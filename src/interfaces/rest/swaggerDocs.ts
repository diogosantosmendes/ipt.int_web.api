import { NextFunction, Request, RequestHandler, Response } from 'express';
import swaggerUi, { JsonObject, SwaggerUiOptions } from 'swagger-ui-express';

const swaggerOptions: SwaggerUiOptions & { customJsStr: string } = {
  customCss: '.swagger-ui .scheme-container .auth-wrapper, .swagger-ui .opblock .authorization__btn { display: none !important; }',
  customJsStr: `
    (function () {
      var swaggerUiBundle = window.SwaggerUIBundle;
      var pendingGoogleIdToken;
      var authStatus;
      var signInMessage;
      var googleButton;

      function authorizeGoogleIdToken(idToken) {
        if (!window.swaggerUi) {
          pendingGoogleIdToken = idToken;
          return;
        }

        try {
          window.swaggerUi.preauthorizeApiKey('GoogleBearer', idToken);
          if (authStatus) {
            authStatus.textContent = 'Signed in with Google. API requests are authorized.';
            authStatus.style.color = '#137333';
          }
          if (signInMessage) signInMessage.remove();
          if (googleButton) googleButton.remove();
        } catch (error) {
          console.error('Unable to authorize Swagger UI with the Google ID token.', error);
          if (authStatus) {
            authStatus.textContent = 'Google sign-in succeeded, but Swagger authorization failed.';
            authStatus.style.color = '#b3261e';
          }
        }
      }

      window.SwaggerUIBundle = function (options) {
        var ui = swaggerUiBundle(options);
        window.swaggerUi = ui;
        if (pendingGoogleIdToken) {
          authorizeGoogleIdToken(pendingGoogleIdToken);
          pendingGoogleIdToken = undefined;
        }
        return ui;
      };
      Object.assign(window.SwaggerUIBundle, swaggerUiBundle);

      var googleClientId = ${JSON.stringify(process.env.GOOGLE_CLIENT_ID ?? '')};
      var script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = function () {
        var signIn = document.createElement('section');
        signIn.setAttribute('aria-label', 'Google sign-in');
        signIn.style.display = 'flex';
        signIn.style.alignItems = 'center';
        signIn.style.justifyContent = 'space-between';
        signIn.style.gap = '1rem';
        signIn.style.margin = '1rem auto';
        signIn.style.maxWidth = '1460px';
        signIn.style.padding = '0 20px';

        signInMessage = document.createElement('span');
        signInMessage.textContent = 'Sign in with Google to authorize API requests';
        signIn.appendChild(signInMessage);

        authStatus = document.createElement('span');
        authStatus.setAttribute('role', 'status');
        authStatus.setAttribute('aria-live', 'polite');
        signIn.appendChild(authStatus);

        googleButton = document.createElement('div');
        signIn.appendChild(googleButton);
        document.body.insertBefore(signIn, document.getElementById('swagger-ui'));

        google.accounts.id.initialize({
          client_id: googleClientId,
          use_fedcm_for_button: true,
          callback: function (response) {
            if (!response.credential) {
              console.error('Google sign-in returned no ID token.');
              authStatus.textContent = 'Google sign-in did not return an ID token.';
              authStatus.style.color = '#b3261e';
              return;
            }
            authorizeGoogleIdToken(response.credential);
          }
        });
        google.accounts.id.renderButton(googleButton, { theme: 'outline', size: 'large' });
      };
      script.onerror = function () {
        console.error('Unable to load Google Identity Services for Swagger UI.');
      };
      document.head.appendChild(script);
    })();
  `,
};

const setGoogleSignInPopupPolicy: RequestHandler = (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
};

export default function createSwaggerDocs(openApiDocument: JsonObject): RequestHandler[] {
  return [
    setGoogleSignInPopupPolicy,
    ...swaggerUi.serve,
    swaggerUi.setup(openApiDocument, swaggerOptions),
  ];
}

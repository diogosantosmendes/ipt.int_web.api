import { NextFunction, Request, RequestHandler, Response } from 'express';
import { createRemoteJWKSet, errors, jwtVerify } from 'jose';

export interface GoogleAuthConfig {
  clientId: string;
}

export interface AuthenticatedUser {
  subject: string;
  email: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

function loadGoogleAuthConfig(environment: NodeJS.ProcessEnv = process.env): GoogleAuthConfig {
  const clientId = environment.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID must be the Google OAuth web client ID');
  }

  return { clientId };
}

export function createGoogleAuthMiddleware(): RequestHandler {
  const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
  const config = loadGoogleAuthConfig();

  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const authorization = request.header('authorization');
    const idToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!idToken) {
      response.setHeader('WWW-Authenticate', 'Bearer');
      response.status(401).json({ error: 'A Google ID token is required' });
      return;
    }

    let payload;
    try {
      ({ payload } = await jwtVerify(idToken, jwks, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: config.clientId,
      }));
    } catch (error) {
      if (error instanceof errors.JWKSTimeout
        || error instanceof errors.JWKSInvalid
        || error instanceof errors.JWKSMultipleMatchingKeys) {
        console.error('Google signing-key verification failed:', error);
        response.status(503).json({ error: 'Unable to verify ID token' });
        return;
      }

      if (error instanceof errors.JOSEError) {
        response.setHeader('WWW-Authenticate', 'Bearer error="invalid_token"');
        response.status(401).json({ error: 'Invalid or expired Google ID token' });
        return;
      }

      console.error('Google ID token verification failed:', error);
      response.status(503).json({ error: 'Unable to verify ID token' });
      return;
    }

    const subject = payload.sub;
    const email = payload.email;
    if (typeof subject !== 'string' || typeof email !== 'string' || payload.email_verified !== true) {
      response.status(403).json({ error: 'A Google-verified account is required' });
      return;
    }

    request.auth = {
      subject,
      email,
      name: payload.name,
    };
    next();
  };
}

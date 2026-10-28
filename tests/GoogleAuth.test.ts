import { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import {
  createGoogleAuthMiddleware,
  GoogleAuthConfig,
  loadGoogleAuthConfig,
} from '../src/interfaces/rest/auth/googleAuth';

jest.mock('jose', () => {
  class JOSEError extends Error { }
  class JWTInvalid extends JOSEError { }
  class JWKSTimeout extends JOSEError { }
  class JWKSInvalid extends JOSEError { }
  class JWKSMultipleMatchingKeys extends JOSEError { }

  return {
    errors: { JOSEError, JWTInvalid, JWKSTimeout, JWKSInvalid, JWKSMultipleMatchingKeys },
    createRemoteJWKSet: jest.fn(() => ({})),
    jwtVerify: jest.fn(),
  };
});

const config: GoogleAuthConfig = {
  clientId: 'ipt-web-client.apps.googleusercontent.com',
};

function makeRequest(authorization?: string): Request {
  return {
    header: jest.fn().mockReturnValue(authorization),
  } as unknown as Request;
}

function makeResponse(): Response {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('Google authorization middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires a Google OAuth web client ID', () => {
    expect(loadGoogleAuthConfig({
      GOOGLE_CLIENT_ID: config.clientId,
    })).toEqual(config);
    expect(() => loadGoogleAuthConfig({})).toThrow('GOOGLE_CLIENT_ID');
  });

  it('rejects requests without a Bearer ID token', async () => {
    const request = makeRequest();
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    await createGoogleAuthMiddleware(config)(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer');
    expect(jwtVerify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('validates the token and exposes verified IPT identity to downstream handlers', async () => {
    const request = makeRequest('Bearer google-id-token');
    const response = makeResponse();
    const next = jest.fn() as NextFunction;
    jest.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: 'google-account-subject',
        email: 'student@ipt.pt',
        email_verified: true,
        hd: 'ipt.pt',
      },
      protectedHeader: { alg: 'RS256' },
    } as never);

    await createGoogleAuthMiddleware(config)(request, response, next);

    expect(createRemoteJWKSet).toHaveBeenCalledWith(
      new URL('https://www.googleapis.com/oauth2/v3/certs'),
    );
    expect(jwtVerify).toHaveBeenCalledWith(
      'google-id-token',
      expect.anything(),
      {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: config.clientId,
      },
    );
    expect(request.auth).toEqual({
      subject: 'google-account-subject',
      email: 'student@ipt.pt',
      hostedDomain: 'ipt.pt',
    });
    expect(response.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['unverified email', { email_verified: false }],
    ['non-IPT email', { email: 'student@ipt.pt.evil.test' }],
    ['different Workspace domain', { hd: 'example.com' }],
  ])('rejects accounts with %s', async (_description, claims) => {
    const request = makeRequest('Bearer google-id-token');
    const response = makeResponse();
    const next = jest.fn() as NextFunction;
    jest.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: 'google-account-subject',
        email: 'student@ipt.pt',
        email_verified: true,
        hd: 'ipt.pt',
        ...claims,
      },
      protectedHeader: { alg: 'RS256' },
    } as never);

    await createGoogleAuthMiddleware(config)(request, response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(request.auth).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a Google-verified IPT address without a Workspace hosted-domain claim', async () => {
    const request = makeRequest('Bearer google-id-token');
    const response = makeResponse();
    const next = jest.fn() as NextFunction;
    jest.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: 'google-account-subject',
        email: 'student@ipt.pt',
        email_verified: true,
      },
      protectedHeader: { alg: 'RS256' },
    } as never);

    await createGoogleAuthMiddleware(config)(request, response, next);

    expect(request.auth).toEqual({
      subject: 'google-account-subject',
      email: 'student@ipt.pt',
      hostedDomain: undefined,
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid tokens and reports signing-key infrastructure failures', async () => {
    const middleware = createGoogleAuthMiddleware(config);
    const invalidRequest = makeRequest('Bearer bad-token');
    const invalidResponse = makeResponse();
    jest.mocked(jwtVerify).mockRejectedValueOnce(new errors.JWTInvalid());

    await middleware(invalidRequest, invalidResponse, jest.fn() as NextFunction);

    expect(invalidResponse.status).toHaveBeenCalledWith(401);

    const unavailableRequest = makeRequest('Bearer google-id-token');
    const unavailableResponse = makeResponse();
    const logError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(jwtVerify).mockRejectedValueOnce(new errors.JWKSTimeout());

    await middleware(unavailableRequest, unavailableResponse, jest.fn() as NextFunction);

    expect(unavailableResponse.status).toHaveBeenCalledWith(503);
    expect(logError).toHaveBeenCalled();
    logError.mockRestore();
  });
});

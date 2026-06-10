const {
  resolveClientUrl,
  resolveOAuthCallbackUrl,
} = require('../auth/origin');

function createRequest(headers = {}, protocol = 'https') {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    protocol,
    get(name) {
      return normalizedHeaders[name.toLowerCase()];
    },
  };
}

describe('auth origin helpers', () => {
  const originalClientOrigin = process.env.CLIENT_ORIGIN;
  const originalGoogleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

  afterEach(() => {
    process.env.CLIENT_ORIGIN = originalClientOrigin;
    process.env.GOOGLE_CALLBACK_URL = originalGoogleCallbackUrl;
  });

  test('uses the forwarded Vercel host for the Google callback URL', () => {
    process.env.CLIENT_ORIGIN = '';
    process.env.GOOGLE_CALLBACK_URL = 'https://mini-library-y6je.onrender.com';

    const req = createRequest({
      host: 'mini-library-y6je.onrender.com',
      'x-forwarded-host': 'mini-library-virid.vercel.app',
      'x-forwarded-proto': 'https',
    });

    expect(resolveOAuthCallbackUrl(req)).toBe(
      'https://mini-library-virid.vercel.app/api/auth/google/callback'
    );
  });

  test('uses the configured client origin for post-login redirects in local development', () => {
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
    process.env.GOOGLE_CALLBACK_URL =
      'http://localhost:4000/api/auth/google/callback';

    const req = createRequest({
      host: 'localhost:4000',
    }, 'http');

    expect(resolveClientUrl(req, '/books')).toBe('http://localhost:5173/books');
    expect(resolveOAuthCallbackUrl(req)).toBe(
      'http://localhost:4000/api/auth/google/callback'
    );
  });

  test('falls back to the request origin when no client origin is configured', () => {
    delete process.env.CLIENT_ORIGIN;
    delete process.env.GOOGLE_CALLBACK_URL;

    const req = createRequest({
      host: 'mini-library-y6je.onrender.com',
    });

    expect(resolveClientUrl(req, '/login')).toBe(
      'https://mini-library-y6je.onrender.com/login'
    );
    expect(resolveOAuthCallbackUrl(req)).toBe(
      'https://mini-library-y6je.onrender.com/api/auth/google/callback'
    );
  });
});

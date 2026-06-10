const { URL } = require('node:url');

function normalizeOrigin(value) {
  if (!value) return '';

  const trimmedValue = String(value).trim();

  try {
    return new URL(trimmedValue).origin;
  } catch {
    return trimmedValue.replace(/\/+$/, '');
  }
}

function firstHeaderValue(value) {
  if (!value) return '';
  return String(value).split(',')[0].trim();
}

function isLocalhostOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function buildOrigin(proto, host) {
  const normalizedHost = firstHeaderValue(host);

  if (!normalizedHost) {
    return '';
  }

  const normalizedProto = firstHeaderValue(proto) || 'https';
  return normalizeOrigin(`${normalizedProto}://${normalizedHost}`);
}

function getForwardedOrigin(req) {
  return buildOrigin(
    req.get('x-forwarded-proto') || req.protocol,
    req.get('x-forwarded-host')
  );
}

function getRequestOrigin(req) {
  return buildOrigin(req.protocol, req.get('host'));
}

function resolveOAuthCallbackUrl(req) {
  const forwardedOrigin = getForwardedOrigin(req);

  if (forwardedOrigin) {
    return `${forwardedOrigin}/api/auth/google/callback`;
  }

  const clientOrigin = normalizeOrigin(process.env.CLIENT_ORIGIN);

  if (clientOrigin && !isLocalhostOrigin(clientOrigin)) {
    return `${clientOrigin}/api/auth/google/callback`;
  }

  const configuredCallbackUrl = (process.env.GOOGLE_CALLBACK_URL || '').trim();

  if (configuredCallbackUrl) {
    return configuredCallbackUrl;
  }

  const requestOrigin = getRequestOrigin(req);
  return requestOrigin
    ? `${requestOrigin}/api/auth/google/callback`
    : '/api/auth/google/callback';
}

function resolveClientUrl(req, path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const forwardedOrigin = getForwardedOrigin(req);
  const clientOrigin = normalizeOrigin(process.env.CLIENT_ORIGIN);
  const requestOrigin = getRequestOrigin(req);
  const baseOrigin = forwardedOrigin || clientOrigin || requestOrigin;

  return baseOrigin ? `${baseOrigin}${normalizedPath}` : normalizedPath;
}

module.exports = {
  getForwardedOrigin,
  getRequestOrigin,
  isLocalhostOrigin,
  normalizeOrigin,
  resolveClientUrl,
  resolveOAuthCallbackUrl,
};

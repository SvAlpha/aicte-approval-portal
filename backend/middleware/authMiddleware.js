'use strict';

const crypto = require('crypto');
const DatabaseConnection = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'svvv-aicte-portal-secret-key-2026';
const DEFAULT_EXPIRY_SECONDS = Number(process.env.JWT_EXPIRY_SECONDS || 28800); // 8 hours

/**
 * Generates an HMAC-SHA256 signed JWT token with issued-at (iat) and expiration (exp) claims
 */
function signJwt(payload, expiresInSeconds = DEFAULT_EXPIRY_SECONDS) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: nowSec,
      exp: nowSec + expiresInSeconds
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 signed JWT token including signature, expiration, and revocation list
 */
function verifyJwt(token, db = DatabaseConnection.getInstance()) {
  if (!token || typeof token !== 'string') {
    throw new Error('401 Unauthorized: Authentication token is required');
  }
  if (db && db.isTokenRevoked(token)) {
    throw new Error('401 Unauthorized: Session token has been logged out');
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('401 Unauthorized: Malformed JWT token');
  }
  const [header, body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('401 Unauthorized: Invalid JWT signature');
  }

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch (_err) {
    throw new Error('401 Unauthorized: Invalid JWT payload encoding');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof decoded.exp === 'number' && nowSec >= decoded.exp) {
    throw new Error('401 Unauthorized: Session token has expired');
  }

  return decoded;
}

/**
 * Role-Based Access Control (RBAC) verifier (SRS 3.1 REQ-4 & REQ-5)
 * Verifies JWT validity, role authorization, and live account status in the database.
 */
function authorizeRoles(allowedRoles = [], db = DatabaseConnection.getInstance()) {
  return (token) => {
    const decoded = verifyJwt(token, db);
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      throw new Error(`403 Forbidden: Role '${decoded.role}' is not authorized for this resource`);
    }

    // Re-verify Evaluator active and verified status on every protected request (SRS 3.1 REQ-5)
    if (decoded.role === 'Evaluator' && db && db.tables.evaluators.has(decoded.id)) {
      const ev = db.tables.evaluators.get(decoded.id);
      if (!ev.is_active || !ev.is_verified) {
        throw new Error('403 Forbidden (SRS 3.1 REQ-5): Evaluator account is inactive or unverified');
      }
    }

    return decoded;
  };
}

module.exports = { signJwt, verifyJwt, authorizeRoles };

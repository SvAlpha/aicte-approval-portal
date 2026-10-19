'use strict';

const DatabaseConnection = require('../database/db');
const College = require('../models/College');
const { signJwt, verifyJwt } = require('../middleware/authMiddleware');

/**
 * AuthController (backend/controllers/AuthController.js)
 * Handles College-only public registration, server-resolved multi-role authentication,
 * session restoration (/api/auth/me), and token revocation logout (/api/auth/logout).
 */
class AuthController {
  constructor(db = DatabaseConnection.getInstance()) {
    this.db = db;
  }

  /**
   * Registers a new College account (SRS 3.1 REQ-1 & REQ-2)
   * Explicitly forbids creating Evaluator or AICTEAdmin accounts via public registration.
   */
  registerCollege(payload = {}) {
    if (payload.role && payload.role !== 'College') {
      throw new Error('403 Forbidden (SRS 3.1): Public registration is restricted strictly to College accounts');
    }
    const email = String(payload.email || '').trim().toLowerCase();
    const college_name = String(payload.college_name || '').trim();
    const password = String(payload.password || '');

    if (!college_name || !email || !password) {
      throw new Error('Validation Error: Institution name, email, and password are required');
    }
    if (password.length < 6) {
      throw new Error('Validation Error: Password must be at least 6 characters');
    }

    // Ensure email is not already used by any role
    const emailInUse =
      [...this.db.tables.colleges.values()].some((c) => c.email.toLowerCase() === email) ||
      [...this.db.tables.evaluators.values()].some((e) => e.email.toLowerCase() === email) ||
      [...this.db.tables.aicte_admins.values()].some((a) => a.email.toLowerCase() === email);

    if (emailInUse) {
      throw new Error('409 Conflict: Email address is already registered');
    }

    const college_id = payload.college_id || `college_${101 + this.db.tables.colleges.size}`;
    const college = new College({
      college_id,
      college_name,
      email,
      password,
      address: payload.address || '',
      contact_no: payload.contact_no || '',
      trust_society_name: payload.trust_society_name || '',
      registration_number: payload.registration_number || `TR-2026-${1000 + this.db.tables.colleges.size}`,
      authorized_signatory_name: payload.authorized_signatory_name || ''
    });

    college.register(this.db);
    const token = signJwt({ id: college.college_id, role: 'College', email: college.email });

    return {
      status: 201,
      token,
      role: 'College',
      redirectTo: '/college',
      user: {
        id: college.college_id,
        college_id: college.college_id,
        name: college.college_name,
        email: college.email,
        role: 'College'
      }
    };
  }

  /**
   * Authenticates user by email & password, resolving role strictly from server records (SRS 3.1 REQ-3, REQ-4, REQ-5).
   * Never trusts a client-selected role dropdown to elevate privileges.
   */
  login({ email, password }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('401 Invalid credentials: Email and password are required');
    }

    // 1. Check College records
    const college = [...this.db.tables.colleges.values()].find(
      (c) => c.email.toLowerCase() === normalizedEmail
    );
    if (college) {
      if (!college.login(password)) {
        throw new Error('401 Invalid email or password');
      }
      const token = signJwt({ id: college.college_id, role: 'College', email: college.email });
      this.db.logAudit('College', college.college_id, 'AuthController.login()', 'Authenticated College session');
      return {
        status: 200,
        token,
        role: 'College',
        id: college.college_id,
        redirectTo: '/college',
        user: {
          id: college.college_id,
          name: college.college_name,
          email: college.email,
          role: 'College'
        }
      };
    }

    // 2. Check Evaluator records
    const evaluator = [...this.db.tables.evaluators.values()].find(
      (e) => e.email.toLowerCase() === normalizedEmail
    );
    if (evaluator) {
      // evaluator.login() enforces SRS 3.1 REQ-5 (throws if !is_active || !is_verified)
      let ok = false;
      try {
        ok = evaluator.login(password);
      } catch (err) {
        this.db.logAudit('Evaluator', evaluator.evaluator_id, 'AuthController.login()', `Blocked login: ${err.message}`);
        throw new Error(`403 ${err.message}`);
      }
      if (!ok) {
        throw new Error('401 Invalid email or password');
      }
      const token = signJwt({ id: evaluator.evaluator_id, role: 'Evaluator', email: evaluator.email });
      this.db.logAudit('Evaluator', evaluator.evaluator_id, 'AuthController.login()', 'Authenticated Evaluator session');
      return {
        status: 200,
        token,
        role: 'Evaluator',
        id: evaluator.evaluator_id,
        redirectTo: '/evaluator',
        user: {
          id: evaluator.evaluator_id,
          name: evaluator.evaluator_name,
          email: evaluator.email,
          role: 'Evaluator'
        }
      };
    }

    // 3. Check AICTEAdmin records
    const admin = [...this.db.tables.aicte_admins.values()].find(
      (a) => a.email.toLowerCase() === normalizedEmail
    );
    if (admin) {
      if (!admin.login(password)) {
        throw new Error('401 Invalid email or password');
      }
      const token = signJwt({ id: admin.admin_id, role: 'AICTEAdmin', email: admin.email });
      this.db.logAudit('AICTEAdmin', admin.admin_id, 'AuthController.login()', 'Authenticated AICTEAdmin session');
      return {
        status: 200,
        token,
        role: 'AICTEAdmin',
        id: admin.admin_id,
        redirectTo: '/admin',
        user: {
          id: admin.admin_id,
          name: admin.admin_name,
          email: admin.email,
          role: 'AICTEAdmin'
        }
      };
    }

    throw new Error('401 Invalid email or password');
  }

  /**
   * Validates active JWT and returns sanitized user profile for session restoration on page refresh
   */
  getSession(token) {
    const decoded = verifyJwt(token, this.db);
    if (decoded.role === 'College') {
      const c = this.db.tables.colleges.get(decoded.id);
      if (!c) throw new Error('401 Account no longer exists');
      return {
        status: 200,
        role: 'College',
        id: c.college_id,
        redirectTo: '/college',
        user: { id: c.college_id, name: c.college_name, email: c.email, role: 'College' }
      };
    }
    if (decoded.role === 'Evaluator') {
      const ev = this.db.tables.evaluators.get(decoded.id);
      if (!ev || !ev.is_active || !ev.is_verified) {
        throw new Error('403 Evaluator account is no longer active or verified');
      }
      return {
        status: 200,
        role: 'Evaluator',
        id: ev.evaluator_id,
        redirectTo: '/evaluator',
        user: { id: ev.evaluator_id, name: ev.evaluator_name, email: ev.email, role: 'Evaluator' }
      };
    }
    if (decoded.role === 'AICTEAdmin') {
      const a = this.db.tables.aicte_admins.get(decoded.id);
      if (!a) throw new Error('401 Account no longer exists');
      return {
        status: 200,
        role: 'AICTEAdmin',
        id: a.admin_id,
        redirectTo: '/admin',
        user: { id: a.admin_id, name: a.admin_name, email: a.email, role: 'AICTEAdmin' }
      };
    }
    throw new Error('401 Invalid session role');
  }

  /**
   * Invalidates/revokes the active JWT token and logs the logout event
   */
  logout(token) {
    const decoded = verifyJwt(token, this.db);
    this.db.revokeToken(token);
    this.db.logAudit(decoded.role, decoded.id, 'AuthController.logout()', 'User logged out and token revoked');
    return { status: 200, message: 'Logged out successfully' };
  }
}

module.exports = AuthController;

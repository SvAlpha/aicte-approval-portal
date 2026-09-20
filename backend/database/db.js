'use strict';

const crypto = require('crypto');

/**
 * DatabaseConnection (Singleton Pattern)
 * Manages PostgreSQL connection configuration via environment variables (DoD 2.2)
 * and provides an in-memory relational store with token revocation for local/CI execution.
 */
class DatabaseConnection {
  static #instance = null;

  constructor() {
    if (DatabaseConnection.#instance) {
      return DatabaseConnection.#instance;
    }
    this.connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/aicte_portal';
    this.isConnected = true;
    this.resetInMemoryStore();
    DatabaseConnection.#instance = this;
  }

  /**
   * Returns the single shared instance of DatabaseConnection (Singleton Pattern)
   * @returns {DatabaseConnection}
   */
  static getInstance() {
    if (!DatabaseConnection.#instance) {
      DatabaseConnection.#instance = new DatabaseConnection();
    }
    return DatabaseConnection.#instance;
  }

  resetInMemoryStore() {
    this.tables = {
      colleges: new Map(),
      evaluators: new Map(),
      aicte_admins: new Map(),
      applications: new Map(),
      documents: new Map(),
      clarification_requests: new Map(),
      audit_logs: []
    };
    this.revokedTokens = new Set();
  }

  /**
   * Hashes plain password using salted SHA-256 digest with bcrypt-format prefix
   * @param {string} plainPassword
   * @returns {string}
   */
  static hashPassword(plainPassword) {
    const salt = 'svvv_aicte_salt_2026';
    const digest = crypto
      .createHmac('sha256', salt)
      .update(String(plainPassword))
      .digest('hex');
    return `$2b$10$${digest.slice(0, 44)}`;
  }

  /**
   * Verifies plain password against stored hash using constant-time comparison
   * @param {string} plainPassword
   * @param {string} storedHash
   * @returns {boolean}
   */
  static verifyPassword(plainPassword, storedHash) {
    if (!plainPassword || !storedHash || typeof storedHash !== 'string') {
      return false;
    }
    const candidate = DatabaseConnection.hashPassword(plainPassword);
    if (candidate.length !== storedHash.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(storedHash));
  }

  revokeToken(token) {
    if (token) {
      this.revokedTokens.add(token);
    }
  }

  isTokenRevoked(token) {
    return this.revokedTokens.has(token);
  }

  logAudit(actor_role, actor_id, action_method, details) {
    const entry = {
      log_id: `LOG-${1000 + this.tables.audit_logs.length + 1}`,
      actor_role,
      actor_id,
      action_method,
      details,
      created_at: new Date().toISOString()
    };
    this.tables.audit_logs.unshift(entry);
    return entry;
  }
}

module.exports = DatabaseConnection;

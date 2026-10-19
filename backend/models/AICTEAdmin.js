'use strict';

const DatabaseConnection = require('../database/db');

/**
 * AICTEAdmin Domain Entity (Week 3 & Week 6 UML Class Diagram)
 * Oversees applications, invokes IEvaluatorMatcher, manages evaluator verification/active flags,
 * records binding final decisions, and computes minimal analytics.
 */
class AICTEAdmin {
  #password;

  constructor({
    admin_id,
    admin_name,
    email,
    password,
    designation = 'AICTE Approval Officer',
    contact_no = ''
  }) {
    this.admin_id = admin_id;
    this.admin_name = admin_name;
    this.email = email;
    this.#password = password && password.startsWith('$2b$')
      ? password
      : DatabaseConnection.hashPassword(password || 'adminPass');
    this.designation = designation;
    this.contact_no = contact_no;
  }

  getPasswordHash() {
    return this.#password;
  }

  /**
   * Authenticates Admin (Week 6 UML: +login())
   * @param {string} plainPassword
   * @returns {boolean}
   */
  login(plainPassword) {
    return DatabaseConnection.verifyPassword(plainPassword, this.#password);
  }

  /**
   * Monitors all applications across the system (Week 6 UML: +monitorApplications())
   * @param {Array<Application>} allApplications
   * @param {string} statusFilter
   */
  monitorApplications(allApplications = [], statusFilter = null) {
    if (!statusFilter || statusFilter === 'All') {
      return allApplications;
    }
    return allApplications.filter((a) => a.getStatus() === statusFilter);
  }

  /**
   * Uses IEvaluatorMatcher Strategy to suggest evaluators and assigns upon Admin confirmation (Week 6 UML: +assignEvaluator())
   * @param {Application} application
   * @param {IEvaluatorMatcher} matcherService
   * @param {Array<Evaluator>} evaluators
   * @param {Array<Application>} allApplications
   * @param {string|null} confirmedEvaluatorId
   */
  assignEvaluator(application, matcherService, evaluators, allApplications, confirmedEvaluatorId = null) {
    const suggestions = matcherService.suggestEvaluator(application, evaluators, allApplications);
    if (confirmedEvaluatorId) {
      const chosen = evaluators.find((e) => e.evaluator_id === confirmedEvaluatorId);
      if (!chosen || !chosen.is_active || !chosen.is_verified) {
        throw new Error('Cannot assign an inactive or unverified evaluator');
      }
      application.assigned_evaluator_id = confirmedEvaluatorId;
      if (application.getStatus() === 'Applied') {
        application.updateStatus('Under Review');
      }
    }
    return { suggestions, assigned_evaluator_id: application.assigned_evaluator_id };
  }

  /**
   * Updates Admin-controlled Evaluator attributes is_verified and is_active (Week 6 UML: +manageEvaluator())
   * @param {Evaluator} evaluator
   * @param {{ is_verified?: boolean, is_active?: boolean }} adminFlags
   */
  manageEvaluator(evaluator, adminFlags = {}) {
    if (adminFlags.is_verified !== undefined) {
      evaluator.is_verified = Boolean(adminFlags.is_verified);
    }
    if (adminFlags.is_active !== undefined) {
      evaluator.is_active = Boolean(adminFlags.is_active);
    }
    return evaluator;
  }

  /**
   * Records binding final decision while preserving Evaluator's recommendation separately (Week 6 UML: +finalizeDecision())
   * @param {Application} application
   * @param {'Approved'|'Rejected'} decision
   * @param {string} reason
   */
  finalizeDecision(application, decision, reason) {
    return application.recordFinalDecision(decision, reason);
  }

  /**
   * Computes minimal analytics (SRS 3.7 REQ-1 & REQ-2, Week 6 UML: +viewAnalytics())
   * @param {Array<Application>} allApplications
   */
  viewAnalytics(allApplications = []) {
    const countsByStatus = {
      Applied: 0,
      'Under Review': 0,
      'Clarification Requested': 0,
      Recommended: 0,
      Approved: 0,
      Rejected: 0
    };

    let finalizedCount = 0;
    let totalTurnaroundMs = 0;

    allApplications.forEach((app) => {
      const st = app.getStatus();
      countsByStatus[st] = (countsByStatus[st] || 0) + 1;
      if (app.final_decision_at && app.submitted_date) {
        const diff = new Date(app.final_decision_at) - new Date(app.submitted_date);
        if (diff >= 0) {
          finalizedCount += 1;
          totalTurnaroundMs += diff;
        }
      }
    });

    const averageProcessingDays =
      finalizedCount > 0
        ? Number((totalTurnaroundMs / (finalizedCount * 1000 * 60 * 60 * 24)).toFixed(2))
        : 0;

    return {
      total_applications: allApplications.length,
      counts_by_status: countsByStatus,
      average_processing_days: averageProcessingDays
    };
  }
}

module.exports = AICTEAdmin;

'use strict';

const DatabaseConnection = require('../database/db');
const ClarificationRequest = require('./ClarificationRequest');

/**
 * Evaluator Domain Entity (Week 3 & Week 6 UML Class Diagram)
 * Enforces private #password encapsulation, login verification checks (SRS 3.1 REQ-5),
 * derived workload computation (SRS 3.5 REQ-2), and field-level permissions (SRS 3.4 REQ-7).
 */
class Evaluator {
  #password;

  constructor({
    evaluator_id,
    evaluator_name,
    email,
    password,
    expertise = '',
    availability = 'Available',
    address = '',
    contact_no = '',
    is_verified = false,
    is_active = true
  }) {
    this.evaluator_id = evaluator_id;
    this.evaluator_name = evaluator_name;
    this.email = email;
    this.#password = password && password.startsWith('$2b$')
      ? password
      : DatabaseConnection.hashPassword(password || 'evalPass');
    this.expertise = expertise;
    this.availability = availability;
    this.address = address;
    this.contact_no = contact_no;
    this.is_verified = Boolean(is_verified);
    this.is_active = Boolean(is_active);
  }

  getPasswordHash() {
    return this.#password;
  }

  /**
   * Authenticates Evaluator; enforces SRS 3.1 REQ-5 (rejects login if is_active or is_verified is false).
   * @param {string} plainPassword
   * @returns {boolean}
   */
  login(plainPassword) {
    if (!this.is_active || !this.is_verified) {
      throw new Error('Access Denied (SRS 3.1 REQ-5): Evaluator account must be both active and verified by AICTE Admin.');
    }
    return DatabaseConnection.verifyPassword(plainPassword, this.#password);
  }

  /**
   * Returns only applications assigned to this Evaluator (SRS 3.4 REQ-1, Week 6 UML: +viewAssignedApplications())
   * @param {Array<Application>} allApplications
   * @returns {Array<Application>}
   */
  viewAssignedApplications(allApplications = []) {
    return allApplications.filter((app) => app.assigned_evaluator_id === this.evaluator_id);
  }

  /**
   * Reviews a document using AI-Assisted IDocumentProcessor or manual text (Week 6 UML: +reviewDocument())
   * @param {Document} document
   * @param {IDocumentProcessor} docProcessor
   */
  reviewDocument(document, docProcessor) {
    if (!document.extracted_text && docProcessor) {
      document.uploadDocument(document.file_url, document.raw_text || '', docProcessor);
    }
    return {
      document_id: document.document_id,
      document_type: document.document_type,
      extracted_text: document.getExtractedText(),
      ai_summary: document.ai_summary,
      highlights: document.highlights,
      ocr_confidence: document.ocr_confidence
    };
  }

  /**
   * Raises a document-specific ClarificationRequest (Week 6 UML: +requestClarification())
   * @param {Application} application
   * @param {Document} document
   * @param {string} message
   * @param {string} clarificationId
   * @returns {ClarificationRequest}
   */
  requestClarification(application, document, message, clarificationId = `clarification_${Date.now()}`) {
    if (application.assigned_evaluator_id !== this.evaluator_id) {
      throw new Error('Unauthorized: Evaluator can only request clarification on assigned applications');
    }
    const req = new ClarificationRequest({
      clarification_id: clarificationId,
      application_id: application.application_id,
      document_id: document.document_id,
      raised_by_evaluator_id: this.evaluator_id,
      message
    });
    req.createRequest();
    application.updateStatus('Clarification Requested');
    return req;
  }

  /**
   * Submits formal Evaluator Recommendation to AICTE Admin (Week 6 UML: +submitRecommendation())
   * @param {Application} application
   * @param {'Accept'|'Reject'} recommendation
   * @param {string} comments
   * @param {boolean} siteVisitConfirmed
   */
  submitRecommendation(application, recommendation, comments, siteVisitConfirmed) {
    if (application.assigned_evaluator_id !== this.evaluator_id) {
      throw new Error('Unauthorized: Evaluator can only recommend on assigned applications');
    }
    return application.recordEvaluatorRecommendation(recommendation, comments, siteVisitConfirmed);
  }

  /**
   * Self-edits Evaluator profile (SRS 3.4 REQ-7: ONLY expertise and availability; ignores admin flags)
   * @param {object} updates
   */
  updateProfile(updates = {}) {
    if (updates.expertise !== undefined) this.expertise = updates.expertise;
    if (updates.availability !== undefined) this.availability = updates.availability;
    // Deliberately ignore is_verified and is_active here (Admin-controlled per Week 3 & SRS 3.4 REQ-7)
    return this;
  }
}

module.exports = Evaluator;

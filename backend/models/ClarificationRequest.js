'use strict';

/**
 * ClarificationRequest Domain Entity (Week 3 & Week 6 UML Class Diagram)
 * Models the conditional <<extend>> clarification lifecycle.
 */
class ClarificationRequest {
  constructor({
    clarification_id,
    application_id,
    document_id,
    raised_by_evaluator_id,
    message,
    status = 'Open',
    created_at = new Date().toISOString(),
    resolved_at = null
  }) {
    this.clarification_id = clarification_id;
    this.application_id = application_id;
    this.document_id = document_id;
    this.raised_by_evaluator_id = raised_by_evaluator_id;
    this.message = message;
    this.status = status;
    this.created_at = created_at;
    this.resolved_at = resolved_at;
  }

  /**
   * Initializes request as Open (Week 6 UML: +createRequest())
   */
  createRequest() {
    if (!this.message || !this.document_id) {
      throw new Error('ClarificationRequest requires document_id and message');
    }
    this.status = 'Open';
    this.created_at = new Date().toISOString();
    return this;
  }

  /**
   * Marks clarification as Resolved when College reuploads document (Week 6 UML: +resolveRequest())
   */
  resolveRequest() {
    this.status = 'Resolved';
    this.resolved_at = new Date().toISOString();
    return this;
  }

  /**
   * Enforces SRS 3.4 REQ-4 & Business Rule BR-4:
   * Returns an anonymized view for the College that omits raised_by_evaluator_id.
   */
  toCollegeView() {
    return {
      clarification_id: this.clarification_id,
      application_id: this.application_id,
      document_id: this.document_id,
      message: this.message,
      status: this.status,
      created_at: this.created_at,
      resolved_at: this.resolved_at
    };
  }
}

module.exports = ClarificationRequest;

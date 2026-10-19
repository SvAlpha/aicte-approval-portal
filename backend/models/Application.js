'use strict';

/**
 * Application Domain Entity (Week 3 & Week 6 UML Class Diagram)
 * Retains Evaluator recommendation and Admin final decision as separate fields
 * with independent timestamps (SRS 3.6 REQ-6).
 */
class Application {
  constructor({
    application_id,
    college_id,
    assigned_evaluator_id = null,
    subject_applied_for,
    application_details = '',
    status = 'Applied',
    submitted_date = new Date().toISOString(),
    evaluator_recommendation = null,
    evaluator_comments = null,
    site_visit_confirmed = false,
    recommendation_submitted_at = null,
    final_decision = null,
    final_decision_reason = null,
    final_decision_at = null
  }) {
    this.application_id = application_id;
    this.college_id = college_id;
    this.assigned_evaluator_id = assigned_evaluator_id;
    this.subject_applied_for = subject_applied_for;
    this.application_details = application_details;
    this.status = status;
    this.submitted_date = submitted_date;
    this.evaluator_recommendation = evaluator_recommendation;
    this.evaluator_comments = evaluator_comments;
    this.site_visit_confirmed = Boolean(site_visit_confirmed);
    this.recommendation_submitted_at = recommendation_submitted_at;
    this.final_decision = final_decision;
    this.final_decision_reason = final_decision_reason;
    this.final_decision_at = final_decision_at;
    this.documents = [];
  }

  /**
   * Returns current lifecycle status (Week 6 UML: +getStatus())
   * @returns {string}
   */
  getStatus() {
    return this.status;
  }

  /**
   * Validates and updates application status (Week 6 UML: +updateStatus())
   * @param {string} newStatus
   */
  updateStatus(newStatus) {
    const validStatuses = [
      'Applied',
      'Under Review',
      'Clarification Requested',
      'Recommended',
      'Approved',
      'Rejected'
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid application status: ${newStatus}`);
    }
    this.status = newStatus;
    return this.status;
  }

  /**
   * Associates a statutory Document with this Application (Week 6 UML: +attachDocument())
   * @param {object} document
   */
  attachDocument(document) {
    this.documents.push(document);
    return this.documents;
  }

  /**
   * Records Evaluator's non-binding recommendation and timestamp (Week 6 UML: +recordEvaluatorRecommendation())
   * @param {'Accept'|'Reject'} recommendation
   * @param {string} comments
   * @param {boolean} siteVisitConfirmed
   */
  recordEvaluatorRecommendation(recommendation, comments, siteVisitConfirmed) {
    if (!['Accept', 'Reject'].includes(recommendation)) {
      throw new Error('Evaluator recommendation must be Accept or Reject');
    }
    this.evaluator_recommendation = recommendation;
    this.evaluator_comments = comments;
    this.site_visit_confirmed = Boolean(siteVisitConfirmed);
    this.recommendation_submitted_at = new Date().toISOString();
    this.updateStatus('Recommended');
    return this;
  }

  /**
   * Records Admin's binding final decision in a separate field from Evaluator recommendation (Week 6 UML: +recordFinalDecision())
   * @param {'Approved'|'Rejected'} decision
   * @param {string} reason
   */
  recordFinalDecision(decision, reason) {
    if (!['Approved', 'Rejected'].includes(decision)) {
      throw new Error('Admin final decision must be Approved or Rejected');
    }
    this.final_decision = decision;
    this.final_decision_reason = reason || `Application ${decision} by AICTE Admin.`;
    this.final_decision_at = new Date().toISOString();
    this.updateStatus(decision);
    return this;
  }
}

module.exports = Application;

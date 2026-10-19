'use strict';

const DatabaseConnection = require('../database/db');
const TesseractOCRService = require('../services/TesseractOCRService');
const NLPMatchingService = require('../services/NLPMatchingService');

/**
 * ApplicationController (backend/controllers/ApplicationController.js)
 * Coordinates the end-to-end application lifecycle across College, Evaluator,
 * AICTEAdmin, IDocumentProcessor, and IEvaluatorMatcher (Week 5 Sequence Diagram).
 */
class ApplicationController {
  constructor(
    db = DatabaseConnection.getInstance(),
    docProcessor = new TesseractOCRService(),
    evaluatorMatcher = new NLPMatchingService()
  ) {
    this.db = db;
    this.docProcessor = docProcessor;
    this.evaluatorMatcher = evaluatorMatcher;
  }

  /**
   * College submits an application; triggers parallel OCR extraction & evaluator queue placement.
   */
  submitApplication(collegeId, payload) {
    const college = this.db.tables.colleges.get(collegeId);
    if (!college) throw new Error('College not found');

    const { application, documents } = college.applyForApplication(payload, this.docProcessor);
    this.db.tables.applications.set(application.application_id, application);
    documents.forEach((doc) => this.db.tables.documents.set(doc.document_id, doc));

    this.db.logAudit(
      'College',
      collegeId,
      'ApplicationController.submitApplication()',
      `Created ${application.application_id} with ${documents.length} OCR-processed documents`
    );

    return { application, documents };
  }

  /**
   * Sequence Diagram Steps 1-7: Evaluator opens assigned application, fetches documents,
   * delegates OCR extraction to IDocumentProcessor, and receives AI summary & highlights.
   */
  openAssignedApplicationForReview(evaluatorId, applicationId) {
    const evaluator = this.db.tables.evaluators.get(evaluatorId);
    const application = this.db.tables.applications.get(applicationId);
    if (!evaluator || !application) throw new Error('Evaluator or Application not found');
    if (application.assigned_evaluator_id !== evaluatorId) {
      throw new Error('403 Forbidden (SRS 3.4 REQ-1): Evaluator may only view assigned applications');
    }

    const appDocs = [...this.db.tables.documents.values()].filter(
      (d) => d.application_id === applicationId
    );
    const reviewedDocs = appDocs.map((d) => evaluator.reviewDocument(d, this.docProcessor));

    return {
      application,
      reviewedDocuments: reviewedDocs
    };
  }

  /**
   * Sequence Diagram alt branch 1 [Issue Found in Document]:
   * Evaluator raises ClarificationRequest -> stored in DB -> College notified anonymously.
   */
  raiseClarification(evaluatorId, applicationId, documentId, message) {
    const evaluator = this.db.tables.evaluators.get(evaluatorId);
    const application = this.db.tables.applications.get(applicationId);
    const document = this.db.tables.documents.get(documentId);
    if (!evaluator || !application || !document) {
      throw new Error('Evaluator, Application, or Document not found');
    }

    const clarificationId = `clarification_C${11 + this.db.tables.clarification_requests.size}`;
    const clarification = evaluator.requestClarification(
      application,
      document,
      message,
      clarificationId
    );
    this.db.tables.clarification_requests.set(clarification.clarification_id, clarification);

    this.db.logAudit(
      'Evaluator',
      evaluatorId,
      'ApplicationController.raiseClarification()',
      `Raised ${clarificationId} on ${documentId}`
    );

    return clarification;
  }

  /**
   * Sequence Diagram Steps 12-17: College re-uploads corrected document ->
   * OCR re-extracts text -> Clarification resolved -> Evaluator notified.
   */
  reuploadFlaggedDocument(collegeId, applicationId, documentId, clarificationId, newFileUrl, newRawText) {
    const college = this.db.tables.colleges.get(collegeId);
    const application = this.db.tables.applications.get(applicationId);
    const document = this.db.tables.documents.get(documentId);
    const clarification = this.db.tables.clarification_requests.get(clarificationId);

    if (!college || !application || !document || !clarification) {
      throw new Error('Required entities not found for document reupload');
    }

    const result = college.reuploadDocument(
      document,
      clarification,
      newFileUrl,
      newRawText,
      this.docProcessor,
      application
    );

    this.db.logAudit(
      'College',
      collegeId,
      'ApplicationController.reuploadFlaggedDocument()',
      `Re-uploaded ${documentId} and resolved ${clarificationId}`
    );

    return result;
  }

  /**
   * Sequence Diagram alt branch 2 [No Issue Found]:
   * Evaluator submits recommendation -> Application updated -> Admin notified.
   */
  submitEvaluatorRecommendation(evaluatorId, applicationId, recommendation, comments, siteVisitConfirmed) {
    const evaluator = this.db.tables.evaluators.get(evaluatorId);
    const application = this.db.tables.applications.get(applicationId);
    if (!evaluator || !application) throw new Error('Evaluator or Application not found');

    evaluator.submitRecommendation(application, recommendation, comments, siteVisitConfirmed);

    this.db.logAudit(
      'Evaluator',
      evaluatorId,
      'ApplicationController.submitEvaluatorRecommendation()',
      `Submitted ${recommendation} recommendation for ${applicationId}`
    );

    return application;
  }

  /**
   * Admin requests AI-suggested evaluators and confirms assignment (SRS 3.5)
   */
  matchAndAssignEvaluator(adminId, applicationId, confirmedEvaluatorId = null) {
    const admin = this.db.tables.aicte_admins.get(adminId);
    const application = this.db.tables.applications.get(applicationId);
    if (!admin || !application) throw new Error('Admin or Application not found');

    const evaluators = [...this.db.tables.evaluators.values()];
    const allApplications = [...this.db.tables.applications.values()];

    const result = admin.assignEvaluator(
      application,
      this.evaluatorMatcher,
      evaluators,
      allApplications,
      confirmedEvaluatorId
    );

    if (confirmedEvaluatorId) {
      this.db.logAudit(
        'AICTEAdmin',
        adminId,
        'ApplicationController.matchAndAssignEvaluator()',
        `Assigned ${confirmedEvaluatorId} to ${applicationId}`
      );
    }

    return result;
  }

  /**
   * Admin records binding final decision (SRS 3.6 REQ-5, REQ-6, REQ-7)
   */
  recordAdminFinalDecision(adminId, applicationId, decision, reason) {
    const admin = this.db.tables.aicte_admins.get(adminId);
    const application = this.db.tables.applications.get(applicationId);
    if (!admin || !application) throw new Error('Admin or Application not found');

    admin.finalizeDecision(application, decision, reason);

    this.db.logAudit(
      'AICTEAdmin',
      adminId,
      'ApplicationController.recordAdminFinalDecision()',
      `Recorded final decision ${decision} for ${applicationId}`
    );

    return application;
  }
}

module.exports = ApplicationController;

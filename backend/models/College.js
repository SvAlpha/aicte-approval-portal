'use strict';

const DatabaseConnection = require('../database/db');
const Application = require('./Application');
const Document = require('./Document');

/**
 * College Domain Entity (Week 3 & Week 6 UML Class Diagram)
 * Demonstrates strict OOP Encapsulation with private #password field and institution-level isolation.
 */
class College {
  #password;

  constructor({
    college_id,
    college_name,
    email,
    password,
    address = '',
    contact_no = '',
    trust_society_name = '',
    registration_number = '',
    authorized_signatory_name = '',
    is_seeded_demo = false
  }) {
    this.college_id = college_id;
    this.college_name = college_name;
    this.email = String(email || '').trim().toLowerCase();
    this.#password =
      password && String(password).startsWith('$2b$')
        ? password
        : DatabaseConnection.hashPassword(password || 'defaultPass');
    this.address = address;
    this.contact_no = contact_no;
    this.trust_society_name = trust_society_name;
    this.registration_number = registration_number;
    this.authorized_signatory_name = authorized_signatory_name;
    this.is_seeded_demo = Boolean(is_seeded_demo);
  }

  /**
   * Encapsulated getter returning only the hashed password for DB persistence, never plain text.
   * @returns {string}
   */
  getPasswordHash() {
    return this.#password;
  }

  /**
   * Registers the College in the database (Week 6 UML: +register())
   * @param {DatabaseConnection} db
   * @returns {College}
   */
  register(db = DatabaseConnection.getInstance()) {
    if (!this.email || !this.college_name) {
      throw new Error('College name and email are required for registration');
    }
    const existingEmail = [...db.tables.colleges.values()].find((c) => c.email === this.email);
    if (existingEmail && existingEmail.college_id !== this.college_id) {
      throw new Error('409 Conflict: An institution with this email is already registered');
    }
    db.tables.colleges.set(this.college_id, this);
    db.logAudit('College', this.college_id, 'College.register()', `Registered ${this.college_name}`);
    return this;
  }

  /**
   * Authenticates the College using encapsulated private #password (Week 6 UML: +login())
   * @param {string} plainPassword
   * @returns {boolean}
   */
  login(plainPassword) {
    return DatabaseConnection.verifyPassword(plainPassword, this.#password);
  }

  /**
   * Submits a new application and triggers OCR on attached documents (Week 6 UML: +applyForApplication())
   * @param {object} params
   * @param {IDocumentProcessor} docProcessor
   * @returns {{ application: Application, documents: Array<Document> }}
   */
  applyForApplication({ application_id, subject_applied_for, application_details, rawDocuments = [] }, docProcessor) {
    if (!subject_applied_for || !String(subject_applied_for).trim()) {
      throw new Error('Validation Error (SRS 3.2 REQ-1): Program applied for is required');
    }
    const app = new Application({
      application_id,
      college_id: this.college_id,
      subject_applied_for: String(subject_applied_for).trim(),
      application_details: String(application_details || '').trim(),
      status: 'Applied'
    });

    const processedDocs = rawDocuments.map((d) => {
      const doc = new Document({
        document_id: d.document_id,
        application_id: app.application_id,
        document_type: d.document_type,
        file_url: d.file_url,
        file_name: d.file_name,
        file_size_bytes: d.file_size_bytes || 0
      });
      doc.uploadDocument(d.file_url, d.raw_text || '', docProcessor, {
        file_name: d.file_name,
        file_size_bytes: d.file_size_bytes || 0
      });
      app.attachDocument(doc);
      return doc;
    });

    return { application: app, documents: processedDocs };
  }

  /**
   * Retrieves real-time status and anonymized clarifications for this College's own applications (SRS 3.2 REQ-4)
   * @param {Array<Application>} allApplications
   * @param {Array<ClarificationRequest>} allClarifications
   * @returns {Array<object>}
   */
  trackApplicationStatus(allApplications = [], allClarifications = []) {
    return allApplications
      .filter((app) => app.college_id === this.college_id)
      .map((app) => ({
        application_id: app.application_id,
        college_id: app.college_id,
        subject_applied_for: app.subject_applied_for,
        application_details: app.application_details,
        status: app.getStatus(),
        submitted_date: app.submitted_date,
        final_decision: app.final_decision,
        final_decision_reason: app.final_decision_reason,
        final_decision_at: app.final_decision_at,
        clarifications: allClarifications
          .filter((c) => c.application_id === app.application_id)
          .map((c) => c.toCollegeView()) // Enforces SRS 3.4 REQ-4 & BR-4 anonymization
      }));
  }

  /**
   * Updates editable institutional profile fields (Week 6 UML: +updateProfile())
   * @param {object} updates
   * @returns {College}
   */
  updateProfile(updates = {}) {
    const allowed = ['college_name', 'address', 'contact_no', 'trust_society_name', 'authorized_signatory_name'];
    allowed.forEach((field) => {
      if (updates[field] !== undefined && String(updates[field]).trim() !== '') {
        this[field] = String(updates[field]).trim();
      }
    });
    return this;
  }

  /**
   * Conditional <<extend>> use case: Re-uploads a specific document ONLY when a clarification request is Open
   * and belongs to this College (SRS 3.2 REQ-4 & REQ-7, Week 6 UML: +reuploadDocument())
   */
  reuploadDocument(document, clarificationRequest, newFileUrl, newRawText, docProcessor, application, fileMeta = {}) {
    if (application && application.college_id !== this.college_id) {
      throw new Error('403 Forbidden: Cannot re-upload documents for another institution');
    }
    if (!clarificationRequest || clarificationRequest.status !== 'Open') {
      throw new Error(
        'Reupload denied (SRS 3.2 REQ-7): Document can only be re-uploaded when an open ClarificationRequest exists.'
      );
    }
    if (clarificationRequest.document_id !== document.document_id) {
      throw new Error('Reupload denied (SRS 3.2 REQ-7): Only the specific flagged document may be re-uploaded.');
    }

    // Re-upload and automatically re-run OCR (SRS 3.3 REQ-3)
    document.uploadDocument(newFileUrl, newRawText, docProcessor, fileMeta);
    clarificationRequest.resolveRequest();

    if (application && application.getStatus() === 'Clarification Requested') {
      application.updateStatus('Under Review');
    }

    return { document, clarificationRequest };
  }
}

module.exports = College;

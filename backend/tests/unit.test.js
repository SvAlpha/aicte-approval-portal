'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const DatabaseConnection = require('../database/db');
const College = require('../models/College');
const Application = require('../models/Application');
const Evaluator = require('../models/Evaluator');
const Document = require('../models/Document');
const AICTEAdmin = require('../models/AICTEAdmin');
const IDocumentProcessor = require('../services/IDocumentProcessor');
const TesseractOCRService = require('../services/TesseractOCRService');
const IEvaluatorMatcher = require('../services/IEvaluatorMatcher');
const NLPMatchingService = require('../services/NLPMatchingService');
const { signJwt, verifyJwt, authorizeRoles } = require('../middleware/authMiddleware');

test('1. OOP Encapsulation: User models keep #password private and authenticate via login()', () => {
  const college = new College({
    college_id: 'college_101',
    college_name: 'SVIIT College of Engineering',
    email: 'admin@sviit.edu',
    password: 'SecretPassword123!',
    registration_number: 'TR-2024-8891'
  });

  assert.equal(college.password, undefined);
  assert.ok(college.getPasswordHash().startsWith('$2b$10$'));
  assert.equal(college.login('SecretPassword123!'), true);
  assert.equal(college.login('WrongPassword'), false);
});

test('2. SRS 3.1 REQ-5 & 3.4 REQ-7: Evaluator login blocked when unverified/inactive & field-level access enforced', () => {
  const evaluator = new Evaluator({
    evaluator_id: 'evaluator_25',
    evaluator_name: 'Dr. R. Sharma',
    email: 'r.sharma@iitb.ac.in',
    password: 'EvalPassword123',
    expertise: 'Computer Science, AI',
    is_verified: false,
    is_active: true
  });

  assert.throws(() => evaluator.login('EvalPassword123'), /SRS 3.1 REQ-5/);

  // Evaluator attempting to self-edit is_verified via updateProfile() is ignored
  evaluator.updateProfile({ expertise: 'Computer Science, AI, ML', is_verified: true });
  assert.equal(evaluator.expertise, 'Computer Science, AI, ML');
  assert.equal(evaluator.is_verified, false);

  const admin = new AICTEAdmin({
    admin_id: 'admin_01',
    admin_name: 'Dr. Vikram Sethi',
    email: 'admin@aicte-india.org',
    password: 'AdminPassword'
  });
  admin.manageEvaluator(evaluator, { is_verified: true });
  assert.equal(evaluator.is_verified, true);
  assert.equal(evaluator.login('EvalPassword123'), true);
});

test('3. Strategy Pattern (SOLID Dependency Inversion): IDocumentProcessor & TesseractOCRService', () => {
  const baseInterface = new IDocumentProcessor();
  assert.throws(() => baseInterface.extractText({}), /NotImplementedError/);

  const ocrService = new TesseractOCRService();
  const doc = new Document({
    document_id: 'document_D901',
    application_id: 'application_A501',
    document_type: 'Land and Infrastructure',
    file_url: 'https://aicte.gov.in/docs/D901.pdf'
  });

  doc.uploadDocument(
    doc.file_url,
    'LAND CERTIFICATE Reg No: TR-2024-8891. Total built-up area: 4500 sq.ft verified on 10 Sep 2026.',
    ocrService
  );

  assert.ok(doc.getExtractedText().includes('4500 sq.ft'));
  assert.ok(doc.ocr_confidence > 90);
  assert.ok(doc.highlights.some((h) => h.field === 'built_up_area' && h.value === '4500 sq.ft'));
});

test('4. SRS 3.2 REQ-3: Document file format (PDF/JPG/PNG) and 10 MB size validation', () => {
  const ocrService = new TesseractOCRService();
  const doc = new Document({
    document_id: 'document_D999',
    application_id: 'application_A501',
    document_type: 'Affidavit',
    file_url: 'https://aicte.gov.in/docs/D999.pdf'
  });

  // Reject unsupported extension (.exe / .docx)
  assert.throws(
    () => doc.uploadDocument('https://aicte.gov.in/docs/malware.exe', 'text', ocrService),
    /Only PDF, JPG, and PNG files are supported/
  );

  // Reject oversized file (> 10 MB)
  assert.throws(
    () =>
      doc.uploadDocument('https://aicte.gov.in/docs/scan.pdf', 'text', ocrService, {
        file_name: 'scan.pdf',
        file_size_bytes: 12 * 1024 * 1024
      }),
    /exceeds maximum allowed size of 10 MB/
  );

  // Accept valid PDF under 10 MB
  doc.uploadDocument('https://aicte.gov.in/docs/valid_affidavit.pdf', 'Notarized Affidavit Reg TR-2024-8891', ocrService, {
    file_name: 'valid_affidavit.pdf',
    file_size_bytes: 2 * 1024 * 1024
  });
  assert.equal(doc.file_name, 'valid_affidavit.pdf');
});

test('5. Strategy Pattern (AI Module 2): IEvaluatorMatcher & NLPMatchingService with Derived Workload', () => {
  const baseMatcher = new IEvaluatorMatcher();
  assert.throws(() => baseMatcher.suggestEvaluator({}), /NotImplementedError/);

  const matcher = new NLPMatchingService();
  const app = new Application({
    application_id: 'application_A501',
    college_id: 'college_101',
    subject_applied_for: 'B.Tech Computer Science and AI',
    application_details: 'Artificial Intelligence and Machine Learning program'
  });

  const ev1 = new Evaluator({
    evaluator_id: 'evaluator_22',
    evaluator_name: 'Dr. R. Sharma',
    email: 'sharma@iitb.ac.in',
    password: 'pass',
    expertise: 'Computer Science, Artificial Intelligence, Machine Learning',
    availability: 'Available',
    is_verified: true,
    is_active: true
  });

  const ev2 = new Evaluator({
    evaluator_id: 'evaluator_23',
    evaluator_name: 'Dr. Civil Expert',
    email: 'civil@nit.ac.in',
    password: 'pass',
    expertise: 'Civil Engineering, Structural Design',
    availability: 'Available',
    is_verified: true,
    is_active: true
  });

  const evUnverified = new Evaluator({
    evaluator_id: 'evaluator_24',
    evaluator_name: 'Dr. Unverified CS',
    email: 'unv@nit.ac.in',
    password: 'pass',
    expertise: 'Computer Science, Artificial Intelligence',
    availability: 'Available',
    is_verified: false,
    is_active: true
  });

  const suggestions = matcher.suggestEvaluator(app, [ev1, ev2, evUnverified], []);
  assert.equal(suggestions.length, 2);
  assert.equal(suggestions[0].evaluator_id, 'evaluator_22');
  assert.ok(suggestions[0].suitability_score > suggestions[1].suitability_score);
});

test('6. JWT Security: Signature verification, token expiration, and logout revocation', () => {
  const db = DatabaseConnection.getInstance();
  db.resetInMemoryStore();

  const validToken = signJwt({ id: 'college_101', role: 'College' }, 3600);
  const decoded = verifyJwt(validToken, db);
  assert.equal(decoded.id, 'college_101');
  assert.equal(decoded.role, 'College');

  // Tampered payload/signature must fail
  const tamperedToken = validToken.slice(0, -4) + 'XXXX';
  assert.throws(() => verifyJwt(tamperedToken, db), /Invalid JWT signature/);

  // Expired token must fail
  const expiredToken = signJwt({ id: 'college_101', role: 'College' }, -10);
  assert.throws(() => verifyJwt(expiredToken, db), /Session token has expired/);

  // Role guard blocks College token from AICTEAdmin route
  assert.throws(
    () => authorizeRoles(['AICTEAdmin'], db)(validToken),
    /403 Forbidden: Role 'College' is not authorized/
  );

  // Revoked token after logout must fail
  db.revokeToken(validToken);
  assert.throws(() => verifyJwt(validToken, db), /Session token has been logged out/);
});

test('7. Singleton Pattern: DatabaseConnection returns identical instance', () => {
  const db1 = DatabaseConnection.getInstance();
  const db2 = new DatabaseConnection();
  assert.strictEqual(db1, db2);
});

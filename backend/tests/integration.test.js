'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const DatabaseConnection = require('../database/db');
const Evaluator = require('../models/Evaluator');
const AICTEAdmin = require('../models/AICTEAdmin');
const AuthController = require('../controllers/AuthController');
const ApplicationController = require('../controllers/ApplicationController');
const { createServer } = require('../server');

test('8. End-to-End Workflow & Cross-Institution Security Isolation', () => {
  const db = DatabaseConnection.getInstance();
  db.resetInMemoryStore();

  const authCtrl = new AuthController(db);
  const appCtrl = new ApplicationController(db);

  // Public registration cannot create privileged Evaluator or Admin accounts
  assert.throws(
    () =>
      authCtrl.registerCollege({
        college_name: 'Attacker',
        email: 'hacker@test.org',
        password: 'Password123',
        role: 'AICTEAdmin'
      }),
    /403 Forbidden/
  );

  // Register two separate institutions
  const regRes1 = authCtrl.registerCollege({
    college_id: 'college_101',
    college_name: 'SVIIT College of Engineering',
    email: 'admin@sviit.edu',
    password: 'CollegePass123',
    registration_number: 'TR-2024-8891',
    trust_society_name: 'Shri Vaishnav Vidyapeeth Trust',
    authorized_signatory_name: 'Prof. Namrata Bhatt'
  });
  assert.equal(regRes1.status, 201);
  assert.equal(regRes1.role, 'College');
  assert.equal(regRes1.redirectTo, '/college');

  authCtrl.registerCollege({
    college_id: 'college_102',
    college_name: 'Malwa Institute of Science & Technology',
    email: 'registrar@mistindore.ac.in',
    password: 'MistPassword123',
    registration_number: 'TR-2025-4410'
  });

  // Seed Verified Evaluator (Dr. R. Sharma) and AICTE Admin
  const evaluator = new Evaluator({
    evaluator_id: 'evaluator_22',
    evaluator_name: 'Dr. R. Sharma',
    email: 'r.sharma@iitb.ac.in',
    password: 'EvalPass123',
    expertise: 'Computer Science, AI',
    availability: 'Available',
    is_verified: true,
    is_active: true
  });
  db.tables.evaluators.set(evaluator.evaluator_id, evaluator);

  const admin = new AICTEAdmin({
    admin_id: 'admin_01',
    admin_name: 'Dr. Vikram Sethi',
    email: 'admin@aicte-india.org',
    password: 'AdminPass123'
  });
  db.tables.aicte_admins.set(admin.admin_id, admin);

  // Server-determined role login: even if client passes role='AICTEAdmin' with College email, server resolves 'College'
  const loginCollege = authCtrl.login({
    email: 'admin@sviit.edu',
    password: 'CollegePass123',
    role: 'AICTEAdmin'
  });
  assert.equal(loginCollege.role, 'College');
  assert.equal(loginCollege.redirectTo, '/college');

  // College 101 submits Application A501
  const { application, documents } = appCtrl.submitApplication('college_101', {
    application_id: 'application_A501',
    subject_applied_for: 'B.Tech Computer Science',
    application_details: 'Undergraduate Computer Science and AI program',
    rawDocuments: [
      {
        document_id: 'document_D901',
        document_type: 'Land and Infrastructure',
        file_url: 'https://aicte.gov.in/docs/D901_initial.pdf',
        raw_text: 'Initial scan unclear: area 3100 sq.ft Reg TR-2024-8891'
      }
    ]
  });
  assert.equal(application.getStatus(), 'Applied');

  // Institution-level data isolation: College 102 sees 0 applications from College 101
  const college102 = db.tables.colleges.get('college_102');
  assert.equal(college102.trackApplicationStatus([application], []).length, 0);

  // Admin assigns evaluator_22
  const matchRes = appCtrl.matchAndAssignEvaluator('admin_01', 'application_A501', 'evaluator_22');
  assert.equal(matchRes.assigned_evaluator_id, 'evaluator_22');
  assert.equal(application.getStatus(), 'Under Review');

  // Evaluator raises clarification
  const clar = appCtrl.raiseClarification(
    'evaluator_22',
    'application_A501',
    'document_D901',
    'Infrastructure document unclear, please reupload'
  );
  assert.equal(clar.status, 'Open');
  assert.equal(application.getStatus(), 'Clarification Requested');

  // Cross-institution protection: College 102 cannot re-upload document belonging to College 101
  assert.throws(
    () =>
      appCtrl.reuploadFlaggedDocument(
        'college_102',
        'application_A501',
        'document_D901',
        clar.clarification_id,
        'https://aicte.gov.in/docs/hacked.pdf',
        'Fake text'
      ),
    /403 Forbidden: Cannot re-upload documents for another institution/
  );

  // College 101 re-uploads flagged document -> triggers Re-OCR -> resolves Clarification
  appCtrl.reuploadFlaggedDocument(
    'college_101',
    'application_A501',
    'document_D901',
    clar.clarification_id,
    'https://aicte.gov.in/docs/D901_revised.pdf',
    'CERTIFIED LAND CERTIFICATE Reg No: TR-2024-8891. Total built-up area: 4500 sq.ft verified.'
  );
  assert.equal(clar.status, 'Resolved');
  assert.equal(application.getStatus(), 'Under Review');
  assert.ok(documents[0].getExtractedText().includes('4500 sq.ft'));

  // Evaluator submits recommendation
  appCtrl.submitEvaluatorRecommendation(
    'evaluator_22',
    'application_A501',
    'Accept',
    'All documents and physical site visit verified.',
    true
  );
  assert.equal(application.getStatus(), 'Recommended');

  // Admin records binding Final Decision
  appCtrl.recordAdminFinalDecision(
    'admin_01',
    'application_A501',
    'Approved',
    'Approved by AICTE Executive Committee.'
  );
  assert.equal(application.getStatus(), 'Approved');
  assert.equal(application.evaluator_recommendation, 'Accept');
  assert.equal(application.final_decision, 'Approved');
});

test('9. HTTP REST API Server: Protected Routes, Session Validation (/api/auth/me), and Logout Revocation', async () => {
  const db = DatabaseConnection.getInstance();
  db.resetInMemoryStore();

  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Unauthenticated request to GET /api/applications must return 401
    const unauthRes = await fetch(`${baseUrl}/api/applications`);
    assert.equal(unauthRes.status, 401);

    // 2. Register a College via POST /api/auth/register
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_name: 'SVIIT Indore',
        email: 'dean@sviit.edu',
        password: 'StrongPassword99',
        registration_number: 'TR-2026-5001'
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.equal(regData.role, 'College');
    assert.ok(regData.token);

    // 3. Validate session on refresh via GET /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${regData.token}` }
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.email, 'dean@sviit.edu');

    // 4. College attempting to access Admin-only GET /api/analytics must receive 403 Forbidden
    const forbiddenRes = await fetch(`${baseUrl}/api/analytics`, {
      headers: { Authorization: `Bearer ${regData.token}` }
    });
    assert.equal(forbiddenRes.status, 403);

    // 5. Logout via POST /api/auth/logout revokes token; subsequent /api/auth/me returns 401
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${regData.token}` }
    });
    assert.equal(logoutRes.status, 200);

    const afterLogoutRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${regData.token}` }
    });
    assert.equal(afterLogoutRes.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

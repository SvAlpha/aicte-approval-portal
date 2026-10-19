-- ============================================================================
-- AI-Supported AICTE Approval Process Portal
-- PostgreSQL 3NF Relational Schema (IEEE Std 830-1998 SRS Section 6.1)
-- Course: BTCS706N / BTIT706N | SVIIT, SVVV Indore
-- Team: Jayant Dhakad, Shreyansh Pachwariya, Raghav Verma, Abhishek Singh
-- Guide: Prof. Namrata Bhatt
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. College Entity (1:N with Application)
CREATE TABLE IF NOT EXISTS colleges (
    college_id VARCHAR(64) PRIMARY KEY,
    college_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed (private in OOP model)
    address TEXT NOT NULL,
    contact_no VARCHAR(32) NOT NULL,
    trust_society_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(64) UNIQUE NOT NULL,
    authorized_signatory_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Evaluator Entity (1:N with Application, 1:N with ClarificationRequest)
-- Note: workload is a derived attribute (SRS 3.5 REQ-2) computed via active applications count
CREATE TABLE IF NOT EXISTS evaluators (
    evaluator_id VARCHAR(64) PRIMARY KEY,
    evaluator_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed (private in OOP model)
    expertise TEXT NOT NULL,
    availability VARCHAR(32) NOT NULL DEFAULT 'Available' CHECK (availability IN ('Available', 'Unavailable')),
    address TEXT NOT NULL, -- Visible to AICTEAdmin only (SRS 5.3 Privacy)
    contact_no VARCHAR(32) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Admin-controlled (SRS 3.6 REQ-3)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,    -- Admin-controlled (SRS 3.6 REQ-3)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AICTEAdmin Entity
CREATE TABLE IF NOT EXISTS aicte_admins (
    admin_id VARCHAR(64) PRIMARY KEY,
    admin_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed (private in OOP model)
    designation VARCHAR(255) NOT NULL,
    contact_no VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Application Entity (Two-stage decision fields retained with independent timestamps)
CREATE TABLE IF NOT EXISTS applications (
    application_id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
    assigned_evaluator_id VARCHAR(64) REFERENCES evaluators(evaluator_id) ON DELETE SET NULL,
    subject_applied_for VARCHAR(255) NOT NULL,
    application_details TEXT NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'Applied' CHECK (
        status IN ('Applied', 'Under Review', 'Clarification Requested', 'Recommended', 'Approved', 'Rejected')
    ),
    submitted_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    evaluator_recommendation VARCHAR(32) CHECK (evaluator_recommendation IN ('Accept', 'Reject')),
    evaluator_comments TEXT,
    site_visit_confirmed BOOLEAN DEFAULT FALSE,
    recommendation_submitted_at TIMESTAMP,
    final_decision VARCHAR(32) CHECK (final_decision IN ('Approved', 'Rejected')),
    final_decision_reason TEXT,
    final_decision_at TIMESTAMP
);

-- 5. Document Entity (5 Statutory Document Types per Application)
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    document_type VARCHAR(128) NOT NULL CHECK (
        document_type IN (
            'Trust/Society Registration',
            'Land and Infrastructure',
            'Faculty List',
            'Affidavit',
            'Fee Payment Proof'
        )
    ),
    file_url TEXT NOT NULL,
    extracted_text TEXT,
    ai_summary TEXT,
    ocr_confidence NUMERIC(5,2) DEFAULT 0.0,
    uploaded_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. ClarificationRequest Entity (Models <<extend>> conditional workflow)
CREATE TABLE IF NOT EXISTS clarification_requests (
    clarification_id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    raised_by_evaluator_id VARCHAR(64) NOT NULL REFERENCES evaluators(evaluator_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Immutable Audit Log (SRS 5.3 Security & Auditability)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    actor_role VARCHAR(32) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    action_method VARCHAR(128) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data (Matches Week 3 Object Diagram Snapshot)
INSERT INTO colleges (college_id, college_name, email, password, address, contact_no, trust_society_name, registration_number, authorized_signatory_name)
VALUES ('college_101', 'SVIIT College of Engineering', 'admin@sviit.edu', '$2b$10$sviitHashedPassword', 'Sanwer Road, Indore, MP', '+91-731-2729071', 'Shri Vaishnav Vidyapeeth Trust', 'TR-2024-8891', 'Prof. Namrata Bhatt')
ON CONFLICT (college_id) DO NOTHING;

INSERT INTO evaluators (evaluator_id, evaluator_name, email, password, expertise, availability, address, contact_no, is_verified, is_active)
VALUES ('evaluator_22', 'Dr. R. Sharma', 'r.sharma@iitb.ac.in', '$2b$10$sharmaHashedPassword', 'Computer Science, AI', 'Available', 'IIT Bombay Campus, Powai, Mumbai', '+91-98201-44512', TRUE, TRUE)
ON CONFLICT (evaluator_id) DO NOTHING;

INSERT INTO aicte_admins (admin_id, admin_name, email, password, designation, contact_no)
VALUES ('admin_01', 'Dr. Vikram Sethi', 'admin@aicte-india.org', '$2b$10$adminHashedPassword', 'Director (Approval Bureau)', '+91-11-26131577')
ON CONFLICT (admin_id) DO NOTHING;

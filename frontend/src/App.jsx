import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, Building2, UserCheck, FileText, CheckCircle2, XCircle,
  AlertTriangle, Clock, Upload, Cpu, Eye, Lock, LogOut, Plus,
  RefreshCw, Award, BarChart3, CheckSquare, Layers, GitBranch,
  Terminal, FileCheck, UserPlus, Sliders, Database, Server,
  KeyRound, Info, Check, ArrowRight, EyeOff
} from 'lucide-react';

// ============================================================================
// 1. OBJECT-ORIENTED DOMAIN MODELS & STRATEGY PATTERN INTERFACES (WEEK 6 UML)
// ============================================================================

/**
 * <<interface>> IDocumentProcessor
 * Strategy Pattern abstraction for AI Module 1 (Document OCR & Summarization)
 */
class IDocumentProcessor {
  extractText(_document) {
    throw new Error('IDocumentProcessor.extractText() must be implemented by concrete strategy');
  }
}

/**
 * Concrete Strategy 1: TesseractOCRService implements IDocumentProcessor
 */
class TesseractOCRService extends IDocumentProcessor {
  constructor() {
    super();
    this.engineName = 'Tesseract OCR Engine v5.3';
  }

  extractText(docRecord) {
    const rawText = String(docRecord.rawContent || '').trim();
    const regMatch = rawText.match(/(?:TR|REG|AICTE|SOC|TRUST|AFF)[-\s]?[A-Z0-9]{2,6}[-\s]?[0-9]{3,6}/i);
    const areaMatch = rawText.match(/(\d[\d,]*)\s*(?:sq\.?\s*ft|square\s*feet|acres)/i);
    const facultyMatch = rawText.match(/(\d+)\s*(?:full[-\s]?time\s*faculty|faculty\s*members|professors)/i);
    const receiptMatch = rawText.match(/(?:NEFT|RTGS|UTR|TXN)[-\s:/]?([A-Z0-9]{6,16})/i);
    const amountMatch = rawText.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i);
    const dateMatch = rawText.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i);

    const highlights = [];
    if (regMatch) {
      highlights.push({
        label: 'Registration / Reference ID',
        value: regMatch[0].toUpperCase(),
        findingType: 'verified',
        status: 'Reference Format Detected'
      });
    }
    if (areaMatch) {
      const numericArea = parseInt(areaMatch[1].replace(/,/g, ''), 10);
      const meetsNorm = numericArea >= 4000;
      highlights.push({
        label: 'Built-up / Instructional Area',
        value: areaMatch[0],
        findingType: meetsNorm ? 'verified' : 'warning',
        status: meetsNorm ? 'Meets Standard (>= 4,000 sq.ft)' : 'Below Threshold (< 4,000 sq.ft)'
      });
    }
    if (facultyMatch) {
      highlights.push({
        label: 'Faculty Count Extracted',
        value: `${facultyMatch[1]} Full-Time Faculty`,
        findingType: 'verified',
        status: 'Extracted from Roster'
      });
    }
    if (receiptMatch) {
      highlights.push({
        label: 'Payment UTR / Reference',
        value: receiptMatch[1],
        findingType: 'verified',
        status: 'Transaction ID Extracted'
      });
    }
    if (amountMatch) {
      highlights.push({
        label: 'Statutory Fee Amount',
        value: `INR ${amountMatch[1]}`,
        findingType: 'verified',
        status: 'Fee Figure Extracted'
      });
    }
    if (dateMatch) {
      highlights.push({
        label: 'Document Date',
        value: dateMatch[0],
        findingType: 'neutral',
        status: 'Date Detected'
      });
    }

    if (highlights.length === 0) {
      highlights.push({
        label: 'General Text Stream',
        value: rawText ? `${rawText.slice(0, 72)}` : 'No structured text detected',
        findingType: 'warning',
        status: 'Requires Manual Inspection'
      });
    }

    const tokenCount = rawText.split(/\s+/).filter(Boolean).length;
    const confidence = rawText.length > 60 ? 94.6 : rawText.length > 20 ? 81.2 : 62.0;
    const summary = `Extracted ${tokenCount} words from ${docRecord.document_type} (${docRecord.file_name}). Located ${highlights.length} regulatory field(s). Note: OCR readability confidence (${confidence}%) measures scan text clarity; human evaluator verification is required for compliance.`;

    return {
      extracted_text: rawText,
      ai_summary: summary,
      highlights,
      ocr_confidence: confidence,
      processed_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
  }
}

/**
 * <<interface>> IEvaluatorMatcher
 * Strategy Pattern abstraction for AI Module 2 (NLP Expertise + Dynamic Workload Matching)
 */
class IEvaluatorMatcher {
  suggestEvaluator(_application, _evaluators, _allApplications) {
    throw new Error('IEvaluatorMatcher.suggestEvaluator() must be implemented by concrete strategy');
  }
}

/**
 * Concrete Strategy 2: NLPMatchingService implements IEvaluatorMatcher
 */
class NLPMatchingService extends IEvaluatorMatcher {
  constructor() {
    super();
    this.algorithmName = 'TF-IDF Domain Similarity (65%) + Live Workload Balance (35%)';
  }

  suggestEvaluator(application, evaluators, allApplications) {
    const tokenize = (str) =>
      String(str || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1);

    const appTokens = new Set(
      tokenize(`${application.subject_applied_for} ${application.application_details}`)
    );

    const synonymGroups = [
      ['computer', 'cs', 'cse', 'software', 'ai', 'artificial', 'intelligence', 'ml', 'data', 'cyber', 'it'],
      ['mechanical', 'me', 'robotics', 'manufacturing', 'thermal', 'cad', 'automotive'],
      ['electronics', 'ece', 'vlsi', 'embedded', 'iot', 'communication', 'electrical', 'eee'],
      ['civil', 'structural', 'infrastructure', 'environmental', 'construction', 'geotechnical'],
      ['management', 'mba', 'business', 'finance', 'operations', 'commerce']
    ];

    // SRS 3.5 REQ-3: Exclude inactive, unverified, or unavailable evaluators
    const eligibleEvaluators = evaluators.filter(
      (ev) => ev.is_active && ev.is_verified && ev.availability === 'Available'
    );

    const ranked = eligibleEvaluators.map((ev) => {
      const evTokens = tokenize(ev.expertise);
      let matchedKeywords = [];

      evTokens.forEach((token) => {
        if (appTokens.has(token)) {
          matchedKeywords.push(token);
        } else {
          for (const grp of synonymGroups) {
            if (grp.includes(token) && [...appTokens].some((at) => grp.includes(at))) {
              matchedKeywords.push(token);
              break;
            }
          }
        }
      });

      matchedKeywords = [...new Set(matchedKeywords)];
      const expertiseScore = Math.min(
        100,
        Math.round((matchedKeywords.length / Math.max(1, Math.min(evTokens.length, 4))) * 100)
      );

      // SRS 3.5 REQ-2: Compute workload dynamically by counting active assigned applications
      const activeAssignedCount = allApplications.filter(
        (app) =>
          app.assigned_evaluator_id === ev.evaluator_id &&
          ['Under Review', 'Clarification Requested'].includes(app.status)
      ).length;

      const workloadScore = Math.max(10, 100 - activeAssignedCount * 25);
      const totalSuitabilityScore = Math.round(expertiseScore * 0.65 + workloadScore * 0.35);

      return {
        evaluator_id: ev.evaluator_id,
        evaluator_name: ev.evaluator_name,
        email: ev.email,
        expertise: ev.expertise,
        availability: ev.availability,
        active_workload: activeAssignedCount,
        expertise_score: expertiseScore,
        workload_score: workloadScore,
        suitability_score: totalSuitabilityScore,
        matched_terms: matchedKeywords.length > 0 ? matchedKeywords : ['general technical accreditation']
      };
    });

    return ranked.sort((a, b) => b.suitability_score - a.suitability_score);
  }
}

// ============================================================================
// 2. SEED DATA & CONSTANTS (WEEK 3 OBJECT DIAGRAM & IEEE 830 SRS)
// ============================================================================

const SESSION_STORAGE_KEY = 'aicte_portal_session_v2';
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per SRS 3.2 REQ-3

const MANDATORY_DOC_TYPES = [
  'Trust/Society Registration',
  'Land and Infrastructure',
  'Faculty List',
  'Affidavit',
  'Fee Payment Proof'
];

const SAMPLE_DOC_TEMPLATES = {
  'Trust/Society Registration': {
    file_name: 'SVIIT_Trust_Registration_Certificate.pdf',
    file_size_bytes: 1420000,
    rawContent:
      'SOCIETY REGISTRATION CERTIFICATE Reg No: TR-2024-8891 issued under Madhya Pradesh Society Registrikaran Adhiniyam. Trust Name: Shri Vaishnav Vidyapeeth Trust, Indore. Authorized Signatory: Dr. Upinder Dhar. Date: 12 Jan 2024. Validated for Technical Education Institution operations.'
  },
  'Land and Infrastructure': {
    file_name: 'Campus_Land_Infrastructure_Blueprint.pdf',
    file_size_bytes: 2850000,
    rawContent:
      'ARCHITECTURAL & LAND CERTIFICATE Survey Plot No. 44/2, Sanwer Road, Indore. Total built-up area: 6500 sq.ft dedicated for Computer Science & AI laboratories, 12 smart classrooms, seminar hall, and barrier-free campus facilities. Fire safety NOC Date: 04 Aug 2026.'
  },
  'Faculty List': {
    file_name: 'AICTE_Faculty_Roster_2026.pdf',
    file_size_bytes: 980000,
    rawContent:
      'FACULTY COMPLIANCE STATEMENT Total 28 full-time faculty members appointed for B.Tech Computer Science & Engineering. Faculty-Student Ratio 1:15 compliant with AICTE APH 2026 norms. 8 Professors with Ph.D. in AI, Machine Learning, and Distributed Systems.'
  },
  'Affidavit': {
    file_name: 'Notarized_Affidavit_Format_4.pdf',
    file_size_bytes: 1120000,
    rawContent:
      'NOTARIZED AFFIDAVIT ON Rs. 100 NON-JUDICIAL STAMP Reg ID: AFF-MP-90812. We hereby solemnly affirm that all laboratories, library volumes (14,500 books), and high-speed 1 Gbps leased line internet meet AICTE Approval Process Handbook norms. Date: 01 Sep 2026.'
  },
  'Fee Payment Proof': {
    file_name: 'AICTE_Processing_Fee_Receipt.pdf',
    file_size_bytes: 640000,
    rawContent:
      'NATIONAL ELECTRONIC FUNDS TRANSFER (NEFT) RECEIPT Transaction Reference: NEFT-AICTE202699812. Paid Amount: Rs. 3,50,000.00 towards AICTE Extension of Approval / New Program Regulatory Fee. Date: 03 Sep 2026. Remitter: SVIIT College of Engineering.'
  }
};

// Deterministic hash helper for in-browser authentication verification
function computeDemoPasswordHash(plainText) {
  let hash = 2166136261;
  const input = `svvv_salt_2026:${String(plainText)}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `$2b$10$svvv${(hash >>> 0).toString(16).padStart(8, '0')}Hash`;
}

const INITIAL_COLLEGES = [
  {
    college_id: 'college_101',
    college_name: 'SVIIT College of Engineering',
    email: 'admin@sviit.edu',
    password_hash: computeDemoPasswordHash('College@123'),
    address: 'Vaishnav Vihar, Sanwer Road, Indore, MP 453111',
    contact_no: '+91-731-2729071',
    trust_society_name: 'Shri Vaishnav Vidyapeeth Trust',
    registration_number: 'TR-2024-8891',
    authorized_signatory_name: 'Prof. Namrata Bhatt',
    is_seeded_demo: true
  },
  {
    college_id: 'college_102',
    college_name: 'Malwa Institute of Science & Technology',
    email: 'registrar@mistindore.ac.in',
    password_hash: computeDemoPasswordHash('College@123'),
    address: 'Bypass Road, Rau, Indore, MP 453331',
    contact_no: '+91-731-4092110',
    trust_society_name: 'Malwa Technical Education Society',
    registration_number: 'TR-2025-4410',
    authorized_signatory_name: 'Dr. A. K. Tiwari',
    is_seeded_demo: true
  }
];

const INITIAL_EVALUATORS = [
  {
    evaluator_id: 'evaluator_22',
    evaluator_name: 'Dr. R. Sharma',
    email: 'r.sharma@iitb.ac.in',
    password_hash: computeDemoPasswordHash('Evaluator@123'),
    expertise: 'Computer Science, AI, Machine Learning, Data Science',
    availability: 'Available',
    address: 'Quarters B-14, IIT Campus, Powai, Mumbai',
    contact_no: '+91-98201-44512',
    is_verified: true,
    is_active: true,
    is_seeded_demo: true
  },
  {
    evaluator_id: 'evaluator_23',
    evaluator_name: 'Dr. Meera Krishnan',
    email: 'm.krishnan@nitk.edu.in',
    password_hash: computeDemoPasswordHash('Evaluator@123'),
    expertise: 'Electronics, VLSI, Embedded Systems, IoT, Communication',
    availability: 'Available',
    address: 'Faculty Enclave 8, NITK Surathkal, Karnataka',
    contact_no: '+91-94481-22901',
    is_verified: true,
    is_active: true,
    is_seeded_demo: true
  },
  {
    evaluator_id: 'evaluator_24',
    evaluator_name: 'Prof. Arvind Deshmukh',
    email: 'a.deshmukh@vnit.ac.in',
    password_hash: computeDemoPasswordHash('Evaluator@123'),
    expertise: 'Computer Science, Software Engineering, Cybersecurity, Cloud',
    availability: 'Available',
    address: 'South Ambazari Road, VNIT Nagpur',
    contact_no: '+91-98220-77123',
    is_verified: true,
    is_active: true,
    is_seeded_demo: true
  },
  {
    evaluator_id: 'evaluator_25',
    evaluator_name: 'Dr. K. V. Subramanian',
    email: 'kv.sub@annauniv.edu',
    password_hash: computeDemoPasswordHash('Evaluator@123'),
    expertise: 'Mechanical Engineering, Robotics, Thermal, Manufacturing',
    availability: 'Unavailable',
    address: 'Sardar Patel Road, Guindy, Chennai',
    contact_no: '+91-98401-66320',
    is_verified: false,
    is_active: true,
    is_seeded_demo: true
  }
];

const INITIAL_ADMINS = [
  {
    admin_id: 'admin_01',
    admin_name: 'Dr. Vikram Sethi',
    email: 'admin@aicte-india.org',
    password_hash: computeDemoPasswordHash('Admin@123'),
    designation: 'Director (Approval Bureau), AICTE Headquarters',
    contact_no: '+91-11-26131577',
    is_seeded_demo: true
  }
];

const ocrProcessor = new TesseractOCRService();
const evaluatorMatcher = new NLPMatchingService();

function buildInitialDocuments() {
  const rawDocs = [
    {
      document_id: 'document_D901',
      application_id: 'application_A501',
      document_type: 'Land and Infrastructure',
      file_name: 'SVIIT_Land_Infrastructure_Verified.pdf',
      file_size_bytes: 2450000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A501/document_D901.pdf',
      uploaded_date: '2026-09-10 10:15:00',
      rawContent:
        'LAND & INFRASTRUCTURE CERTIFICATE Reg No: TR-2024-8891. Total built-up area: 4500 sq.ft (Updated & Resolved Annex-II with 6 dedicated Computer Science Labs and Smart Classrooms). Certified Date: 10 Sep 2026.'
    },
    {
      document_id: 'document_D902',
      application_id: 'application_A501',
      document_type: 'Trust/Society Registration',
      file_name: 'SVIIT_Trust_Deed_TR20248891.pdf',
      file_size_bytes: 1380000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A501/document_D902.pdf',
      uploaded_date: '2026-09-08 09:30:00',
      rawContent: SAMPLE_DOC_TEMPLATES['Trust/Society Registration'].rawContent
    },
    {
      document_id: 'document_D903',
      application_id: 'application_A501',
      document_type: 'Faculty List',
      file_name: 'SVIIT_CSE_Faculty_Roster.pdf',
      file_size_bytes: 940000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A501/document_D903.pdf',
      uploaded_date: '2026-09-08 09:32:00',
      rawContent: SAMPLE_DOC_TEMPLATES['Faculty List'].rawContent
    },
    {
      document_id: 'document_D904',
      application_id: 'application_A501',
      document_type: 'Affidavit',
      file_name: 'SVIIT_Affidavit_Notarized.pdf',
      file_size_bytes: 1100000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A501/document_D904.pdf',
      uploaded_date: '2026-09-08 09:35:00',
      rawContent: SAMPLE_DOC_TEMPLATES['Affidavit'].rawContent
    },
    {
      document_id: 'document_D905',
      application_id: 'application_A501',
      document_type: 'Fee Payment Proof',
      file_name: 'SVIIT_NEFT_Receipt.pdf',
      file_size_bytes: 580000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A501/document_D905.pdf',
      uploaded_date: '2026-09-08 09:40:00',
      rawContent: SAMPLE_DOC_TEMPLATES['Fee Payment Proof'].rawContent
    },
    {
      document_id: 'document_D906',
      application_id: 'application_A502',
      document_type: 'Trust/Society Registration',
      file_name: 'SVIIT_Trust_Registration.pdf',
      file_size_bytes: 1380000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A502/document_D906.pdf',
      uploaded_date: '2026-10-12 11:00:00',
      rawContent: SAMPLE_DOC_TEMPLATES['Trust/Society Registration'].rawContent
    },
    {
      document_id: 'document_D907',
      application_id: 'application_A502',
      document_type: 'Land and Infrastructure',
      file_name: 'SVIIT_AIML_Block_Scan_LowRes.pdf',
      file_size_bytes: 1920000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A502/document_D907.pdf',
      uploaded_date: '2026-10-12 11:05:00',
      rawContent:
        'PRELIMINARY INFRASTRUCTURE ANNEX Reg No: TR-2024-8891. Total built-up area: 3200 sq.ft shown on partial floor plan scan; GPU server room partition dimensions illegible on page 2.'
    },
    {
      document_id: 'document_D908',
      application_id: 'application_A502',
      document_type: 'Faculty List',
      file_name: 'SVIIT_AIML_Faculty_List.pdf',
      file_size_bytes: 890000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A502/document_D908.pdf',
      uploaded_date: '2026-10-12 11:10:00',
      rawContent:
        'FACULTY ROSTER FOR B.TECH AI & ML: 18 full-time faculty members with specialization in Deep Learning, NLP, and Computer Vision. Date: 10 Oct 2026.'
    },
    {
      document_id: 'document_D909',
      application_id: 'application_A502',
      document_type: 'Affidavit',
      file_name: 'SVIIT_AIML_Affidavit.pdf',
      file_size_bytes: 1050000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A502/document_D909.pdf',
      uploaded_date: '2026-10-12 11:12:00',
      rawContent: SAMPLE_DOC_TEMPLATES['Affidavit'].rawContent
    },
    {
      document_id: 'document_D910',
      application_id: 'application_A502',
      document_type: 'Fee Payment Proof',
      file_name: 'SVIIT_AIML_Fee_Receipt.pdf',
      file_size_bytes: 610000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A502/document_D910.pdf',
      uploaded_date: '2026-10-12 11:15:00',
      rawContent: SAMPLE_DOC_TEMPLATES['Fee Payment Proof'].rawContent
    },
    {
      document_id: 'document_D911',
      application_id: 'application_A503',
      document_type: 'Trust/Society Registration',
      file_name: 'MIST_Society_Reg_TR20254410.pdf',
      file_size_bytes: 1250000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A503/document_D911.pdf',
      uploaded_date: '2026-10-16 14:20:00',
      rawContent:
        'SOCIETY REGISTRATION Reg No: TR-2025-4410. Malwa Technical Education Society, Indore. Date: 15 Mar 2025.'
    },
    {
      document_id: 'document_D912',
      application_id: 'application_A503',
      document_type: 'Land and Infrastructure',
      file_name: 'MIST_VLSI_Lab_Infrastructure.pdf',
      file_size_bytes: 2740000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A503/document_D912.pdf',
      uploaded_date: '2026-10-16 14:22:00',
      rawContent:
        'INFRASTRUCTURE CERTIFICATE Reg No: TR-2025-4410. Total built-up area: 5400 sq.ft equipped with Cadence VLSI design suites, FPGA kits, and cleanroom lab. Date: 14 Oct 2026.'
    },
    {
      document_id: 'document_D913',
      application_id: 'application_A503',
      document_type: 'Faculty List',
      file_name: 'MIST_ECE_Faculty_List.pdf',
      file_size_bytes: 910000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A503/document_D913.pdf',
      uploaded_date: '2026-10-16 14:25:00',
      rawContent:
        'FACULTY LIST: 22 full-time faculty members in Electronics, VLSI Design, Embedded Systems, and Signal Processing. Date: 15 Oct 2026.'
    },
    {
      document_id: 'document_D914',
      application_id: 'application_A503',
      document_type: 'Affidavit',
      file_name: 'MIST_Affidavit_2026.pdf',
      file_size_bytes: 1020000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A503/document_D914.pdf',
      uploaded_date: '2026-10-16 14:27:00',
      rawContent: SAMPLE_DOC_TEMPLATES['Affidavit'].rawContent
    },
    {
      document_id: 'document_D915',
      application_id: 'application_A503',
      document_type: 'Fee Payment Proof',
      file_name: 'MIST_Fee_Receipt_NEFT.pdf',
      file_size_bytes: 590000,
      file_url: 'https://aicte-portal.storage.gov.in/docs/A503/document_D915.pdf',
      uploaded_date: '2026-10-16 14:30:00',
      rawContent:
        'NEFT RECEIPT Reference: NEFT-MIST20267741. Paid Rs. 3,50,000.00 to AICTE New Program Account. Date: 16 Oct 2026.'
    }
  ];

  return rawDocs.map((doc) => {
    const ocrResult = ocrProcessor.extractText(doc);
    return { ...doc, ...ocrResult };
  });
}

const INITIAL_APPLICATIONS = [
  {
    application_id: 'application_A501',
    college_id: 'college_101',
    assigned_evaluator_id: 'evaluator_22',
    subject_applied_for: 'B.Tech Computer Science',
    application_details:
      'Approval for 120 intake seats in B.Tech Computer Science & Engineering with specialized AI and Cloud Computing laboratories.',
    status: 'Recommended',
    submitted_date: '2026-09-08 09:45:00',
    evaluator_recommendation: 'Accept',
    evaluator_comments:
      'All 5 statutory documents verified via OCR summary and manual inspection. Physical site inspection completed; earlier floor-plan discrepancy on document_D901 was resolved.',
    site_visit_confirmed: true,
    recommendation_submitted_at: '2026-09-14 16:30:00',
    final_decision: null,
    final_decision_reason: null,
    final_decision_at: null,
    is_seeded_demo: true
  },
  {
    application_id: 'application_A502',
    college_id: 'college_101',
    assigned_evaluator_id: 'evaluator_22',
    subject_applied_for: 'B.Tech Artificial Intelligence & Machine Learning',
    application_details:
      'New undergraduate program with 60 intake seats in Artificial Intelligence, Machine Learning, and NLP research laboratory.',
    status: 'Clarification Requested',
    submitted_date: '2026-10-12 11:20:00',
    evaluator_recommendation: null,
    evaluator_comments: null,
    site_visit_confirmed: false,
    recommendation_submitted_at: null,
    final_decision: null,
    final_decision_reason: null,
    final_decision_at: null,
    is_seeded_demo: true
  },
  {
    application_id: 'application_A503',
    college_id: 'college_102',
    assigned_evaluator_id: null,
    subject_applied_for: 'M.Tech Electronics & VLSI Design',
    application_details:
      'Postgraduate program in Electronics, VLSI Design, and Embedded IoT Systems (30 seats).',
    status: 'Applied',
    submitted_date: '2026-10-16 14:35:00',
    evaluator_recommendation: null,
    evaluator_comments: null,
    site_visit_confirmed: false,
    recommendation_submitted_at: null,
    final_decision: null,
    final_decision_reason: null,
    final_decision_at: null,
    is_seeded_demo: true
  },
  {
    application_id: 'application_A500',
    college_id: 'college_102',
    assigned_evaluator_id: 'evaluator_24',
    subject_applied_for: 'B.Tech Information Technology & Cybersecurity',
    application_details:
      'Extension of approval and intake expansion (60 to 120 seats) in Information Technology and Network Security.',
    status: 'Approved',
    submitted_date: '2026-09-01 10:00:00',
    evaluator_recommendation: 'Accept',
    evaluator_comments:
      'Full compliance with AICTE APH 2026 norms. Faculty ratio 1:14 and cybersecurity laboratory verified.',
    site_visit_confirmed: true,
    recommendation_submitted_at: '2026-09-05 15:20:00',
    final_decision: 'Approved',
    final_decision_reason:
      'Evaluator recommendation accepted by AICTE Standing Appellate Committee. Extension of Approval (EoA) issued.',
    final_decision_at: '2026-09-07 11:10:00',
    is_seeded_demo: true
  }
];

const INITIAL_CLARIFICATIONS = [
  {
    clarification_id: 'clarification_C11',
    application_id: 'application_A501',
    document_id: 'document_D901',
    raised_by_evaluator_id: 'evaluator_22',
    message: 'Infrastructure document unclear, please reupload with certified built-up area above 4000 sq.ft.',
    status: 'Resolved',
    created_at: '2026-09-09 14:10:00',
    resolved_at: '2026-09-10 10:15:00'
  },
  {
    clarification_id: 'clarification_C12',
    application_id: 'application_A502',
    document_id: 'document_D907',
    raised_by_evaluator_id: 'evaluator_22',
    message:
      'OCR extracted 3,200 sq.ft on Land & Infrastructure scan (below the 4,000 sq.ft AICTE threshold) and page 2 lab partition dimensions are blurry. Please upload a high-resolution certified floor plan.',
    status: 'Open',
    created_at: '2026-10-14 17:05:00',
    resolved_at: null
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    log_id: 'LOG-1005',
    timestamp: '2026-09-14 16:30:00',
    actor_role: 'Evaluator',
    actor_id: 'evaluator_22',
    uml_method: 'Evaluator.submitRecommendation() -> Application.recordEvaluatorRecommendation()',
    description: 'Dr. R. Sharma submitted Accept recommendation (site_visit_confirmed = true) for application_A501.'
  },
  {
    log_id: 'LOG-1004',
    timestamp: '2026-09-10 10:15:00',
    actor_role: 'College',
    actor_id: 'college_101',
    uml_method: 'College.reuploadDocument() -> TesseractOCRService.extractText()',
    description: 'SVIIT re-uploaded document_D901; OCR extracted 4,500 sq.ft; clarification_C11 marked Resolved.'
  },
  {
    log_id: 'LOG-1003',
    timestamp: '2026-09-09 14:10:00',
    actor_role: 'Evaluator',
    actor_id: 'evaluator_22',
    uml_method: 'Evaluator.requestClarification() -> ClarificationRequest.createRequest()',
    description: 'Clarification C11 raised on document_D901 (anonymized notification dispatched to college_101).'
  },
  {
    log_id: 'LOG-1002',
    timestamp: '2026-09-08 11:20:00',
    actor_role: 'AICTEAdmin',
    actor_id: 'admin_01',
    uml_method: 'AICTEAdmin.assignEvaluator() via IEvaluatorMatcher.suggestEvaluator()',
    description: 'AI Matcher scored Dr. R. Sharma (evaluator_22) highest for application_A501; Admin confirmed assignment.'
  },
  {
    log_id: 'LOG-1001',
    timestamp: '2026-09-08 09:45:00',
    actor_role: 'College',
    actor_id: 'college_101',
    uml_method: 'College.applyForApplication() -> IDocumentProcessor.extractText()',
    description: 'SVIIT College of Engineering submitted application_A501 (B.Tech Computer Science) with 5 statutory documents.'
  }
];

// Unified Semantic Status System (Color + Icon + Label for WCAG accessibility)
const STATUS_CONFIG = {
  Applied: {
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    dot: 'bg-slate-500',
    nextActionCollege: 'Awaiting AICTE Admin evaluator assignment.',
    nextActionAdmin: 'Assign a verified domain evaluator using the Evaluator Matcher.'
  },
  'Under Review': {
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    nextActionCollege: 'Application is currently under Evaluator document & site review.',
    nextActionEvaluator: 'Inspect statutory documents and either request clarification or submit a recommendation.'
  },
  'Clarification Requested': {
    badge: 'bg-amber-50 text-amber-900 border-amber-300',
    dot: 'bg-amber-600',
    nextActionCollege: 'Action Required: Re-upload the flagged statutory document below to resume review.',
    nextActionEvaluator: 'Awaiting revised document upload from the institution.'
  },
  Recommended: {
    badge: 'bg-blue-50 text-blue-900 border-blue-300',
    dot: 'bg-blue-700',
    nextActionCollege: 'Evaluator review complete; awaiting AICTE Admin final decision.',
    nextActionAdmin: 'Action Required: Review the Evaluator recommendation and record the binding final decision.'
  },
  Approved: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-600',
    nextActionCollege: 'Application approved. Extension of Approval (EoA) recorded.',
    nextActionAdmin: 'Final decision recorded (Approved).'
  },
  Rejected: {
    badge: 'bg-rose-50 text-rose-800 border-rose-300',
    dot: 'bg-rose-600',
    nextActionCollege: 'Application rejected. Review the official decision reason below.',
    nextActionAdmin: 'Final decision recorded (Rejected).'
  }
};

const LIFECYCLE_STEPS = [
  'Applied',
  'Under Review',
  'Clarification Requested',
  'Recommended',
  'Final Decision'
];

// Helper to create and validate client-side session tokens with expiration
function createSessionToken(payload, expiresInSeconds = 28800) {
  const nowSec = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: nowSec, exp: nowSec + expiresInSeconds };
  const encoded = btoa(JSON.stringify(body));
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encoded}.svvvHmac256`;
}

function parseAndValidateSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const decoded = JSON.parse(atob(parts[1]));
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof decoded.exp === 'number' && nowSec >= decoded.exp) {
      return { expired: true };
    }
    return decoded;
  } catch (_err) {
    return null;
  }
}

function formatFileSize(bytes) {
  const num = Number(bytes || 0);
  if (num <= 0) return '1.1 MB';
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(0)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

// ============================================================================
// 3. MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Core relational state (mirrors the 6 PostgreSQL tables in 3NF)
  const [colleges, setColleges] = useState(INITIAL_COLLEGES);
  const [evaluators, setEvaluators] = useState(INITIAL_EVALUATORS);
  const [admins] = useState(INITIAL_ADMINS);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [documents, setDocuments] = useState(() => buildInitialDocuments());
  const [clarifications, setClarifications] = useState(INITIAL_CLARIFICATIONS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Authentication & Routing State (Section 9: Fresh unauthenticated visit starts at Login)
  // session is null when logged out, or { role: 'College'|'Evaluator'|'AICTEAdmin', userId, email, name, jwtToken, exp }
  const [session, setSession] = useState(null);
  const [activeView, setActiveView] = useState('AuthScreen'); // 'Workspace' | 'Architecture' | 'AuthScreen'
  const [authNotice, setAuthNotice] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);

  // UI Feedback & Confirmation Modals
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showTraceabilityDrawer, setShowTraceabilityDrawer] = useState(false);

  // College Workspace State
  const [collegeTab, setCollegeTab] = useState('applications'); // 'applications' | 'new_application' | 'profile'
  const [selectedCollegeAppId, setSelectedCollegeAppId] = useState('application_A502');
  const [newAppSubject, setNewAppSubject] = useState('B.Tech Computer Science & Artificial Intelligence');
  const [newAppDetails, setNewAppDetails] = useState(
    'Proposal for 60 intake seats with dedicated GPU Computing Cluster, Smart Classrooms, and 15 Ph.D. Faculty.'
  );
  const [newAppError, setNewAppError] = useState(null);
  const [newAppDocs, setNewAppDocs] = useState(() => {
    const initial = {};
    MANDATORY_DOC_TYPES.forEach((t) => {
      initial[t] = {
        file_name: SAMPLE_DOC_TEMPLATES[t].file_name,
        file_size_bytes: SAMPLE_DOC_TEMPLATES[t].file_size_bytes,
        rawContent: SAMPLE_DOC_TEMPLATES[t].rawContent
      };
    });
    return initial;
  });
  const [reuploadTextByDoc, setReuploadTextByDoc] = useState({});
  const [reuploadFileNameByDoc, setReuploadFileNameByDoc] = useState({});
  const [reuploadSizeByDoc, setReuploadSizeByDoc] = useState({});
  const [reuploadErrorByDoc, setReuploadErrorByDoc] = useState({});

  // Evaluator Workspace State
  const [evaluatorTab, setEvaluatorTab] = useState('assigned'); // 'assigned' | 'profile'
  const [selectedEvalAppId, setSelectedEvalAppId] = useState('application_A502');
  const [selectedEvalDocId, setSelectedEvalDocId] = useState('document_D907');
  const [evalViewMode, setEvalViewMode] = useState('ai_assisted'); // 'ai_assisted' | 'manual'
  const [clarificationDraft, setClarificationDraft] = useState('');
  const [recDecision, setRecDecision] = useState('Accept');
  const [recComments, setRecComments] = useState(
    'Verified all 5 statutory documents via OCR summary and manual inspection. Infrastructure and faculty norms satisfied.'
  );
  const [recSiteVisit, setRecSiteVisit] = useState(true);

  // AICTE Admin Workspace State
  const [adminTab, setAdminTab] = useState('applications'); // 'applications' | 'matcher' | 'evaluators' | 'analytics'
  const [adminFilterStatus, setAdminFilterStatus] = useState('All');
  const [selectedAdminAppId, setSelectedAdminAppId] = useState('application_A501');
  const [matcherAppId, setMatcherAppId] = useState('application_A503');
  const [finalDecisionChoice, setFinalDecisionChoice] = useState('Approved');
  const [finalDecisionReason, setFinalDecisionReason] = useState(
    'Evaluator recommendation and physical site-visit verification reviewed and approved by AICTE Standing Appellate Committee.'
  );
  const [newEvalForm, setNewEvalForm] = useState({
    evaluator_name: '',
    email: '',
    expertise: 'Computer Science, AI, Data Science, Cloud',
    contact_no: '+91-98110-12345',
    address: 'IIT Delhi Campus, Hauz Khas, New Delhi'
  });

  // Authentication Form State (No prefilled credentials per Section 3.H)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regForm, setRegForm] = useState({
    college_name: '',
    email: '',
    password: '',
    registration_number: '',
    trust_society_name: '',
    authorized_signatory_name: '',
    address: '',
    contact_no: ''
  });

  // UML Reference Active Section
  const [umlSection, setUmlSection] = useState('classes'); // 'classes' | 'patterns' | 'endpoints' | 'requirements'

  // Helper to show non-blocking toast notifications
  const triggerToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.title === title ? null : prev));
    }, 4500);
  };

  // Helper to append immutable audit & UML execution logs
  const appendAuditLog = (actor_role, actor_id, uml_method, description) => {
    const newEntry = {
      log_id: `LOG-${1000 + auditLogs.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor_role,
      actor_id,
      uml_method,
      description
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Restore session on page refresh if valid and non-expired (Section 9.7)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const decoded = parseAndValidateSessionToken(saved.jwtToken);
      if (!decoded || decoded.expired) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setAuthNotice('Your previous session expired. Please sign in again.');
        return;
      }
      // Verify account still exists and (if Evaluator) remains active and verified
      if (decoded.role === 'Evaluator') {
        const ev = evaluators.find((e) => e.evaluator_id === decoded.id);
        if (!ev || !ev.is_active || !ev.is_verified) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setAuthError('Evaluator session invalidated because account is no longer active or verified.');
          return;
        }
      }
      setSession(saved);
      setActiveView('Workspace');
    } catch (_err) {
      // Ignore storage access errors in restricted iframes
    }
  }, []);

  const persistSession = (newSession) => {
    setSession(newSession);
    setActiveView('Workspace');
    setAuthError(null);
    setAuthNotice(null);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    } catch (_err) {
      // Ignore storage errors
    }
  };

  // Functional Logout Action (Section 9.8)
  const handleLogout = () => {
    if (session) {
      appendAuditLog(
        session.role,
        session.userId,
        'AuthController.logout()',
        `User ${session.email} signed out and invalidated session token.`
      );
    }
    setSession(null);
    setActiveView('AuthScreen');
    setAuthNotice('You have been signed out safely.');
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (_err) {
      // Ignore storage errors
    }
    triggerToast('Signed Out', 'Session cleared and token revoked.');
  };

  // Server-equivalent credential authentication (Section 9.2, 9.3, 9.4, 9.6)
  // Resolves role strictly from the verified account record, never from a client dropdown.
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    const normalizedEmail = loginEmail.trim().toLowerCase();
    if (!normalizedEmail || !loginPassword) {
      setAuthError('Please enter both your official email address and password.');
      return;
    }

    const candidateHash = computeDemoPasswordHash(loginPassword);

    // 1. Check College records
    const matchedCollege = colleges.find((c) => c.email.toLowerCase() === normalizedEmail);
    if (matchedCollege) {
      if (matchedCollege.password_hash !== candidateHash) {
        setAuthError('Invalid email or password. Please verify your credentials.');
        return;
      }
      const token = createSessionToken({
        id: matchedCollege.college_id,
        role: 'College',
        email: matchedCollege.email
      });
      const firstCollegeApp = applications.find((a) => a.college_id === matchedCollege.college_id);
      if (firstCollegeApp) setSelectedCollegeAppId(firstCollegeApp.application_id);

      persistSession({
        role: 'College',
        userId: matchedCollege.college_id,
        name: matchedCollege.college_name,
        email: matchedCollege.email,
        jwtToken: token
      });
      appendAuditLog(
        'College',
        matchedCollege.college_id,
        'AuthController.login() -> College.login()',
        `Authenticated College session for ${matchedCollege.college_name} (${matchedCollege.email}).`
      );
      setLoginPassword('');
      triggerToast('Signed In as Institution', `Welcome, ${matchedCollege.college_name}.`);
      return;
    }

    // 2. Check Evaluator records
    const matchedEvaluator = evaluators.find((ev) => ev.email.toLowerCase() === normalizedEmail);
    if (matchedEvaluator) {
      if (matchedEvaluator.password_hash !== candidateHash) {
        setAuthError('Invalid email or password. Please verify your credentials.');
        return;
      }
      // SRS 3.1 REQ-5: Reject login for evaluators whose is_active or is_verified flag is false
      if (!matchedEvaluator.is_active || !matchedEvaluator.is_verified) {
        const reason = `Access Denied (SRS 3.1 REQ-5): Evaluator account for ${matchedEvaluator.evaluator_name} cannot sign in because is_verified=${matchedEvaluator.is_verified} and is_active=${matchedEvaluator.is_active}. AICTE Admin verification is required.`;
        setAuthError(reason);
        appendAuditLog(
          'Evaluator',
          matchedEvaluator.evaluator_id,
          'Evaluator.login() [REJECTED REQ-5]',
          reason
        );
        return;
      }
      const token = createSessionToken({
        id: matchedEvaluator.evaluator_id,
        role: 'Evaluator',
        email: matchedEvaluator.email
      });
      const firstEvalApp = applications.find(
        (a) => a.assigned_evaluator_id === matchedEvaluator.evaluator_id
      );
      if (firstEvalApp) {
        setSelectedEvalAppId(firstEvalApp.application_id);
        const firstDoc = documents.find((d) => d.application_id === firstEvalApp.application_id);
        if (firstDoc) setSelectedEvalDocId(firstDoc.document_id);
      }

      persistSession({
        role: 'Evaluator',
        userId: matchedEvaluator.evaluator_id,
        name: matchedEvaluator.evaluator_name,
        email: matchedEvaluator.email,
        jwtToken: token
      });
      appendAuditLog(
        'Evaluator',
        matchedEvaluator.evaluator_id,
        'AuthController.login() -> Evaluator.login()',
        `Authenticated Evaluator session for ${matchedEvaluator.evaluator_name}.`
      );
      setLoginPassword('');
      triggerToast('Signed In as Evaluator', `Welcome, ${matchedEvaluator.evaluator_name}.`);
      return;
    }

    // 3. Check AICTEAdmin records
    const matchedAdmin = admins.find((a) => a.email.toLowerCase() === normalizedEmail);
    if (matchedAdmin) {
      if (matchedAdmin.password_hash !== candidateHash) {
        setAuthError('Invalid email or password. Please verify your credentials.');
        return;
      }
      const token = createSessionToken({
        id: matchedAdmin.admin_id,
        role: 'AICTEAdmin',
        email: matchedAdmin.email
      });
      persistSession({
        role: 'AICTEAdmin',
        userId: matchedAdmin.admin_id,
        name: matchedAdmin.admin_name,
        email: matchedAdmin.email,
        jwtToken: token
      });
      appendAuditLog(
        'AICTEAdmin',
        matchedAdmin.admin_id,
        'AuthController.login() -> AICTEAdmin.login()',
        `Authenticated AICTE Admin session for ${matchedAdmin.admin_name}.`
      );
      setLoginPassword('');
      triggerToast('Signed In as AICTE Admin', `Welcome, ${matchedAdmin.admin_name}.`);
      return;
    }

    setAuthError('No registered account matches that email address.');
  };

  // Public College Registration (Section 9.9: Strictly creates College accounts only)
  const handleRegisterCollegeSubmit = (e) => {
    e.preventDefault();
    setAuthError(null);

    const college_name = regForm.college_name.trim();
    const email = regForm.email.trim().toLowerCase();
    const password = regForm.password;
    const registration_number = regForm.registration_number.trim();
    const authorized_signatory_name = regForm.authorized_signatory_name.trim();

    if (!college_name || !email || !password || !registration_number || !authorized_signatory_name) {
      setAuthError('Please complete all required institutional registration fields.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    const emailExists =
      colleges.some((c) => c.email.toLowerCase() === email) ||
      evaluators.some((ev) => ev.email.toLowerCase() === email) ||
      admins.some((a) => a.email.toLowerCase() === email);

    if (emailExists) {
      setAuthError('An account with this official email address is already registered.');
      return;
    }

    const regNoExists = colleges.some(
      (c) => c.registration_number.toLowerCase() === registration_number.toLowerCase()
    );
    if (regNoExists) {
      setAuthError('An institution with this Trust/Society Registration Number already exists.');
      return;
    }

    const newId = `college_${101 + colleges.length}`;
    const newCol = {
      college_id: newId,
      college_name,
      email,
      password_hash: computeDemoPasswordHash(password),
      address: regForm.address.trim() || 'Indore, Madhya Pradesh',
      contact_no: regForm.contact_no.trim() || '+91-731-2000000',
      trust_society_name: regForm.trust_society_name.trim() || `${college_name} Trust`,
      registration_number,
      authorized_signatory_name,
      is_seeded_demo: false
    };

    setColleges((prev) => [...prev, newCol]);
    const token = createSessionToken({ id: newId, role: 'College', email: newCol.email });

    persistSession({
      role: 'College',
      userId: newId,
      name: newCol.college_name,
      email: newCol.email,
      jwtToken: token
    });

    appendAuditLog(
      'College',
      newId,
      'College.register() -> AuthController.registerCollege()',
      `Registered new institution ${newCol.college_name} (${newId}) with hashed password.`
    );

    setRegForm({
      college_name: '',
      email: '',
      password: '',
      registration_number: '',
      trust_society_name: '',
      authorized_signatory_name: '',
      address: '',
      contact_no: ''
    });
    setCollegeTab('new_application');
    triggerToast(
      'Institution Registered & Signed In',
      `Created ${newCol.college_name} (${newId}). You may now submit your first application.`
    );
  };

  // Explicit Academic Evaluation Demo Helper (Isolated from real authentication per Section 9.11)
  const activateAcademicDemoAccount = (role, userId) => {
    if (role === 'Evaluator') {
      const ev = evaluators.find((e) => e.evaluator_id === userId);
      if (!ev || !ev.is_active || !ev.is_verified) {
        triggerToast(
          'Evaluator Login Blocked (SRS 3.1 REQ-5)',
          `${ev ? ev.evaluator_name : userId} cannot sign in because is_verified=${ev?.is_verified} and is_active=${ev?.is_active}.`,
          'error'
        );
        return;
      }
      const token = createSessionToken({ id: ev.evaluator_id, role: 'Evaluator', email: ev.email });
      persistSession({
        role: 'Evaluator',
        userId: ev.evaluator_id,
        name: ev.evaluator_name,
        email: ev.email,
        jwtToken: token,
        isDemoSwitch: true
      });
      appendAuditLog(
        'Evaluator',
        ev.evaluator_id,
        'Evaluator.login() [Academic Evaluation Helper]',
        `Switched active evaluation session to ${ev.evaluator_name} (${ev.evaluator_id}).`
      );
      return;
    }

    if (role === 'College') {
      const col = colleges.find((c) => c.college_id === userId) || colleges[0];
      const token = createSessionToken({ id: col.college_id, role: 'College', email: col.email });
      persistSession({
        role: 'College',
        userId: col.college_id,
        name: col.college_name,
        email: col.email,
        jwtToken: token,
        isDemoSwitch: true
      });
      appendAuditLog(
        'College',
        col.college_id,
        'College.login() [Academic Evaluation Helper]',
        `Switched active evaluation session to ${col.college_name} (${col.college_id}).`
      );
      return;
    }

    if (role === 'AICTEAdmin') {
      const adm = admins.find((a) => a.admin_id === userId) || admins[0];
      const token = createSessionToken({ id: adm.admin_id, role: 'AICTEAdmin', email: adm.email });
      persistSession({
        role: 'AICTEAdmin',
        userId: adm.admin_id,
        name: adm.admin_name,
        email: adm.email,
        jwtToken: token,
        isDemoSwitch: true
      });
      appendAuditLog(
        'AICTEAdmin',
        adm.admin_id,
        'AICTEAdmin.login() [Academic Evaluation Helper]',
        `Switched active evaluation session to ${adm.admin_name} (${adm.admin_id}).`
      );
    }
  };

  // Derived Authenticated User Records
  const currentCollege = useMemo(() => {
    if (session?.role === 'College') {
      return colleges.find((c) => c.college_id === session.userId) || colleges[0];
    }
    return colleges[0];
  }, [colleges, session]);

  const currentEvaluator = useMemo(() => {
    if (session?.role === 'Evaluator') {
      return evaluators.find((e) => e.evaluator_id === session.userId) || evaluators[0];
    }
    return evaluators[0];
  }, [evaluators, session]);

  const currentAdmin = useMemo(() => {
    if (session?.role === 'AICTEAdmin') {
      return admins.find((a) => a.admin_id === session.userId) || admins[0];
    }
    return admins[0];
  }, [admins, session]);

  // ============================================================================
  // 4. WORKFLOW HANDLERS (WITH VALIDATION & AUTHORIZATION CHECKS)
  // ============================================================================

  const validateUploadedFile = (fileName, fileSizeBytes) => {
    const cleanName = String(fileName || '').trim().toLowerCase();
    if (!cleanName) {
      return 'Please provide a valid document filename (.pdf, .jpg, .png).';
    }
    const validExt = ALLOWED_FILE_EXTENSIONS.some((ext) => cleanName.endsWith(ext));
    if (!validExt) {
      return 'Unsupported file format (SRS 3.2 REQ-3): Only PDF, JPG, and PNG files are accepted.';
    }
    if (Number(fileSizeBytes || 0) > MAX_FILE_SIZE_BYTES) {
      return 'File exceeds the 10 MB size limit specified in SRS 3.2 REQ-3.';
    }
    return null;
  };

  // 4.1 College: Submit New Application
  const handleCollegeSubmitApplication = (e) => {
    e.preventDefault();
    setNewAppError(null);

    if (!session || session.role !== 'College') {
      triggerToast('Authorization Error', 'Only authenticated College accounts can submit applications.', 'error');
      return;
    }

    const cleanSubject = newAppSubject.trim();
    const cleanDetails = newAppDetails.trim();
    if (!cleanSubject || !cleanDetails) {
      setNewAppError('Please specify both the academic program title and intake/infrastructure summary.');
      return;
    }

    // Prevent accidental duplicate submission for the same program by the same college while active
    const duplicateActive = applications.find(
      (a) =>
        a.college_id === currentCollege.college_id &&
        a.subject_applied_for.toLowerCase() === cleanSubject.toLowerCase() &&
        !['Approved', 'Rejected'].includes(a.status)
    );
    if (duplicateActive) {
      setNewAppError(
        `An active application (${duplicateActive.application_id}) for "${cleanSubject}" is already in progress.`
      );
      return;
    }

    // Validate all 5 statutory documents (SRS 3.2 REQ-2 & REQ-3)
    for (const docType of MANDATORY_DOC_TYPES) {
      const draftDoc = newAppDocs[docType];
      if (!draftDoc || !draftDoc.rawContent.trim()) {
        setNewAppError(`Statutory document "${docType}" is missing content.`);
        return;
      }
      const fileErr = validateUploadedFile(draftDoc.file_name, draftDoc.file_size_bytes);
      if (fileErr) {
        setNewAppError(`${docType}: ${fileErr}`);
        return;
      }
    }

    const newAppId = `application_A${501 + applications.length}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const createdDocs = MANDATORY_DOC_TYPES.map((docType, idx) => {
      const draftDoc = newAppDocs[docType];
      const baseDoc = {
        document_id: `document_D${901 + documents.length + idx}`,
        application_id: newAppId,
        document_type: docType,
        file_name: draftDoc.file_name.trim(),
        file_size_bytes: draftDoc.file_size_bytes || 1024000,
        file_url: `https://aicte-portal.storage.gov.in/docs/${newAppId}/${draftDoc.file_name.trim()}`,
        uploaded_date: nowStr,
        rawContent: draftDoc.rawContent.trim()
      };
      const ocrOutput = ocrProcessor.extractText(baseDoc);
      return { ...baseDoc, ...ocrOutput };
    });

    const newAppRecord = {
      application_id: newAppId,
      college_id: currentCollege.college_id,
      assigned_evaluator_id: null,
      subject_applied_for: cleanSubject,
      application_details: cleanDetails,
      status: 'Applied',
      submitted_date: nowStr,
      evaluator_recommendation: null,
      evaluator_comments: null,
      site_visit_confirmed: false,
      recommendation_submitted_at: null,
      final_decision: null,
      final_decision_reason: null,
      final_decision_at: null,
      is_seeded_demo: false
    };

    setDocuments((prev) => [...prev, ...createdDocs]);
    setApplications((prev) => [newAppRecord, ...prev]);
    setSelectedCollegeAppId(newAppId);
    setMatcherAppId(newAppId);
    setCollegeTab('applications');

    appendAuditLog(
      'College',
      currentCollege.college_id,
      'College.applyForApplication() -> IDocumentProcessor.extractText()',
      `Submitted ${newAppId} (${newAppRecord.subject_applied_for}) with 5 statutory documents processed via OCR.`
    );

    triggerToast(
      'Application Submitted',
      `${newAppId} created. All 5 statutory documents passed validation and OCR extraction.`
    );
  };

  // 4.2 College: Reupload Flagged Document (SRS 3.2 REQ-7)
  const handleCollegeReuploadDocument = (docRecord, openClarification, appRecord) => {
    if (!session || session.role !== 'College' || appRecord.college_id !== currentCollege.college_id) {
      triggerToast('Authorization Error', 'You can only modify documents belonging to your institution.', 'error');
      return;
    }
    if (!openClarification || openClarification.status !== 'Open') {
      triggerToast('Re-upload Locked', 'A document can only be replaced when an open clarification exists.', 'error');
      return;
    }

    const updatedFileName = (
      reuploadFileNameByDoc[docRecord.document_id] !== undefined
        ? reuploadFileNameByDoc[docRecord.document_id]
        : `${docRecord.file_name.replace(/\.(pdf|jpg|jpeg|png)$/i, '')}_Revised_Certified.pdf`
    ).trim();

    const updatedFileSize =
      reuploadSizeByDoc[docRecord.document_id] !== undefined
        ? reuploadSizeByDoc[docRecord.document_id]
        : 2150000;

    const fileErr = validateUploadedFile(updatedFileName, updatedFileSize);
    if (fileErr) {
      setReuploadErrorByDoc((prev) => ({ ...prev, [docRecord.document_id]: fileErr }));
      triggerToast('File Validation Failed', fileErr, 'error');
      return;
    }

    const updatedRawText = (
      reuploadTextByDoc[docRecord.document_id] !== undefined
        ? reuploadTextByDoc[docRecord.document_id]
        : `CERTIFIED REVISED ${docRecord.document_type.toUpperCase()} Reg No: ${currentCollege.registration_number}. Total built-up area: 4800 sq.ft compliant with AICTE APH norms. High-resolution architectural seal verified on ${new Date().toISOString().slice(0, 10)}.`
    ).trim();

    if (!updatedRawText) {
      setReuploadErrorByDoc((prev) => ({
        ...prev,
        [docRecord.document_id]: 'Document text content cannot be empty.'
      }));
      return;
    }

    setReuploadErrorByDoc((prev) => ({ ...prev, [docRecord.document_id]: null }));
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updatedDocBase = {
      ...docRecord,
      file_name: updatedFileName,
      file_size_bytes: updatedFileSize,
      uploaded_date: nowStr,
      rawContent: updatedRawText
    };
    const freshOcr = ocrProcessor.extractText(updatedDocBase);

    setDocuments((prev) =>
      prev.map((d) => (d.document_id === docRecord.document_id ? { ...updatedDocBase, ...freshOcr } : d))
    );

    setClarifications((prev) =>
      prev.map((c) =>
        c.clarification_id === openClarification.clarification_id
          ? { ...c, status: 'Resolved', resolved_at: nowStr }
          : c
      )
    );

    const remainingOpen = clarifications.filter(
      (c) =>
        c.application_id === docRecord.application_id &&
        c.status === 'Open' &&
        c.clarification_id !== openClarification.clarification_id
    );

    if (remainingOpen.length === 0) {
      setApplications((prev) =>
        prev.map((app) =>
          app.application_id === docRecord.application_id ? { ...app, status: 'Under Review' } : app
        )
      );
    }

    appendAuditLog(
      'College',
      currentCollege.college_id,
      'College.reuploadDocument() -> TesseractOCRService.extractText() -> ClarificationRequest.resolveRequest()',
      `Re-uploaded ${docRecord.document_id} (${updatedFileName}); OCR confidence ${freshOcr.ocr_confidence}%; clarification resolved.`
    );

    triggerToast(
      'Revised Document Uploaded & Re-Processed',
      `OCR extracted updated fields (${freshOcr.ocr_confidence}% readability confidence). Application returned to Under Review.`
    );
  };

  // 4.3 Evaluator: Raise Clarification Request on Specific Document
  const handleEvaluatorRequestClarification = (appRecord, docRecord) => {
    if (!session || session.role !== 'Evaluator' || appRecord.assigned_evaluator_id !== currentEvaluator.evaluator_id) {
      triggerToast('Authorization Error', 'You may only review applications assigned to you.', 'error');
      return;
    }
    if (!clarificationDraft.trim()) {
      triggerToast('Clarification Note Required', 'Please enter a specific clarification question for the institution.', 'error');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newClarId = `clarification_C${11 + clarifications.length}`;

    const newClar = {
      clarification_id: newClarId,
      application_id: appRecord.application_id,
      document_id: docRecord.document_id,
      raised_by_evaluator_id: currentEvaluator.evaluator_id,
      message: clarificationDraft.trim(),
      status: 'Open',
      created_at: nowStr,
      resolved_at: null
    };

    setClarifications((prev) => [newClar, ...prev]);
    setApplications((prev) =>
      prev.map((a) =>
        a.application_id === appRecord.application_id ? { ...a, status: 'Clarification Requested' } : a
      )
    );
    setClarificationDraft('');

    appendAuditLog(
      'Evaluator',
      currentEvaluator.evaluator_id,
      'Evaluator.requestClarification() -> ClarificationRequest.createRequest()',
      `Flagged ${docRecord.document_id} (${docRecord.document_type}) on ${appRecord.application_id}. Anonymized query sent to College.`
    );

    triggerToast(
      'Clarification Request Sent',
      `Flagged ${docRecord.document_type}. The institution will see your query anonymously (SRS BR-4).`
    );
  };

  // 4.4 Evaluator: Submit Recommendation
  const handleEvaluatorSubmitRecommendation = (appRecord) => {
    if (!session || session.role !== 'Evaluator' || appRecord.assigned_evaluator_id !== currentEvaluator.evaluator_id) {
      triggerToast('Authorization Error', 'You may only submit recommendations for applications assigned to you.', 'error');
      return;
    }

    setConfirmModal({
      title: 'Confirm Evaluator Recommendation',
      description: `Submit a formal "${recDecision}" recommendation for ${appRecord.application_id} (${appRecord.subject_applied_for}) with Physical Site-Visit Verified = ${recSiteVisit ? 'Yes' : 'No'}? Per SRS Business Rule BR-3, this recommendation will be routed to AICTE Admin for the binding final decision.`,
      confirmLabel: `Submit ${recDecision} Recommendation`,
      onConfirm: () => {
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
        setApplications((prev) =>
          prev.map((a) =>
            a.application_id === appRecord.application_id
              ? {
                  ...a,
                  status: 'Recommended',
                  evaluator_recommendation: recDecision,
                  evaluator_comments: recComments.trim() || 'Reviewed all statutory documents and OCR summaries.',
                  site_visit_confirmed: recSiteVisit,
                  recommendation_submitted_at: nowStr
                }
              : a
          )
        );

        appendAuditLog(
          'Evaluator',
          currentEvaluator.evaluator_id,
          'Evaluator.submitRecommendation() -> Application.recordEvaluatorRecommendation()',
          `Submitted '${recDecision}' recommendation (site_visit_confirmed=${recSiteVisit}) for ${appRecord.application_id}.`
        );

        setConfirmModal(null);
        triggerToast(
          'Recommendation Recorded',
          `Application ${appRecord.application_id} moved to "Recommended" for AICTE Admin final review.`
        );
      }
    });
  };

  // 4.5 Admin: Confirm Evaluator Assignment
  const handleAdminAssignEvaluator = (appRecord, evaluatorId) => {
    if (!session || session.role !== 'AICTEAdmin') {
      triggerToast('Authorization Error', 'Only AICTE Admin can assign evaluators.', 'error');
      return;
    }
    const evObj = evaluators.find((e) => e.evaluator_id === evaluatorId);
    if (!evObj || !evObj.is_active || !evObj.is_verified) {
      triggerToast('Assignment Error', 'Selected evaluator must be active and verified.', 'error');
      return;
    }

    setApplications((prev) =>
      prev.map((a) =>
        a.application_id === appRecord.application_id
          ? {
              ...a,
              assigned_evaluator_id: evaluatorId,
              status: a.status === 'Applied' ? 'Under Review' : a.status
            }
          : a
      )
    );

    appendAuditLog(
      'AICTEAdmin',
      currentAdmin.admin_id,
      'AICTEAdmin.assignEvaluator() via IEvaluatorMatcher.suggestEvaluator()',
      `Admin assigned ${evObj.evaluator_name} (${evaluatorId}) to ${appRecord.application_id}; status set to Under Review.`
    );

    triggerToast(
      'Evaluator Assigned',
      `${evObj.evaluator_name} assigned to ${appRecord.application_id}. Status updated to Under Review.`
    );
  };

  // 4.6 Admin: Record Binding Final Decision
  const handleAdminFinalizeDecision = (appRecord) => {
    if (!session || session.role !== 'AICTEAdmin') {
      triggerToast('Authorization Error', 'Only AICTE Admin can record final approval decisions.', 'error');
      return;
    }

    setConfirmModal({
      title: `Confirm Binding Final Decision: ${finalDecisionChoice}`,
      description: `Record the official AICTE final decision "${finalDecisionChoice}" for ${appRecord.application_id} (${appRecord.subject_applied_for})? The Evaluator's recommendation (${appRecord.evaluator_recommendation || 'Not yet submitted'}) remains stored in a separate field for audit traceability (SRS 3.6 REQ-6).`,
      confirmLabel: `Confirm Final ${finalDecisionChoice} Decision`,
      isDestructive: finalDecisionChoice === 'Rejected',
      onConfirm: () => {
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
        setApplications((prev) =>
          prev.map((a) =>
            a.application_id === appRecord.application_id
              ? {
                  ...a,
                  status: finalDecisionChoice,
                  final_decision: finalDecisionChoice,
                  final_decision_reason:
                    finalDecisionReason.trim() || `Final ${finalDecisionChoice} decision recorded by AICTE Admin.`,
                  final_decision_at: nowStr
                }
              : a
          )
        );

        appendAuditLog(
          'AICTEAdmin',
          currentAdmin.admin_id,
          'AICTEAdmin.finalizeDecision() -> Application.recordFinalDecision()',
          `Recorded binding final decision '${finalDecisionChoice}' on ${appRecord.application_id}.`
        );

        setConfirmModal(null);
        triggerToast(
          `Final Decision Recorded (${finalDecisionChoice})`,
          `Decision timestamped (${nowStr}) and published to the institution workspace.`
        );
      }
    });
  };

  // 4.7 Admin: Toggle Evaluator Verification / Active Status
  const handleAdminToggleEvaluatorFlag = (evaluator, field) => {
    const nextVal = !evaluator[field];
    setConfirmModal({
      title: `Update Evaluator ${field === 'is_verified' ? 'Verification' : 'Active'} Status`,
      description: `Set ${field} = ${nextVal} for ${evaluator.evaluator_name} (${evaluator.evaluator_id})? Evaluators with is_verified=false or is_active=false are automatically excluded from suitability matching (SRS 3.5 REQ-3) and blocked from portal sign-in (SRS 3.1 REQ-5).`,
      confirmLabel: 'Confirm Status Update',
      isDestructive: !nextVal,
      onConfirm: () => {
        setEvaluators((prev) =>
          prev.map((ev) => (ev.evaluator_id === evaluator.evaluator_id ? { ...ev, [field]: nextVal } : ev))
        );
        appendAuditLog(
          'AICTEAdmin',
          currentAdmin.admin_id,
          `AICTEAdmin.manageEvaluator(${evaluator.evaluator_id}, ${field}=${nextVal})`,
          `Updated admin-controlled flag ${field}=${nextVal} for ${evaluator.evaluator_name}.`
        );
        setConfirmModal(null);
        triggerToast(
          'Evaluator Account Updated',
          `${evaluator.evaluator_name}: ${field} set to ${String(nextVal)}.`
        );
      }
    });
  };

  // 4.8 Admin: Onboard New Evaluator
  const handleAdminOnboardEvaluator = (e) => {
    e.preventDefault();
    if (!newEvalForm.evaluator_name.trim() || !newEvalForm.email.trim()) {
      triggerToast('Missing Fields', 'Please provide the evaluator name and official email.', 'error');
      return;
    }
    const cleanEmail = newEvalForm.email.trim().toLowerCase();
    if (evaluators.some((ev) => ev.email.toLowerCase() === cleanEmail)) {
      triggerToast('Duplicate Email', 'An evaluator with this email is already onboarded.', 'error');
      return;
    }
    const newId = `evaluator_${22 + evaluators.length}`;
    const created = {
      evaluator_id: newId,
      evaluator_name: newEvalForm.evaluator_name.trim(),
      email: cleanEmail,
      password_hash: computeDemoPasswordHash('Evaluator@123'),
      expertise: newEvalForm.expertise.trim(),
      availability: 'Available',
      address: newEvalForm.address.trim() || 'Confidential Residential Address',
      contact_no: newEvalForm.contact_no.trim() || '+91-98000-00000',
      is_verified: true,
      is_active: true,
      is_seeded_demo: false
    };
    setEvaluators((prev) => [...prev, created]);
    setNewEvalForm({
      evaluator_name: '',
      email: '',
      expertise: 'Computer Science, AI, Data Science, Cloud',
      contact_no: '+91-98110-12345',
      address: 'IIT Delhi Campus, Hauz Khas, New Delhi'
    });
    appendAuditLog(
      'AICTEAdmin',
      currentAdmin.admin_id,
      'AICTEAdmin.manageEvaluator() -> Evaluator.constructor()',
      `Onboarded & verified new Evaluator ${created.evaluator_name} (${newId}).`
    );
    triggerToast('Evaluator Onboarded', `${created.evaluator_name} (${newId}) added to verified pool.`);
  };

  // ============================================================================
  // 5. COMPUTED METRICS & MATCHER SUGGESTIONS
  // ============================================================================

  const getEvaluatorActiveWorkload = (evaluatorId) =>
    applications.filter(
      (app) =>
        app.assigned_evaluator_id === evaluatorId &&
        ['Under Review', 'Clarification Requested'].includes(app.status)
    ).length;

  const matcherTargetApp = useMemo(
    () => applications.find((a) => a.application_id === matcherAppId) || applications[0],
    [applications, matcherAppId]
  );

  const rankedEvaluatorSuggestions = useMemo(() => {
    if (!matcherTargetApp) return [];
    return evaluatorMatcher.suggestEvaluator(matcherTargetApp, evaluators, applications);
  }, [matcherTargetApp, evaluators, applications]);

  const excludedEvaluators = useMemo(
    () =>
      evaluators.filter(
        (ev) => !ev.is_active || !ev.is_verified || ev.availability !== 'Available'
      ),
    [evaluators]
  );

  const analyticsSummary = useMemo(() => {
    const counts = {
      Applied: 0,
      'Under Review': 0,
      'Clarification Requested': 0,
      Recommended: 0,
      Approved: 0,
      Rejected: 0
    };
    let finalizedCount = 0;
    let totalTurnaroundDays = 0;

    applications.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
      if (app.final_decision_at && app.submitted_date) {
        const start = new Date(app.submitted_date.replace(' ', 'T'));
        const end = new Date(app.final_decision_at.replace(' ', 'T'));
        const diffDays = Math.max(0.5, (end - start) / (1000 * 60 * 60 * 24));
        if (!Number.isNaN(diffDays)) {
          finalizedCount += 1;
          totalTurnaroundDays += diffDays;
        }
      }
    });

    const avgDays = finalizedCount > 0 ? (totalTurnaroundDays / finalizedCount).toFixed(1) : '6.1';
    return { counts, avgDays, finalizedCount, total: applications.length };
  }, [applications]);

  const renderStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Applied;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-md border ${cfg.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span>{status}</span>
      </span>
    );
  };

  // ============================================================================
  // 6. COLLEGE WORKSPACE VIEW (SECTION 3.D)
  // ============================================================================

  const renderCollegeWorkspace = () => {
    const collegeApps = applications.filter((a) => a.college_id === currentCollege.college_id);
    const activeApp =
      collegeApps.find((a) => a.application_id === selectedCollegeAppId) || collegeApps[0] || null;
    const activeAppDocs = activeApp
      ? documents.filter((d) => d.application_id === activeApp.application_id)
      : [];
    const activeAppClarifications = activeApp
      ? clarifications.filter((c) => c.application_id === activeApp.application_id)
      : [];

    return (
      <div className="space-y-6">
        {/* Institution Workspace Header & Navigation */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-slate-900 text-white shrink-0 mt-0.5">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-semibold text-slate-900">{currentCollege.college_name}</h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                  Reg: {currentCollege.registration_number}
                </span>
                <span className="px-2 py-0.5 text-xs font-mono text-slate-500">
                  ID: {currentCollege.college_id}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Trust/Society: {currentCollege.trust_society_name} &bull; Authorized Signatory:{' '}
                {currentCollege.authorized_signatory_name} &bull; {currentCollege.address}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCollegeTab('applications')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                collegeTab === 'applications'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Applications ({collegeApps.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCollegeTab('new_application')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                collegeTab === 'new_application'
                  ? 'bg-blue-800 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Program Application</span>
            </button>
            <button
              type="button"
              onClick={() => setCollegeTab('profile')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                collegeTab === 'profile'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Institution Profile</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Applications List & Selected Application Details */}
        {collegeTab === 'applications' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Institution Applications Queue */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Institution Applications
                </h3>
                <span className="text-xs text-slate-500">{collegeApps.length} total</span>
              </div>

              {collegeApps.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-6 text-center space-y-3">
                  <p className="text-sm text-slate-600">No applications have been submitted by this institution yet.</p>
                  <button
                    type="button"
                    onClick={() => setCollegeTab('new_application')}
                    className="px-4 py-2 rounded-md bg-blue-800 text-white text-xs font-medium hover:bg-blue-900"
                  >
                    Create First Application
                  </button>
                </div>
              ) : (
                collegeApps.map((app) => {
                  const isSelected = activeApp && activeApp.application_id === app.application_id;
                  const openClars = clarifications.filter(
                    (c) => c.application_id === app.application_id && c.status === 'Open'
                  ).length;

                  return (
                    <button
                      key={app.application_id}
                      type="button"
                      onClick={() => setSelectedCollegeAppId(app.application_id)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-slate-50 border-slate-900 border-l-4 border-l-blue-800 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-600">{app.application_id}</span>
                        {renderStatusBadge(app.status)}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-2">
                        {app.subject_applied_for}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {app.application_details}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-200/80 text-xs text-slate-500">
                        <span className="font-mono">Submitted: {app.submitted_date.slice(0, 10)}</span>
                        {openClars > 0 && (
                          <span className="text-amber-800 font-medium inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{openClars} Clarification Action Required</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right Column: Selected Application Lifecycle & Document Management */}
            <div className="lg:col-span-8 space-y-5">
              {activeApp && (
                <>
                  {/* Application Summary & Workflow Stepper */}
                  <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">
                            {activeApp.application_id}
                          </span>
                          {activeApp.is_seeded_demo && (
                            <span className="px-2 py-0.5 text-[11px] rounded bg-slate-100 text-slate-600 border border-slate-200">
                              Seeded Reference Record
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          {activeApp.subject_applied_for}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">{activeApp.application_details}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {renderStatusBadge(activeApp.status)}
                        <span className="text-[11px] text-slate-500 font-mono">
                          Submitted: {activeApp.submitted_date}
                        </span>
                      </div>
                    </div>

                    {/* Clear Next Action Guidance Banner */}
                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-800 shrink-0" />
                        <span>
                          <strong className="font-semibold text-slate-900">Workflow Status: </strong>
                          {(STATUS_CONFIG[activeApp.status] || STATUS_CONFIG.Applied).nextActionCollege}
                        </span>
                      </div>
                    </div>

                    {/* 5-Stage Progress Indicator */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const order = [
                          'Applied',
                          'Under Review',
                          'Clarification Requested',
                          'Recommended',
                          'Approved',
                          'Rejected'
                        ];
                        const currIdx = order.indexOf(activeApp.status);
                        let isCurrent = false;
                        let isDone = false;

                        if (step === 'Final Decision') {
                          isDone = ['Approved', 'Rejected'].includes(activeApp.status);
                          isCurrent = isDone;
                        } else {
                          const stepIdx = order.indexOf(step);
                          isCurrent = activeApp.status === step;
                          isDone =
                            currIdx > stepIdx &&
                            !(step === 'Clarification Requested' && activeAppClarifications.length === 0);
                        }

                        return (
                          <div
                            key={step}
                            className={`p-2.5 rounded-md border text-left ${
                              isCurrent
                                ? 'bg-blue-50/70 border-blue-800 text-slate-900'
                                : isDone
                                ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span>Step {idx + 1}</span>
                              {isDone && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </div>
                            <div className="text-xs font-medium mt-1">
                              {step === 'Final Decision' && ['Approved', 'Rejected'].includes(activeApp.status)
                                ? activeApp.status
                                : step}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Official Final Decision Notice (SRS 3.6 REQ-7) */}
                    {activeApp.final_decision && (
                      <div
                        className={`p-4 rounded-lg border flex items-start gap-3 ${
                          activeApp.final_decision === 'Approved'
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50/70 border-rose-300 text-rose-950'
                        }`}
                      >
                        {activeApp.final_decision === 'Approved' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                        )}
                        <div className="text-xs space-y-1">
                          <div className="font-semibold text-sm">
                            Official AICTE Decision: {activeApp.final_decision}
                          </div>
                          <p className="leading-relaxed">{activeApp.final_decision_reason}</p>
                          <div className="font-mono text-[11px] opacity-80 pt-1">
                            Decision Timestamp: {activeApp.final_decision_at}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statutory Documents & Targeted Clarification Re-upload */}
                  <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Statutory Application Documents ({activeAppDocs.length} of 5 Required Categories)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted documents are locked during review. If an evaluator raises a clarification on a specific document, replacement upload unlocks for that file only (SRS 3.2 REQ-7).
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {activeAppDocs.map((doc) => {
                        const docClars = activeAppClarifications.filter(
                          (c) => c.document_id === doc.document_id
                        );
                        const openClar = docClars.find((c) => c.status === 'Open');
                        const resolvedClar = docClars.find((c) => c.status === 'Resolved');
                        const docError = reuploadErrorByDoc[doc.document_id];

                        return (
                          <div
                            key={doc.document_id}
                            className={`p-4 rounded-lg border ${
                              openClar
                                ? 'bg-amber-50/40 border-amber-300'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <FileCheck
                                  className={`w-4 h-4 shrink-0 ${
                                    openClar ? 'text-amber-700' : 'text-slate-700'
                                  }`}
                                />
                                <div>
                                  <span className="text-sm font-medium text-slate-900">
                                    {doc.document_type}
                                  </span>
                                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                                    {doc.file_name} &bull; {formatFileSize(doc.file_size_bytes)} &bull; Uploaded {doc.uploaded_date}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  title="Tesseract OCR scan text readability confidence"
                                  className="px-2.5 py-0.5 text-xs font-mono rounded bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  OCR Readability: {doc.ocr_confidence}%
                                </span>
                                {openClar ? (
                                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                    Clarification Open
                                  </span>
                                ) : resolvedClar ? (
                                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Clarification Resolved
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                    Submitted (Locked)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Anonymized Clarification Notice & Replacement Form */}
                            {openClar && (
                              <div className="mt-3 p-4 rounded-lg bg-white border border-amber-300 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    Evaluator Clarification Request (Identity Anonymized per SRS BR-4)
                                  </span>
                                  <span className="text-xs font-mono text-slate-500">
                                    Logged: {openClar.created_at}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-800 bg-amber-50/60 p-3 rounded border border-amber-200 leading-relaxed">
                                  &ldquo;{openClar.message}&rdquo;
                                </p>

                                <div className="pt-2 border-t border-slate-200 space-y-3">
                                  <div className="text-xs font-semibold text-slate-900">
                                    Upload Revised &ldquo;{doc.document_type}&rdquo; Document (PDF, JPG, PNG up to 10 MB)
                                  </div>

                                  {docError && (
                                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                                      {docError}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Revised Document Filename
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          reuploadFileNameByDoc[doc.document_id] !== undefined
                                            ? reuploadFileNameByDoc[doc.document_id]
                                            : 'SVIIT_AIML_Infrastructure_4800sqft_Certified.pdf'
                                        }
                                        onChange={(e) =>
                                          setReuploadFileNameByDoc((prev) => ({
                                            ...prev,
                                            [doc.document_id]: e.target.value
                                          }))
                                        }
                                        className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Select Local File (Optional)
                                      </label>
                                      <label className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-slate-50 text-slate-700 font-medium cursor-pointer flex items-center justify-center gap-1.5 hover:bg-slate-100">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Select PDF / JPG / PNG (&le; 10 MB)</span>
                                        <input
                                          type="file"
                                          accept=".pdf,.jpg,.jpeg,.png"
                                          className="hidden"
                                          onChange={(e) => {
                                            const f = e.target.files && e.target.files[0];
                                            if (f) {
                                              setReuploadFileNameByDoc((prev) => ({
                                                ...prev,
                                                [doc.document_id]: f.name
                                              }));
                                              setReuploadSizeByDoc((prev) => ({
                                                ...prev,
                                                [doc.document_id]: f.size
                                              }));
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                      Document Text Content (Extracted by Tesseract OCR upon upload)
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={
                                        reuploadTextByDoc[doc.document_id] !== undefined
                                          ? reuploadTextByDoc[doc.document_id]
                                          : 'CERTIFIED LAND & INFRASTRUCTURE ANNEX Reg No: TR-2024-8891. Total built-up area: 4800 sq.ft with dedicated AI GPU Cluster Room (1200 sq.ft) and 4 Smart Classrooms. Certified Date: 19 Oct 2026.'
                                      }
                                      onChange={(e) =>
                                        setReuploadTextByDoc((prev) => ({
                                          ...prev,
                                          [doc.document_id]: e.target.value
                                        }))
                                      }
                                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white font-mono focus:border-blue-800 focus:outline-none"
                                    />
                                  </div>

                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCollegeReuploadDocument(doc, openClar, activeApp)
                                      }
                                      className="px-4 py-2 rounded-md bg-blue-800 hover:bg-blue-900 text-white text-xs font-medium flex items-center gap-1.5"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      <span>Upload Revised Document &amp; Re-Run OCR</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Submit New Application Form */}
        {collegeTab === 'new_application' && (
          <form
            onSubmit={handleCollegeSubmitApplication}
            className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6"
          >
            <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Submit New Institutional Program Application
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  All 5 statutory documents are validated for format (PDF/JPG/PNG &le; 10 MB), processed by Tesseract OCR, and placed into the Evaluator Assignment Queue.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                SRS Section 3.2 (REQ-1 to REQ-3)
              </span>
            </div>

            {newAppError && (
              <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{newAppError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-app-program"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Academic Program Applied For *
                </label>
                <input
                  id="new-app-program"
                  type="text"
                  required
                  value={newAppSubject}
                  onChange={(e) => setNewAppSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                  placeholder="e.g., B.Tech Computer Science & Engineering"
                />
              </div>
              <div>
                <label
                  htmlFor="new-app-details"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Intake &amp; Infrastructure Summary *
                </label>
                <input
                  id="new-app-details"
                  type="text"
                  required
                  value={newAppDetails}
                  onChange={(e) => setNewAppDetails(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mandatory Statutory Documents (5 Required Categories &bull; PDF, JPG, PNG &le; 10 MB)
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {MANDATORY_DOC_TYPES.map((docType, index) => {
                  const item = newAppDocs[docType] || SAMPLE_DOC_TEMPLATES[docType];
                  return (
                    <div
                      key={docType}
                      className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {index + 1}. {docType}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                            {item.file_name} ({formatFileSize(item.file_size_bytes)})
                          </span>
                          <label className="px-3 py-1 text-xs font-medium rounded bg-white text-slate-700 border border-slate-300 cursor-pointer hover:bg-slate-100">
                            Select File
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files && e.target.files[0];
                                if (file) {
                                  setNewAppDocs((prev) => ({
                                    ...prev,
                                    [docType]: {
                                      ...prev[docType],
                                      file_name: file.name,
                                      file_size_bytes: file.size
                                    }
                                  }));
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        aria-label={`${docType} OCR text preview`}
                        value={item.rawContent}
                        onChange={(e) =>
                          setNewAppDocs((prev) => ({
                            ...prev,
                            [docType]: { ...prev[docType], rawContent: e.target.value }
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white font-mono text-slate-700 focus:border-blue-800 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCollegeTab('applications')}
                className="px-4 py-2 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-blue-800 hover:bg-blue-900 text-white text-xs font-medium flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit Application &amp; Run OCR</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Update Institutional Profile */}
        {collegeTab === 'profile' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm max-w-3xl space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Institution Profile Details (SRS 3.2 REQ-6)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your institution&apos;s authorized signatory, contact number, and campus address. Registration number ({currentCollege.registration_number}) is immutable.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={currentCollege.college_name}
                  onChange={(e) =>
                    setColleges((prev) =>
                      prev.map((c) =>
                        c.college_id === currentCollege.college_id
                          ? { ...c, college_name: e.target.value }
                          : c
                      )
                    )
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Authorized Signatory Name
                </label>
                <input
                  type="text"
                  value={currentCollege.authorized_signatory_name}
                  onChange={(e) =>
                    setColleges((prev) =>
                      prev.map((c) =>
                        c.college_id === currentCollege.college_id
                          ? { ...c, authorized_signatory_name: e.target.value }
                          : c
                      )
                    )
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={currentCollege.contact_no}
                  onChange={(e) =>
                    setColleges((prev) =>
                      prev.map((c) =>
                        c.college_id === currentCollege.college_id
                          ? { ...c, contact_no: e.target.value }
                          : c
                      )
                    )
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Campus Address
                </label>
                <input
                  type="text"
                  value={currentCollege.address}
                  onChange={(e) =>
                    setColleges((prev) =>
                      prev.map((c) =>
                        c.college_id === currentCollege.college_id
                          ? { ...c, address: e.target.value }
                          : c
                      )
                    )
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  appendAuditLog(
                    'College',
                    currentCollege.college_id,
                    'College.updateProfile()',
                    `Updated institutional profile for ${currentCollege.college_name}.`
                  );
                  triggerToast('Profile Updated', 'Institutional profile changes saved.');
                }}
                className="px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
              >
                Save Profile Changes
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // 7. EVALUATOR WORKSPACE VIEW (SECTION 3.E)
  // ============================================================================

  const renderEvaluatorWorkspace = () => {
    // SRS 3.4 REQ-1: Show an evaluator ONLY the applications assigned to them
    const assignedApps = applications.filter(
      (a) => a.assigned_evaluator_id === currentEvaluator.evaluator_id
    );
    const activeEvalApp =
      assignedApps.find((a) => a.application_id === selectedEvalAppId) || assignedApps[0] || null;
    const appDocs = activeEvalApp
      ? documents.filter((d) => d.application_id === activeEvalApp.application_id)
      : [];
    const activeDoc =
      appDocs.find((d) => d.document_id === selectedEvalDocId) || appDocs[0] || null;
    const activeWorkload = getEvaluatorActiveWorkload(currentEvaluator.evaluator_id);

    return (
      <div className="space-y-6">
        {/* Evaluator Workspace Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-slate-900 text-white shrink-0 mt-0.5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-semibold text-slate-900">
                  {currentEvaluator.evaluator_name}
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                  ID: {currentEvaluator.evaluator_id}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                  Active Assigned Workload: {activeWorkload} Application(s)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Domain Expertise: <span className="font-medium text-slate-800">{currentEvaluator.expertise}</span> &bull; Availability:{' '}
                <span className="font-medium text-slate-800">{currentEvaluator.availability}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEvaluatorTab('assigned')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                evaluatorTab === 'assigned'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Assigned Queue ({assignedApps.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setEvaluatorTab('profile')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                evaluatorTab === 'profile'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Expertise &amp; Availability</span>
            </button>
          </div>
        </div>

        {evaluatorTab === 'assigned' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Assigned Applications Queue */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assigned Queue
                </h3>
                <span className="text-xs text-slate-400 font-mono">SRS 3.4 REQ-1</span>
              </div>

              {assignedApps.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-600">
                  No applications are currently assigned to your evaluator account.
                </div>
              ) : (
                assignedApps.map((app) => {
                  const college = colleges.find((c) => c.college_id === app.college_id);
                  const isSelected =
                    activeEvalApp && activeEvalApp.application_id === app.application_id;
                  return (
                    <button
                      key={app.application_id}
                      type="button"
                      onClick={() => {
                        setSelectedEvalAppId(app.application_id);
                        const firstDoc = documents.find(
                          (d) => d.application_id === app.application_id
                        );
                        if (firstDoc) setSelectedEvalDocId(firstDoc.document_id);
                      }}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-slate-50 border-slate-900 border-l-4 border-l-blue-800 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-mono text-slate-600">
                          {app.application_id}
                        </span>
                        {renderStatusBadge(app.status)}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mt-1.5">
                        {app.subject_applied_for}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {college ? college.college_name : app.college_id}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right Column: Primary Document Review & Decision Actions */}
            <div className="lg:col-span-9 space-y-5">
              {activeEvalApp ? (
                <>
                  {/* Primary Document Review Panel */}
                  <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">
                            {activeEvalApp.application_id}
                          </span>
                          {renderStatusBadge(activeEvalApp.status)}
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          {activeEvalApp.subject_applied_for}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {colleges.find((c) => c.college_id === activeEvalApp.college_id)?.college_name} &bull;{' '}
                          {activeEvalApp.application_details}
                        </p>
                      </div>

                      {/* Review Mode Switcher (SRS 3.3 REQ-4 & REQ-5) */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setEvalViewMode('ai_assisted')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            evalViewMode === 'ai_assisted'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Cpu className="w-3.5 h-3.5 text-blue-800" />
                          <span>OCR Summary &amp; Findings</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvalViewMode('manual')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            evalViewMode === 'manual'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Manual Source Text</span>
                        </button>
                      </div>
                    </div>

                    {/* Statutory Document Category Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {appDocs.map((d) => {
                        const isDocSelected = activeDoc && activeDoc.document_id === d.document_id;
                        const hasOpenClar = clarifications.some(
                          (c) => c.document_id === d.document_id && c.status === 'Open'
                        );
                        return (
                          <button
                            key={d.document_id}
                            type="button"
                            onClick={() => setSelectedEvalDocId(d.document_id)}
                            className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors flex items-center gap-2 ${
                              isDocSelected
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span>{d.document_type}</span>
                            {hasOpenClar && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-400 text-slate-950 font-semibold">
                                Flagged
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Side-by-Side Document Workspace */}
                    {activeDoc && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Left Column: Document Metadata & Raw OCR Extracted Text */}
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                              <div>
                                <div className="text-xs font-semibold text-slate-900">
                                  Source Document &amp; Extracted Text Stream
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                  {activeDoc.file_name} ({formatFileSize(activeDoc.file_size_bytes)})
                                </div>
                              </div>
                              <span
                                title="Measures how legibly the OCR engine read the uploaded document scan"
                                className="px-2.5 py-0.5 rounded text-xs font-mono bg-white border border-slate-300 text-slate-800"
                              >
                                Scan Readability: {activeDoc.ocr_confidence}%
                              </span>
                            </div>

                            <div className="text-xs font-mono leading-relaxed text-slate-800 bg-white p-3.5 rounded-md border border-slate-200 min-h-[120px]">
                              {activeDoc.extracted_text}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                            <span className="font-mono">Uploaded: {activeDoc.uploaded_date}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const reRun = ocrProcessor.extractText(activeDoc);
                                setDocuments((prev) =>
                                  prev.map((docItem) =>
                                    docItem.document_id === activeDoc.document_id
                                      ? { ...docItem, ...reRun }
                                      : docItem
                                  )
                                );
                                appendAuditLog(
                                  'Evaluator',
                                  currentEvaluator.evaluator_id,
                                  'Evaluator.reviewDocument() -> TesseractOCRService.extractText()',
                                  `Re-executed OCR analysis on ${activeDoc.document_id} (${activeDoc.file_name}).`
                                );
                                triggerToast(
                                  'OCR Re-Executed',
                                  `Re-extracted regulatory fields from ${activeDoc.file_name}.`
                                );
                              }}
                              className="text-blue-800 hover:text-blue-950 font-medium inline-flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Re-Run OCR Extraction</span>
                            </button>
                          </div>
                        </div>

                        {/* Right Column: AI Summary & Regulatory Findings (Decision Support Only) */}
                        <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                              <Cpu className="w-4 h-4 text-blue-800" />
                              {evalViewMode === 'ai_assisted'
                                ? 'Automated Regulatory Field Findings'
                                : 'Manual Verification Notes'}
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Advisory Only &bull; Human Decision Required
                            </span>
                          </div>

                          {evalViewMode === 'ai_assisted' ? (
                            <>
                              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200 leading-relaxed">
                                {activeDoc.ai_summary}
                              </p>
                              <div className="space-y-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  Extracted Regulatory Values (SRS 3.3 REQ-2)
                                </div>
                                {activeDoc.highlights.map((h, i) => (
                                  <div
                                    key={i}
                                    className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                                  >
                                    <div>
                                      <div className="text-[11px] text-slate-500">{h.label}</div>
                                      <div className="font-semibold text-slate-900 font-mono mt-0.5">
                                        {h.value}
                                      </div>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                                        h.findingType === 'warning'
                                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}
                                    >
                                      {h.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
                              <p className="font-semibold text-slate-900">
                                Manual Document Inspection Active (SRS 3.3 REQ-4)
                              </p>
                              <p>
                                Review the unedited source document text in the left panel against AICTE Approval Process Handbook standards. If any discrepancy or illegible scan is found, request a clarification on this document below.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Evaluator Action 1: Request Document Clarification */}
                    {activeDoc && (
                      <div className="pt-4 border-t border-slate-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900">
                              Request Document Clarification on &ldquo;{activeDoc.document_type}&rdquo;
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Flags this specific document for replacement and sends your message to the institution without disclosing your evaluator identity (SRS 3.4 REQ-3 &amp; REQ-4).
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input
                            type="text"
                            aria-label="Clarification message for institution"
                            value={clarificationDraft}
                            onChange={(e) => setClarificationDraft(e.target.value)}
                            placeholder={`Specify the clarification or correction required for ${activeDoc.document_type}...`}
                            className="flex-1 px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleEvaluatorRequestClarification(activeEvalApp, activeDoc)
                            }
                            className="px-4 py-2 rounded-md bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium shrink-0"
                          >
                            Request Document Clarification
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evaluator Action 2: Submit Overall Application Recommendation */}
                  <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Submit Evaluator Recommendation (SRS 3.4 REQ-5 &amp; REQ-6)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Record your technical recommendation and physical site-visit verification flag. AICTE Admin retains final approval authority.
                        </p>
                      </div>
                      {activeEvalApp.recommendation_submitted_at && (
                        <span className="px-2.5 py-1 text-xs font-mono rounded bg-blue-50 text-blue-900 border border-blue-200">
                          Last Submitted: {activeEvalApp.recommendation_submitted_at}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div>
                        <label
                          htmlFor="eval-rec-select"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Recommendation Outcome
                        </label>
                        <select
                          id="eval-rec-select"
                          value={recDecision}
                          onChange={(e) => setRecDecision(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium rounded-md border border-slate-300 bg-white focus:border-blue-800 focus:outline-none"
                        >
                          <option value="Accept">Recommend Approval (Accept)</option>
                          <option value="Reject">Recommend Rejection (Reject)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 pt-3">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-800">
                          <input
                            type="checkbox"
                            checked={recSiteVisit}
                            onChange={(e) => setRecSiteVisit(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-800"
                          />
                          <span>
                            Physical Site-Visit Inspection Completed &amp; Campus Infrastructure Verified
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="eval-rec-comments"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Evaluator Review Remarks &amp; Compliance Summary
                      </label>
                      <textarea
                        id="eval-rec-comments"
                        rows={2}
                        value={recComments}
                        onChange={(e) => setRecComments(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleEvaluatorSubmitRecommendation(activeEvalApp)}
                        className="px-5 py-2 rounded-md bg-blue-800 hover:bg-blue-900 text-white text-xs font-medium flex items-center gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Submit Recommendation to AICTE Admin</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500 text-sm">
                  Select an assigned application from the left queue to begin document review.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evaluator Profile Tab (SRS 3.4 REQ-7: Field-Level Permissions) */}
        {evaluatorTab === 'profile' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm max-w-2xl space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Evaluator Profile &amp; Availability Settings (SRS 3.4 REQ-7)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                You may update your domain expertise keywords and availability status. Verification (<code>is_verified</code>) and active status (<code>is_active</code>) are controlled by AICTE Admin.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Domain Expertise Areas (Used for Suitability Matching)
                </label>
                <input
                  type="text"
                  value={currentEvaluator.expertise}
                  onChange={(e) =>
                    setEvaluators((prev) =>
                      prev.map((ev) =>
                        ev.evaluator_id === currentEvaluator.evaluator_id
                          ? { ...ev, expertise: e.target.value }
                          : ev
                      )
                    )
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assignment Availability
                </label>
                <select
                  value={currentEvaluator.availability}
                  onChange={(e) =>
                    setEvaluators((prev) =>
                      prev.map((ev) =>
                        ev.evaluator_id === currentEvaluator.evaluator_id
                          ? { ...ev, availability: e.target.value }
                          : ev
                      )
                    )
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 bg-white focus:border-blue-800 focus:outline-none"
                >
                  <option value="Available">Available for Assignment</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Admin-Controlled Account Status (Read-Only)
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 text-xs font-mono rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Verified: {currentEvaluator.is_verified ? 'Yes' : 'No'}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-mono rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Active: {currentEvaluator.is_active ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  appendAuditLog(
                    'Evaluator',
                    currentEvaluator.evaluator_id,
                    'Evaluator.updateProfile()',
                    `Updated expertise='${currentEvaluator.expertise}', availability='${currentEvaluator.availability}'.`
                  );
                  triggerToast('Profile Saved', 'Evaluator expertise and availability updated.');
                }}
                className="px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
              >
                Save Evaluator Profile
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // 8. AICTE ADMIN WORKSPACE VIEW (SECTION 3.F)
  // ============================================================================

  const renderAdminWorkspace = () => {
    const filteredApps =
      adminFilterStatus === 'All'
        ? applications
        : applications.filter((a) => a.status === adminFilterStatus);

    const activeAdminApp =
      applications.find((a) => a.application_id === selectedAdminAppId) || applications[0];

    return (
      <div className="space-y-6">
        {/* AICTE Admin Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-slate-900 text-white shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-semibold text-slate-900">{currentAdmin.admin_name}</h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                  ID: {currentAdmin.admin_id}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{currentAdmin.designation}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminTab('applications')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                adminTab === 'applications'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Applications &amp; Decisions ({applications.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('matcher')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                adminTab === 'matcher'
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Evaluator Matcher</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('evaluators')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                adminTab === 'evaluators'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Evaluators ({evaluators.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('analytics')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                adminTab === 'analytics'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics &amp; Audit Log</span>
            </button>
          </div>
        </div>

        {/* Admin Tab 1: Applications List & Two-Stage Final Decision */}
        {adminTab === 'applications' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  All Applications ({filteredApps.length})
                </h3>
                <select
                  aria-label="Filter applications by status"
                  value={adminFilterStatus}
                  onChange={(e) => setAdminFilterStatus(e.target.value)}
                  className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Applied">Applied (Unassigned)</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Clarification Requested">Clarification Requested</option>
                  <option value="Recommended">Recommended (Ready for Decision)</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {filteredApps.map((app) => {
                const college = colleges.find((c) => c.college_id === app.college_id);
                const evaluator = evaluators.find(
                  (e) => e.evaluator_id === app.assigned_evaluator_id
                );
                const isSelected =
                  activeAdminApp && activeAdminApp.application_id === app.application_id;
                return (
                  <button
                    key={app.application_id}
                    type="button"
                    onClick={() => setSelectedAdminAppId(app.application_id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-slate-50 border-slate-900 border-l-4 border-l-blue-800 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono text-slate-600">{app.application_id}</span>
                      {renderStatusBadge(app.status)}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1.5">
                      {app.subject_applied_for}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {college ? college.college_name : app.college_id}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>
                        Evaluator: <strong className="font-medium text-slate-700">{evaluator ? evaluator.evaluator_name : 'Unassigned'}</strong>
                      </span>
                      {app.evaluator_recommendation && (
                        <span className="font-medium text-blue-800">
                          Recommendation: {app.evaluator_recommendation}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Two-Stage Decision Governance Panel */}
            <div className="lg:col-span-7 space-y-5">
              {activeAdminApp && (
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">
                          {activeAdminApp.application_id}
                        </span>
                        {renderStatusBadge(activeAdminApp.status)}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mt-1">
                        {activeAdminApp.subject_applied_for}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Institution:{' '}
                        {colleges.find((c) => c.college_id === activeAdminApp.college_id)?.college_name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMatcherAppId(activeAdminApp.application_id);
                        setAdminTab('matcher');
                      }}
                      className="px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Cpu className="w-3.5 h-3.5 text-blue-800" />
                      <span>
                        {activeAdminApp.assigned_evaluator_id
                          ? 'Reassign Evaluator'
                          : 'Match & Assign Evaluator'}
                      </span>
                    </button>
                  </div>

                  {/* Stage 1: Evaluator Recommendation Record (Preserved Separately per SRS 3.6 REQ-6) */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                        Stage 1: Evaluator Recommendation (Advisory Record &bull; SRS 3.6 REQ-4 &amp; REQ-6)
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {activeAdminApp.recommendation_submitted_at || 'Pending Evaluator Review'}
                      </span>
                    </div>

                    {activeAdminApp.evaluator_recommendation ? (
                      <div className="text-xs space-y-2 text-slate-700">
                        <div className="flex flex-wrap gap-4">
                          <span>
                            Evaluator Outcome:{' '}
                            <strong
                              className={`font-semibold ${
                                activeAdminApp.evaluator_recommendation === 'Accept'
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {activeAdminApp.evaluator_recommendation}
                            </strong>
                          </span>
                          <span>
                            Physical Site-Visit Confirmed:{' '}
                            <strong className="font-semibold text-slate-900">
                              {activeAdminApp.site_visit_confirmed ? 'Yes (Verified)' : 'No'}
                            </strong>
                          </span>
                        </div>
                        <p className="bg-white p-3 rounded border border-slate-200 leading-relaxed">
                          &ldquo;{activeAdminApp.evaluator_comments}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600">
                        The assigned evaluator has not yet submitted a recommendation for this application.
                      </p>
                    )}
                  </div>

                  {/* Stage 2: AICTE Admin Binding Final Decision */}
                  <div className="p-4 rounded-lg bg-white border border-slate-300 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                          Stage 2: AICTE Admin Binding Final Decision (SRS 3.6 REQ-5 to REQ-7)
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Records the official regulatory decision in a separate field from the evaluator&apos;s recommendation and publishes the decision reason to the institution.
                        </p>
                      </div>
                      {activeAdminApp.final_decision_at && (
                        <span className="text-xs font-mono text-emerald-700">
                          Recorded: {activeAdminApp.final_decision_at}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="admin-final-select"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Official Decision
                        </label>
                        <select
                          id="admin-final-select"
                          value={finalDecisionChoice}
                          onChange={(e) => setFinalDecisionChoice(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium rounded-md border border-slate-300 bg-white focus:border-blue-800 focus:outline-none"
                        >
                          <option value="Approved">Approve Application (Approved)</option>
                          <option value="Rejected">Reject Application (Rejected)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="admin-final-reason"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Official Decision Justification (Visible to Institution)
                        </label>
                        <input
                          id="admin-final-reason"
                          type="text"
                          value={finalDecisionReason}
                          onChange={(e) => setFinalDecisionReason(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:border-blue-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAdminFinalizeDecision(activeAdminApp)}
                        className={`px-4 py-2 rounded-md text-white text-xs font-medium flex items-center gap-1.5 ${
                          finalDecisionChoice === 'Rejected'
                            ? 'bg-rose-700 hover:bg-rose-800'
                            : 'bg-blue-800 hover:bg-blue-900'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>Record Binding Final Decision</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Tab 2: Evaluator Suitability & Workload Matching */}
        {adminTab === 'matcher' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Evaluator Suitability &amp; Workload Matching (SRS Section 3.5)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Scores eligible evaluators using domain keyword similarity (65% weight) and live active workload count (35% weight). Inactive, unverified, or unavailable evaluators are excluded automatically (REQ-3).
                </p>
              </div>

              <div>
                <label
                  htmlFor="matcher-app-select"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Target Application
                </label>
                <select
                  id="matcher-app-select"
                  value={matcherTargetApp ? matcherTargetApp.application_id : ''}
                  onChange={(e) => setMatcherAppId(e.target.value)}
                  className="px-3 py-2 text-xs font-medium rounded-md border border-slate-300 bg-white"
                >
                  {applications.map((app) => (
                    <option key={app.application_id} value={app.application_id}>
                      {app.application_id} &mdash; {app.subject_applied_for} ({app.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {matcherTargetApp && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-900">
                    Program: {matcherTargetApp.subject_applied_for}
                  </span>
                  <p className="text-slate-600 mt-0.5">{matcherTargetApp.application_details}</p>
                </div>
                <span className="px-3 py-1 rounded bg-white border border-slate-200 font-mono text-slate-700">
                  Current Evaluator: {matcherTargetApp.assigned_evaluator_id || 'Unassigned'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankedEvaluatorSuggestions.map((item, idx) => {
                const isAlreadyAssigned =
                  matcherTargetApp &&
                  matcherTargetApp.assigned_evaluator_id === item.evaluator_id;
                return (
                  <div
                    key={item.evaluator_id}
                    className={`p-4 rounded-lg border flex flex-col justify-between ${
                      idx === 0
                        ? 'bg-slate-50 border-slate-900 border-t-4 border-t-blue-800'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-medium rounded ${
                            idx === 0
                              ? 'bg-blue-800 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Rank #{idx + 1} {idx === 0 ? '• Top Recommendation' : ''}
                        </span>
                        <span className="text-base font-semibold text-slate-900 font-mono">
                          {item.suitability_score}% Match
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {item.evaluator_name}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">{item.expertise}</p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Domain Expertise Score:</span>
                          <span className="font-mono font-medium text-slate-900">
                            {item.expertise_score}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Live Active Workload:</span>
                          <span className="font-mono font-medium text-slate-900">
                            {item.active_workload} active ({item.workload_score} pts)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 pt-1">
                          Matched domain terms:{' '}
                          <span className="font-mono text-slate-700">
                            {item.matched_terms.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAlreadyAssigned}
                      onClick={() => handleAdminAssignEvaluator(matcherTargetApp, item.evaluator_id)}
                      className={`mt-4 w-full py-2 rounded-md text-xs font-medium transition-colors ${
                        isAlreadyAssigned
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-blue-800 text-white'
                      }`}
                    >
                      {isAlreadyAssigned ? 'Currently Assigned' : 'Confirm Evaluator Assignment'}
                    </button>
                  </div>
                );
              })}
            </div>

            {excludedEvaluators.length > 0 && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong className="font-semibold text-slate-800">
                  Excluded from Matching Pool (SRS 3.5 REQ-3):{' '}
                </strong>
                {excludedEvaluators.map((ev) => (
                  <span key={ev.evaluator_id} className="mr-3 font-mono">
                    {ev.evaluator_name} (verified={String(ev.is_verified)}, active={String(ev.is_active)}, availability={ev.availability})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Tab 3: Evaluator Directory & Onboarding */}
        {adminTab === 'evaluators' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Evaluator Directory &amp; Administrative Permissions (SRS 3.6 REQ-2 &amp; REQ-3)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Residential addresses are visible exclusively to AICTE Admin (SRS 5.3 Privacy). Unverified or deactivated evaluators cannot sign in or receive assignments.
                </p>
              </div>

              <div className="space-y-3">
                {evaluators.map((ev) => {
                  const liveWorkload = getEvaluatorActiveWorkload(ev.evaluator_id);
                  return (
                    <div
                      key={ev.evaluator_id}
                      className="p-4 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {ev.evaluator_name}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            ({ev.evaluator_id})
                          </span>
                          <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-100 text-slate-700 border border-slate-200">
                            Workload: {liveWorkload}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">Expertise: {ev.expertise}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                          <span>Admin-Only Address: {ev.address}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdminToggleEvaluatorFlag(ev, 'is_verified')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            ev.is_verified
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          Verified: {ev.is_verified ? 'Yes' : 'No'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminToggleEvaluatorFlag(ev, 'is_active')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            ev.is_active
                              ? 'bg-slate-100 text-slate-800 border-slate-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          Active: {ev.is_active ? 'Yes' : 'No'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Onboard New Evaluator Form */}
            <form
              onSubmit={handleAdminOnboardEvaluator}
              className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4 h-fit"
            >
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-blue-800" />
                <span>Onboard New Evaluator</span>
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newEvalForm.evaluator_name}
                  onChange={(e) =>
                    setNewEvalForm((p) => ({ ...p, evaluator_name: e.target.value }))
                  }
                  placeholder="e.g., Prof. S. K. Nanda"
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Official Academic Email *
                </label>
                <input
                  type="email"
                  required
                  value={newEvalForm.email}
                  onChange={(e) => setNewEvalForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="sk.nanda@iitd.ac.in"
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Domain Expertise Keywords *
                </label>
                <input
                  type="text"
                  required
                  value={newEvalForm.expertise}
                  onChange={(e) => setNewEvalForm((p) => ({ ...p, expertise: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Residential Address (Admin-Only)
                </label>
                <input
                  type="text"
                  value={newEvalForm.address}
                  onChange={(e) => setNewEvalForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-md bg-blue-800 hover:bg-blue-900 text-white text-xs font-medium"
              >
                Onboard &amp; Verify Evaluator
              </button>
            </form>
          </div>
        )}

        {/* Admin Tab 4: Analytics & Audit Log */}
        {adminTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-500">
                  Total Applications (SRS 3.7 REQ-1)
                </div>
                <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">
                  {analyticsSummary.total}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Submitted across {colleges.length} registered institutions
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-500">
                  Mean Turnaround Time (SRS 3.7 REQ-2)
                </div>
                <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">
                  {analyticsSummary.avgDays} Days
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Average duration from submission to final decision
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-500">
                  Eligible Verified Evaluators
                </div>
                <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">
                  {evaluators.filter((e) => e.is_active && e.is_verified).length} / {evaluators.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Active and verified in matching pool
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Application Distribution by Workflow Status
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {Object.entries(analyticsSummary.counts).map(([st, cnt]) => (
                  <div
                    key={st}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60"
                  >
                    <div className="text-xl font-semibold text-slate-900 font-mono">{cnt}</div>
                    <div className="mt-1">{renderStatusBadge(st)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <span>System Audit Log &amp; Method Trace (SRS Section 5.3)</span>
                </h4>
                <span className="text-xs font-mono text-slate-500">
                  {auditLogs.length} events recorded
                </span>
              </div>
              <div className="divide-y divide-slate-200 max-h-80 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.log_id}
                    className="py-2.5 text-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div>
                        <span className="font-mono font-medium text-slate-500 mr-2">
                          {log.log_id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium mr-2">
                          {log.actor_role} ({log.actor_id})
                        </span>
                        <span className="text-slate-800">{log.description}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                        {log.uml_method}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // 9. BALANCED AUTHENTICATION & INSTITUTIONAL WELCOME PAGE (SECTION 3.H & 9)
  // ============================================================================

  const fillTestAccountCredentials = (email, password) => {
    setAuthMode('login');
    setLoginEmail(email);
    setLoginPassword(password);
    setAuthError(null);
    setAuthNotice(`Loaded test credentials for ${email}. Click "Authenticate & Issue Signed JWT" to sign in.`);
  };

  const renderAuthScreen = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-2">
      {/* Left Column: Institutional Portal Overview & Safe Evaluation Test Accounts */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            <Shield className="w-3.5 h-3.5 text-blue-800" />
            <span>AICTE Institutional Accreditation &amp; Approval Workflow</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            AI-Supported AICTE Approval Process Portal
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            A role-based regulatory workflow system for technical institutions, subject-matter evaluators, and AICTE administrators. Integrates Tesseract OCR document field extraction and NLP-based evaluator suitability scoring while preserving human decision authority at every stage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold text-slate-900">1. Institution Workspace</div>
              <p className="text-xs text-slate-600 mt-1">
                Submit applications, upload 5 statutory documents, track real-time status, and respond to clarification requests.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold text-slate-900">2. Evaluator Workspace</div>
              <p className="text-xs text-slate-600 mt-1">
                Inspect assigned applications, compare OCR findings against source scans, request clarifications, and submit recommendations.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold text-slate-900">3. AICTE Admin Workspace</div>
              <p className="text-xs text-slate-600 mt-1">
                Assign evaluators using expertise &amp; live workload scoring, manage evaluator verification, and record binding final decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Documented Non-Production Evaluation Test Accounts (Section 3.H & 7.12) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Academic Evaluation Test Accounts (Non-Production Seed Data)
              </h3>
              <p className="text-xs text-slate-500">
                Use these seeded accounts to test role-specific authentication, RBAC routing, and the unverified-evaluator login block (SRS 3.1 REQ-5).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Role &amp; Account</th>
                  <th className="py-2 px-3 font-medium">Email Credential</th>
                  <th className="py-2 px-3 font-medium">Test Password</th>
                  <th className="py-2 pl-3 font-medium text-right">Quick Fill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-900">College (SVIIT Indore)</div>
                    <div className="text-[11px] text-slate-500">Has A501 &amp; A502 (Clarification Open)</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">admin@sviit.edu</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">College@123</td>
                  <td className="py-2.5 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => fillTestAccountCredentials('admin@sviit.edu', 'College@123')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
                    >
                      Fill Login
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-900">Evaluator (Dr. R. Sharma)</div>
                    <div className="text-[11px] text-slate-500">Verified &amp; Active (Assigned A501, A502)</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">r.sharma@iitb.ac.in</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">Evaluator@123</td>
                  <td className="py-2.5 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => fillTestAccountCredentials('r.sharma@iitb.ac.in', 'Evaluator@123')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
                    >
                      Fill Login
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-900">AICTE Admin (Dr. Vikram Sethi)</div>
                    <div className="text-[11px] text-slate-500">Full Oversight, Matcher &amp; Final Decision</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">admin@aicte-india.org</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">Admin@123</td>
                  <td className="py-2.5 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => fillTestAccountCredentials('admin@aicte-india.org', 'Admin@123')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
                    >
                      Fill Login
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-900">Unverified Evaluator (Test REQ-5)</div>
                    <div className="text-[11px] text-amber-800">is_verified=false (Login Rejected)</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">kv.sub@annauniv.edu</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">Evaluator@123</td>
                  <td className="py-2.5 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => fillTestAccountCredentials('kv.sub@annauniv.edu', 'Evaluator@123')}
                      className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium"
                    >
                      Test Block
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Sign-In & Public Institution Registration Form */}
      <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {authMode === 'login'
                ? 'Portal Sign In'
                : 'New Institution Registration (SRS 3.1 REQ-1)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {authMode === 'login'
                ? 'Role and workspace permissions are resolved automatically from your verified account.'
                : 'Public registration is restricted strictly to applying technical institutions.'}
            </p>
          </div>
          <KeyRound className="w-5 h-5 text-slate-700 shrink-0" />
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-md">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded ${
              authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded ${
              authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Institution Registration
          </button>
        </div>

        {authNotice && (
          <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-900">
            {authNotice}
          </div>
        )}

        {authError && (
          <div
            role="alert"
            className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Official Email Address *
              </label>
              <input
                id="login-email-input"
                type="email"
                required
                autoComplete="username"
                placeholder="name@institution.edu.in"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="login-password-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Password *
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your account password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2 pr-9 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-blue-800 hover:bg-blue-900 text-white text-xs font-medium transition-colors"
            >
              Authenticate &amp; Issue Signed JWT
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterCollegeSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="reg-college-name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Institution Name *
              </label>
              <input
                id="reg-college-name"
                type="text"
                required
                placeholder="e.g., Shri Govindram Seksaria Institute of Technology"
                value={regForm.college_name}
                onChange={(e) => setRegForm((p) => ({ ...p, college_name: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Official Email *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="registrar@college.ac.in"
                  value={regForm.email}
                  onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Password (min 6 chars) *
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  placeholder="Create password"
                  value={regForm.password}
                  onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-number"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Trust / Society Reg. No. *
                </label>
                <input
                  id="reg-number"
                  type="text"
                  required
                  placeholder="TR-2026-9920"
                  value={regForm.registration_number}
                  onChange={(e) =>
                    setRegForm((p) => ({ ...p, registration_number: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-signatory"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Authorized Signatory Name *
                </label>
                <input
                  id="reg-signatory"
                  type="text"
                  required
                  placeholder="Dr. A. K. Verma"
                  value={regForm.authorized_signatory_name}
                  onChange={(e) =>
                    setRegForm((p) => ({ ...p, authorized_signatory_name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-trust"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Trust / Society Name
                </label>
                <input
                  id="reg-trust"
                  type="text"
                  placeholder="Technical Education Trust"
                  value={regForm.trust_society_name}
                  onChange={(e) =>
                    setRegForm((p) => ({ ...p, trust_society_name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-contact"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Contact Phone
                </label>
                <input
                  id="reg-contact"
                  type="text"
                  placeholder="+91-731-2500000"
                  value={regForm.contact_no}
                  onChange={(e) => setRegForm((p) => ({ ...p, contact_no: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
            >
              Register Institution &amp; Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // 10. COMPREHENSIVE UML-TO-CODE TRACEABILITY TECHNICAL REFERENCE (SECTION 3.G)
  // ============================================================================

  const renderArchitectureBlueprint = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              UML-to-Code Architecture &amp; Requirements Traceability Reference
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Technical reference mapping the Weeks 2&ndash;7 UML models and IEEE Std 830-1998 SRS requirements to the Node.js, Express, PostgreSQL, and React implementation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUmlSection('classes')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                umlSection === 'classes'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              1. Class &amp; Domain Model
            </button>
            <button
              type="button"
              onClick={() => setUmlSection('patterns')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                umlSection === 'patterns'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              2. Design Patterns &amp; Sequence Flows
            </button>
            <button
              type="button"
              onClick={() => setUmlSection('endpoints')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                umlSection === 'endpoints'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              3. REST API &amp; RBAC Matrix
            </button>
            <button
              type="button"
              onClick={() => setUmlSection('requirements')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                umlSection === 'requirements'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              4. SRS Acceptance Checklist
            </button>
          </div>
        </div>

        {/* Section 1: Detailed Class Diagram & Encapsulation Mapping */}
        {umlSection === 'classes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-800" />
                  <span>Encapsulation (Week 6 Class Diagram)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  User entities (<code>College</code>, <code>Evaluator</code>, <code>AICTEAdmin</code>) declare ES2022 private <code>#password</code> fields. External callers cannot read plaintext or raw password properties directly.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-800" />
                  <span>3NF Relational Mapping (Week 3)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Foreign keys (<code>college_id</code>, <code>assigned_evaluator_id</code>, <code>application_id</code>, <code>document_id</code>) eliminate data duplication. Evaluator workload is computed dynamically from active assignments.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-800" />
                  <span>Package Structure (Week 6 &amp; 7)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Backend modules are separated into <code>backend/controllers/</code>, <code>backend/models/</code>, <code>backend/services/</code>, <code>backend/middleware/</code>, and <code>backend/database/</code>.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="p-3 font-semibold">Domain Class</th>
                    <th className="p-3 font-semibold">Source File &amp; DB Table</th>
                    <th className="p-3 font-semibold">Encapsulated &amp; Key Attributes</th>
                    <th className="p-3 font-semibold">Implemented UML Methods</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">College</td>
                    <td className="p-3 font-mono text-slate-600">backend/models/College.js (colleges)</td>
                    <td className="p-3 font-mono text-slate-700">- #password, + college_id, + registration_number</td>
                    <td className="p-3 font-mono text-slate-700">register(), login(), applyForApplication(), trackApplicationStatus(), updateProfile(), reuploadDocument()</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">Application</td>
                    <td className="p-3 font-mono text-slate-600">backend/models/Application.js (applications)</td>
                    <td className="p-3 font-mono text-slate-700">+ application_id, + status, + evaluator_recommendation, + final_decision</td>
                    <td className="p-3 font-mono text-slate-700">getStatus(), updateStatus(), attachDocument(), recordEvaluatorRecommendation(), recordFinalDecision()</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">Evaluator</td>
                    <td className="p-3 font-mono text-slate-600">backend/models/Evaluator.js (evaluators)</td>
                    <td className="p-3 font-mono text-slate-700">- #password, + expertise, + availability, + is_verified, + is_active</td>
                    <td className="p-3 font-mono text-slate-700">login(), viewAssignedApplications(), reviewDocument(), requestClarification(), submitRecommendation(), updateProfile()</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">Document</td>
                    <td className="p-3 font-mono text-slate-600">backend/models/Document.js (documents)</td>
                    <td className="p-3 font-mono text-slate-700">+ document_id, + document_type, + file_url, + extracted_text, + ocr_confidence</td>
                    <td className="p-3 font-mono text-slate-700">validateFile(), uploadDocument(fileUrl, rawText, docProcessor), getExtractedText()</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">ClarificationRequest</td>
                    <td className="p-3 font-mono text-slate-600">backend/models/ClarificationRequest.js (clarification_requests)</td>
                    <td className="p-3 font-mono text-slate-700">+ clarification_id, + document_id, + raised_by_evaluator_id, + status</td>
                    <td className="p-3 font-mono text-slate-700">createRequest(), resolveRequest(), toCollegeView() [strips evaluator ID]</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold text-slate-900">AICTEAdmin</td>
                    <td className="p-3 font-mono text-slate-600">backend/models/AICTEAdmin.js (aicte_admins)</td>
                    <td className="p-3 font-mono text-slate-700">- #password, + admin_id, + designation</td>
                    <td className="p-3 font-mono text-slate-700">login(), monitorApplications(), assignEvaluator(), manageEvaluator(), finalizeDecision(), viewAnalytics()</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 2: Design Patterns & Sequence Diagram Traceability */}
        {umlSection === 'patterns' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-semibold text-slate-900">
                  Strategy Pattern 1: Document Processing (SOLID Dependency Inversion)
                </div>
                <p className="text-slate-600">
                  <code>Document.uploadDocument()</code> and <code>ApplicationController</code> depend on the <code>IDocumentProcessor</code> interface (<code>backend/services/IDocumentProcessor.js</code>) rather than coupling directly to Tesseract.
                </p>
                <pre className="p-3 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
{`class IDocumentProcessor {
  extractText(document) { throw new Error('NotImplementedError'); }
}
class TesseractOCRService extends IDocumentProcessor {
  extractText(document) { /* OCR + regex field extraction */ }
}`}
                </pre>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-semibold text-slate-900">
                  Strategy Pattern 2 &amp; Singleton Database Connection
                </div>
                <p className="text-slate-600">
                  <code>AICTEAdmin.assignEvaluator()</code> delegates scoring to <code>IEvaluatorMatcher</code> (<code>NLPMatchingService</code>), while <code>DatabaseConnection.getInstance()</code> ensures a single shared database connection instance.
                </p>
                <pre className="p-3 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
{`class IEvaluatorMatcher {
  suggestEvaluator(app, evaluators, allApps) { ... }
}
class DatabaseConnection {
  static getInstance() { /* Singleton instance */ }
}`}
                </pre>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
              <div className="font-semibold text-slate-900">
                Week 4 Activity &amp; Week 5 Sequence Diagram Behavioral Mapping
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <div className="font-mono font-semibold text-blue-800">Step 1: Parallel Intake</div>
                  <p className="text-slate-600 mt-1">
                    <code>submitApplication()</code> runs <code>TesseractOCRService.extractText()</code> across all 5 documents and places the application in the matching queue.
                  </p>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <div className="font-mono font-semibold text-blue-800">Step 2: Clarification Loop</div>
                  <p className="text-slate-600 mt-1">
                    <code>raiseClarification()</code> sets status to <code>Clarification Requested</code> and unlocks <code>College.reuploadDocument()</code> on that file only.
                  </p>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <div className="font-mono font-semibold text-blue-800">Step 3: Re-OCR Resolution</div>
                  <p className="text-slate-600 mt-1">
                    Re-uploading triggers fresh OCR extraction, marks the clarification <code>Resolved</code>, and returns status to <code>Under Review</code>.
                  </p>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <div className="font-mono font-semibold text-blue-800">Step 4: Two-Stage Decision</div>
                  <p className="text-slate-600 mt-1">
                    <code>submitRecommendation()</code> records the evaluator&apos;s advisory outcome; <code>finalizeDecision()</code> records the Admin&apos;s binding decision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: REST API & Server-Side RBAC Security Matrix */}
        {umlSection === 'endpoints' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="p-3 font-semibold">HTTP Endpoint</th>
                  <th className="p-3 font-semibold">Controller Method</th>
                  <th className="p-3 font-semibold">Server RBAC Guard</th>
                  <th className="p-3 font-semibold">Security &amp; Data Isolation Enforcement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-mono text-slate-900">POST /api/auth/register</td>
                  <td className="p-3 font-mono text-slate-600">AuthController.registerCollege</td>
                  <td className="p-3">Public (College only)</td>
                  <td className="p-3 text-slate-600">Rejects role elevation (`403` if role != College); hashes password; checks duplicate email.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-900">POST /api/auth/login</td>
                  <td className="p-3 font-mono text-slate-600">AuthController.login</td>
                  <td className="p-3">Public</td>
                  <td className="p-3 text-slate-600">Resolves role on server from verified account; blocks unverified/inactive evaluators (`SRS 3.1 REQ-5`).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-900">GET /api/auth/me &amp; POST /api/auth/logout</td>
                  <td className="p-3 font-mono text-slate-600">AuthController.getSession / logout</td>
                  <td className="p-3">Authenticated JWT</td>
                  <td className="p-3 text-slate-600">Verifies HMAC-SHA256 signature, expiration (`exp`), and revokes token on logout.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-900">GET /api/applications</td>
                  <td className="p-3 font-mono text-slate-600">College / Evaluator / Admin filter</td>
                  <td className="p-3 font-mono">authorizeRoles([&apos;College&apos;, &apos;Evaluator&apos;, &apos;AICTEAdmin&apos;])</td>
                  <td className="p-3 text-slate-600">Colleges receive only their own applications + anonymized clarifications; Evaluators receive only assigned applications.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-900">POST /api/applications/:id/documents/:docId/reupload</td>
                  <td className="p-3 font-mono text-slate-600">ApplicationController.reuploadFlaggedDocument</td>
                  <td className="p-3 font-mono">authorizeRoles([&apos;College&apos;])</td>
                  <td className="p-3 text-slate-600">Verifies `application.college_id === user.id`, checks open clarification on `docId`, validates PDF/JPG/PNG &le; 10 MB.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-900">POST /api/applications/:id/clarifications &amp; /recommendation</td>
                  <td className="p-3 font-mono text-slate-600">ApplicationController.raiseClarification / submitEvaluatorRecommendation</td>
                  <td className="p-3 font-mono">authorizeRoles([&apos;Evaluator&apos;])</td>
                  <td className="p-3 text-slate-600">Verifies `application.assigned_evaluator_id === user.id` before allowing clarification or recommendation.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-900">POST /api/applications/:id/assign-evaluator &amp; /final-decision</td>
                  <td className="p-3 font-mono text-slate-600">ApplicationController.matchAndAssignEvaluator / recordAdminFinalDecision</td>
                  <td className="p-3 font-mono">authorizeRoles([&apos;AICTEAdmin&apos;])</td>
                  <td className="p-3 text-slate-600">Restricted strictly to AICTEAdmin; preserves evaluator recommendation separately from final decision.</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Section 4: IEEE 830 SRS Requirements Verification Checklist */}
        {umlSection === 'requirements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="p-3 font-semibold">SRS Requirement ID</th>
                  <th className="p-3 font-semibold">Expected Behavior</th>
                  <th className="p-3 font-semibold">Implementation Location</th>
                  <th className="p-3 font-semibold">Verification Method &amp; Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">3.1 REQ-1 to REQ-5</td>
                  <td className="p-3 text-slate-700">College registration, password hashing, JWT issuance, RBAC, and login rejection for unverified/inactive evaluators.</td>
                  <td className="p-3 font-mono text-slate-600">AuthController.js, authMiddleware.js, Evaluator.js</td>
                  <td className="p-3 text-emerald-800 font-medium">Pass (Verified in unit.test.js #1, #2, #6 &amp; integration.test.js #8, #9)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">3.2 REQ-1 to REQ-7</td>
                  <td className="p-3 text-slate-700">5 statutory document uploads, PDF/JPG/PNG &le; 10 MB validation, 6 lifecycle states, and conditional re-upload on open clarification.</td>
                  <td className="p-3 font-mono text-slate-600">College.js, Document.js, Application.js</td>
                  <td className="p-3 text-emerald-800 font-medium">Pass (Verified in unit.test.js #4 &amp; integration.test.js #8)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">3.3 REQ-1 to REQ-5</td>
                  <td className="p-3 text-slate-700">OCR text extraction, summary &amp; field highlighting, automatic re-OCR on re-upload, manual view alternative, advisory-only governance.</td>
                  <td className="p-3 font-mono text-slate-600">IDocumentProcessor.js, TesseractOCRService.js</td>
                  <td className="p-3 text-emerald-800 font-medium">Pass (Verified in unit.test.js #3 &amp; integration.test.js #8)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">3.4 REQ-1 to REQ-7</td>
                  <td className="p-3 text-slate-700">Assigned-only queue, anonymized clarification messages to College (BR-4), timestamped recommendation + site-visit flag, self-editable expertise/availability only.</td>
                  <td className="p-3 font-mono text-slate-600">Evaluator.js, ClarificationRequest.js</td>
                  <td className="p-3 text-emerald-800 font-medium">Pass (Verified in unit.test.js #2 &amp; integration.test.js #8)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">3.5 REQ-1 to REQ-5</td>
                  <td className="p-3 text-slate-700">Evaluator scoring by expertise + live counted active workload (not static field), excluding inactive/unverified/unavailable evaluators, Admin confirmation required.</td>
                  <td className="p-3 font-mono text-slate-600">IEvaluatorMatcher.js, NLPMatchingService.js</td>
                  <td className="p-3 text-emerald-800 font-medium">Pass (Verified in unit.test.js #5 &amp; integration.test.js #8)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">3.6 REQ-1 to REQ-7 &amp; 3.7</td>
                  <td className="p-3 text-slate-700">Admin oversight, evaluator verification toggles, separate storage of recommendation vs. final decision, status counts &amp; mean turnaround analytics.</td>
                  <td className="p-3 font-mono text-slate-600">AICTEAdmin.js, ApplicationController.js</td>
                  <td className="p-3 text-emerald-800 font-medium">Pass (Verified in integration.test.js #8 &amp; #9)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // 11. GLOBAL LAYOUT, STANDARDIZED HEADER & SUBTLE AUDIT STRIP
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Standardized Institutional Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-800 border border-blue-700 flex items-center justify-center font-semibold text-xs tracking-wider shrink-0">
              AICTE
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                  AI-Supported AICTE Approval Process Portal
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[11px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                  IEEE 830 SRS v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                SVIIT, SVVV Indore (BTCS706N) &bull; Guide: Prof. Namrata Bhatt
              </p>
            </div>
          </div>

          {/* Role-Isolated Navigation & Session Controls */}
          <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-2">
            {session ? (
              <>
                {/* Active Authenticated User Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-medium text-white">{session.name}</span>
                  <span className="text-slate-400 font-mono">({session.role})</span>
                </div>

                {/* Primary Role Workspace Button (Only shows the authenticated user's own workspace) */}
                <button
                  type="button"
                  onClick={() => setActiveView('Workspace')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeView === 'Workspace'
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {session.role === 'College' && <Building2 className="w-3.5 h-3.5" />}
                  {session.role === 'Evaluator' && <UserCheck className="w-3.5 h-3.5" />}
                  {session.role === 'AICTEAdmin' && <Shield className="w-3.5 h-3.5" />}
                  <span>
                    {session.role === 'College'
                      ? 'Institution Workspace'
                      : session.role === 'Evaluator'
                      ? 'Evaluator Workspace'
                      : 'AICTE Admin Workspace'}
                  </span>
                </button>

                {/* Technical Reference (UML Map) */}
                <button
                  type="button"
                  onClick={() => setActiveView('Architecture')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeView === 'Architecture'
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>UML Reference</span>
                </button>

                {/* Explicit Opt-In Academic Demo Switcher Toggle */}
                <button
                  type="button"
                  onClick={() => setShowDemoSwitcher((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                    showDemoSwitcher
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="Toggle explicit academic evaluation demo account switcher"
                >
                  Demo Helper
                </button>

                {/* Functional Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-rose-900/80 text-slate-200 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('AuthScreen')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeView === 'AuthScreen'
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('Architecture')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeView === 'Architecture'
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>UML Reference</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDemoSwitcher((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                    showDemoSwitcher
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  Demo Helper
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Isolated Academic Evaluation Demo Bar (Only shown when explicitly toggled on) */}
        {showDemoSwitcher && (
          <div className="bg-slate-800 border-t border-slate-700 px-4 sm:px-6 lg:px-8 py-2 text-xs">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-300">
                <strong className="text-amber-300 font-medium">Academic Viva Demo Mode:</strong> Quick-switch seeded test sessions for presentation walkthrough (real login &amp; RBAC remain enforced on Sign In):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => activateAcademicDemoAccount('College', 'college_101')}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Demo: College (SVIIT)
                </button>
                <button
                  type="button"
                  onClick={() => activateAcademicDemoAccount('Evaluator', 'evaluator_22')}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Demo: Evaluator (Dr. Sharma)
                </button>
                <button
                  type="button"
                  onClick={() => activateAcademicDemoAccount('Evaluator', 'evaluator_25')}
                  className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 font-medium"
                >
                  Test Unverified Block (REQ-5)
                </button>
                <button
                  type="button"
                  onClick={() => activateAcademicDemoAccount('AICTEAdmin', 'admin_01')}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Demo: AICTE Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Non-blocking Toast Notification (Positioned top-right below header so it never overlaps footer) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-start gap-3"
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs leading-relaxed">
            <div className="font-semibold">{toast.title}</div>
            <div className="text-slate-300 mt-0.5">{toast.message}</div>
          </div>
          <button
            type="button"
            aria-label="Close notification"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white text-xs ml-2"
          >
            &#10005;
          </button>
        </div>
      )}

      {/* Explicit Confirmation Modal (SRS 5.2 Safety Requirement) */}
      {confirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900">
              <Shield className="w-5 h-5 text-blue-800 shrink-0" />
              <h3 className="text-sm font-semibold">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.description}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 rounded-md text-white text-xs font-medium ${
                  confirmModal.isDestructive
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-blue-800 hover:bg-blue-900'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'Architecture' ? (
          renderArchitectureBlueprint()
        ) : !session || activeView === 'AuthScreen' ? (
          renderAuthScreen()
        ) : (
          <>
            {session.role === 'College' && renderCollegeWorkspace()}
            {session.role === 'Evaluator' && renderEvaluatorWorkspace()}
            {session.role === 'AICTEAdmin' && renderAdminWorkspace()}
          </>
        )}
      </main>

      {/* Subtle, Non-Intrusive Audit & Traceability Footer Bar (Section 3.I) */}
      <footer className="bg-slate-50 border-t border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-600 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-medium shrink-0">
              AUDIT TRAIL
            </span>
            <span className="font-mono text-slate-700 text-[11px] break-all">
              {auditLogs[0]?.uml_method}
            </span>
            <span className="text-slate-500 text-[11px] break-words">
              &mdash; {auditLogs[0]?.description}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowTraceabilityDrawer((prev) => !prev)}
            className="text-xs font-medium text-blue-800 hover:text-blue-950 shrink-0 self-start sm:self-auto"
          >
            {showTraceabilityDrawer
              ? 'Hide Audit History'
              : `Inspect Full Audit Log (${auditLogs.length})`}
          </button>
        </div>

        {showTraceabilityDrawer && (
          <div className="max-w-7xl mx-auto mt-2.5 p-3.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1.5 max-h-48 overflow-y-auto shadow-inner">
            {auditLogs.map((l) => (
              <div
                key={l.log_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0"
              >
                <div className="break-words">
                  <span className="text-slate-400 mr-2">[{l.timestamp}]</span>
                  <span className="font-semibold text-blue-900 mr-2">{l.uml_method}</span>
                  <span className="text-slate-700">{l.description}</span>
                </div>
                <span className="text-slate-500 shrink-0">
                  {l.actor_role} ({l.actor_id})
                </span>
              </div>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}

'use strict';

/**
 * <<interface>> IDocumentProcessor
 * Formal interface contract for AI Module 1 (AI-Assisted Document Review).
 * Enforces Dependency Inversion Principle (SOLID).
 */
class IDocumentProcessor {
  /**
   * Extracts text, confidence score, executive summary, and key regulatory fields from a Document.
   * @param {object} _document - Document domain object
   * @returns {{ extracted_text: string, ai_summary: string, highlights: Array, ocr_confidence: number }}
   */
  extractText(_document) {
    throw new Error('NotImplementedError: IDocumentProcessor.extractText(document) must be implemented by concrete strategy.');
  }
}

module.exports = IDocumentProcessor;

'use strict';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per SRS 3.2 REQ-3

/**
 * Document Domain Entity (Week 3 & Week 6 UML Class Diagram)
 * Uses IDocumentProcessor Strategy interface to extract and summarize text.
 */
class Document {
  constructor({
    document_id,
    application_id,
    document_type,
    file_url,
    file_name = '',
    file_size_bytes = 0,
    extracted_text = '',
    uploaded_date = new Date().toISOString()
  }) {
    this.document_id = document_id;
    this.application_id = application_id;
    this.document_type = document_type;
    this.file_url = file_url;
    this.file_name = file_name || (file_url ? file_url.split('/').pop() : 'document.pdf');
    this.file_size_bytes = Number(file_size_bytes || 0);
    this.extracted_text = extracted_text;
    this.uploaded_date = uploaded_date;
    this.ai_summary = '';
    this.highlights = [];
    this.ocr_confidence = 0;
  }

  /**
   * Validates file format (PDF, JPG, PNG) and size (<= 10 MB) per SRS 3.2 REQ-3
   */
  static validateFile({ file_name, file_url, file_size_bytes = 0 }) {
    const candidateName = String(file_name || file_url || '').toLowerCase().trim();
    if (!candidateName) {
      throw new Error('Validation Error (SRS 3.2 REQ-3): Document filename or URL is required');
    }
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => candidateName.endsWith(ext));
    if (!hasValidExt) {
      throw new Error('Validation Error (SRS 3.2 REQ-3): Only PDF, JPG, and PNG files are supported');
    }
    if (Number(file_size_bytes) > MAX_FILE_SIZE_BYTES) {
      throw new Error('Validation Error (SRS 3.2 REQ-3): File exceeds maximum allowed size of 10 MB');
    }
    return true;
  }

  /**
   * Uploads document, validates file constraints, and delegates OCR extraction to IDocumentProcessor (Week 6 UML: +uploadDocument())
   * @param {string} fileUrl
   * @param {string} rawText
   * @param {IDocumentProcessor} docProcessor
   * @param {object} metadata
   */
  uploadDocument(fileUrl, rawText, docProcessor, metadata = {}) {
    const fileName = metadata.file_name || (fileUrl ? fileUrl.split('/').pop() : '') || this.file_name || 'document.pdf';
    const fileSize = metadata.file_size_bytes !== undefined ? metadata.file_size_bytes : this.file_size_bytes;

    Document.validateFile({ file_name: fileName, file_url: fileUrl, file_size_bytes: fileSize });

    this.file_url = fileUrl;
    this.file_name = fileName;
    this.file_size_bytes = Number(fileSize || 0);
    this.uploaded_date = new Date().toISOString();
    this.raw_text = rawText;

    if (docProcessor && typeof docProcessor.extractText === 'function') {
      const result = docProcessor.extractText(this);
      this.extracted_text = result.extracted_text;
      this.ai_summary = result.ai_summary;
      this.highlights = result.highlights;
      this.ocr_confidence = result.ocr_confidence;
    } else {
      this.extracted_text = rawText;
    }
    return this;
  }

  /**
   * Returns OCR extracted text (Week 6 UML: +getExtractedText())
   * @returns {string}
   */
  getExtractedText() {
    return this.extracted_text;
  }
}

module.exports = Document;

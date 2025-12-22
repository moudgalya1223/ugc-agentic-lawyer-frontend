/**
 * Constants for chat functionality
 * Centralized keywords and types for draft detection
 */

/**
 * Keywords that indicate a draft document request
 */
export const DRAFT_KEYWORDS = [
  "draft",
  "generate",
  "create",
  "prepare",
  "write",
  "make",
  "form",
  "document",
  "notice",
  "agreement",
  "contract",
  "petition",
  "application",
  "affidavit",
  "legal notice",
  "cease and desist",
  "demand letter",
  "complaint",
  "reply",
  "response",
] as const;

/**
 * Draft types and their associated keywords
 */
export const DRAFT_TYPES: Record<string, readonly string[]> = {
  notice: [
    "notice",
    "legal notice",
    "demand notice",
    "show cause notice",
  ],
  agreement: [
    "agreement",
    "contract",
    "memorandum of understanding",
    "mou",
  ],
  contract: [
    "contract",
    "agreement",
  ],
  petition: [
    "petition",
    "writ petition",
    "civil petition",
  ],
  application: [
    "application",
    "request",
  ],
  affidavit: [
    "affidavit",
    "sworn statement",
  ],
  complaint: [
    "complaint",
    "fir",
    "first information report",
  ],
  reply: [
    "reply",
    "response",
    "rebuttal",
  ],
  letter: [
    "letter",
    "demand letter",
    "cease and desist",
  ],
} as const;

/**
 * Default document type when no specific type is detected
 */
export const DEFAULT_DRAFT_TYPE = "document";

/**
 * Reddit URL pattern for detection
 */
export const REDDIT_URL_PATTERN =
  /https?:\/\/(www\.)?reddit\.com\/r\/[^/]+\/comments\/[^\s]+/gi;

/**
 * Maximum file size for PDF uploads (2MB)
 */
export const MAX_PDF_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Accepted file types for upload
 */
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
] as const;

/**
 * Utility functions for chat functionality
 */

import {
  DEFAULT_DRAFT_TYPE,
  DRAFT_KEYWORDS,
  DRAFT_TYPES,
  REDDIT_URL_PATTERN,
} from "./chat.constants";

/**
 * Check if a message text contains draft request keywords
 */
export function isDraftRequest(text: string): boolean {
  const content = text.toLowerCase();
  return DRAFT_KEYWORDS.some((keyword) => content.includes(keyword));
}

/**
 * Get document type from message text
 */
export function getDraftType(text: string): string {
  const content = text.toLowerCase();

  for (const [type, keywords] of Object.entries(DRAFT_TYPES)) {
    if (keywords.some((keyword) => content.includes(keyword))) {
      return type;
    }
  }

  return DEFAULT_DRAFT_TYPE;
}

/**
 * Extract Reddit URL from text if present
 */
export function extractRedditUrl(text: string): string | null {
  const match = text.match(REDDIT_URL_PATTERN);
  return match ? match[0] : null;
}

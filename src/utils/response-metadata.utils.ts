/**
 * Utility functions to extract metadata from chat responses
 */

export type ConfidenceLevel = "low" | "medium" | "high";

export type LegalCategory =
  | "criminal"
  | "civil"
  | "contract"
  | "property"
  | "family"
  | "corporate"
  | "constitutional"
  | "tax"
  | "labor"
  | "consumer"
  | "general";

export type TimeSensitivity =
  | "immediate"
  | "urgent"
  | "normal"
  | "no_action_needed";

export type Jurisdiction = "national" | "state_specific" | "union_territory";

export interface ResponseMetadata {
  confidence: ConfidenceLevel;
  legalCategory: LegalCategory;
  jurisdiction: Jurisdiction;
  timeSensitivity: TimeSensitivity;
}

/**
 * Extract confidence level based on response content and structure
 */
function extractConfidenceLevel(
  responseText: string,
  userMessage: string
): ConfidenceLevel {
  const text = responseText.toLowerCase();
  const userText = userMessage.toLowerCase();

  // High confidence indicators in response
  const highConfidenceIndicators = [
    /section \d+/i, // Specific sections mentioned
    /article \d+/i, // Constitutional articles
    /bns|bharatiya nyaya sanhita/i, // Specific acts
    /ipc|indian penal code/i,
    /case law|precedent|judgment/i,
    /act \d{4}/i, // Acts with years
  ];

  // Low confidence indicators in response
  const lowConfidenceIndicators = [
    /i'm not sure/i,
    /unclear|uncertain/i,
    /may vary|could be/i,
    /i cannot|unable to/i,
    /consult.*attorney|seek.*legal/i,
    /general.*information/i,
    /please note.*may vary/i,
    /depending.*circumstances/i,
  ];

  // Vague question indicators (from user message)
  const vagueQuestionIndicators = [
    /what.*law/i,
    /tell me about/i,
    /explain/i,
    /general/i,
    /overview/i,
  ];

  // Specific question indicators (from user message)
  const specificQuestionIndicators = [
    /section \d+/i,
    /article \d+/i,
    /specific/i,
    /exact/i,
    /precise/i,
    /what.*punishment/i,
    /what.*penalty/i,
  ];

  // Check for high confidence indicators in response
  const hasHighConfidence = highConfidenceIndicators.some((pattern) =>
    pattern.test(text)
  );
  const hasLowConfidence = lowConfidenceIndicators.some((pattern) =>
    pattern.test(text)
  );

  // Check question specificity
  const isVagueQuestion = vagueQuestionIndicators.some((pattern) =>
    pattern.test(userText)
  );
  const isSpecificQuestion = specificQuestionIndicators.some((pattern) =>
    pattern.test(userText)
  );

  // If response mentions specific sections/acts and is detailed, and question was specific
  if (
    hasHighConfidence &&
    text.length > 200 &&
    !hasLowConfidence &&
    isSpecificQuestion
  ) {
    return "high";
  }

  // If response mentions specific sections/acts and is detailed, even with vague question
  if (hasHighConfidence && text.length > 200 && !hasLowConfidence) {
    return "high";
  }

  // If response is vague, uncertain, or question was very vague, low confidence
  if (
    hasLowConfidence ||
    text.length < 100 ||
    (isVagueQuestion && !isSpecificQuestion && text.length < 300)
  ) {
    return "low";
  }

  // Default to medium
  return "medium";
}

/**
 * Extract legal category from response and user message
 */
function extractLegalCategory(
  responseText: string,
  userMessage: string
): LegalCategory {
  const text = (responseText + " " + userMessage).toLowerCase();

  // Criminal law keywords
  const criminalKeywords = [
    "criminal",
    "offense",
    "crime",
    "bns",
    "penal code",
    "punishment",
    "imprisonment",
    "fir",
    "complaint",
    "bail",
    "arrest",
    "murder",
    "theft",
    "fraud",
    "section 302",
    "section 304",
  ];

  // Civil law keywords
  const civilKeywords = [
    "civil",
    "suit",
    "damages",
    "injunction",
    "tort",
    "negligence",
    "defamation",
  ];

  // Contract law keywords
  const contractKeywords = [
    "contract",
    "agreement",
    "breach",
    "consideration",
    "party",
    "terms",
    "clause",
    "mou",
    "memorandum",
  ];

  // Property law keywords
  const propertyKeywords = [
    "property",
    "land",
    "real estate",
    "ownership",
    "possession",
    "registration",
    "title",
    "deed",
  ];

  // Family law keywords
  const familyKeywords = [
    "divorce",
    "marriage",
    "custody",
    "maintenance",
    "alimony",
    "family",
    "domestic",
    "matrimonial",
  ];

  // Corporate law keywords
  const corporateKeywords = [
    "company",
    "corporate",
    "incorporation",
    "shareholder",
    "director",
    "board",
    "merger",
    "acquisition",
  ];

  // Constitutional law keywords
  const constitutionalKeywords = [
    "constitutional",
    "article",
    "fundamental right",
    "constitution",
    "supreme court",
    "judicial review",
  ];

  // Tax law keywords
  const taxKeywords = [
    "tax",
    "income tax",
    "gst",
    "vat",
    "taxation",
    "assessment",
    "it department",
  ];

  // Labor law keywords
  const laborKeywords = [
    "labor",
    "employment",
    "employee",
    "employer",
    "wages",
    "industrial dispute",
    "workmen",
  ];

  // Consumer law keywords
  const consumerKeywords = [
    "consumer",
    "consumer protection",
    "cpa",
    "defective",
    "deficiency",
    "redressal",
  ];

  // Check categories in order of specificity
  if (criminalKeywords.some((keyword) => text.includes(keyword))) {
    return "criminal";
  }
  if (contractKeywords.some((keyword) => text.includes(keyword))) {
    return "contract";
  }
  if (propertyKeywords.some((keyword) => text.includes(keyword))) {
    return "property";
  }
  if (familyKeywords.some((keyword) => text.includes(keyword))) {
    return "family";
  }
  if (corporateKeywords.some((keyword) => text.includes(keyword))) {
    return "corporate";
  }
  if (constitutionalKeywords.some((keyword) => text.includes(keyword))) {
    return "constitutional";
  }
  if (taxKeywords.some((keyword) => text.includes(keyword))) {
    return "tax";
  }
  if (laborKeywords.some((keyword) => text.includes(keyword))) {
    return "labor";
  }
  if (consumerKeywords.some((keyword) => text.includes(keyword))) {
    return "consumer";
  }
  if (civilKeywords.some((keyword) => text.includes(keyword))) {
    return "civil";
  }

  return "general";
}

/**
 * Extract jurisdiction from response
 */
function extractJurisdiction(
  responseText: string,
  userMessage: string
): Jurisdiction {
  const text = (responseText + " " + userMessage).toLowerCase();

  // State-specific indicators
  const stateKeywords = [
    "state of",
    "state-specific",
    "varies by state",
    "state law",
    "state act",
    "particular state",
    "state government",
  ];

  // Union territory indicators
  const utKeywords = [
    "union territory",
    "delhi",
    "chandigarh",
    "puducherry",
    "daman and diu",
    "dadra and nagar haveli",
    "lakshadweep",
    "andaman",
  ];

  // National indicators (default if no state/UT specific)
  const nationalKeywords = [
    "national",
    "central",
    "union",
    "india",
    "indian",
    "constitution",
    "parliament",
  ];

  // Check if state-specific
  if (stateKeywords.some((keyword) => text.includes(keyword))) {
    return "state_specific";
  }

  // Check if union territory specific
  if (utKeywords.some((keyword) => text.includes(keyword))) {
    return "union_territory";
  }

  // Check if explicitly mentions national/central/union indicators
  if (nationalKeywords.some((keyword) => text.includes(keyword))) {
    return "national";
  }

  // Default to national (most Indian laws are national)
  return "national";
}

/**
 * Extract time sensitivity from response and user message
 */
function extractTimeSensitivity(
  responseText: string,
  userMessage: string
): TimeSensitivity {
  const text = (responseText + " " + userMessage).toLowerCase();

  // Immediate action required
  const immediateKeywords = [
    "immediate",
    "right now",
    "as soon as possible",
    "urgently",
    "emergency",
    "without delay",
    "at once",
    "immediately file",
    "file immediately",
  ];

  // Urgent keywords
  const urgentKeywords = [
    "urgent",
    "asap",
    "soon",
    "quickly",
    "prompt",
    "time-sensitive",
    "deadline",
    "within.*days",
    "statute of limitations",
    "limitation period",
  ];

  // No action needed
  const noActionKeywords = [
    "informational",
    "general information",
    "for your knowledge",
    "reference",
    "background",
  ];

  if (immediateKeywords.some((keyword) => text.includes(keyword))) {
    return "immediate";
  }

  if (
    urgentKeywords.some((keyword) => {
      const regex = new RegExp(keyword.replace("*", ".*"), "i");
      return regex.test(text);
    })
  ) {
    return "urgent";
  }

  if (noActionKeywords.some((keyword) => text.includes(keyword))) {
    return "no_action_needed";
  }

  return "normal";
}

/**
 * Extract metadata from response text and user message
 */
export function extractResponseMetadata(
  responseText: string,
  userMessage: string
): ResponseMetadata {
  return {
    confidence: extractConfidenceLevel(responseText, userMessage),
    legalCategory: extractLegalCategory(responseText, userMessage),
    jurisdiction: extractJurisdiction(responseText, userMessage),
    timeSensitivity: extractTimeSensitivity(responseText, userMessage),
  };
}

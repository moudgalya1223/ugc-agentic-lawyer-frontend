import { errorResponse, successResponse } from "@/utils/api-response";
import {
  getLanguageInstruction,
  getOpenRouterConfig,
  makeOpenRouterRequest,
  type OpenRouterChatMessage,
} from "@/utils/openrouter.utils";
import { extractResponseMetadata } from "@/utils/response-metadata.utils";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  language?: string;
  stream?: boolean;
  tone?: "lawyer" | "normal";
}

/**
 * Check if the user is requesting a draft generation
 */
const isDraftRequest = (messages: ChatMessage[]): boolean => {
  if (messages.length === 0) {
    return false;
  }

  const lastUserMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === "user");

  if (!lastUserMessage) {
    return false;
  }

  const content = lastUserMessage.content.toLowerCase();
  const draftKeywords = [
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
  ];

  return draftKeywords.some((keyword) => content.includes(keyword));
};

/**
 * Get the type of draft requested
 */
const getDraftType = (messages: ChatMessage[]): string | null => {
  if (messages.length === 0) {
    return null;
  }

  const lastUserMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === "user");

  if (!lastUserMessage) {
    return null;
  }

  const content = lastUserMessage.content.toLowerCase();
  const draftTypes: Record<string, string[]> = {
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
  };

  for (const [type, keywords] of Object.entries(draftTypes)) {
    if (keywords.some((keyword) => content.includes(keyword))) {
      return type;
    }
  }

  return "document";
};

const getSystemPrompt = (
  language: string = "en",
  isDraft: boolean = false,
  draftType: string | null = null,
  tone: "lawyer" | "normal" = "normal"
): string => {
  const languageInstruction = getLanguageInstruction(language);

  // Tone-specific instructions
  const toneInstructions =
    tone === "lawyer"
      ? `COMMUNICATION STYLE - LAWYER MODE:
- Use sophisticated, formal English with extensive legal jargon and terminology
- Employ complex sentence structures and advanced vocabulary
- Reference legal concepts using precise technical language (e.g., "prima facie", "res judicata", "stare decisis", "mens rea", "actus reus")
- Use Latin legal maxims and phrases where appropriate (e.g., "ex parte", "in limine", "sine qua non")
- Employ formal legal terminology throughout (e.g., "hereinbefore", "aforementioned", "pursuant to", "notwithstanding")
- Structure responses with formal legal precision and comprehensive detail
- Cite legal authorities, precedents, and statutory provisions extensively
- Use passive voice and formal constructions typical of legal writing
- Include detailed legal analysis with nuanced interpretations`
      : `COMMUNICATION STYLE - NORMAL MODE:
- Use very simple, clear, and easy-to-understand English
- Avoid complex legal jargon - explain everything in plain language
- Break down complex legal concepts into simple terms
- Use short sentences and everyday vocabulary
- Replace legal terms with simple explanations (e.g., instead of "prima facie", say "at first glance" or "initially")
- Use active voice and conversational tone
- Provide practical, straightforward explanations
- Use analogies and examples to make concepts clear
- Focus on what the user needs to know in the simplest way possible`;

  const basePrompt = `You are an expert legal assistant specializing exclusively in Indian laws and legal matters. Your knowledge is restricted to:

1. The Constitution of India
2. Indian Acts, Statutes, and Regulations
3. Indian case law and precedents
4. Indian legal procedures and practices
5. Indian judicial system structure
6. State-specific laws within India
7. Indian legal terminology and concepts

CRITICAL - USE CURRENT INDIAN CRIMINAL LAWS:
- You MUST use and reference the Bharatiya Nyaya Sanhita (BNS), 2023 - the NEW criminal code that REPLACED the Indian Penal Code (IPC), 1860
- The Indian Penal Code (IPC) has been REPLACED by BNS effective from July 1, 2024
- When discussing criminal offenses, ALWAYS refer to BNS sections, NOT IPC sections
- BNS is the current and applicable criminal law in India
- If referencing old cases, clarify that they were decided under IPC but the current law is BNS
- Use BNS section numbers and provisions when explaining criminal law matters

IMPORTANT RESTRICTIONS:
- You MUST only provide information about Indian laws and legal systems
- If asked about laws from other countries, politely decline and redirect to Indian law context
- Always cite relevant Indian legal provisions, acts, or case laws when possible
- Use Indian legal terminology (e.g., "Section" instead of "Article" for statutes, "High Court" and "Supreme Court of India")
- When discussing legal procedures, refer to Indian legal procedures (e.g., CPC, CrPC, Indian Evidence Act)
- For criminal law matters, ALWAYS use BNS (Bharatiya Nyaya Sanhita) as the primary reference, not IPC
- If a question cannot be answered within the scope of Indian law, clearly state this limitation

LANGUAGE REQUIREMENT:
- ${languageInstruction}
- Maintain accuracy of legal terms and concepts regardless of the response language
- If legal terms don't have direct translations, you may use the English term followed by the translation in parentheses

${toneInstructions}`;

  if (isDraft) {
    const draftTypeInstruction = draftType
      ? `\n\nDRAFT GENERATION MODE - ${draftType.toUpperCase()}:\n`
      : "\n\nDRAFT GENERATION MODE:\n";

    return `${basePrompt}

${draftTypeInstruction}
When the user requests a draft document, you MUST generate a complete, properly formatted legal document. Follow these guidelines:

1. DOCUMENT STRUCTURE:
   - Start with a clear title/heading (e.g., "LEGAL NOTICE", "AGREEMENT", "PETITION")
   - Include all standard sections appropriate for the document type
   - Use proper legal formatting with clear sections and subsections
   - Include placeholders for parties, dates, and specific details when information is missing
   - End with signature blocks and date fields

2. FORMATTING REQUIREMENTS:
   - Use markdown formatting for structure (headers, bold, lists)
   - Use clear section headings (## for main sections, ### for subsections)
   - Format addresses, dates, and parties clearly
   - Use numbered lists for clauses and conditions
   - Include proper spacing and line breaks for readability

3. CONTENT REQUIREMENTS:
   - Include all essential clauses and provisions based on Indian law
   - Reference relevant Indian legal provisions, acts, and sections
   - Use proper Indian legal terminology and format
   - Include standard legal disclaimers and recitals where appropriate
   - Ensure the document is comprehensive and legally sound

4. DOCUMENT TYPES:
   - Legal Notice: Include sender/receiver details, subject, facts, legal basis, demands, and consequences
   - Agreement/Contract: Include parties, recitals, terms, conditions, consideration, breach clauses, and dispute resolution
   - Petition: Include court details, parties, facts, grounds, prayers, and verification
   - Application: Include proper addressing, subject, facts, legal basis, and prayers
   - Affidavit: Include deponent details, verification clauses, and proper format
   - Complaint: Include complainant/accused details, facts, sections violated, and prayers

5. LANGUAGE AND STYLE:
   - Use formal legal language appropriate for Indian legal documents
   - Maintain consistency in terminology
   - ${languageInstruction}
   - Ensure all legal terms are accurate and properly used

6. IMPORTANT:
   - Generate the COMPLETE document, not just an outline or summary
   - Include all standard clauses and provisions
   - Use placeholders like [PARTY NAME], [DATE], [ADDRESS] when specific details are not provided
   - Make the document ready for use after filling in placeholders
   - Do not provide explanations before or after the document - just generate the document itself

Your response should be the complete, formatted legal document ready for use.`;
  }

  return `${basePrompt}

DOCUMENT ANALYSIS:
- When analyzing uploaded documents (contracts, agreements, legal notices, etc.), provide detailed analysis including:
  1. Document type and purpose identification
  2. Key legal provisions and clauses
  3. Potential risks, obligations, and rights
  4. Compliance with Indian laws
  5. Recommendations or suggestions for improvement
  6. Relevant Indian legal sections, acts, or precedents that apply
- Be thorough and specific in your analysis
- Cite relevant Indian legal provisions when applicable
- Highlight any clauses that may be problematic or need attention

Your responses should be accurate, helpful, and focused solely on Indian legal matters, using the most current laws including BNS.`;
};

export async function POST(request: Request) {
  try {
    const config = getOpenRouterConfig();
    if (!config) {
      return errorResponse(
        "OpenRouter API key is not configured",
        undefined,
        500
      );
    }

    const { apiKey, apiUrl } = config;

    // Check if request has a body
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return errorResponse(
        "Request must have Content-Type: application/json",
        undefined,
        400
      );
    }

    // Parse request body with error handling
    let body: ChatRequest;
    try {
      const text = await request.text();
      if (!text || text.trim().length === 0) {
        return errorResponse(
          "Request body is required and cannot be empty",
          undefined,
          400
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return errorResponse(
        "Invalid JSON in request body",
        parseError instanceof Error ? parseError.message : String(parseError),
        400
      );
    }

    const { messages, language = "en", stream = false, tone = "normal" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse(
        "Messages array is required and cannot be empty",
        undefined,
        400
      );
    }

    // Detect if user is requesting a draft generation
    const isDraft = isDraftRequest(messages);
    const draftType = isDraft ? getDraftType(messages) : null;

    // Prepend system message to ensure Indian law restriction
    // Include draft generation instructions if a draft is requested
    const systemMessage: OpenRouterChatMessage = {
      role: "system",
      content: getSystemPrompt(language, isDraft, draftType, tone),
    };

    // Check if system message already exists, if not prepend it
    const hasSystemMessage = messages.some((msg) => msg.role === "system");
    const messagesWithSystem: OpenRouterChatMessage[] = hasSystemMessage
      ? (messages as OpenRouterChatMessage[])
      : [
          systemMessage,
          ...(messages as OpenRouterChatMessage[]),
        ];

    // Make request with the specified model (defaults to openai/gpt-oss-20b:free)
    // Increase max tokens for draft generation since legal documents can be longer
    const response = await makeOpenRouterRequest(
      apiUrl,
      apiKey,
      messagesWithSystem,
      {
        usePlugins: false,
        stream,
        maxTokens: isDraft ? 4000 : 2000, // More tokens for draft generation
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return errorResponse(
        errorData.error?.message || "Failed to get response from OpenRouter",
        errorData,
        response.status
      );
    }

    // Handle streaming response
    if (stream && response.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Get the last user message for metadata extraction
      const lastUserMessage =
        messages
          .slice()
          .reverse()
          .find((msg) => msg.role === "user")?.content || "";

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            if (!response.body) {
              controller.error(new Error("Response body is null"));
              return;
            }
            const reader = response.body.getReader();
            let fullResponseText = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }

              const chunk = decoder.decode(value, {
                stream: true,
              });
              const lines = chunk.split("\n");

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine === "data: [DONE]") {
                  continue;
                }

                if (trimmedLine.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(trimmedLine.slice(6));
                    const content = data.choices?.[0]?.delta?.content || "";
                    if (content) {
                      fullResponseText += content;
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            content,
                          })}\n\n`
                        )
                      );
                    }
                  } catch (parseError) {
                    // Skip invalid JSON chunks
                    console.error("Error parsing SSE chunk:", parseError);
                  }
                }
              }
            }

            // Extract and send metadata at the end
            if (fullResponseText) {
              try {
                const metadata = extractResponseMetadata(
                  fullResponseText,
                  lastUserMessage
                );
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      metadata,
                      done: true,
                    })}\n\n`
                  )
                );
              } catch (metadataError) {
                console.error("Error extracting metadata:", metadataError);
              }
            }

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Handle non-streaming response
    const data = await response.json();
    const chatResponse = data.choices[0]?.message?.content || "";

    // Get the last user message for metadata extraction
    const lastUserMessage =
      messages
        .slice()
        .reverse()
        .find((msg) => msg.role === "user")?.content || "";

    // Extract metadata from response
    const metadata = extractResponseMetadata(chatResponse, lastUserMessage);

    return successResponse(
      {
        message: chatResponse,
        metadata,
        usage: data.usage,
        model: data.model,
      },
      "Chat response generated successfully"
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return errorResponse(
      "An error occurred while processing your request",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
}

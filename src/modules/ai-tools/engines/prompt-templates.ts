export interface PromptTemplate {
  systemPrompt: string;
  buildUserPrompt: (content: string, options: Record<string, string>) => string;
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  "ai-pdf-summarizer": {
    systemPrompt: "You summarize documents clearly and concisely, preserving key facts and figures.",
    buildUserPrompt: (content) => `Summarize the following document:\n\n${content}`,
  },
  "ai-document-translator": {
    systemPrompt: "You translate documents accurately while preserving structure and tone.",
    buildUserPrompt: (content, options) =>
      `Translate the following document into ${options.targetLanguage ?? "English"}:\n\n${content}`,
  },
  "ai-grammar-rewrite": {
    systemPrompt: "You correct grammar and improve clarity without changing the original meaning.",
    buildUserPrompt: (content) => `Rewrite the following text, fixing grammar and improving clarity:\n\n${content}`,
  },
  "ai-resume-analyzer": {
    systemPrompt: "You are a career advisor who gives direct, actionable resume feedback.",
    buildUserPrompt: (content, options) =>
      `Analyze this resume${options.targetRole ? ` for the role of ${options.targetRole}` : ""} and list concrete improvements:\n\n${content}`,
  },
  "ai-contract-analyzer": {
    systemPrompt: "You review contracts and flag risky or unusual clauses in plain language.",
    buildUserPrompt: (content) =>
      `Review this contract, flag risky clauses, and summarize obligations for each party:\n\n${content}`,
  },
  "ai-invoice-extractor": {
    systemPrompt:
      "You extract structured invoice data and respond with valid JSON only, no explanation, no markdown fences.",
    buildUserPrompt: (content) =>
      `Extract invoice number, date, vendor, line items (description, quantity, unit price, total), and grand total as JSON from:\n\n${content}`,
  },
  "ai-chat-with-pdf": {
    systemPrompt: "You answer questions about a document using only the information it contains.",
    buildUserPrompt: (content, options) =>
      `Document:\n${content}\n\nQuestion: ${options.question ?? "What is this document about?"}`,
  },
  "ai-pdf-qa": {
    systemPrompt: "You answer questions about a document using only the information it contains.",
    buildUserPrompt: (content, options) =>
      `Document:\n${content}\n\nQuestion: ${options.question ?? "Summarize the key points."}`,
  },
  "ai-document-generator": {
    systemPrompt: "You draft clean, well-structured documents from a short brief.",
    buildUserPrompt: (content) => content,
  },
  "ai-proposal-writer": {
    systemPrompt: "You write persuasive, professional client proposals from a short brief.",
    buildUserPrompt: (content) => `Write a client proposal based on this brief:\n\n${content}`,
  },
};

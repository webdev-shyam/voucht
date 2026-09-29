import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

export interface ContractGenerationParams {
  projectTitle: string;
  clientName: string;
  freelancerName: string;
  scopeOfWork: string;
  totalBudget: number;
  currency: string;
  milestonesSummary: string;
}

// Which generator produced a draft, so the UI can describe it accurately
// instead of labelling a deterministic fallback "AI generated".
export type ContractProvider = "gemini" | "openrouter" | "template";

export async function generateSmartContract(params: ContractGenerationParams): Promise<{
  provider: ContractProvider;
  title: string;
  scopeOfWork: string;
  paymentTerms: string;
  ipClause: string;
  terminationTerms: string;
  fullMarkdown: string;
}> {
  const prompt = `You are a specialized legal tech contract drafting AI for freelance and agency service agreements.
Draft a professional, bullet-proof freelance service agreement based on the following details:
- Project Title: ${params.projectTitle}
- Freelancer/Agency: ${params.freelancerName}
- Client: ${params.clientName}
- Budget: ${params.currency} ${params.totalBudget}
- Scope of Work: ${params.scopeOfWork}
- Milestones: ${params.milestonesSummary}

Please generate clear and structured contract sections:
1. Scope & Deliverables
2. Payment Terms & Milestone Acceptance
3. Intellectual Property Rights (Transfer upon final payment)
4. Termination & Dispute Resolution (Binding arbitration & 14-day notice)

Return the contract in clean markdown format.`;

  // Try Gemini first if available
  const client = getGeminiClient();
  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      return {
        provider: "gemini",
        title: `Master Services Agreement - ${params.projectTitle}`,
        scopeOfWork: params.scopeOfWork,
        paymentTerms: `Total of ${params.currency} ${params.totalBudget} payable upon completion and verified sign-off of deliverables. Net 7 payment terms.`,
        ipClause: `All intellectual property rights, trademarks, and code transfer exclusively to ${params.clientName} upon receipt of 100% full payment.`,
        terminationTerms: `Either party may terminate this agreement with 14 calendar days written notice. Payment is due for all milestones completed and delivered prior to termination.`,
        fullMarkdown: text,
      };
    } catch (e) {
      console.warn("Gemini generation fallback:", e);
    }
  }

  // OpenRouter fallback if configured
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey && openRouterKey !== "your_openrouter_key") {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      return {
        provider: "openrouter",
        title: `Master Services Agreement - ${params.projectTitle}`,
        scopeOfWork: params.scopeOfWork,
        paymentTerms: `Total of ${params.currency} ${params.totalBudget} payable upon milestone acceptance.`,
        ipClause: `Full IP ownership assigned to ${params.clientName} upon full settlement of invoice.`,
        terminationTerms: `14-day mutual written cancellation notice.`,
        fullMarkdown: content,
      };
    } catch (e) {
      console.warn("OpenRouter fallback error:", e);
    }
  }

  // Standalone robust template fallback
  return {
    provider: "template",
    title: `Master Services Agreement - ${params.projectTitle}`,
    scopeOfWork: params.scopeOfWork || "Design, development, and delivery of verified milestone deliverables.",
    paymentTerms: `Total compensation of ${params.currency} ${params.totalBudget}. Each milestone requires client digital confirmation on Voucht. Net 7 days from verification.`,
    ipClause: `Upon receipt of full payment, all custom code, assets, and design deliverables are assigned to ${params.clientName}. Pre-existing developer toolkits remain property of ${params.freelancerName}.`,
    terminationTerms: `Either party may terminate upon 14 days written notice. Completed milestones will be paid in full.`,
    fullMarkdown: `# Master Services Agreement: ${params.projectTitle}\n\n> Draft generated from a template. Not reviewed by a lawyer; have counsel of your own review it before signing.\n\n**Provider:** ${params.freelancerName}\n**Client:** ${params.clientName}\n**Total Budget:** ${params.currency} ${params.totalBudget}\n\n### 1. Scope of Work\n${params.scopeOfWork}\n\n### 2. Milestone Structure\n${params.milestonesSummary}\n\n### 3. Payment Terms\nEach milestone is invoiced on delivery and treated as accepted when the Client confirms it on Voucht. Payment is due within 7 days of acceptance.\n\n### 4. Intellectual Property\nCustom deliverables become the Client's property once the corresponding invoice is paid in full. Pre-existing tools and libraries stay with the Provider.\n\n### 5. Dispute Resolution\nThe parties attempt good-faith resolution first. Voucht delivery records may be shared as evidence of what was confirmed, but Voucht is not an arbitrator, a party to this agreement, or a provider of legal advice.`,
  };
}

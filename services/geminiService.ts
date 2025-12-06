import { GoogleGenAI } from "@google/genai";
import { ComplaintData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Drafts the "Statement of Facts" and "Prayer" sections based on user input.
 * We do not ask the AI to write the headers/footer to keep control over formatting in the PDF generation.
 */
export const draftLegalContent = async (data: ComplaintData): Promise<{ facts: string; prayer: string }> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are an expert Indian Legal Drafter specializing in the Consumer Protection Act, 2019.
    
    Task: Convert the user's raw input into two specific legal sections: "Statement of Facts" and "Prayer" (Relief Sought).
    
    Input Data:
    - Product/Service: ${data.transaction.productDescription || "Not specified"}
    - Date of Transaction: ${data.transaction.date || "Not specified"}
    - Amount Paid: ${data.transaction.amount || "Not specified"}
    - Invoice No: ${data.transaction.invoiceNumber || "Not specified"}
    - User's Grievance (Raw): "${data.grievanceRaw}"
    - User's Desired Outcome: "${data.reliefRaw}"
    
    Instructions:
    1. **Statement of Facts**: Write a numbered list (1, 2, 3...) narrating the sequence of events chronologically. 
       - Use formal legal language (e.g., "That the Complainant purchased...", "That the Opposite Party failed to...").
       - **ANTI-HALLUCINATION RULE**: You must NOT invent dates, names, or specific events that are not in the input. 
       - If a detail is missing (e.g., date of purchase, invoice number, specific defect details), use a placeholder in brackets like [Date], [Invoice No], or [Details]. 
       - Do NOT assume the user called customer care 5 times or a technician visited unless the user explicitly stated so in the "Grievance" section.
       - Cite the deficiency in service or unfair trade practice based ONLY on the provided grievance.
    
    2. **Prayer**: Write a numbered list of reliefs sought.
       - Include the specific refund/replacement asked for.
       - If the user did not specify a compensation amount, use a placeholder: "Compensation of Rs. [Insert Amount] for mental harassment".
       - Include litigation costs (e.g., INR 5,000) as standard practice.
    
    Output Format:
    Return a JSON object with two keys: "facts" and "prayer". Do not use Markdown code blocks. Just the raw JSON string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const parsed = JSON.parse(resultText);

    // Normalize 'facts' to string
    let facts = parsed.facts;
    if (Array.isArray(facts)) {
      facts = facts.join('\n');
    } else if (typeof facts !== 'string') {
      facts = String(facts || "Could not generate facts.");
    }

    // Normalize 'prayer' to string
    let prayer = parsed.prayer;
    if (Array.isArray(prayer)) {
      prayer = prayer.join('\n');
    } else if (typeof prayer !== 'string') {
      prayer = String(prayer || "Could not generate prayer.");
    }

    return {
      facts: facts,
      prayer: prayer
    };

  } catch (error) {
    console.error("Error drafting complaint:", error);
    throw error;
  }
};
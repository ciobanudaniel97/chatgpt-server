const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "";
    const language = req.body.language || "en";

    const allowedTopics = [
      "tax", "vat", "hmrc", "self employed", "self-employed",
      "limited company", "ltd", "cis", "payroll", "accounting",
      "bookkeeping", "dividend", "dividends", "expenses",
      "mtd", "making tax digital", "corporation tax",
      "self assessment", "self-assessment", "utr", "company",
      "sole trader", "landlord", "rental income", "director",
      "companies house", "tax return", "refund", "penalty"
    ];

    const lowerMessage = userMessage.toLowerCase();
    const isRelevant = allowedTopics.some(word => lowerMessage.includes(word));

    // 🌍 Language-based responses
    const cta =
      language === "ro"
        ? "\n\nAi nevoie de ajutor pentru situația ta exactă? Contactează-ne folosind butonul de mai jos."
        : "\n\nNeed help with your exact situation? Contact us using the button below.";

    const disclaimer =
      language === "ro"
        ? "\n\n⚠️ Aceste informații sunt doar orientative și nu constituie consultanță profesională."
        : "\n\n⚠️ This is general guidance only and not professional advice.";

    // ❌ If question is not relevant
    if (!isRelevant) {
      return res.json({
        reply:
          language === "ro"
            ? "Pot ajuta doar cu întrebări legate de contabilitate și taxe, în legătură cu serviciile noastre." + cta
            : "I can only help with accounting and tax-related questions connected to our services." + cta
      });
    }

    const languageInstruction =
      language === "ro"
        ? "Reply only in Romanian."
        : "Reply only in English.";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
You are TAXACE, the website assistant for DCTaxAgent, a UK accounting firm.

${languageInstruction}

YOUR ROLE:
You only answer questions related to:
- UK tax
- Self-employment
- Limited companies
- VAT
- CIS
- Payroll
- HMRC compliance
- Accounting services

STRICT RULES:
- Keep every answer brief (2-3 short sentences max)
- Give general guidance only
- Do NOT give full advice or full solutions
- If the answer depends on personal circumstances, say so clearly
- Always keep answers business-focused and encourage contact
- Always end with a CTA directing to contact

User question: ${userMessage}
`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("OPENAI ERROR:", data);
      return res.status(response.status).json(data);
    }

    let reply = "Sorry, I could not generate a response.";

    if (data.output_text && data.output_text.trim()) {
      reply = data.output_text.trim();
    } else if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.content && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.text && typeof part.text === "string" && part.text.trim()) {
              reply = part.text.trim();
              break;
            }
          }
        }
        if (reply !== "Sorry, I could not generate a response.") break;
      }
    }

    // ✅ Add disclaimer only if giving real advice
    const needsDisclaimer =
      isRelevant &&
      !reply.toLowerCase().includes("i can only help") &&
      !reply.toLowerCase().includes("pot ajuta doar");

    if (needsDisclaimer && !reply.includes("⚠️")) {
      reply += disclaimer;
    }

    // ✅ Always ensure CTA is included
    if (!reply.includes("Contact")) {
      reply += cta;
    }

    res.json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
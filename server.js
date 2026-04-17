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

    // Only allow accounting / tax related topics
    const allowedTopics = [
      "tax", "vat", "hmrc", "self employed", "self-employed",
      "limited company", "ltd", "cis", "payroll", "accounting",
      "bookkeeping", "dividend", "dividends", "expenses",
      "mtd", "making tax digital", "corporation tax",
      "self assessment", "self-assessment", "utr", "company",
      "sole trader", "landlord", "rental income"
    ];

    const lowerMessage = userMessage.toLowerCase();
    const isRelevant = allowedTopics.some(word => lowerMessage.includes(word));

    if (!isRelevant) {
      return res.json({
        reply:
          "I can only help with accounting and tax-related questions connected to our services.\n\n⚠️ This is general guidance only and not professional advice.\n\nNeed help with your exact situation? Message us on WhatsApp: https://wa.me/447587532646?text=Hello,%20I%20need%20help%20with%20my%20tax%20situation. or email us at contact@dctaxagent.co.uk"
      });
    }

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
- Keep every answer brief, maximum 2-3 short sentences.
- Give general guidance only.
- Do not provide detailed calculations, full tax advice, or complete solutions.
- If the answer depends on personal circumstances, say so clearly.
- If the question is not related to accounting or tax, say you can only help with accounting and tax-related questions connected to our services.
- Always include a short disclaimer that the response is general guidance only and not professional advice.
- Every answer must end with this exact CTA:

Need help with your exact situation? Message us on WhatsApp: https://wa.me/447587532646?text=Hello,%20I%20need%20help%20with%20my%20tax%20situation. or email us at contact@dctaxagent.co.uk

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

    const disclaimer = "\n\n⚠️ This is general guidance only and not professional advice.";
    const cta = "\n\nNeed help with your exact situation? Message us on WhatsApp: https://wa.me/447587532646?text=Hello,%20I%20need%20help%20with%20my%20tax%20situation. or email us at contact@dctaxagent.co.uk";

    if (!reply.includes("general guidance only")) {
      reply += disclaimer;
    }

    if (!reply.includes("Need help with your exact situation?")) {
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
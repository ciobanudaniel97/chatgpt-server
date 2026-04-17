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
    const userMessage = req.body.message;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `You are a helpful UK accounting assistant for DCTaxAgent. Answer clearly and briefly.\n\nUser question: ${userMessage}`
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

    console.log("FINAL REPLY:", reply);

    res.json({ reply });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
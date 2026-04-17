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
        input: userMessage
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    let reply = "Sorry, I could not generate a response.";
    if (data.output_text) {
      reply = data.output_text;
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
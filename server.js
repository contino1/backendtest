import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Middleware (Fixes frontend connection issue)
app.use(cors({ 
    origin: "https://elevateseo.netlify.app",  // ✅ Allows Netlify frontend
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization"
}));

app.use(bodyParser.json());

// ✅ Sample Route (For debugging API connection)
app.get("/api/status", (req, res) => {
    res.json({ message: "Backend is running!" });
});

// ✅ REGISTER Endpoint
app.post("/api/register", async (req, res) => {
    const { fullName, email, password, plan } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

    res.json({ message: "User registered successfully!" });
});

// ✅ LOGIN Endpoint
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

    res.json({ message: "Login successful!" });
});

// ✅ AI Suggestions (Example with OpenAI)
app.post("/api/ai-suggestions", async (req, res) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Generate SEO recommendations for a small business website." }]
    });

    res.json({ suggestions: response.choices[0].message.content });
});

// ✅ Start the Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv").config(); // Load environment variables

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your OpenAI key is set in Railway
});
const openai = new OpenAIApi(configuration);

// Route to register a user (placeholder, assuming your existing logic handles this)
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password, plan } = req.body;

        // TODO: Add logic to save user to your database
        res.status(200).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Error registering user:", error.message);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// Route to log in a user (placeholder, assuming your existing logic handles this)
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // TODO: Add logic to authenticate user and generate a token
        const token = "mock-token"; // Replace with your token logic
        res.status(200).json({ message: "Login successful", token, plan: "Free" });
    } catch (error) {
        console.error("Error logging in user:", error.message);
        res.status(500).json({ error: "Failed to log in user" });
    }
});

// Route to generate SEO recommendations
app.post("/api/generate-seo", async (req, res) => {
    try {
        const { businessName, website, services, location } = req.body;

        // Construct the prompt for OpenAI
        const prompt = `
            Business Name: ${businessName || "N/A"}
            Website: ${website || "N/A"}
            Services: ${services || "N/A"}
            Location: ${location || "N/A"}

            Based on this information, generate:
            1. Five SEO target keywords.
            2. Three suggested local SEO locations.
            3. A brief SEO strategy to improve traffic and visibility.
        `;

        // Call OpenAI's API
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const content = response.data.choices[0].message.content;

        res.json({ recommendations: content });
    } catch (error) {
        console.error("Error generating SEO suggestions:", error.message);
        res.status(500).json({ error: "Failed to generate SEO suggestions" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai"); // Import OpenAI API
const db = require("./database"); // Your database connection file
const authMiddleware = require("./middleware/auth"); // Authentication middleware

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Add your OpenAI API Key in .env
}));

// API to generate AI-based SEO recommendations
app.post("/api/generate-seo", authMiddleware, async (req, res) => {
    try {
        const { businessName, website, services, location } = req.body;

        // Store the business profile in the database
        await db.run(
            "INSERT INTO users_profiles (user_id, businessName, website, services, location) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET businessName = excluded.businessName, website = excluded.website, services = excluded.services, location = excluded.location",
            [req.user.id, businessName, website, services, location]
        );

        // Create an AI prompt for SEO keyword & strategy suggestions
        const aiPrompt = `
            Business Name: ${businessName || "N/A"}
            Website: ${website || "N/A"}
            Services: ${services || "N/A"}
            Location: ${location || "N/A"}

            Based on the above business information, generate:
            - 5 target keywords for SEO
            - 3 suggested locations for local SEO
            - A brief SEO strategy to increase traffic and visibility.
        `;

        const aiResponse = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: aiPrompt,
            max_tokens: 150,
        });

        // Extract AI-generated content
        const aiSuggestions = aiResponse.data.choices[0].text.trim().split("\n");

        // Format AI response
        const keywords = aiSuggestions[1]?.split(", ") || ["No keywords found"];
        const locations = aiSuggestions[3]?.split(", ") || ["No locations found"];
        const strategy = aiSuggestions.slice(5).join(" ") || "No strategy generated.";

        res.json({
            keywords,
            locations,
            strategy
        });

    } catch (error) {
        console.error("Error generating AI SEO suggestions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

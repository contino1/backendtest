import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://elevateseo.netlify.app',
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    credentials: true
}));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET || !OPENAI_API_KEY) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

app.post('/api/ai-suggestions', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        console.log('Sending request to OpenAI...');

        // Test a simple fallback prompt to validate API connection
        const fallbackPrompt = 'Provide three SEO tips for a business website.';
        const requestPrompt = prompt.trim() || fallbackPrompt;

        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: `Generate a detailed SEO business plan and implementation guide:\n\n${requestPrompt}`,
            max_tokens: 1000,
            temperature: 0.7,
            top_p: 1,
            n: 1,
        });

        console.log('OpenAI response:', response.data);

        // Ensure response contains valid data
        if (!response.data.choices || !response.data.choices.length) {
            throw new Error('Empty response from OpenAI API.');
        }

        const generatedText = response.data.choices[0].text.trim();
        const [businessPlan, implementation] = generatedText.split("Implementation Instructions:");

        res.json({
            businessPlan: businessPlan?.trim() || "No business plan generated.",
            implementation: implementation?.trim() || "No implementation instructions generated."
        });

    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);

        // Return detailed error message if available
        res.status(500).json({
            message: 'Failed to generate suggestions',
            debug: process.env.NODE_ENV === 'development' ? error.response?.data || error.message : undefined,
        });
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';

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

app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.post('/api/ai-suggestions', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        console.error('Prompt is missing in the request.');
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        console.log('Received prompt:', prompt);

        // Use the updated chat completion endpoint with gpt-3.5-turbo or gpt-4
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an expert SEO assistant.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        console.log('OpenAI response:', response.data);

        if (!response.data.choices || !response.data.choices.length) {
            console.error('Empty response from OpenAI:', response.data);
            return res.status(500).json({ message: 'OpenAI returned an empty response' });
        }

        const generatedText = response.data.choices[0].message.content.trim();
        const [businessPlan, implementation] = generatedText.split("Implementation Instructions:");

        res.json({
            businessPlan: businessPlan?.trim() || "No business plan generated.",
            implementation: implementation?.trim() || "No implementation instructions generated."
        });

    } catch (error) {
        console.error('OpenAI API error:', error.response ? error.response.data : error.message);

        res.status(500).json({
            message: 'Failed to generate suggestions',
            debug: error.response?.data || error.message,
            statusCode: error.response?.status || 500
        });
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

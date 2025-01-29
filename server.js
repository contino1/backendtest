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

// Environment variables
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET || !OPENAI_API_KEY) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

// Mock profile data store
let profileData = null;

const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));

// ** Test route **
app.get('/api/status', (req, res) => res.json({ status: 'Server is running' }));

// ** Login Route **
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign({ id: 1, email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// ** Profile Routes **
// GET /api/profile - Retrieve profile data
app.get('/api/profile', (req, res) => {
    if (!profileData) {
        return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profileData);
});

// POST /api/profile - Save profile data
app.post('/api/profile', (req, res) => {
    profileData = req.body;  // Mock storing the profile data
    res.json({ message: 'Profile saved successfully', profile: profileData });
});

// PUT /api/profile - Update profile data
app.put('/api/profile', (req, res) => {
    if (!profileData) {
        return res.status(404).json({ message: 'Profile not found' });
    }

    profileData = { ...profileData, ...req.body };
    res.json({ message: 'Profile updated successfully', profile: profileData });
});

// ** AI Suggestions Route **
// POST /api/ai-suggestions - Generate AI-based SEO suggestions
app.post('/api/ai-suggestions', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 300,
        });

        res.json({ suggestions: response.data.choices[0].text.trim() });
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ message: 'Failed to generate suggestions' });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

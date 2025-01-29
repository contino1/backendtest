import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Environment variables from Railway
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET || !OPENAI_API_KEY) {
    console.error('Missing required environment variables. Please set JWT_SECRET and OPENAI_API_KEY.');
    process.exit(1);
}

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Test route for server status
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Register route
app.post('/api/register', (req, res) => {
    const { email, password, fullName, plan } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = { id: 1, email, fullName, plan };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Registration successful', token });
});

// Login route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign({ id: 1, email }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ message: 'Login successful', token });
    }

    res.status(401).json({ message: 'Invalid email or password' });
});

// AI suggestion route
app.post('/api/ai-suggestions', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 100,
        });

        res.json({ suggestions: response.data.choices[0].text.trim() });
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ message: 'Failed to generate suggestions' });
    }
});

// Profile routes
let profile = { id: 1, businessName: 'Initial Name', website: 'https://initialwebsite.com' };

// Save profile route
app.post('/api/profile', (req, res) => {
    const { businessName, website } = req.body;

    if (!businessName || !website) {
        return res.status(400).json({ message: 'Business name and website are required' });
    }

    profile = { id: 1, businessName, website };

    res.json({ message: 'Profile saved successfully', profile });
});

// Edit profile route
app.put('/api/profile/edit', (req, res) => {
    const { id, businessName, website } = req.body;

    if (!id || !businessName || !website) {
        return res.status(400).json({ message: 'ID, business name, and website are required' });
    }

    if (profile.id !== id) {
        return res.status(404).json({ message: 'Profile not found' });
    }

    profile = { id, businessName, website };

    res.json({ message: 'Profile updated successfully', profile });
});

// Fetch profile route
app.get('/api/profile', (req, res) => {
    res.json({ profile });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

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

// Mock profile data
let profileData = null;

// Test route for status check
app.get('/api/status', (req, res) => res.json({ status: 'Server is running' }));

// Register route
app.post('/api/register', (req, res) => {
    console.log('Register request received:', req.body);

    const { email, password, fullName, plan } = req.body;
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Simulate user creation (replace with database logic later)
    const user = { id: 1, email, fullName, plan };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    console.log('Registration successful:', { email });
    res.json({ message: 'Registration successful', token });
});

// Login route
app.post('/api/login', (req, res) => {
    console.log('Login request received:', req.body);

    const { email, password } = req.body;
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign({ id: 1, email }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful:', { email });
        res.json({ message: 'Login successful', token });
    } else {
        console.log('Invalid credentials:', { email });
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// Profile routes
app.get('/api/profile', (req, res) => {
    if (!profileData) {
        return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profileData);
});

app.post('/api/profile', (req, res) => {
    profileData = req.body;
    res.json({ message: 'Profile saved successfully', profile: profileData });
});

app.put('/api/profile', (req, res) => {
    if (!profileData) {
        return res.status(404).json({ message: 'Profile not found' });
    }

    profileData = { ...profileData, ...req.body };
    res.json({ message: 'Profile updated successfully', profile: profileData });
});

// AI suggestions route
app.post('/api/ai-suggestions', async (req, res) => {
    console.log('AI suggestions request received:', req.body);

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

// Catch-all route for unhandled paths
app.all('*', (req, res) => {
    console.log(`Unhandled request to: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

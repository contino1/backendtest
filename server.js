import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
app.use(express.json());

// CORS Configuration with Debugging
app.use(cors({
    origin: (origin, callback) => {
        console.log(`CORS request from origin: ${origin}`);
        // Allow requests from your frontend
        if (!origin || origin === 'https://elevateseo.netlify.app') {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Environment variables
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET || !OPENAI_API_KEY) {
    console.error('Missing required environment variables. Please set JWT_SECRET and OPENAI_API_KEY.');
    process.exit(1);
}

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// Test route for server status
app.get('/api/status', (req, res) => res.json({ status: 'Server is running' }));

// Register route
app.post('/api/register', (req, res) => {
    console.log('Register request received:', req.body);

    const { email, password, fullName, plan } = req.body;
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = { id: 1, email, fullName, plan };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Registration successful:', { email });
    res.json({ message: 'Registration successful', token });
});

// Login route with debugging logs
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

// AI suggestion route with error handling
app.post('/api/ai-suggestions', async (req, res) => {
    console.log('AI suggestions request received:', req.body);

    const { prompt } = req.body;
    if (!prompt) {
        console.log('Prompt is missing');
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 100,
        });

        console.log('AI response generated successfully');
        res.json({ suggestions: response.data.choices[0].text.trim() });
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ message: 'Failed to generate suggestions' });
    }
});

// Profile route to save business information
app.post('/api/profile', (req, res) => {
    console.log('Profile save request received:', req.body);

    const { businessName, website } = req.body;
    if (!businessName || !website) {
        console.log('Missing business name or website');
        return res.status(400).json({ message: 'Business name and website are required' });
    }

    const profile = { id: 1, businessName, website };
    console.log('Profile saved successfully:', profile);
    res.json({ message: 'Profile saved successfully', profile });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

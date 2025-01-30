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

// Configure OpenAI API
const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

let profileData = null;

// Status route for health check
app.get('/api/status', (req, res) => {
    console.log('Status check received.');
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Login route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.error('Login error: Missing email or password.');
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Simulate login logic (replace with actual user authentication)
    if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign({ id: 1, email }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful:', email);
        res.json({ message: 'Login successful', token });
    } else {
        console.error('Invalid login attempt:', email);
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

// AI suggestions route with improved logging and handling
app.post('/api/ai-suggestions', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        console.log('Received AI request with prompt:', prompt);

        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an SEO assistant providing business plans.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

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
        console.error('OpenAI API error:', error.response?.data || error.message);

        res.status(500).json({
            message: 'Failed to generate suggestions',
            debug: error.response?.data || error.message,
            statusCode: error.response?.status || 500
        });
    }
});

// Catch-all route for invalid paths
app.all('*', (req, res) => {
    console.warn(`Unhandled request to ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

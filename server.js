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

// Environment variables set in Railway
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

// Status route for checking server health
app.get('/api/status', (req, res) => {
    console.log('Status check received.');
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Registration route
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
        res.json({ message: 'Login successful', token });
    } else {
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

// AI suggestions route with improved logging and diagnostics
app.post('/api/ai-suggestions', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        console.log('Sending AI request with prompt:', prompt);

        // Send the request to OpenAI
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 1000,
            temperature: 0.7,
            top_p: 1,
        });

        // Log the full response for debugging
        console.log('OpenAI response:', response.data);

        if (!response.data.choices || !response.data.choices.length) {
            console.error('Empty response from OpenAI:', response.data);
            return res.status(500).json({ message: 'OpenAI returned an empty response' });
        }

        const generatedText = response.data.choices[0].text.trim();
        const [businessPlan, implementation] = generatedText.split("Implementation Instructions:");

        res.json({
            businessPlan: businessPlan?.trim() || "No business plan generated.",
            implementation: implementation?.trim() || "No implementation instructions generated."
        });

    } catch (error) {
        console.error('OpenAI API error:', error.response ? error.response.data : error.message);

        // Return detailed error information for diagnostics
        res.status(500).json({
            message: 'Failed to generate suggestions',
            debug: error.response?.data || error.message,
            statusCode: error.response?.status || 500
        });
    }
});

// Catch-all route for unhandled paths
app.all('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

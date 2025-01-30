import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://elevateseo.netlify.app', // Allow front-end domain
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    credentials: true
}));

// Environment variables from Railway
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET || !OPENAI_API_KEY) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

let profileData = null;

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
}

// Health check route
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Login route
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Dummy login credentials (Replace with your user authentication logic)
    if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign({ id: 1, email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// Profile routes
app.get('/api/profile', authenticateToken, (req, res) => {
    if (!profileData) {
        return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profileData);
});

app.post('/api/profile', authenticateToken, (req, res) => {
    profileData = req.body;
    console.log('Profile data saved:', profileData);
    res.json({ message: 'Profile saved successfully', profile: profileData });
});

// AI suggestions route
app.post('/api/ai-suggestions', authenticateToken, async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
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

// Catch-all route for undefined routes
app.all('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

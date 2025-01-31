// Initialize Express app with enhanced CORS and debugging for profile save issues
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
app.use(express.json());

// Enhanced CORS setup with logging
app.use((req, res, next) => {
    console.log(`CORS Debug - Request from: ${req.headers.origin}`);
    console.log('Request Headers:', req.headers);
    next();
});

app.use(cors({
    origin: 'https://elevateseo.netlify.app',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type']
}));

// Environment variables
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET || !OPENAI_API_KEY) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

let profileData = {};

// JWT Authentication Middleware with token verification logs
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.error('Authorization failed: No token provided.');
        return res.sendStatus(401); // Unauthorized
    }

    console.log('Authorization header:', authHeader);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.sendStatus(403); // Forbidden
        }

        console.log('Token verified successfully for user:', user);
        req.user = user;
        next();
    });
}

// Profile routes with request logging
app.get('/api/profile', authenticateToken, (req, res) => {
    console.log('GET /api/profile request received for user:', req.user);

    if (!profileData[req.user.id]) {
        console.log('No profile found for user:', req.user.id);
        return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profileData[req.user.id]);
});

app.post('/api/profile', authenticateToken, (req, res) => {
    console.log('POST /api/profile request received for user:', req.user);
    console.log('Profile data received:', req.body);

    // Save comprehensive SEO profile data
    profileData[req.user.id] = {
        businessName: req.body.businessName,
        websiteURL: req.body.websiteURL,
        businessType: req.body.businessType,
        targetAudience: req.body.targetAudience,
        mainKeywords: req.body.mainKeywords,
        geographicTarget: req.body.geographicTarget,
        competitorAnalysis: req.body.competitorAnalysis,
        marketingGoals: req.body.marketingGoals,
        currentSEOtools: req.body.currentSEOtools,
        budget: req.body.budget
    };

    res.json({ message: 'Profile saved successfully', profile: profileData[req.user.id] });
});

// Health check route
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Login route with logging
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login request received:', req.body);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Dummy login credentials (replace with your actual authentication logic)
    if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign({ id: 1, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// AI suggestions route with logging
app.post('/api/ai-suggestions', authenticateToken, async (req, res) => {
    const { prompt } = req.body;
    console.log('POST /api/ai-suggestions request received with prompt:', prompt);

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
    console.log('Undefined route accessed:', req.method, req.path);
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

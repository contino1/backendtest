import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { OpenAI } from 'openai';

// Initialize the Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Environment variables from Railway
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'Secret-Key';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI with the API key
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Middleware to authenticate user
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Unauthorized access' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

// Routes

// Register route
app.post('/api/register', (req, res) => {
    const { email, password, fullName, plan } = req.body;
    if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Registration successful', token });
});

// Login route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Profile update route
app.post('/api/profile', authenticateToken, (req, res) => {
    const profileData = req.body;
    res.json({ message: 'Profile updated successfully', profileData });
});

// AI suggestions route
app.post('/api/get-ai-suggestions', authenticateToken, async (req, res) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: req.body.messages,
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error generating AI suggestions:', error);
        res.status(500).json({ error: 'Failed to get AI suggestions' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

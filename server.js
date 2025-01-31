// Initialize Express app with enhanced CORS and debugging
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'https://elevateseo.netlify.app',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type']
}));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET || !OPENAI_API_KEY) {
    console.error('Missing environment variables.');
    process.exit(1);
}

const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));

let profileData = {};

// Authenticate token middleware with enhanced logging and debugging
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.error('Authorization header missing.');
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.error('Token missing in Authorization header.');
        return res.status(401).json({ message: 'Token missing' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).json({ message: 'Token verification failed', error: err.message });
        }

        console.log('Token verified successfully for user:', user);
        req.user = user;
        next();
    });
}

// API endpoints
app.get('/api/profile', authenticateToken, (req, res) => {
    console.log('GET /api/profile request received for user:', req.user);
    if (!profileData[req.user.id]) {
        return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profileData[req.user.id]);
});

app.post('/api/profile', authenticateToken, (req, res) => {
    console.log('POST /api/profile request received for user:', req.user);
    profileData[req.user.id] = req.body;
    res.json({ message: 'Profile saved successfully', profile: profileData[req.user.id] });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log('POST /api/auth/login request received with email:', email);

    if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign({ id: 1, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

app.post('/api/ai-suggestions', authenticateToken, async (req, res) => {
    console.log('POST /api/ai-suggestions request received with prompt:', req.body.prompt);

    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an SEO assistant providing business plans.' },
                { role: 'user', content: req.body.prompt }
            ],
            max_tokens: 1000
        });
        const generatedText = response.data.choices[0]?.message.content.trim() || "No response generated.";
        res.json({ suggestions: generatedText });
    } catch (error) {
        console.error('OpenAI API error:', error.message);
        res.status(500).json({ message: 'OpenAI error', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

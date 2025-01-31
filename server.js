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
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type']
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

let profileData = {};

// JWT Authentication Middleware with detailed logging
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.error('Authorization failed: No token provided.');
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.sendStatus(403); // Forbidden
        }

        console.log('Token verification successful for user:', user);
        req.user = user;
        next();
    });
}

// Health check route
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Profile routes with enhanced logging
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

    profileData[req.user.id] = req.body;
    res.json({ message: 'Profile saved successfully', profile: profileData[req.user.id] });
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

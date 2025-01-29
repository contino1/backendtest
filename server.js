import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY_SECRET;

// Validate environment variables
if (!JWT_SECRET || !OPENAI_API_KEY || !DATABASE_URL) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

// Initialize OpenAI API client
const openai = new OpenAIApi(
    new Configuration({
        apiKey: OPENAI_API_KEY,
    })
);

// Middleware setup
app.use(cors({ origin: 'https://elevateseo.netlify.app' }));  // Allow only your frontend domain
app.use(bodyParser.json());

// Mock database for demonstration purposes
const users = [];

// Routes

// Status check route
app.get('/api/status', (req, res) => {
    res.json({ status: 'success', message: 'Server is running!' });
});

// Register route
app.post('/api/register', (req, res) => {
    const { fullName, email, password, plan } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(409).json({ status: 'error', message: 'User already exists.' });
    }

    const newUser = { id: users.length + 1, fullName, email, password, plan };
    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ status: 'success', message: 'Registration successful.', token });
});

// Login route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ status: 'success', message: 'Login successful.', token });
});

// Save profile route
app.post('/api/profile/save', (req, res) => {
    const { token, profileData } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        user.profile = profileData;

        res.json({ status: 'success', message: 'Profile saved successfully.' });
    } catch (error) {
        res.status(401).json({ status: 'error', message: 'Unauthorized or invalid token.' });
    }
});

// Get AI suggestions route
app.post('/api/ai/suggestions', async (req, res) => {
    const { token, businessDetails } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        const prompt = `Generate SEO suggestions for the following business details: ${JSON.stringify(businessDetails)}`;
        
        const completion = await openai.createChatCompletion({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
        });

        const suggestions = completion.data.choices[0].message.content;

        res.json({ status: 'success', message: 'AI suggestions generated.', suggestions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Failed to generate AI suggestions.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
app.use(cors({ origin: 'https://elevateseo.netlify.app' }));
app.use(express.json());

// Database Setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to SQLite database');
});

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// **User Registration**
app.post('/api/register', async (req, res) => {
    const { name, email, password, plan } = req.body;

    if (!name || !email || !password || !plan) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        `INSERT INTO users (name, email, password, plan) VALUES (?, ?, ?, ?)`,
        [name, email, hashedPassword, plan],
        function (err) {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'User already exists' });
            }
            res.status(201).json({ status: 'success', message: 'User registered successfully' });
        }
    );
});

// **User Login**
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, plan: user.plan }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ status: 'success', message: 'Login successful', token });
    });
});

// **Save Business Profile**
app.post('/api/profile', (req, res) => {
    const { userId, website, services, location, email, phone } = req.body;

    if (!userId) return res.status(400).json({ status: 'error', message: 'User ID required' });

    db.run(
        `INSERT INTO profiles (userId, website, services, location, email, phone) VALUES (?, ?, ?, ?, ?, ?) 
        ON CONFLICT(userId) DO UPDATE SET website = excluded.website, services = excluded.services, location = excluded.location, email = excluded.email, phone = excluded.phone`,
        [userId, website, services, location, email, phone],
        function (err) {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Failed to save profile' });
            }
            res.status(200).json({ status: 'success', message: 'Profile saved successfully' });
        }
    );
});

// **Generate AI SEO Suggestions**
app.post('/api/ai-suggestions', async (req, res) => {
    const { businessType, services, location } = req.body;

    if (!businessType && !services) {
        return res.status(400).json({ status: 'error', message: 'At least business type or services must be provided' });
    }

    try {
        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: `Generate SEO strategies for a ${businessType} business offering ${services} in ${location}.` }],
            temperature: 0.7,
        });

        res.status(200).json({ status: 'success', suggestions: aiResponse.choices[0].message.content });
    } catch (error) {
        console.error('AI API error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate AI suggestions' });
    }
});

// **Verify Server is Running**
app.get('/api/status', (req, res) => {
    res.json({ status: 'success', message: 'Server is running' });
});

// **Start Server**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai'); // Corrected OpenAI import

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// OpenAI Setup (Fixed)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ API Health Check
app.get('/api/status', (req, res) => {
  res.status(200).json({ message: 'API is running!' });
});

// Mock Database (For Testing)
let users = [];

// ✅ User Registration
app.post('/api/register', (req, res) => {
  const { name, email, password, plan } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const userExists = users.find((user) => user.email === email);
  if (userExists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = { id: users.length + 1, name, email, password, plan };
  users.push(newUser);
  res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// ✅ User Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.status(200).json({ message: 'Login successful', user });
});

// ✅ AI-Generated SEO Suggestions
app.post('/api/seo-suggestions', async (req, res) => {
  const { website, businessType, targetLocation } = req.body;

  if (!website) {
    return res.status(400).json({ error: 'Website URL is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an SEO expert providing high-quality recommendations.' },
        { role: 'user', content: `Provide SEO strategy for ${businessType} in ${targetLocation}. Website: ${website}` }
      ],
    });

    res.json({ suggestions: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'Error generating SEO suggestions', details: error.message });
  }
});

// ✅ Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

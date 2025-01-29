const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(express.json());
app.use(cors());

// Database setup
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

// User model
const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    plan: { type: DataTypes.ENUM('Free', 'Growth', 'Premier'), defaultValue: 'Free' }
});

sequelize.sync();

const JWT_SECRET = 'your_jwt_secret';

function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
}

// Routes
app.post('/api/register', async (req, res) => {
    const { name, email, password, plan } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).send('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword, plan });
    res.status(201).send({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).send('Invalid email or password');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password');

    const token = jwt.sign({ id: user.id, plan: user.plan }, JWT_SECRET);
    res.send({ token, plan: user.plan });
});

app.get('/api/recommendations', authenticateToken, (req, res) => {
    const recommendations = {
        Free: ['Use free SEO tools', 'Focus on local SEO'],
        Growth: ['Target long-tail keywords', 'Improve website speed'],
        Premier: ['Custom SEO strategy', 'Backlink analysis']
    };

    res.send({ recommendations: recommendations[req.user.plan] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

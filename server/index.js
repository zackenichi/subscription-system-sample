require('dotenv').config();
const express = require('express');

const app = express();
const cors = require('cors');

const connection = require('./connect/db');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');

// database connection
connection();

// middlewares
app.use(express.json());
app.use(cors());

// routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening to port ${port}...`));

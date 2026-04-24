const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const initAndSeed = require('./utils/seed');

// Initialize DB and Seed Admin User
initAndSeed();

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');

// 1. API ROUTES FIRST (To avoid static file conflicts)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// 2. SPECIFIC ADMIN ROUTE
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../Admin/admin.html'));
});

// 3. STATIC FILES
app.use('/admin', express.static(path.join(__dirname, '../Admin')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ LAST LINE (Global 404)
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`Frontend: http://localhost:${PORT}`);
});

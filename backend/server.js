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

// Test Route
app.get("/test", (req, res) => {
  res.send("Backend working fine");
});

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

let latestWeight = 0;
let lastUpdate = Date.now();

// ESP32 sends weight here
app.post("/update-weight", (req, res) => {
    latestWeight = req.body.weight;
    lastUpdate = Date.now();
    console.log("Weight:", latestWeight);
    res.sendStatus(200);
});

// Frontend gets weight here
app.get("/get-weight", (req, res) => {
    res.json({
        weight: latestWeight,
        lastUpdate: lastUpdate
    });
});

// ✅ LAST LINE (Global 404)
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

// ❌ GLOBAL ERROR HANDLER (Prevents Hangs)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`Frontend: http://localhost:${PORT}`);
});

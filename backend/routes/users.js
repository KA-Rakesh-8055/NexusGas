const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// @route   GET /users
// @desc    Get all users (ADMIN ONLY)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

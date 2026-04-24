const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// @route   GET /api/admin/users
// @desc    Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/stats
// @desc    Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    const adminCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    
    res.json({
      totalUsers: parseInt(userCount.rows[0].count),
      adminUsers: parseInt(adminCount.rows[0].count),
      systemStatus: 'Online',
      lastUpdate: new Date()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");


// ✅ 1. LOGIN FIRST (no middleware here)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      "SELECT id, name, email, password, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not an admin" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 🔥 Update Last Login & Online Status
    await db.query(
      "UPDATE users SET last_login = NOW(), is_online = TRUE WHERE id = $1",
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});


// 🔒 2. APPLY MIDDLEWARE AFTER LOGIN
router.use(authMiddleware);
router.use(adminMiddleware);

// ✅ Logout Route
router.post("/logout", async (req, res) => {
  try {
    await db.query("UPDATE users SET is_online = FALSE WHERE id = $1", [req.user.id]);
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).send("Server Error");
  }
});


// 🔒 3. PROTECTED ROUTES
router.get("/users", async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, email, role, last_login, is_online, created_at FROM users ORDER BY is_online DESC, last_login DESC");
    return res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

// ✅ Get Stats
router.get("/stats", async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) as count FROM users");
    return res.json({
      totalUsers: parseInt(result.rows[0].count),
      systemIntegrity: "99.9%",
      nodeStatus: "Active"
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

// ✅ Delete User
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = $1", [id]);
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
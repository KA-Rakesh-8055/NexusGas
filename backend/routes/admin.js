const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check user in DB
    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // 2. Check password (simple for now)
    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 3. Check admin role
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not an admin" });
    }

    // 4. Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5. Send token
    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
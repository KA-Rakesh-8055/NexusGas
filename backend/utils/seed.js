const bcrypt = require('bcryptjs');
const db = require('../db');
const fs = require('fs');
const path = require('path');

const initAndSeed = async () => {
  try {
    console.log('Starting Database Initialization...');
    
    // 1. Database Validation - Create table if not exists
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon to run statements individually if needed, 
    // though pg supports multi-statement strings, splitting helps debug.
    const statements = schemaSql.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      await db.query(statement);
    }
    console.log('Database schema validated successfully.');

    // 2. Fix Admin User Seeding
    const adminEmail = 'admin@nexus.com';
    const adminPassword = 'admin123';
    const adminName = 'Nexus Admin';

    const result = await db.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (result.rows.length === 0) {
      await db.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        [adminName, adminEmail, hashedPassword, 'admin']
      );
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      await db.query(
        'UPDATE users SET password = $1, role = $2, name = $3 WHERE email = $4',
        [hashedPassword, 'admin', adminName, adminEmail]
      );
      console.log(`Admin user synchronized: ${adminEmail}`);
    }
  } catch (err) {
    console.error('---------------------------------------------------------');
    console.error('CRITICAL: Backend Seeding/Initialization Failed');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Stack Trace:', err.stack);
    console.error('---------------------------------------------------------');
  }
};

module.exports = initAndSeed;

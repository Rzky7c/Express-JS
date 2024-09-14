const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const { sendEmailVerification } = require('../config/emailService');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { message: null });
});

router.get('/login', (req, res) => {
  res.render('login', { message: null });
});

router.get('/verify', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.redirect('/auth/login');
  }

  try {
    const [rows] = await db.execute('SELECT isVerified FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.redirect('/auth/login');
    }

    if (rows[0].isVerified) {
      return res.redirect('/docs');
    }

    res.render('verify', { email, message: null });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data.', error });
  }
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).render('register', { message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    await db.execute('INSERT INTO users (email, password, pin, isVerified) VALUES (?, ?, ?, ?)', [email, hashedPassword, pin, false]);

    sendEmailVerification(email, pin);

    res.redirect('/auth/login?register=success');
  } catch (error) {
    res.status(500).json({ message: 'Registration failed.', error });
  }
});

router.post('/verify', async (req, res) => {
  const { email, pin } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ? AND pin = ?', [email, pin]);

    if (rows.length > 0) {
      if (rows[0].isVerified) {
        return res.redirect('/docs');
      }

      await db.execute('UPDATE users SET isVerified = ?, pin = NULL WHERE email = ?', [true, email]);
      res.redirect('/docs');
    } else {
      res.render('verify', { email, message: 'Invalid PIN.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Verification failed.', error });
    console.log(error);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(400).render('login', { message: 'User not found.' });
    }

    const user = rows[0];

    if (!user.isVerified) {
      return res.redirect('/auth/verify?email=' + encodeURIComponent(email));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('login', { message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.redirect('/docs');
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error });
  }
});

module.exports = router;

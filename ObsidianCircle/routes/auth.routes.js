const express = require('express');
const { admin } = require('../config/firebase'); // Keep admin for createUser
const firestoreService = require('../services/firestore');
const { validateRegistration } = require('../utils/validators');

// Sanitize input helper
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  const validationErrors = validateRegistration(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(', ') });
  }

  const { email, password, role, external_id, name } = req.body;

  // Sanitize inputs
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedName = sanitizeInput(name);
  const sanitizedExternalId = sanitizeInput(external_id);

  try {
    // Check existing in DB first to be sure
    const existing = await firestoreService.getUserByEmail(sanitizedEmail);
    if (existing) {
        return res.status(409).json({ error: 'User already exists' });
    }

    // 1. Create User in Firebase Auth
    const user = await admin.auth().createUser({
      email: sanitizedEmail,
      password,
      displayName: sanitizedName || ''
    });

    // 2. Create User in Firestore with SAME UID
    const userData = {
      email: sanitizedEmail,
      role,
      status: role === 'alumni' ? 'pending' : 'approved',
      external_id: sanitizedExternalId,
      created_at: new Date().toISOString()
    };

    await firestoreService.createUser(user.uid, userData);

    // 3. Create Profile
    await firestoreService.createProfile({
      user_id: user.uid,
      name: sanitizedName || 'New User',
      skills: [],
      visibility: 'public',
      // Default empty profiles
      developmentProfile: { github: '', portfolio: '' },
      dsaProfile: { leetcode: '', codeforces: '', codechef: '', hackerrank: '', spoil: '' },
      tags: [role],
      bio: '',
      education: 'VNR VJIET',
      company: '',
      job_role: '',
      github_url: '',
      resume_url: ''
    });

    await firestoreService.addAuditEntry({
         actor_id: user.uid, 
         action: 'register', 
         target_id: user.uid, 
         details: { role } 
    });

    return res.status(201).json({ 
        message: 'Registration successful',
        user: { uid: user.uid, ...userData }
    });

  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'User already exists (Auth)' });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /auth/login - Legacy stub or simplified check
// User instruction: "REMOVE /auth/login OR Repurpose it to ONLY verify a Firebase ID token"
// We will repurpose it for verify-only to help debug or simple token checks
router.post('/login', async (req, res) => {
    // Expects "token" in body
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        const user = await firestoreService.getUserById(decoded.uid);
        if (!user) return res.status(401).json({ error: 'User not in database' });
        
        return res.json({ 
            message: 'Token valid', 
            user: { uid: decoded.uid, email: user.email, role: user.role, status: user.status } 
        });
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;

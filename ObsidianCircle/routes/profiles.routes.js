const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const firestoreService = require('../services/firestore');
// const storageService = require('../services/storage'); // Unused if we don't upload files directly
const router = express.Router();

// GET /profiles/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const profile = await firestoreService.getProfileByUID(req.user.uid);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json({ profile });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /profiles/me
router.put('/me', requireAuth, async (req, res) => {
    try {
        const current = await firestoreService.getProfileByUID(req.user.uid);
        if (!current) return res.status(404).json({ error: 'Profile not found' });

        // Update logic
        const updates = {};
        const safeFields = ['name', 'bio', 'education', 'company', 'job_role', 'github_url', 'visibility'];
        
        safeFields.forEach(f => {
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        });

        if (req.body.skills && Array.isArray(req.body.skills)) {
            updates.skills = req.body.skills;
        }

        if (req.body.tags && Array.isArray(req.body.tags)) {
            updates.tags = req.body.tags;
        }

        // Complex objects
        if (req.body.developmentProfile) {
            updates.developmentProfile = { ...current.developmentProfile, ...req.body.developmentProfile };
        }
        if (req.body.dsaProfile) {
            updates.dsaProfile = { ...current.dsaProfile, ...req.body.dsaProfile };
        }

        // Student Validations
        if (req.user.role === 'student') {
             const newDev = updates.developmentProfile || current.developmentProfile;
             if (!newDev?.github || newDev.github.trim() === '') {
                 return res.status(400).json({ error: 'GitHub profile is required for students' });
             }

             const newDSA = updates.dsaProfile || current.dsaProfile;
             const required = ['leetcode', 'codeforces', 'codechef', 'hackerrank', 'spoj'];
             for (const r of required) {
                 if (!newDSA?.[r] || newDSA[r].trim() === '') {
                     return res.status(400).json({ error: `DSA profile missing: ${r}` });
                 }
             }
        }

        const updated = await firestoreService.updateProfile(req.user.uid, updates);
        res.json({ profile: updated });

    } catch (err) {
        console.error('Update profile error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /profiles/:uid
router.get('/:uid', requireAuth, async (req, res) => {
    try {
        const profile = await firestoreService.getProfileByUID(req.params.uid);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        // Visibility Check
        const isSelf = req.user.uid === req.params.uid;
        const isAdmin = req.user.role === 'admin';
        const isAlumni = req.user.role === 'alumni';

        if (!isSelf && !isAdmin) {
             if (profile.visibility === 'alumni_only' && !isAlumni) {
                 return res.status(403).json({ error: 'Profile is private (Alumni only)' });
             }
        }

        res.json({ profile });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /profiles/me/resume
// Reverted to legacy behavior (JSON body) because multer is not available
router.post('/me/resume', requireAuth, async (req, res) => {
    const { resume_url } = req.body;
    // Simple stub or accept URL
    if (resume_url === undefined) {
         // If they tried multipart, we cant handle it without mutler.
         // Return error or mock success if it was a file upload attempt? 
         // Legacy code accepted JSON `resume_url`.
         return res.status(400).json({ error: 'resume_url string required in body' });
    }
    
    try {
        const updated = await firestoreService.updateProfile(req.user.uid, { resume_url });
        res.json({ profile: updated });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Resume update failed.' });
    }
});

module.exports = router;

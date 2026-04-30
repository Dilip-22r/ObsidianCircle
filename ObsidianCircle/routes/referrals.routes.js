const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const firestoreService = require('../services/firestore');
const router = express.Router();

// GET /referrals (My referrals)
router.get('/', requireAuth, async (req, res) => {
    try {
        const referrals = await firestoreService.getReferralsForUser(req.user.uid, req.user.role);
        res.json({ referrals });
    } catch (e) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// POST /referrals (Student only)
router.post('/', requireAuth, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Students only' });
    }

    const { project_id, mentor_id, notes } = req.body;
    if (!project_id || !mentor_id) {
        return res.status(400).json({ error: 'project_id and mentor_id required' });
    }

    try {
        const project = await firestoreService.getProjectById(project_id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        
        // Verify mentor exists?
        // const mentor = await firestoreService.getUserById(mentor_id); ... 
        
        const referral = await firestoreService.createReferral({
             project_id,
             mentor_id,
             student_id: req.user.uid,
             notes: notes || '',
             status: 'pending',
             created_at: new Date().toISOString()
        });
        
        res.status(201).json({ referral });
    } catch (e) {
        res.status(500).json({ error: 'Create referral failed' });
    }
});

// PUT /referrals/:id/status (Mentor only)
router.put('/:id/status', requireAuth, async (req, res) => {
    const { status } = req.body; // accepted, rejected, ignored
    if (!['accepted', 'rejected', 'ignored'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    try {
        const referral = await firestoreService.getReferralById(req.params.id);
        if (!referral) return res.status(404).json({ error: 'Not found' });

        if (referral.mentor_id !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updated = await firestoreService.updateReferral(referral.id, { status });
        res.json({ referral: updated });
    } catch(e) {
        res.status(500).json({ error: 'Update failed' });
    }
});

module.exports = router;

const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const firestoreService = require('../services/firestore');
const router = express.Router();

router.use(requireAdmin);

// POST /admin/approve-alumni
 router.post('/approve-alumni', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await firestoreService.getUserById(userId);
        if (!user || user.role !== 'alumni') {
            return res.status(404).json({ error: 'Alumni not found' });
        }
        
        const updated = await firestoreService.updateUserStatus(user.id, 'approved');
        
        await firestoreService.addAuditEntry({
            actor_id: req.user.uid,
            action: 'approve_alumni',
            target_id: user.id
        });

        res.json({ user: updated });
    } catch(e) {
        res.status(500).json({ error: 'Operation failed' });
    }
});

// POST /admin/ban/:userId
router.post('/ban/:userId', async (req, res) => {
    try {
        const user = await firestoreService.getUserById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const updated = await firestoreService.updateUserStatus(user.id, 'banned');
        
        // Firebase Auth disable? (Optional but good practice, keeping to Firestore status for now as per rules "Status = banned")
        
        await firestoreService.addAuditEntry({
             actor_id: req.user.uid,
             action: 'ban_user',
             target_id: user.id
        });
        
        res.json({ user: updated });
    } catch (e) {
        res.status(500).json({ error: 'Operation failed' });
    }
});

module.exports = router;

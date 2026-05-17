const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const firestoreService = require('../services/firestore');
const router = express.Router();

// Cache communities to reduce database calls
let communitiesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

async function getCachedCommunities() {
    const now = Date.now();
    if (!communitiesCache || (now - cacheTimestamp) > CACHE_TTL) {
        communitiesCache = await firestoreService.getCommunities();
        cacheTimestamp = now;
    }
    return communitiesCache;
}

function canAccessCommunity(user, community) {
    if (!community) return false;
    if (community.visibility === 'common') return true;
    if (community.visibility === 'students') return user.role === 'student' || user.role === 'alumni' || user.role === 'admin';
    if (community.visibility === 'alumni') return ['alumni', 'admin'].includes(user.role);
    return false;
}

// GET /communities
router.get('/', requireAuth, async (req, res) => {
    try {
        const all = await getCachedCommunities();
        const visible = all.filter(c => canAccessCommunity(req.user, c));
        res.json({ communities: visible });
    } catch (e) {
        console.error('Fetch communities error:', e);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// GET /communities/:id/messages
router.get('/:id/messages', requireAuth, async (req, res) => {
    try {
        const all = await getCachedCommunities();
        const community = all.find(c => String(c.id) === String(req.params.id));
        
        if (!community || !canAccessCommunity(req.user, community)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messages = await firestoreService.getMessages(community.id, req.query.cursor);
        
        // Enrich with sender names
        const profileCache = {};
        for (let msg of messages) {
            if (!msg.sender_name && msg.sender_id) {
                if (!profileCache[msg.sender_id]) {
                    const profile = await firestoreService.getProfileByUID(msg.sender_id);
                    profileCache[msg.sender_id] = profile ? profile.name : (msg.sender_email || 'Unknown');
                }
                msg.sender_name = profileCache[msg.sender_id];
            }
        }

        res.json({ messages });
    } catch (e) {
        console.error('Fetch messages error:', e);
        res.status(500).json({ error: 'Fetch messages failed' });
    }
});

// POST /communities/:id/messages
router.post('/:id/messages', requireAuth, async (req, res) => {
    try {
        const all = await getCachedCommunities();
        const community = all.find(c => String(c.id) === String(req.params.id));
        
        if (!community || !canAccessCommunity(req.user, community)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const profile = await firestoreService.getProfileByUID(req.user.uid);
        const sender_name = profile ? profile.name : (req.user.email || 'Unknown');

        const message = await firestoreService.createMessage({
            community_id: community.id,
            sender_id: req.user.uid,
            sender_name: sender_name,
            sender_email: req.user.email,
            body: req.body.body || '',
            file_url: req.body.file_url || '',
            link_preview: req.body.link_preview || {}
        });

        res.status(201).json({ message });
    } catch (e) {
        console.error('Post message error:', e);
        res.status(500).json({ error: 'Message failed' });
    }
});

module.exports = router;

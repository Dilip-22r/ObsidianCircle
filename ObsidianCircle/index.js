require('./config/firebase');
const express = require('express');
const http = require('http');
const cors = require('cors');
const firebaseAuth = require('./middleware/firebaseAuth');
const firestoreService = require('./services/firestore');
const { initializeSocketIO } = require('./services/socketService');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profiles.routes');
const projectRoutes = require('./routes/projects.routes');
const communityRoutes = require('./routes/communities.routes');
const referralRoutes = require('./routes/referrals.routes');
const adminRoutes = require('./routes/admin.routes');
const messageRoutes = require('./routes/messages.routes');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware: sets req.user for all routes
app.use(firebaseAuth);

// Mount Routes
app.use('/auth', authRoutes); // /auth/register, /auth/login
app.use('/profiles', profileRoutes); // /profiles/me, /profiles/:uid
app.use('/projects', projectRoutes); // /projects
app.use('/communities', communityRoutes); // /communities
app.use('/referrals', referralRoutes); // /referrals
app.use('/admin', adminRoutes); // /admin/approve-alumni, /admin/ban
app.use('/messages', messageRoutes); // /messages

// Root Endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Obsidian Circle Production Backend',
    status: 'running',
    auth_mode: 'firebase_only'
  });
});

// Search Endpoint (Legacy Global Search)
app.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        // Basic public search, visibility filtering handled by client or service?
        // Service returns all, we filter.
        const results = await firestoreService.searchProfiles(q);
        // Filter visibility if desired. For now returning results.
        res.json({ results });
    } catch (e) {
        res.status(500).json({ results: [] });
    }
});

// Initialization / Seeding
// We only ensure communities exist. 
// We DO NOT seed users with passwords anymore as we use Firebase only.
async function init() {
    try {
        await firestoreService.ensureCommunitiesInit([
            { id: '1', name: 'Common', visibility: 'common' },
            { id: '2', name: 'Students', visibility: 'students' },
            { id: '3', name: 'Alumni', visibility: 'alumni' },
        ]);
        console.log('System initialized.');
    } catch (e) {
        console.error('Init failed:', e);
    }
}

const PORT = process.env.PORT || 3001;

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketIO(server);

server.listen(PORT, async () => {
  console.log(`Obsidian Circle Backend running on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
  await init();
});

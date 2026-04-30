const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireMentor = require('../middleware/requireMentor');
const requireAdmin = require('../middleware/requireAdmin');
const firestoreService = require('../services/firestore');
const { validateProject } = require('../utils/validators');

const router = express.Router();

// GET /projects
router.get('/', async (req, res) => {
    try {
        const projects = await firestoreService.getProjects();
        res.json({ projects });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST /projects (Mentor/Admin only)
router.post('/', requireMentor, async (req, res) => {
    const errors = validateProject(req.body);
    if (errors.length > 0) return res.status(400).json({ error: errors.join(', ') });

    try {
        const project = await firestoreService.createProject({
            mentor_id: req.user.uid,
            title: req.body.title,
            description: req.body.description,
            repo_url: req.body.repo_url || '',
            total_score: Number(req.body.total_score) || 100,
            is_team_based: !!req.body.is_team_based,
            published: false
        });

        await firestoreService.addAuditEntry({
            actor_id: req.user.uid,
            action: 'create_project',
            target_id: project.id
        });

        res.status(201).json({ project });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// GET /projects/:id
router.get('/:id', async (req, res) => {
    try {
        const project = await firestoreService.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (e) {
        res.status(500).json({ error: 'Error fetching project' });
    }
});

// POST /projects/:id/join
router.post('/:id/join', requireAuth, async (req, res) => {
    try {
        const project = await firestoreService.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can join projects' });
        }
        if (project.published) {
            return res.status(409).json({ error: 'Project closed (scores published)' });
        }

        const members = project.members || [];
        // Check using UID (string comparison)
        const already = members.find(m => m.student_id === req.user.uid);
        if (already) {
            return res.status(409).json({ error: 'Already joined' });
        }

        members.push({
            student_id: req.user.uid,
            contribution_score: 0,
            star_awarded: false,
            joined_at: new Date().toISOString()
        });

        const updated = await firestoreService.updateProject(project.id, { members });
        
        await firestoreService.addAuditEntry({
            actor_id: req.user.uid,
            action: 'join_project',
            target_id: project.id
        });

        res.json({ project: updated });
    } catch (e) {
        res.status(500).json({ error: 'Failed to join project' });
    }
});

// PUT /projects/:id/scores
router.put('/:id/scores', requireMentor, async (req, res) => {
    try {
        const project = await firestoreService.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Authorization: Mentor owner or Admin
        if (project.mentor_id !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to score this project' });
        }
        if (project.published && req.user.role !== 'admin') {
            return res.status(409).json({ error: 'Already published' });
        }

        const { scores, total_score } = req.body;
        
        let members = [...(project.members || [])];
        
        if (scores && Array.isArray(scores)) {
            members = members.map(m => {
                const update = scores.find(s => s.student_id === m.student_id);
                if (update) {
                    if (update.contribution_score !== undefined) m.contribution_score = Number(update.contribution_score);
                    if (update.star_awarded !== undefined) m.star_awarded = !!update.star_awarded;
                }
                return m;
            });
        }

        const updates = { members, published: true, published_at: new Date().toISOString() };
        if (total_score !== undefined) updates.total_score = Number(total_score);

        const updated = await firestoreService.updateProject(project.id, updates);
        
        await firestoreService.addAuditEntry({
            actor_id: req.user.uid,
            action: 'publish_scores',
            target_id: project.id
        });

        res.json({ project: updated });

    } catch (e) {
        res.status(500).json({ error: 'Failed to publish scores' });
    }
});

module.exports = router;

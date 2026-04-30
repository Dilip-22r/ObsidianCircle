# Obsidian Circle – College Mentorship Platform (Hackathon MVP)

College-exclusive mentorship and collaboration platform for VNR VJIET combining WhatsApp-style communities with LinkedIn-style profiles. Focus: verified contributions, fair referrals, and transparent scoring.

## System Architecture
- **Frontend:** SPA (React/Next) consuming REST APIs; role-based UI guards; file preview for resumes.
- **Backend:** Node.js/Express; stateless APIs; JWT auth restricted to `@vnrvjiet.in`; middleware for role-based access; background jobs for audits/penalties.
- **Storage:** PostgreSQL for relational data; S3-compatible bucket for resumes/files.
- **Messaging:** Stored messages only (no websockets); fetch by room with pagination and file/link previews.
- **Security:** Email domain validation, single-role enforcement, admin approval for alumni, soft bans, audit logging for referrals/penalties.

## Database Schema (key tables — snake_case everywhere)
- `users(id, email, password_hash, role [student|alumni|admin], status [pending|approved|banned], external_id (unique college ID; see format note), created_at)`
- `profiles(user_id FK users, name, bio, education, company, job_role, skills jsonb, tags text[], visibility [public|alumni_only], github_url, resume_url)`
- `projects(id, mentor_id FK users, title, description, repo_url, total_score, is_team_based, created_at)`
- `project_members(project_id FK projects, student_id FK users, contribution_score, star_awarded boolean set true by mentor when contribution is published/finalized, joined_at)`
- `communities(id, name, visibility [common|students|alumni])`
- `community_members(community_id FK communities, user_id FK users)`
- `messages(id, community_id FK communities, sender_id FK users, body, file_url, link_preview jsonb, created_at)`
- `referral_requests(id, project_id FK projects, student_id FK users, mentor_id FK users, status [pending|accepted|ignored|blocked], notes, created_at)`
- `badges(id, user_id FK users, badge_type enum('contribution','mentorship','reputation'), label varchar(255), description, earned_at)`
- `mentor_reputations(user_id FK users, score integer CHECK (score >= 0))`
- `admin_audits(id, actor_id FK users, action, target_id, details jsonb, created_at)`

**ID format note:** students `YYYY-DEPT-NNNN` (YYYY=batch year 2000–2099, DEPT=dept code, NNNN=zero-padded 4-digit serial); alumni `ALU-YYYY-NNNN`; admins `ADM-NNNN`.

## Core API Routes (REST)
- **Auth & Roles:** `POST /auth/register` (domain check + role), `POST /auth/login`, `POST /auth/approve-alumni`, `POST /auth/ban/:userId`.
- **Profiles:** `GET/PUT /profiles/me`, `GET /profiles/:id`, `POST /profiles/:id/resume`, `GET /search?q=`.
- **Projects:**  
  - `POST /projects` (mentor), `GET /projects`, `GET /projects/:id`  
  - Membership: `POST /projects/:id/join` (student), `DELETE /projects/:id/members/:student_id` (mentor removes students before scores publish; attempts after publish are rejected)  
  - Scoring: `PUT /projects/:id/scores` (mentor sets contribution_score and star_awarded; first publish via this endpoint locks scores—later calls rejected unless admin override)
- **Communities/Messaging:** `GET /communities`, `POST /communities/:id/messages`, `GET /communities/:id/messages?cursor=` (no realtime), files allowed.
- **Referrals:** `POST /referrals` (student request), `POST /referrals/:id/accept|ignore|block` (mentor), `GET /referrals/:id`.
- **Admin:** `GET /admin/alumni-pending`, `POST /admin/approve/:userId`, `POST /admin/penalize/:userId`, `POST /admin/projects/:id/scores` (admin override after publish), `GET /admin/audits`.

## Demo-Ready UI Outline
- **Authentication:** Domain-restricted signup, alumni pending badge; single role selection.
- **Dashboard:** Personalized feed; visibility toggle (public/alumni-only); GitHub logo button linking to profile.
- **Profiles:** Student cards with skills/tags/roles; resume preview; circular neon contribution chart with star badges indicating completion per project (driven by project_members.star_awarded).
- **Projects:** Project list with mentor, GitHub repo link, total score, contributors with split scores; mentor controls to remove students and set scores.
- **Communities:** Tabs for Common, Students, Alumni; chat-like threads with text, files, and link previews (no live updates).
- **Referrals:** Mentor inbox to accept/ignore/block; audit trail visible to admin.
- **Admin Panel:** Approve alumni, ban users, penalize fake contributions, review audits; mentor reputation and student badges surfaced.

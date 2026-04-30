const { db } = require('../config/firebase');

// --- Users ---

async function createUser(uid, userData) {
  // Enforce UID as the document key
  await db.collection('users').doc(uid).set(userData);
  return { id: uid, ...userData };
}

async function getUserByEmail(email) {
  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() }; // doc.id should match uid
}

async function getUserById(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateUserStatus(uid, status) {
  await db.collection('users').doc(uid).update({ status });
  return getUserById(uid);
}

// --- Profiles ---

async function createProfile(profileData) {
  const ref = await db.collection('profiles').add(profileData);
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() };
}

async function getProfileByUserId(uid) {
  const snap = await db.collection('profiles').where('user_id', '==', uid).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

// Alias for clarity
async function getProfileByUID(uid) {
    return getProfileByUserId(uid);
}

async function updateProfile(uid, updates) {
  const snap = await db.collection('profiles').where('user_id', '==', uid).limit(1).get();
  if (snap.empty) {
    throw new Error('Profile not found');
  }
  const docRef = snap.docs[0].ref;
  await docRef.update(updates);
  const updated = await docRef.get();
  return { id: updated.id, ...updated.data() };
}

async function searchProfiles(query) {
  if (!query || query.trim().length === 0) return [];
  
  const lowerQ = query.toLowerCase().trim();
  
  // Use multiple queries for better performance instead of client-side filtering
  const queries = [
    // Search by name
    db.collection('profiles').where('name', '>=', lowerQ).where('name', '<=', lowerQ + '\uf8ff').limit(20),
    // Search by bio
    db.collection('profiles').where('bio', '>=', lowerQ).where('bio', '<=', lowerQ + '\uf8ff').limit(20)
  ];
  
  const results = await Promise.all(queries.map(q => q.get()));
  const allDocs = results.flatMap(snap => snap.docs);
  
  // Remove duplicates and filter by skills if needed
  const uniqueDocs = new Map();
  allDocs.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    
    // Check if matches criteria
    const nameMatch = data.name && data.name.toLowerCase().includes(lowerQ);
    const bioMatch = data.bio && data.bio.toLowerCase().includes(lowerQ);
    const skillsMatch = Array.isArray(data.skills) && data.skills.some(s => s.toLowerCase().includes(lowerQ));
    
    if (nameMatch || bioMatch || skillsMatch) {
      if (!uniqueDocs.has(id)) {
        uniqueDocs.set(id, { id, ...data });
      }
    }
  });
  
  return Array.from(uniqueDocs.values()).slice(0, 50); // Limit results
}

// --- Projects ---

async function createProject(projectData) {
  const ref = await db.collection('projects').add({
    ...projectData,
    created_at: new Date().toISOString(),
    members: [] 
  });
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() };
}

async function getProjects() {
  const snap = await db.collection('projects').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getProjectById(id) {
  const doc = await db.collection('projects').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateProject(id, updates) {
  await db.collection('projects').doc(id).update(updates);
  return getProjectById(id);
}

// --- Communities & Messages ---

async function getCommunities() {
  try {
      const snap = await db.collection('communities').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
      console.error("Error getting communities", e);
      return [];
  }
}

async function ensureCommunitiesInit(defaultCommunities) {
    const existing = await getCommunities();
    if (existing.length === 0) {
        for (const c of defaultCommunities) {
            await db.collection('communities').doc(String(c.id)).set(c); 
        }
    }
}

async function createMessage(messageData) {
  const ref = await db.collection('messages').add({
    ...messageData,
    created_at: new Date().toISOString()
  });
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() };
}

async function getMessages(communityId, cursor) {
  try {
      let query = db.collection('messages')
        .where('community_id', '==', communityId)
        .orderBy('created_at', 'desc')
        .limit(50); // Limit for performance
      
      if (cursor) {
        query = query.startAfter(new Date(cursor));
      }
      
      const snap = await query.get();
      const msgs = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      
      // Return in chronological order (oldest first)
      return msgs.reverse();
  } catch (e) {
      console.error("Error fetching messages:", e);
      // Fallback to basic query if ordering fails
      try {
        const snap = await db.collection('messages')
          .where('community_id', '==', communityId)
          .limit(50)
          .get();
        
        let msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort by created_at in-memory as fallback
        msgs.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
          return dateA - dateB;
        });
        
        if (cursor) {
          msgs = msgs.filter(m => new Date(m.created_at) > new Date(cursor));
        }
        
        return msgs;
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return [];
      }
  }
}

// --- Audits ---

async function addAuditEntry(entry) {
  try {
      await db.collection('audits').add({
        ...entry,
        created_at: new Date().toISOString()
      });
  } catch (e) {
      console.error("Audit fail", e);
  }
}

// --- Referrals ---

async function createReferral(referralData) {
    const ref = await db.collection('referrals').add(referralData);
    return { id: ref.id, ...referralData };
}

async function getReferralsForUser(uid, role) {
    let query;
    if (role === 'student') {
        query = db.collection('referrals').where('student_id', '==', uid);
    } else {
        query = db.collection('referrals').where('mentor_id', '==', uid);
    }
    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getReferralById(id) {
    const doc = await db.collection('referrals').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
}

async function updateReferral(id, updates) {
    await db.collection('referrals').doc(id).update(updates);
    return getReferralById(id);
}

module.exports = {
  db,
  createUser,
  getUserByEmail,
  getUserById,
  updateUserStatus,
  createProfile,
  getProfileByUserId,
  getProfileByUID,
  updateProfile,
  searchProfiles,
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  getCommunities,
  ensureCommunitiesInit,
  createMessage,
  getMessages,
  addAuditEntry,
  createReferral,
  getReferralsForUser,
  getReferralById,
  updateReferral
};

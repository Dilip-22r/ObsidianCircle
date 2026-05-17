const firestoreService = require('./services/firestore');
const { admin } = require('./config/firebase');

async function createAdmin() {
  try {
    const email = 'admin@vnrvjiet.in';
    const password = 'adminpassword123';
    
    // 1. Create User in Firebase Auth
    let user;
    try {
        user = await admin.auth().createUser({
        email,
        password,
        displayName: 'Platform Admin'
        });
        console.log('Firebase auth user created with uid:', user.uid);
    } catch (e) {
        if (e.code === 'auth/email-already-exists') {
            user = await admin.auth().getUserByEmail(email);
            console.log('Firebase auth user already exists:', user.uid);
            await admin.auth().updateUser(user.uid, { password });
            console.log('Password updated for existing auth user');
        } else {
            throw e;
        }
    }

    // 2. Create User in Firestore with SAME UID
    const userData = {
      email,
      role: 'admin',
      status: 'approved',
      external_id: 'ADM-0001',
      created_at: new Date().toISOString()
    };

    await firestoreService.createUser(user.uid, userData);
    console.log('Firestore user document created');

    // 3. Create Profile
    await firestoreService.createProfile({
      user_id: user.uid,
      name: 'Platform Admin',
      skills: [],
      visibility: 'public',
      developmentProfile: { github: '', portfolio: '' },
      dsaProfile: { leetcode: '', codeforces: '', codechef: '', hackerrank: '', spoil: '' },
      tags: ['admin'],
      bio: 'Administrator account',
      education: 'VNR VJIET',
      company: 'Obsidian Circle',
      job_role: 'Admin',
      github_url: '',
      resume_url: ''
    });
    console.log('Firestore profile document created');

    console.log('\n--- ADMIN CREDENTIALS ---');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('-------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

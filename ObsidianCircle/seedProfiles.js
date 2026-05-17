const firestoreService = require('./services/firestore');

const sampleProfiles = [
  {
    user_id: "ALU-9999",
    name: "John Doe",
    bio: "Passionate software engineer with 5+ years of experience in full-stack development. I love mentoring students and guiding them through complex system design.",
    education: "VNR VJIET",
    company: "Google",
    job_role: "Senior Software Engineer",
    skills: ["React", "Node.js", "System Design", "Mentorship"],
    github_url: "https://github.com/johndoe",
    role: "alumni"
  },
  {
    user_id: "STU-8888",
    name: "Alice Smith",
    bio: "Final year CS student interested in Machine Learning and backend engineering. Currently looking for collaborative projects.",
    education: "B.Tech CSE, VNR VJIET",
    company: "Startup Inc (Intern)",
    job_role: "Student",
    skills: ["Python", "Machine Learning", "C++", "Docker"],
    github_url: "https://github.com/alicesmith",
    role: "student"
  },
  {
    user_id: "ALU-7777",
    name: "Bob Builder",
    bio: "I build scalable cloud architectures. Let's talk about AWS, microservices, and clean code.",
    education: "VNR VJIET",
    company: "Amazon Web Services",
    job_role: "Cloud Architect",
    skills: ["AWS", "Kubernetes", "Golang", "Microservices"],
    github_url: "https://github.com/bobbuilder",
    role: "alumni"
  }
];

const sampleUsers = sampleProfiles.map(p => ({
  uid: p.user_id,
  email: `${p.name.replace(/\s+/g, '').toLowerCase()}@example.com`,
  role: p.role,
  status: "active"
}));

async function seed() {
  try {
    for (const u of sampleUsers) {
      await firestoreService.createUser(u.uid, { email: u.email, role: u.role, status: u.status });
      console.log(`Created user: ${u.email}`);
    }

    for (const p of sampleProfiles) {
      const created = await firestoreService.createProfile(p);
      console.log(`Created profile for: ${p.name}`);
    }
    
    console.log("Successfully seeded users and profiles!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

seed();

const firestoreService = require('./services/firestore');

const sampleProjects = [
  {
    mentor_id: "ALU-SAMPLE",
    title: "Smart Campus Attendance System",
    description: "An AI-based attendance tracking system using facial recognition to streamline college attendance. Tech stack: Python, OpenCV, React, Firebase.",
    repo_url: "https://github.com/sample/smart-attendance",
    total_score: 100,
    is_team_based: true,
    published: false,
    members: []
  },
  {
    mentor_id: "ALU-SAMPLE-2",
    title: "NextGen E-Commerce Dashboard",
    description: "A full-stack modern e-commerce admin dashboard with real-time analytics. Tech stack: Next.js, Node.js, MongoDB.",
    repo_url: "https://github.com/sample/ecommerce-app",
    total_score: 150,
    is_team_based: false,
    published: false,
    members: []
  },
  {
    mentor_id: "ALU-SAMPLE",
    title: "Decentralized Voting Application",
    description: "Secure and transparent voting application built on the Ethereum blockchain for campus elections. Tech stack: Solidity, React, Hardhat.",
    repo_url: "",
    total_score: 120,
    is_team_based: true,
    published: false,
    members: []
  }
];

async function seed() {
  try {
    for (const proj of sampleProjects) {
      const created = await firestoreService.createProject(proj);
      console.log(`Created project: ${created.title} with ID: ${created.id}`);
    }
    console.log("Successfully seeded sample projects!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding projects:", error);
    process.exit(1);
  }
}

seed();

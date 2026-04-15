import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD40-CDvLTqb5zSQeWZmY7vlDPjIeEeAGk",
  authDomain: "obsidian-circle-393f2.firebaseapp.com",
  projectId: "obsidian-circle-393f2",
  storageBucket: "obsidian-circle-393f2.firebasestorage.app",
  messagingSenderId: "503721122220",
  appId: "1:503721122220:web:5fc4ef02a22c3361260209",
  measurementId: "G-0Y4F3F7RPR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;

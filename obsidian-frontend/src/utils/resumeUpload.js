import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload resume file to Firebase Storage
 * @param {File} file - The resume file to upload
 * @param {string} userId - The user's ID for organizing files
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<string>} - Download URL of uploaded file
 */
export async function uploadResume(file, userId, onProgress) {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a PDF or DOC file');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Create unique filename
  const timestamp = Date.now();
  const fileName = `resumes/${userId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, fileName);

  // Upload file with progress tracking
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Update user's resume URL in backend
 */
export async function updateResumeURL(resumeUrl) {
  const token = localStorage.getItem('session_token');
  
  const response = await fetch('http://localhost:3001/profiles/me/resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ resume_url: resumeUrl })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update resume');
  }

  return await response.json();
}

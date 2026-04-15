import { useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadResume, updateResumeURL } from '../../utils/resumeUpload';

export default function ResumeUploader({ userId, onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload to Firebase Storage
      const downloadURL = await uploadResume(file, userId, setUploadProgress);

      // Update backend profile
      await updateResumeURL(downloadURL);

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(downloadURL);
      }

      alert('✅ Resume uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        id="resume-upload"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      <label
        htmlFor="resume-upload"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          background: isUploading ? '#F3F4F6' : '#F9FAFB',
          border: '1px dashed #D1D5DB',
          borderRadius: '6px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          color: isUploading ? '#9CA3AF' : '#6B7280',
          width: '100%',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => !isUploading && (e.currentTarget.style.borderColor = '#6366F1')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
      >
        <Upload size={16} />
        {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Resume (PDF/DOC)'}
      </label>
      
      {isUploading && (
        <div style={{
          marginTop: '8px',
          height: '4px',
          background: '#E5E7EB',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${uploadProgress}%`,
            background: 'linear-gradient(90deg, #6366F1 0%, #A855F7 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
    </div>
  );
}

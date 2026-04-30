const { bucket } = require('../config/firebase');

exports.uploadResume = async (uid, file) => {
  const dest = `resumes/${uid}/${file.originalname}`;
  const blob = bucket.file(dest);

  await blob.save(file.buffer, { contentType: file.mimetype });
  const [url] = await blob.getSignedUrl({
    action: 'read',
    expires: '03-01-2030',
  });

  return url;
};

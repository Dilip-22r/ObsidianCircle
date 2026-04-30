
const validDepartments = ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL'];

exports.validateRegistration = (data) => {
  const { email, password, role, external_id } = data;
  const errors = [];

  if (!email || !email.endsWith('@vnrvjiet.in')) {
    errors.push('Email must be a valid @vnrvjiet.in address');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!['student', 'alumni', 'admin'].includes(role)) {
    errors.push('Invalid role');
  }

  if (role === 'student') {
    const match = /^20(\d{2})-([A-Z]+)-(\d{4})$/.exec(external_id);
    if (!match) {
      errors.push('Invalid student ID format (e.g., 2024-CSE-0001)');
    } else {
       if (!validDepartments.includes(match[2])) errors.push('Invalid department code');
    }
  } else if (role === 'alumni') {
    if (!/^ALU-20\d{2}-\d{4}$/.test(external_id)) {
      errors.push('Invalid alumni ID format (e.g., ALU-2024-0001)');
    }
  } else if (role === 'admin') {
     if (!/^ADM-\d{4}$/.test(external_id)) {
        errors.push('Invalid admin ID format (e.g., ADM-0001)');
     }
  }

  return errors;
};

exports.validateProject = (data) => {
  const { title, description } = data;
  const errors = [];
  if (!title || title.trim().length < 3) errors.push('Title is required (min 3 chars)');
  if (!description || description.trim().length < 10) errors.push('Description is required (min 10 chars)');
  return errors;
};

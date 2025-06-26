// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/
};

// Validation messages
const messages = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address'
  },
  password: {
    required: 'Password is required',
    invalid: 'Password must be at least 6 characters with at least one letter and one number'
  },
  username: {
    required: 'Username is required',
    invalid: 'Username must be 3-20 characters (letters, numbers, underscores)'
  }
};

// Validate signup form inputs
export function validateSignup(email, password, username) {
  const errors = [];
  
  // Email validation
  if (!email) {
    errors.push(messages.email.required);
  } else if (!patterns.email.test(email)) {
    errors.push(messages.email.invalid);
  }
  
  // Password validation
  if (!password) {
    errors.push(messages.password.required);
  } else if (!patterns.password.test(password)) {
    errors.push(messages.password.invalid);
  }
  
  // Username validation
  if (!username) {
    errors.push(messages.username.required);
  } else if (!patterns.username.test(username)) {
    errors.push(messages.username.invalid);
  }
  
  return errors;
}

// Validate login form inputs
export function validateLogin(email, password) {
  const errors = [];
  
  // Email validation
  if (!email) {
    errors.push(messages.email.required);
  } else if (!patterns.email.test(email)) {
    errors.push(messages.email.invalid);
  }
  
  // Password validation
  if (!password) {
    errors.push(messages.password.required);
  }
  
  return errors;
}

// Validate password reset form
export function validatePasswordReset(email) {
  const errors = [];
  
  if (!email) {
    errors.push(messages.email.required);
  } else if (!patterns.email.test(email)) {
    errors.push(messages.email.invalid);
  }
  
  return errors;
}

// Validate group submission form
export function validateGroupSubmission(groupMembers, file) {
  const errors = [];
  
  // Validate at least one group member
  if (!groupMembers || groupMembers.length === 0) {
    errors.push('At least one group member is required');
  } else {
    // Validate each group member
    groupMembers.forEach((member, index) => {
      if (!member.name) {
        errors.push(`Member ${index + 1}: Name is required`);
      }
    });
  }
  
  // Validate file
  if (!file) {
    errors.push('Assignment file is required');
  } else {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      errors.push('Only PDF and Word documents are allowed');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      errors.push('File size must be less than 5MB');
    }
  }
  
  return errors;
}

// Validate user profile form
export function validateProfile(username, currentPassword, newPassword) {
  const errors = [];
  
  // Username validation
  if (!username) {
    errors.push(messages.username.required);
  } else if (!patterns.username.test(username)) {
    errors.push(messages.username.invalid);
  }
  
  // Password validation (if changing)
  if (newPassword) {
    if (!currentPassword) {
      errors.push('Current password is required to change password');
    }
    
    if (!patterns.password.test(newPassword)) {
      errors.push(messages.password.invalid);
    }
  }
  
  return errors;
}

// Helper function to validate a single field
export function validateField(fieldName, value) {
  switch (fieldName) {
    case 'email':
      if (!value) return messages.email.required;
      if (!patterns.email.test(value)) return messages.email.invalid;
      break;
    case 'password':
      if (!value) return messages.password.required;
      if (!patterns.password.test(value)) return messages.password.invalid;
      break;
    case 'username':
      if (!value) return messages.username.required;
      if (!patterns.username.test(value)) return messages.username.invalid;
      break;
    default:
      return '';
  }
  
  return '';
}
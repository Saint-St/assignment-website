// src/scripts/main.js

// Import Firebase services
import { auth, db, storage } from '/src/scripts/firebase/config';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from "/src/scripts/firebase/auth";
import { 
  addUser, 
  getUser, 
  submitAssignment, 
  getAllSubmissions,
  isAdmin
} from '/src/scripts/firebase/db';
import { 
  uploadFile, 
  validateFileType, 
  validateFileSize 
} from '/src/scripts/firebase/storage';
import { generateExcel } from './utils/excel';

// DOM Elements
const authForms = {
  login: document.getElementById('login-form'),
  signup: document.getElementById('signup-form'),
  logout: document.getElementById('logout-btn')
};

const pages = {
  auth: document.getElementById('auth-page'),
  student: document.getElementById('student-dashboard'),
  admin: document.getElementById('admin-dashboard'),
  submission: document.getElementById('submission-page'),
  error: document.getElementById('error-page')
};

const submissionForm = document.getElementById('submission-form');
const groupMembersContainer = document.getElementById('group-members');
const addMemberBtn = document.getElementById('add-member');
const fileInput = document.getElementById('assignment-file');
const fileError = document.getElementById('file-error');

// State
let currentUser = null;
let isUserAdmin = false;

// Initialize the app
function init() {
  setupAuthListeners();
  setupEventListeners();
  checkCurrentPage();
}

// Check which page we're on and show appropriate content
function checkCurrentPage() {
  const path = window.location.pathname.split('/').pop();
  
  if (path === 'admin.html' && !isUserAdmin) {
    showPage('error');
    return;
  }
  
  if (currentUser) {
    if (path === 'submission.html') {
      showPage('submission');
    } else if (path === 'admin.html' && isUserAdmin) {
      showPage('admin');
      loadAdminData();
    } else {
      showPage('student');
    }
  } else {
    showPage('auth');
  }
}

// Show a specific page and hide others
function showPage(pageName) {
  Object.keys(pages).forEach(page => {
    pages[page].style.display = page === pageName ? 'block' : 'none';
  });
}

// Setup authentication state listener
function setupAuthListeners() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userData = await getUser(user.uid);
      isUserAdmin = await isAdmin(user.uid);
      
      if (userData) {
        updateUIForUser(userData);
        checkCurrentPage();
      }
    } else {
      currentUser = null;
      isUserAdmin = false;
      showPage('auth');
    }
  });
}

// Update UI based on user data
function updateUIForUser(userData) {
  const usernameElements = document.querySelectorAll('.username');
  usernameElements.forEach(el => {
    el.textContent = userData.username;
  });
  
  if (isUserAdmin) {
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'block';
    });
  }
}

// Setup event listeners
function setupEventListeners() {
  // Auth forms
  if (authForms.login) {
    authForms.login.addEventListener('submit', handleLogin);
  }
  
  if (authForms.signup) {
    authForms.signup.addEventListener('submit', handleSignup);
  }
  
  if (authForms.logout) {
    authForms.logout.addEventListener('click', handleLogout);
  }
  
  // Submission form
  if (submissionForm) {
    submissionForm.addEventListener('submit', handleSubmission);
  }
  
  // Add group member button
  if (addMemberBtn) {
    addMemberBtn.addEventListener('click', addGroupMemberField);
  }
  
  // File input validation
  if (fileInput) {
    fileInput.addEventListener('change', validateFileInput);
  }
  
  // Admin download button
  const downloadBtn = document.getElementById('download-excel');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', handleDownloadExcel);
  }
}

// Authentication handlers
async function handleLogin(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the redirect
  } catch (error) {
    showError('login-error', error.message);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const username = e.target.username.value;
  const password = e.target.password.value;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await addUser(userCredential.user.uid, email, username);
    // Redirect to submission page after successful signup
    window.location.href = 'submission.html';
  } catch (error) {
    showError('signup-error', error.message);
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Error signing out: ", error);
  }
}

// Submission handlers
function addGroupMemberField() {
  const memberCount = groupMembersContainer.querySelectorAll('.member-input').length;
  
  if (memberCount >= 10) {
    alert('Maximum of 10 group members allowed');
    return;
  }
  
  const div = document.createElement('div');
  div.className = 'member-input';
  div.innerHTML = `
    <input type="text" placeholder="Group member name" required>
    <button type="button" class="remove-member">×</button>
  `;
  
  groupMembersContainer.appendChild(div);
  
  // Add event listener to remove button
  div.querySelector('.remove-member').addEventListener('click', () => {
    groupMembersContainer.removeChild(div);
  });
}

function validateFileInput() {
  const file = fileInput.files[0];
  fileError.textContent = '';
  
  if (!file) return;
  
  if (!validateFileType(file)) {
    fileError.textContent = 'Only PDF, DOC, and DOCX files are allowed';
    fileInput.value = '';
    return;
  }
  
  if (!validateFileSize(file)) {
    fileError.textContent = 'File size must be less than 10MB';
    fileInput.value = '';
    return;
  }
}

async function handleSubmission(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  
  try {
    // Get group members
    const memberInputs = groupMembersContainer.querySelectorAll('input');
    const groupMembers = Array.from(memberInputs).map(input => input.value.trim()).filter(name => name);
    
    if (groupMembers.length === 0) {
      throw new Error('Please add at least one group member');
    }
    
    // Get file
    const file = fileInput.files[0];
    if (!file) {
      throw new Error('Please select a file to upload');
    }
    
    // Upload file
    const fileUrl = await uploadFile(file, currentUser.uid);
    
    // Submit assignment data
    const userData = await getUser(currentUser.uid);
    await submitAssignment(currentUser.uid, userData.username, groupMembers, fileUrl);
    
    // Show success message
    showSuccess('Submission successful!');
    
    // Reset form
    submissionForm.reset();
    groupMembersContainer.innerHTML = '';
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
  } catch (error) {
    showError('submission-error', error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Assignment';
  }
}

// Admin handlers
async function loadAdminData() {
  try {
    const submissions = await getAllSubmissions();
    renderSubmissionsTable(submissions);
  } catch (error) {
    console.error("Error loading admin data: ", error);
    showError('admin-error', 'Failed to load submissions');
  }
}

function renderSubmissionsTable(submissions) {
  const tableBody = document.querySelector('#submissions-table tbody');
  tableBody.innerHTML = '';
  
  if (submissions.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No submissions yet</td></tr>';
    return;
  }
  
  submissions.forEach(sub => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${sub.username}</td>
      <td>${sub.userId}</td>
      <td>${sub.groupMembers.join(', ')}</td>
      <td>${new Date(sub.submittedAt.seconds * 1000).toLocaleString()}</td>
      <td><a href="${sub.fileUrl}" target="_blank">Download</a></td>
    `;
    tableBody.appendChild(row);
  });
}

async function handleDownloadExcel() {
  try {
    const submissions = await getAllSubmissions();
    
    // Prepare data for Excel
    const excelData = submissions.flatMap(sub => 
      sub.groupMembers.map(member => ({
        'Group Leader': sub.username,
        'Leader Email': sub.userId,
        'Member Name': member,
        'Submission Date': new Date(sub.submittedAt.seconds * 1000).toLocaleString(),
        'File URL': sub.fileUrl
      }))
    );
    
    // Generate and download Excel
    generateExcel(excelData, 'submissions');
    showSuccess('Excel file downloaded successfully');
  } catch (error) {
    console.error("Error generating Excel: ", error);
    showError('excel-error', 'Failed to generate Excel file');
  }
}

// Utility functions
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
}

function showSuccess(message) {
  const successElement = document.getElementById('success-message');
  if (successElement) {
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => {
      successElement.style.display = 'none';
    }, 5000);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
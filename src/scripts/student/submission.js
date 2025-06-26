import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { firebaseConfig } from '../../firebase/config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getGroupMembers } from './group.js';
import { validateGroupSubmission } from '../../auth/validator.js';
import { showLoading, hideLoading, showError, showSuccess } from '../../utils/helpers.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const submissionForm = document.getElementById('submission-form');
const fileInput = document.getElementById('assignment-file');
const fileLabel = document.getElementById('file-label');
const previewBtn = document.getElementById('preview-btn');
const submitBtn = document.getElementById('submit-btn');
const groupSummary = document.getElementById('group-summary');

// Event Listeners
if (fileInput) {
  fileInput.addEventListener('change', handleFileSelect);
}

if (previewBtn) {
  previewBtn.addEventListener('click', previewSubmission);
}

if (submissionForm) {
  submissionForm.addEventListener('submit', handleSubmission);
}

// Initialize submission page
document.addEventListener('DOMContentLoaded', () => {
  // Load saved group data if exists
  const savedGroup = localStorage.getItem('currentGroup');
  if (savedGroup && groupSummary) {
    try {
      const members = JSON.parse(savedGroup);
      updateGroupSummary(members);
    } catch (error) {
      console.error('Error loading saved group:', error);
    }
  }
  
  // Disable submit button if no file selected
  if (submitBtn && !fileInput.files[0]) {
    submitBtn.disabled = true;
  }
});

// Handle file selection
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Update file label
  fileLabel.textContent = file.name;
  fileLabel.title = file.name;
  
  // Enable/disable buttons
  previewBtn.disabled = false;
  submitBtn.disabled = false;
  
  // Validate file
  const errors = validateGroupSubmission([], file);
  if (errors.length > 0) {
    showError(errors.join('<br>'));
    submitBtn.disabled = true;
    return;
  }
}

// Preview submission before final submit
function previewSubmission() {
  const file = fileInput.files[0];
  if (!file) return;
  
  const members = getGroupMembers();
  const errors = validateGroupSubmission(members, file);
  
  if (errors.length > 0) {
    showError(errors.join('<br>'));
    return;
  }
  
  // Create preview content
  let previewContent = `
    <h3>Submission Preview</h3>
    <p><strong>File:</strong> ${file.name}</p>
    
    <h4>Group Members</h4>
    <ul class="preview-members">
      ${members.map(member => `
        <li>${member.name} ${member.email ? `(${member.email})` : ''}</li>
      `).join('')}
    </ul>
    
    <p>Please review your submission before finalizing.</p>
  `;
  
  // Show preview modal
  showModal('preview-modal', previewContent);
}

// Handle assignment submission
async function handleSubmission(e) {
  e.preventDefault();
  
  const file = fileInput.files[0];
  const members = getGroupMembers();
  
  // Validate inputs
  const errors = validateGroupSubmission(members, file);
  if (errors.length > 0) {
    showError(errors.join('<br>'));
    return;
  }
  
  // Check if user is authenticated
  const user = auth.currentUser;
  if (!user) {
    showError('You must be logged in to submit');
    window.location.href = '../auth/login.html';
    return;
  }
  
  try {
    showLoading();
    submitBtn.disabled = true;
    
    // Upload file to Firebase Storage
    const fileExt = file.name.split('.').pop();
    const storagePath = `submissions/${user.uid}/${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Create submission document in Firestore
    const submissionData = {
      groupLeaderId: user.uid,
      groupLeaderEmail: user.email,
      groupLeaderName: user.displayName || 'Unknown',
      groupMembers: members,
      fileName: file.name,
      filePath: storagePath,
      fileURL: downloadURL,
      submittedAt: serverTimestamp(),
      status: 'submitted',
      grade: null,
      feedback: null
    };
    
    const submissionRef = doc(collection(db, 'submissions'));
    await setDoc(submissionRef, submissionData);
    
    // Clear form and local storage
    submissionForm.reset();
    fileLabel.textContent = 'Choose file...';
    localStorage.removeItem('currentGroup');
    updateGroupSummary([]);
    
    showSuccess('Assignment submitted successfully!');
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 3000);
    
  } catch (error) {
    console.error('Submission error:', error);
    showError('Failed to submit assignment. Please try again.');
    submitBtn.disabled = false;
  } finally {
    hideLoading();
  }
}

// Update group summary display
export function updateGroupSummary(members) {
  if (!groupSummary) return;
  
  if (members.length === 0) {
    groupSummary.innerHTML = '<p>No group members added yet.</p>';
    return;
  }
  
  groupSummary.innerHTML = `
    <h4>Your Group</h4>
    <ul class="member-list">
      ${members.map(member => `
        <li>${member.name} ${member.email ? `(${member.email})` : ''}</li>
      `).join('')}
    </ul>
    <p class="edit-hint">Edit group members from the dashboard</p>
  `;
}

// Public API
export { updateGroupSummary };
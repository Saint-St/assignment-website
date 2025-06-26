import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  getDownloadURL,
  deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { firebaseConfig } from '../firebase/config.js';
import { exportToExcel } from '../utils/excel.js';
import { showModal, closeModal } from '../components/modal.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const submissionsTable = document.getElementById('submissions-table');
const submissionsBody = document.getElementById('submissions-body');
const exportBtn = document.getElementById('export-btn');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const loadingIndicator = document.getElementById('loading-indicator');

// Global variables
let allSubmissions = [];
let currentSubmissionToDelete = null;

// Event Listeners
exportBtn.addEventListener('click', exportSubmissions);
searchInput.addEventListener('input', filterSubmissions);
filterSelect.addEventListener('change', filterSubmissions);
confirmDeleteBtn.addEventListener('click', confirmDelete);
cancelDeleteBtn.addEventListener('click', () => closeModal('delete-modal'));

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  try {
    loadingIndicator.style.display = 'block';
    await fetchSubmissions();
    loadingIndicator.style.display = 'none';
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    loadingIndicator.style.display = 'none';
    showError('Failed to load submissions. Please try again.');
  }
});

// Fetch all submissions from Firestore
async function fetchSubmissions() {
  try {
    const q = query(collection(db, 'submissions'));
    const querySnapshot = await getDocs(q);
    
    allSubmissions = [];
    submissionsBody.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
      const submission = doc.data();
      submission.id = doc.id;
      allSubmissions.push(submission);
      
      // Add row to table
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${submission.groupLeaderName || 'N/A'}</td>
        <td>${submission.groupLeaderEmail}</td>
        <td>${submission.groupMembers.length}</td>
        <td>${new Date(submission.submittedAt).toLocaleString()}</td>
        <td>
          <button class="btn-view" data-id="${doc.id}">View</button>
          <button class="btn-download" data-id="${doc.id}">Download</button>
          <button class="btn-delete" data-id="${doc.id}">Delete</button>
        </td>
      `;
      submissionsBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', viewSubmission);
    });
    
    document.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', downloadSubmission);
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', promptDelete);
    });
    
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}

// View submission details
function viewSubmission(e) {
  const submissionId = e.target.getAttribute('data-id');
  const submission = allSubmissions.find(sub => sub.id === submissionId);
  
  if (!submission) return;
  
  // Create modal content
  const modalContent = `
    <h2>Submission Details</h2>
    <div class="submission-details">
      <p><strong>Group Leader:</strong> ${submission.groupLeaderName}</p>
      <p><strong>Email:</strong> ${submission.groupLeaderEmail}</p>
      <p><strong>Submission Date:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
      
      <h3>Group Members</h3>
      <ul class="member-list">
        ${submission.groupMembers.map(member => `<li>${member.name} (${member.email || 'N/A'})</li>`).join('')}
      </ul>
      
      <p><strong>File:</strong> ${submission.fileName}</p>
    </div>
    <button class="btn-download" data-id="${submissionId}">Download File</button>
  `;
  
  showModal('view-submission', modalContent);
  
  // Add download button event listener
  document.querySelector('#view-submission .btn-download').addEventListener('click', downloadSubmission);
}

// Download submission file
async function downloadSubmission(e) {
  const submissionId = e.target.getAttribute('data-id');
  const submission = allSubmissions.find(sub => sub.id === submissionId);
  
  if (!submission || !submission.filePath) {
    showError('File not found');
    return;
  }
  
  try {
    const downloadURL = await getDownloadURL(ref(storage, submission.filePath));
    window.open(downloadURL, '_blank');
  } catch (error) {
    console.error('Error downloading file:', error);
    showError('Failed to download file');
  }
}

// Prompt for deletion
function promptDelete(e) {
  const submissionId = e.target.getAttribute('data-id');
  currentSubmissionToDelete = submissionId;
  
  const submission = allSubmissions.find(sub => sub.id === submissionId);
  const modalContent = `
    <h2>Confirm Deletion</h2>
    <p>Are you sure you want to delete the submission by <strong>${submission.groupLeaderName}</strong>?</p>
    <p>This action cannot be undone.</p>
  `;
  
  document.getElementById('delete-modal-content').innerHTML = modalContent;
  showModal('delete-modal');
}

// Confirm and delete submission
async function confirmDelete() {
  if (!currentSubmissionToDelete) return;
  
  try {
    loadingIndicator.style.display = 'block';
    closeModal('delete-modal');
    
    const submission = allSubmissions.find(sub => sub.id === currentSubmissionToDelete);
    
    // Delete file from storage if exists
    if (submission.filePath) {
      const fileRef = ref(storage, submission.filePath);
      await deleteObject(fileRef);
    }
    
    // Delete document from Firestore
    await deleteDoc(doc(db, 'submissions', currentSubmissionToDelete));
    
    // Refresh the table
    await fetchSubmissions();
    showSuccess('Submission deleted successfully');
    
  } catch (error) {
    console.error('Error deleting submission:', error);
    showError('Failed to delete submission');
  } finally {
    loadingIndicator.style.display = 'none';
    currentSubmissionToDelete = null;
  }
}

// Export submissions to Excel
function exportSubmissions() {
  try {
    // Prepare data for export
    const exportData = allSubmissions.flatMap(submission => {
      return submission.groupMembers.map(member => ({
        'Group Leader': submission.groupLeaderName,
        'Leader Email': submission.groupLeaderEmail,
        'Member Name': member.name,
        'Member Email': member.email || 'N/A',
        'Submission Date': new Date(submission.submittedAt).toLocaleString(),
        'File Name': submission.fileName
      }));
    });
    
    exportToExcel(exportData, 'submissions_export.xlsx');
    showSuccess('Export completed successfully');
  } catch (error) {
    console.error('Error exporting submissions:', error);
    showError('Failed to export submissions');
  }
}

// Filter submissions based on search and filter criteria
function filterSubmissions() {
  const searchTerm = searchInput.value.toLowerCase();
  const filterValue = filterSelect.value.toLowerCase();
  
  const filteredSubmissions = allSubmissions.filter(submission => {
    // Filter by search term
    const matchesSearch = 
      submission.groupLeaderName.toLowerCase().includes(searchTerm) ||
      submission.groupLeaderEmail.toLowerCase().includes(searchTerm) ||
      submission.groupMembers.some(member => 
        member.name.toLowerCase().includes(searchTerm) || 
        (member.email && member.email.toLowerCase().includes(searchTerm))
      );
    
    // Filter by status (if implemented)
    const matchesFilter = filterValue === 'all' || true; // Add actual filter logic
    
    return matchesSearch && matchesFilter;
  });
  
  // Update table
  submissionsBody.innerHTML = '';
  filteredSubmissions.forEach(submission => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${submission.groupLeaderName || 'N/A'}</td>
      <td>${submission.groupLeaderEmail}</td>
      <td>${submission.groupMembers.length}</td>
      <td>${new Date(submission.submittedAt).toLocaleString()}</td>
      <td>
        <button class="btn-view" data-id="${submission.id}">View</button>
        <button class="btn-download" data-id="${submission.id}">Download</button>
        <button class="btn-delete" data-id="${submission.id}">Delete</button>
      </td>
    `;
    submissionsBody.appendChild(row);
  });
  
  // Reattach event listeners
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', viewSubmission);
  });
  
  document.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', downloadSubmission);
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', promptDelete);
  });
}

// Helper function to show success message
function showSuccess(message) {
  const alert = document.createElement('div');
  alert.className = 'alert success';
  alert.textContent = message;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

// Helper function to show error message
function showError(message) {
  const alert = document.createElement('div');
  alert.className = 'alert error';
  alert.textContent = message;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 3000);
}
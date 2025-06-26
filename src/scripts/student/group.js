import { showError, showSuccess, showLoading, hideLoading } from '../../utils/helpers.js';

// DOM Elements
const groupForm = document.getElementById('group-form');
const addMemberBtn = document.getElementById('add-member-btn');
const membersContainer = document.getElementById('members-container');
const memberTemplate = document.getElementById('member-template');

// Initialize member counter
let memberCount = 1;

// Event Listeners
if (addMemberBtn) {
  addMemberBtn.addEventListener('click', addMemberField);
}

if (groupForm) {
  groupForm.addEventListener('submit', handleGroupSave);
}

// Initialize group form
document.addEventListener('DOMContentLoaded', () => {
  // Add first member field by default
  if (membersContainer.children.length === 0) {
    addMemberField();
  }
});

// Add new member field
function addMemberField() {
  if (memberCount >= 10) {
    showError('Maximum of 10 group members allowed');
    return;
  }

  const newMember = memberTemplate.content.cloneNode(true);
  const memberDiv = newMember.querySelector('.member-row');
  memberDiv.dataset.index = memberCount;
  
  // Update input names and IDs
  const inputs = memberDiv.querySelectorAll('input');
  inputs.forEach(input => {
    input.name = input.name.replace('0', memberCount);
    input.id = input.id.replace('0', memberCount);
  });
  
  // Add remove button
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-member-btn';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', () => removeMemberField(memberDiv));
  memberDiv.querySelector('.member-actions').appendChild(removeBtn);
  
  membersContainer.appendChild(memberDiv);
  memberCount++;
}

// Remove member field
function removeMemberField(memberDiv) {
  if (membersContainer.children.length <= 1) {
    showError('At least one group member is required');
    return;
  }
  
  memberDiv.remove();
  memberCount--;
  reindexMemberFields();
}

// Reindex member fields after removal
function reindexMemberFields() {
  const members = membersContainer.querySelectorAll('.member-row');
  members.forEach((member, index) => {
    member.dataset.index = index;
    
    // Update input names and IDs
    const inputs = member.querySelectorAll('input');
    inputs.forEach(input => {
      input.name = input.name.replace(/\d+/, index);
      input.id = input.id.replace(/\d+/, index);
    });
  });
}

// Handle group save (local storage)
function handleGroupSave(e) {
  e.preventDefault();
  
  const members = getGroupMembers();
  
  if (members.length === 0) {
    showError('At least one group member is required');
    return;
  }
  
  try {
    showLoading();
    
    // Save to localStorage (temporary until submission)
    localStorage.setItem('currentGroup', JSON.stringify(members));
    
    showSuccess('Group members saved successfully');
    
    // Enable submission button if on dashboard
    const submitBtn = document.getElementById('submit-assignment-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('Error saving group:', error);
    showError('Failed to save group members');
  } finally {
    hideLoading();
  }
}

// Get all group members from form
export function getGroupMembers() {
  const members = [];
  const memberRows = membersContainer.querySelectorAll('.member-row');
  
  memberRows.forEach(row => {
    const nameInput = row.querySelector('input[name^="member-name"]');
    const emailInput = row.querySelector('input[name^="member-email"]');
    
    if (nameInput.value.trim()) {
      members.push({
        name: nameInput.value.trim(),
        email: emailInput.value.trim() || null
      });
    }
  });
  
  return members;
}

// Load saved group from localStorage
export function loadSavedGroup() {
  const savedGroup = localStorage.getItem('currentGroup');
  if (!savedGroup) return;
  
  try {
    const members = JSON.parse(savedGroup);
    
    // Clear existing members
    membersContainer.innerHTML = '';
    memberCount = 0;
    
    // Add saved members
    members.forEach((member, index) => {
      addMemberField();
      const lastRow = membersContainer.lastChild;
      const nameInput = lastRow.querySelector('input[name^="member-name"]');
      const emailInput = lastRow.querySelector('input[name^="member-email"]');
      
      nameInput.value = member.name;
      if (member.email) {
        emailInput.value = member.email;
      }
    });
    
  } catch (error) {
    console.error('Error loading saved group:', error);
    localStorage.removeItem('currentGroup');
  }
}
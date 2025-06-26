// components/modal.js
export function createModal(options = {}) {
  const {
    id = 'modal',
    title = '',
    content = '',
    showClose = true,
    closeText = 'Close',
    showConfirm = false,
    confirmText = 'Confirm',
    onClose = () => {},
    onConfirm = () => {},
  } = options;
  
  // Create modal elements
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.id = `${id}-overlay`;
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = id;
  
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';
  
  const modalTitle = document.createElement('h3');
  modalTitle.textContent = title;
  
  modalHeader.appendChild(modalTitle);
  
  if (showClose) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
      closeModal();
      onClose();
    });
    modalHeader.appendChild(closeBtn);
  }
  
  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  
  // Content can be string or DOM element
  if (typeof content === 'string') {
    modalBody.innerHTML = content;
  } else {
    modalBody.appendChild(content);
  }
  
  const modalFooter = document.createElement('div');
  modalFooter.className = 'modal-footer';
  
  if (showClose) {
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.textContent = closeText;
    closeButton.addEventListener('click', () => {
      closeModal();
      onClose();
    });
    modalFooter.appendChild(closeButton);
  }
  
  if (showConfirm) {
    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-primary';
    confirmButton.textContent = confirmText;
    confirmButton.addEventListener('click', () => {
      onConfirm();
      closeModal();
    });
    modalFooter.appendChild(confirmButton);
  }
  
  // Assemble modal
  modal.appendChild(modalHeader);
  modal.appendChild(modalBody);
  modal.appendChild(modalFooter);
  modalOverlay.appendChild(modal);
  
  // Close modal when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
      onClose();
    }
  });
  
  // Add to DOM
  document.body.appendChild(modalOverlay);
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
  
  function closeModal() {
    document.body.removeChild(modalOverlay);
    document.body.style.overflow = '';
  }
  
  return {
    close: closeModal,
    updateContent: (newContent) => {
      modalBody.innerHTML = '';
      if (typeof newContent === 'string') {
        modalBody.innerHTML = newContent;
      } else {
        modalBody.appendChild(newContent);
      }
    }
  };
}

// Helper function to show a simple alert modal
export function showAlertModal(title, message) {
  return createModal({
    title,
    content: `<p>${message}</p>`,
    showClose: true,
    showConfirm: false
  });
}

// Helper function to show a confirmation modal
export function showConfirmModal(title, message, onConfirm) {
  return createModal({
    title,
    content: `<p>${message}</p>`,
    showClose: true,
    showConfirm: true,
    onConfirm
  });
}
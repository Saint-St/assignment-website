// src/scripts/firebase/storage.js

import { storage } from './config';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from "firebase/storage";

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} userId - User ID of the uploader
 * @returns {Promise<string>} - Download URL of the uploaded file
 */
export const uploadFile = async (file, userId) => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `submissions/${userId}/${file.name}`);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} fileUrl - The URL of the file to delete
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export const deleteFile = async (fileUrl) => {
  try {
    // Create a reference from the URL
    const fileRef = ref(storage, fileUrl);
    
    // Delete the file
    await deleteObject(fileRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting file: ", error);
    return false;
  }
};

/**
 * Validate file type
 * @param {File} file - The file to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @returns {boolean} - True if file type is allowed
 */
export const validateFileType = (file, allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]) => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - True if file size is within limit
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  return file.size <= maxSizeMB * 1024 * 1024;
};
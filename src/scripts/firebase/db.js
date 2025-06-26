// src/scripts/firebase/db.js

import { db } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  setDoc 
} from "firebase/firestore";

/**
 * Add a new user to Firestore
 * @param {string} userId - The user's UID from Firebase Auth
 * @param {string} email - User's email
 * @param {string} username - User's chosen username
 * @returns {Promise} - Resolves when user is added
 */
export const addUser = async (userId, email, username) => {
  try {
    await setDoc(doc(db, "users", userId), {
      email,
      username,
      createdAt: new Date(),
      isAdmin: false
    });
    return true;
  } catch (error) {
    console.error("Error adding user: ", error);
    return false;
  }
};

/**
 * Get user data by UID
 * @param {string} userId - User's UID
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error getting user: ", error);
    return null;
  }
};

/**
 * Submit an assignment with group members
 * @param {string} userId - Submitter's user ID
 * @param {string} username - Submitter's username
 * @param {Array} groupMembers - Array of group member names
 * @param {string} fileUrl - Download URL of the uploaded file
 * @returns {Promise} - Resolves when submission is complete
 */
export const submitAssignment = async (userId, username, groupMembers, fileUrl) => {
  try {
    const submissionRef = await addDoc(collection(db, "submissions"), {
      userId,
      username,
      groupMembers,
      fileUrl,
      submittedAt: new Date(),
      status: "submitted"
    });
    return submissionRef.id;
  } catch (error) {
    console.error("Error submitting assignment: ", error);
    return null;
  }
};

/**
 * Get all submissions (admin only)
 * @returns {Promise<Array>} - Array of all submissions
 */
export const getAllSubmissions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "submissions"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting submissions: ", error);
    return [];
  }
};

/**
 * Check if a user is admin
 * @param {string} userId - User's UID
 * @returns {Promise<boolean>} - True if user is admin
 */
export const isAdmin = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? userDoc.data().isAdmin || false : false;
  } catch (error) {
    console.error("Error checking admin status: ", error);
    return false;
  }
};
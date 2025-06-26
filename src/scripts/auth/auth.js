import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig } from '../firebase/config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { validateSignup, validateLogin } from './validator.js';
import { showLoading, hideLoading, showError, showSuccess } from '../utils/helpers.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Event Listeners
if (signupForm) {
  signupForm.addEventListener('submit', handleSignup);
}

if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

// Check auth state on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
});

// Handle user signup
async function handleSignup(e) {
  e.preventDefault();
  
  const email = signupForm['signup-email'].value;
  const password = signupForm['signup-password'].value;
  const username = signupForm['signup-username'].value;
  const role = signupForm['signup-role']?.value || 'student';

  // Validate inputs
  const errors = validateSignup(email, password, username);
  if (errors.length > 0) {
    showError(errors.join('<br>'));
    return;
  }

  try {
    showLoading();
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send verification email
    await sendEmailVerification(user);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      username: username,
      role: role,
      createdAt: new Date(),
      emailVerified: false,
      lastLoginAt: null
    });
    
    showSuccess('Account created successfully! Please check your email for verification.');
    signupForm.reset();
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 3000);
    
  } catch (error) {
    console.error('Signup error:', error);
    handleAuthError(error);
  } finally {
    hideLoading();
  }
}

// Handle user login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = loginForm['login-email'].value;
  const password = loginForm['login-password'].value;

  // Validate inputs
  const errors = validateLogin(email, password);
  if (errors.length > 0) {
    showError(errors.join('<br>'));
    return;
  }

  try {
    showLoading();
    
    // Sign in user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update last login time
    await setDoc(doc(db, 'users', user.uid), {
      lastLoginAt: new Date()
    }, { merge: true });
    
    // Check if email is verified
    if (!user.emailVerified) {
      showError('Please verify your email before logging in. Check your inbox.');
      await signOut(auth);
      return;
    }
    
    // Redirect based on role
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    if (userData.role === 'admin') {
      window.location.href = 'admin/dashboard.html';
    } else {
      window.location.href = 'student/dashboard.html';
    }
    
  } catch (error) {
    console.error('Login error:', error);
    handleAuthError(error);
  } finally {
    hideLoading();
  }
}

// Handle user logout
async function handleLogout() {
  try {
    showLoading();
    await signOut(auth);
    showSuccess('Logged out successfully');
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Logout error:', error);
    showError('Failed to logout. Please try again.');
  } finally {
    hideLoading();
  }
}

// Check authentication state
function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      const token = await user.getIdTokenResult();
      
      // Update UI for logged in user
      const authElements = document.querySelectorAll('.auth-state');
      authElements.forEach(el => {
        el.classList.add('authenticated');
        el.classList.remove('anonymous');
      });
      
      // Show/hide elements based on role
      const adminElements = document.querySelectorAll('.admin-only');
      if (token.claims.admin) {
        adminElements.forEach(el => el.style.display = 'block');
      } else {
        adminElements.forEach(el => el.style.display = 'none');
      }
      
    } else {
      // User is signed out
      const authElements = document.querySelectorAll('.auth-state');
      authElements.forEach(el => {
        el.classList.add('anonymous');
        el.classList.remove('authenticated');
      });
      
      // Redirect from protected pages
      if (window.location.pathname.includes('dashboard')) {
        window.location.href = '../auth/login.html';
      }
    }
  });
}

// Handle authentication errors
function handleAuthError(error) {
  let message = '';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'Email already in use. Try logging in instead.';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address.';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password. Try again or reset your password.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Try again later.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Check your internet connection.';
      break;
    default:
      message = 'Authentication failed. Please try again.';
  }
  
  showError(message);
}

// Public API
export { 
  auth, 
  checkAuthState,
  handleLogout
};
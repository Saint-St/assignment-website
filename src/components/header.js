// components/header.js
export function createHeader(isLoggedIn = false, isAdmin = false) {
  const header = document.createElement('header');
  header.className = 'site-header';
  
  const nav = document.createElement('nav');
  nav.className = 'main-nav';
  
  const logoLink = document.createElement('a');
  logoLink.href = '/';
  logoLink.className = 'logo';
  logoLink.textContent = 'Assignment Portal';
  
  const navList = document.createElement('ul');
  navList.className = 'nav-list';
  
  // Home link
  const homeItem = document.createElement('li');
  const homeLink = document.createElement('a');
  homeLink.href = '/';
  homeLink.textContent = 'Home';
  homeItem.appendChild(homeLink);
  
  navList.appendChild(homeItem);
  
  // Conditional navigation based on auth status
  if (isLoggedIn) {
    if (isAdmin) {
      const adminItem = document.createElement('li');
      const adminLink = document.createElement('a');
      adminLink.href = '/admin/dashboard.html';
      adminLink.textContent = 'Admin Dashboard';
      adminItem.appendChild(adminLink);
      navList.appendChild(adminItem);
    } else {
      const dashboardItem = document.createElement('li');
      const dashboardLink = document.createElement('a');
      dashboardLink.href = '/student/dashboard.html';
      dashboardLink.textContent = 'Dashboard';
      dashboardItem.appendChild(dashboardLink);
      navList.appendChild(dashboardItem);
      
      const submitItem = document.createElement('li');
      const submitLink = document.createElement('a');
      submitLink.href = '/student/submission.html';
      submitLink.textContent = 'Submit Assignment';
      submitItem.appendChild(submitLink);
      navList.appendChild(submitItem);
    }
    
    const logoutItem = document.createElement('li');
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.id = 'logout-btn';
    logoutLink.textContent = 'Logout';
    logoutItem.appendChild(logoutLink);
    navList.appendChild(logoutItem);
  } else {
    const loginItem = document.createElement('li');
    const loginLink = document.createElement('a');
    loginLink.href = '/auth/login.html';
    loginLink.textContent = 'Login';
    loginItem.appendChild(loginLink);
    navList.appendChild(loginItem);
    
    const signupItem = document.createElement('li');
    const signupLink = document.createElement('a');
    signupLink.href = '/auth/signup.html';
    signupLink.textContent = 'Sign Up';
    signupItem.appendChild(signupLink);
    navList.appendChild(signupItem);
  }
  
  nav.appendChild(logoLink);
  nav.appendChild(navList);
  header.appendChild(nav);
  
  return header;
}

// Initialize header with auth state
export function initHeader() {
  // This would typically check Firebase auth state
  // For now, we'll assume not logged in
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    headerContainer.appendChild(createHeader());
  }
}
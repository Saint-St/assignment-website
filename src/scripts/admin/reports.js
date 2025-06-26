import { 
  getFirestore, 
  collection, 
  query, 
  getDocs,
  where,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { exportToExcel } from '../utils/excel.js';
import { showModal, closeModal } from '../components/modal.js';
import { showLoading, hideLoading } from '../utils/helpers.js';

// DOM Elements
const generateReportBtn = document.getElementById('generate-report-btn');
const reportTypeSelect = document.getElementById('report-type');
const dateRangeStart = document.getElementById('date-range-start');
const dateRangeEnd = document.getElementById('date-range-end');
const reportResults = document.getElementById('report-results');
const exportReportBtn = document.getElementById('export-report-btn');
const reportFilters = document.getElementById('report-filters');

// Global variables
let currentReportData = null;

// Event Listeners
generateReportBtn.addEventListener('click', generateReport);
exportReportBtn.addEventListener('click', exportReport);
reportTypeSelect.addEventListener('change', updateFilterVisibility);

// Initialize reports page
document.addEventListener('DOMContentLoaded', () => {
  // Set default date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  
  dateRangeStart.valueAsDate = startDate;
  dateRangeEnd.valueAsDate = endDate;
  
  updateFilterVisibility();
});

// Update which filters are visible based on report type
function updateFilterVisibility() {
  const reportType = reportTypeSelect.value;
  
  // Hide all filters first
  Array.from(reportFilters.children).forEach(child => {
    child.style.display = 'none';
  });
  
  // Show relevant filters
  switch(reportType) {
    case 'submissions':
      document.getElementById('date-range-filter').style.display = 'block';
      document.getElementById('group-size-filter').style.display = 'block';
      break;
      
    case 'users':
      document.getElementById('user-status-filter').style.display = 'block';
      document.getElementById('date-range-filter').style.display = 'block';
      break;
      
    case 'activity':
      document.getElementById('date-range-filter').style.display = 'block';
      break;
  }
}

// Generate report based on selected criteria
async function generateReport() {
  const reportType = reportTypeSelect.value;
  
  try {
    showLoading();
    reportResults.innerHTML = '';
    exportReportBtn.style.display = 'none';
    
    switch(reportType) {
      case 'submissions':
        currentReportData = await generateSubmissionsReport();
        break;
        
      case 'users':
        currentReportData = await generateUsersReport();
        break;
        
      case 'activity':
        currentReportData = await generateActivityReport();
        break;
        
      default:
        throw new Error('Invalid report type');
    }
    
    displayReportResults(currentReportData);
    exportReportBtn.style.display = 'block';
    
  } catch (error) {
    console.error('Error generating report:', error);
    reportResults.innerHTML = `
      <div class="report-error">
        <p>Failed to generate report. Please try again.</p>
        <p>${error.message}</p>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

// Generate submissions report
async function generateSubmissionsReport() {
  const db = getFirestore();
  const startDate = new Date(dateRangeStart.value);
  const endDate = new Date(dateRangeEnd.value);
  endDate.setHours(23, 59, 59, 999); // Include entire end day
  
  // Build query
  const q = query(
    collection(db, 'submissions'),
    where('submittedAt', '>=', startDate),
    where('submittedAt', '<=', endDate),
    orderBy('submittedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const submissions = [];
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    submissions.push({
      id: doc.id,
      ...data,
      submittedAt: data.submittedAt.toDate()
    });
  });
  
  // Process data for reporting
  const reportData = {
    type: 'submissions',
    title: 'Submissions Report',
    dateRange: `${dateRangeStart.value} to ${dateRangeEnd.value}`,
    totalSubmissions: submissions.length,
    submissions: submissions,
    stats: {
      averageGroupSize: calculateAverageGroupSize(submissions),
      submissionsByDay: groupSubmissionsByDay(submissions),
      fileTypes: analyzeFileTypes(submissions)
    }
  };
  
  return reportData;
}

// Generate users report
async function generateUsersReport() {
  const db = getFirestore();
  const startDate = new Date(dateRangeStart.value);
  const endDate = new Date(dateRangeEnd.value);
  endDate.setHours(23, 59, 59, 999);
  
  // Build query
  const q = query(
    collection(db, 'users'),
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const users = [];
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate()
    });
  });
  
  // Process data for reporting
  const reportData = {
    type: 'users',
    title: 'Users Report',
    dateRange: `${dateRangeStart.value} to ${dateRangeEnd.value}`,
    totalUsers: users.length,
    users: users,
    stats: {
      activeUsers: users.filter(u => u.lastLoginAt).length,
      newUsers: users.filter(u => {
        const createdAt = u.createdAt;
        const daysSinceCreation = Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24));
        return daysSinceCreation <= 30;
      }).length
    }
  };
  
  return reportData;
}

// Generate activity report
async function generateActivityReport() {
  const db = getFirestore();
  const startDate = new Date(dateRangeStart.value);
  const endDate = new Date(dateRangeEnd.value);
  endDate.setHours(23, 59, 59, 999);
  
  // In a real app, you might have a separate 'activity' collection
  // For this example, we'll use submissions as activity data
  const q = query(
    collection(db, 'submissions'),
    where('submittedAt', '>=', startDate),
    where('submittedAt', '<=', endDate),
    orderBy('submittedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const activities = [];
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    activities.push({
      id: doc.id,
      type: 'submission',
      timestamp: data.submittedAt.toDate(),
      user: data.groupLeaderEmail,
      details: `Submitted assignment with ${data.groupMembers.length} group members`
    });
  });
  
  // Process data for reporting
  const reportData = {
    type: 'activity',
    title: 'Activity Report',
    dateRange: `${dateRangeStart.value} to ${dateRangeEnd.value}`,
    totalActivities: activities.length,
    activities: activities,
    stats: {
      activitiesByDay: groupActivitiesByDay(activities),
      busiestHour: findBusiestHour(activities)
    }
  };
  
  return reportData;
}

// Display report results in the UI
function displayReportResults(reportData) {
  let html = `
    <h3>${reportData.title}</h3>
    <p class="report-meta">Date Range: ${reportData.dateRange}</p>
  `;
  
  switch(reportData.type) {
    case 'submissions':
      html += `
        <div class="report-summary">
          <div class="summary-card">
            <h4>Total Submissions</h4>
            <p class="summary-value">${reportData.totalSubmissions}</p>
          </div>
          <div class="summary-card">
            <h4>Average Group Size</h4>
            <p class="summary-value">${reportData.stats.averageGroupSize.toFixed(1)}</p>
          </div>
        </div>
        
        <h4>Submissions by Day</h4>
        <div class="chart-container">
          ${renderBarChart(reportData.stats.submissionsByDay)}
        </div>
        
        <h4>File Types</h4>
        <div class="chart-container">
          ${renderPieChart(reportData.stats.fileTypes)}
        </div>
        
        <h4>Recent Submissions</h4>
        <div class="recent-items">
          ${reportData.submissions.slice(0, 5).map(sub => `
            <div class="recent-item">
              <p><strong>${sub.groupLeaderName}</strong> (${sub.groupLeaderEmail})</p>
              <p>${sub.groupMembers.length} members • ${sub.fileName}</p>
              <p class="item-date">${sub.submittedAt.toLocaleString()}</p>
            </div>
          `).join('')}
        </div>
      `;
      break;
      
    case 'users':
      html += `
        <div class="report-summary">
          <div class="summary-card">
            <h4>Total Users</h4>
            <p class="summary-value">${reportData.totalUsers}</p>
          </div>
          <div class="summary-card">
            <h4>Active Users</h4>
            <p class="summary-value">${reportData.stats.activeUsers}</p>
          </div>
          <div class="summary-card">
            <h4>New Users (30 days)</h4>
            <p class="summary-value">${reportData.stats.newUsers}</p>
          </div>
        </div>
        
        <h4>Recent Users</h4>
        <div class="recent-items">
          ${reportData.users.slice(0, 5).map(user => `
            <div class="recent-item">
              <p><strong>${user.displayName || 'No name'}</strong> (${user.email})</p>
              <p>Joined: ${user.createdAt.toLocaleDateString()}</p>
              ${user.lastLoginAt ? `<p class="item-date">Last active: ${user.lastLoginAt.toLocaleString()}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
      break;
      
    case 'activity':
      html += `
        <div class="report-summary">
          <div class="summary-card">
            <h4>Total Activities</h4>
            <p class="summary-value">${reportData.totalActivities}</p>
          </div>
          <div class="summary-card">
            <h4>Busiest Hour</h4>
            <p class="summary-value">${reportData.stats.busiestHour}:00 - ${reportData.stats.busiestHour + 1}:00</p>
          </div>
        </div>
        
        <h4>Activity by Day</h4>
        <div class="chart-container">
          ${renderBarChart(reportData.stats.activitiesByDay)}
        </div>
        
        <h4>Recent Activity</h4>
        <div class="recent-items">
          ${reportData.activities.slice(0, 5).map(activity => `
            <div class="recent-item">
              <p><strong>${activity.user}</strong></p>
              <p>${activity.details}</p>
              <p class="item-date">${activity.timestamp.toLocaleString()}</p>
            </div>
          `).join('')}
        </div>
      `;
      break;
  }
  
  reportResults.innerHTML = html;
}

// Export the current report to Excel
function exportReport() {
  if (!currentReportData) return;
  
  try {
    let exportData = [];
    let fileName = '';
    
    switch(currentReportData.type) {
      case 'submissions':
        exportData = currentReportData.submissions.flatMap(sub => {
          return sub.groupMembers.map(member => ({
            'Group Leader': sub.groupLeaderName,
            'Leader Email': sub.groupLeaderEmail,
            'Member Name': member.name,
            'Member Email': member.email || 'N/A',
            'Submission Date': sub.submittedAt.toLocaleString(),
            'File Name': sub.fileName,
            'Group Size': sub.groupMembers.length
          }));
        });
        fileName = `submissions_report_${new Date().toISOString().slice(0,10)}.xlsx`;
        break;
        
      case 'users':
        exportData = currentReportData.users.map(user => ({
          'Name': user.displayName || 'N/A',
          'Email': user.email,
          'Account Created': user.createdAt.toLocaleString(),
          'Last Active': user.lastLoginAt ? user.lastLoginAt.toLocaleString() : 'Never',
          'Status': user.lastLoginAt ? 'Active' : 'Inactive'
        }));
        fileName = `users_report_${new Date().toISOString().slice(0,10)}.xlsx`;
        break;
        
      case 'activity':
        exportData = currentReportData.activities.map(activity => ({
          'User': activity.user,
          'Activity Type': activity.type,
          'Timestamp': activity.timestamp.toLocaleString(),
          'Details': activity.details
        }));
        fileName = `activity_report_${new Date().toISOString().slice(0,10)}.xlsx`;
        break;
    }
    
    exportToExcel(exportData, fileName);
    showModal('export-success', `
      <h3>Export Successful</h3>
      <p>Report data has been exported to ${fileName}</p>
    `);
    
  } catch (error) {
    console.error('Error exporting report:', error);
    showModal('export-error', `
      <h3>Export Failed</h3>
      <p>${error.message}</p>
    `);
  }
}

// Helper functions for data analysis
function calculateAverageGroupSize(submissions) {
  if (submissions.length === 0) return 0;
  const totalMembers = submissions.reduce((sum, sub) => sum + sub.groupMembers.length, 0);
  return totalMembers / submissions.length;
}

function groupSubmissionsByDay(submissions) {
  const daysMap = {};
  
  submissions.forEach(sub => {
    const dateStr = sub.submittedAt.toISOString().split('T')[0];
    daysMap[dateStr] = (daysMap[dateStr] || 0) + 1;
  });
  
  return Object.entries(daysMap).map(([date, count]) => ({
    date,
    count
  }));
}

function analyzeFileTypes(submissions) {
  const typeMap = {};
  
  submissions.forEach(sub => {
    const fileName = sub.fileName || '';
    const extension = fileName.split('.').pop().toLowerCase();
    typeMap[extension] = (typeMap[extension] || 0) + 1;
  });
  
  return Object.entries(typeMap).map(([type, count]) => ({
    type,
    count
  }));
}

function groupActivitiesByDay(activities) {
  const daysMap = {};
  
  activities.forEach(act => {
    const dateStr = act.timestamp.toISOString().split('T')[0];
    daysMap[dateStr] = (daysMap[dateStr] || 0) + 1;
  });
  
  return Object.entries(daysMap).map(([date, count]) => ({
    date,
    count
  }));
}

function findBusiestHour(activities) {
  const hoursMap = Array(24).fill(0);
  
  activities.forEach(act => {
    const hour = act.timestamp.getHours();
    hoursMap[hour]++;
  });
  
  return hoursMap.indexOf(Math.max(...hoursMap));
}

// Simple chart rendering (in a real app, use a charting library)
function renderBarChart(data) {
  const maxValue = Math.max(...data.map(d => d.count), 1);
  
  return `
    <div class="bar-chart">
      ${data.map(item => `
        <div class="bar-item">
          <div class="bar-label">${item.date}</div>
          <div class="bar-container">
            <div class="bar" style="width: ${(item.count / maxValue) * 100}%"></div>
          </div>
          <div class="bar-value">${item.count}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPieChart(data) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return '<p>No data available</p>';
  
  let accumulatedPercent = 0;
  
  return `
    <div class="pie-chart">
      <div class="pie" style="--total: ${total}">
        ${data.map((item, index) => {
          const percent = (item.count / total) * 100;
          const startPercent = accumulatedPercent;
          accumulatedPercent += percent;
          
          return `
            <div class="pie-segment" 
                 style="--start: ${startPercent}; --percent: ${percent}; --color: var(--chart-color-${index % 6})"
                 title="${item.type}: ${item.count} (${percent.toFixed(1)}%)">
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="pie-legend">
        ${data.map((item, index) => `
          <div class="legend-item">
            <span class="legend-color" style="background-color: var(--chart-color-${index % 6})"></span>
            <span class="legend-label">${item.type} (${item.count})</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
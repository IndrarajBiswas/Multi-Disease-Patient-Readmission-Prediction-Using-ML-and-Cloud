/* ========================================
   AUTHENTICATION & USER MANAGEMENT
   ======================================== */

// Check authentication status on page load
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    if (!response.ok) {
      // Not authenticated, redirect to login
      window.location.href = '/login.html';
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login.html';
    return null;
  }
}

// Logout function
async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Initialize user UI (display user info, add logout button)
function initializeUserUI(user) {
  const headerContent = document.querySelector('.header-content');

  // Create user info section
  const userSection = document.createElement('div');
  userSection.className = 'user-section';
  userSection.innerHTML = `
    <div class="user-info">
      <div class="user-avatar">
        <i class="fas fa-user-circle"></i>
      </div>
      <div class="user-details">
        <div class="user-name">${user.full_name || user.username}</div>
        <div class="user-role">${user.role === 'admin' ? '👑 Admin' : '👤 User'}</div>
      </div>
    </div>
    <div class="user-actions">
      ${user.role === 'admin' ? '<button id="manage-users-btn" class="btn-secondary"><i class="fas fa-users-cog"></i> Manage Users</button>' : ''}
      <button id="logout-btn" class="btn-danger"><i class="fas fa-sign-out-alt"></i> Logout</button>
    </div>
  `;

  headerContent.appendChild(userSection);

  // Add event listeners
  document.getElementById('logout-btn').addEventListener('click', logout);

  if (user.role === 'admin') {
    document.getElementById('manage-users-btn').addEventListener('click', openUserManagementModal);
  }
}

// Open User Management Modal
async function openUserManagementModal() {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'user-management-modal';

  modal.innerHTML = `
    <div class="modal-content large">
      <div class="modal-header">
        <h2><i class="fas fa-users-cog"></i> User Management</h2>
        <button class="modal-close" onclick="closeUserManagementModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="user-management-actions">
          <button id="add-user-btn" class="btn-primary">
            <i class="fas fa-user-plus"></i> Add New User
          </button>
          <button id="refresh-users-btn" class="btn-secondary">
            <i class="fas fa-sync"></i> Refresh
          </button>
        </div>
        <div id="users-table-container">
          <div class="loading">Loading users...</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Load users
  await loadUsers();

  // Add event listeners
  document.getElementById('add-user-btn').addEventListener('click', openAddUserForm);
  document.getElementById('refresh-users-btn').addEventListener('click', loadUsers);

  // Show modal
  setTimeout(() => modal.classList.add('show'), 10);
}

// Close User Management Modal
function closeUserManagementModal() {
  const modal = document.getElementById('user-management-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// Load and display users
async function loadUsers() {
  const container = document.getElementById('users-table-container');
  container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';

  try {
    const response = await fetch('/api/auth/users', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to load users');
    }

    const data = await response.json();
    renderUsersTable(data.users);
  } catch (error) {
    container.innerHTML = `<div class="error">Failed to load users: ${error.message}</div>`;
  }
}

// Render users table
function renderUsersTable(users) {
  const container = document.getElementById('users-table-container');

  const table = `
    <table class="users-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Full Name</th>
          <th>Department</th>
          <th>Role</th>
          <th>Status</th>
          <th>Last Login</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td>${user.full_name || '-'}</td>
            <td>${user.department || '-'}</td>
            <td>
              <span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">
                ${user.role}
              </span>
            </td>
            <td>
              <span class="badge ${user.is_active ? 'badge-active' : 'badge-inactive'}">
                ${user.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
            <td>
              <button class="btn-icon" onclick="editUser(${user.id})" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon btn-icon-danger" onclick="deleteUser(${user.id}, '${user.username}')" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = table;
}

// Open Add User Form
function openAddUserForm() {
  const formHtml = `
    <div class="modal" id="add-user-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2><i class="fas fa-user-plus"></i> Add New User</h2>
          <button class="modal-close" onclick="closeAddUserModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="add-user-form">
            <div class="form-row">
              <div class="form-group">
                <label><i class="fas fa-user"></i> Username *</label>
                <input type="text" name="username" required>
              </div>
              <div class="form-group">
                <label><i class="fas fa-envelope"></i> Email *</label>
                <input type="email" name="email" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label><i class="fas fa-id-card"></i> Full Name</label>
                <input type="text" name="full_name">
              </div>
              <div class="form-group">
                <label><i class="fas fa-building"></i> Department</label>
                <input type="text" name="department">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label><i class="fas fa-lock"></i> Password *</label>
                <input type="password" name="password" required minlength="6">
              </div>
              <div class="form-group">
                <label><i class="fas fa-user-shield"></i> Role *</label>
                <select name="role" required>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeAddUserModal()">Cancel</button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-user-plus"></i> Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', formHtml);

  // Add form submit handler
  document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('User created successfully!');
        closeAddUserModal();
        loadUsers();
      } else {
        showError(data.error || 'Failed to create user');
      }
    } catch (error) {
      showError('Network error: ' + error.message);
    }
  });

  setTimeout(() => document.getElementById('add-user-modal').classList.add('show'), 10);
}

function closeAddUserModal() {
  const modal = document.getElementById('add-user-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// Delete user
async function deleteUser(userId, username) {
  if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/auth/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.ok) {
      showSuccess('User deleted successfully!');
      loadUsers();
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to delete user');
    }
  } catch (error) {
    showError('Network error: ' + error.message);
  }
}

// Edit user (simplified - just shows a form)
function editUser(userId) {
  showInfo('Edit user feature coming soon! For now, you can delete and recreate the user.');
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (user) {
    initializeUserUI(user);
  }
});

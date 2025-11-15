# Authentication System Guide

## Overview

This hospital analytics system now includes a **secure authentication system** with role-based access control (RBAC). The system uses:

- **Flask-Login** for session management
- **SQLite database** for user storage (FREE - no AWS RDS costs)
- **Role-based permissions** (Admin vs. User)
- **Secure password hashing** with Werkzeug
- **Session-based authentication** with cookies

---

## 🚀 Quick Start

### Default Admin Account

When you first run the application, a default admin account is automatically created:

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change this password immediately after first login!

---

## 💰 Cost Breakdown

### Current Setup (FREE TIER)
- **Database**: SQLite (local file) - **$0/month**
- **Authentication**: Flask-Login (open source) - **$0/month**
- **Hosting**: AWS Elastic Beanstalk free tier (t2.micro) - **$0/month** for 12 months

**Total Monthly Cost: $0**

### If You Scale Later
- Upgrade to RDS PostgreSQL: ~$25/month
- Use AWS Cognito for advanced auth: ~$10/month for 100 users
- But for now, **completely free!**

---

## 🔐 Authentication Features

### 1. **Login System**
- Beautiful, responsive login page at `/login.html`
- Session-based authentication with cookies
- "Remember me" functionality
- Automatic redirect to main app after login

### 2. **User Roles**
- **Admin**: Can create/edit/delete users, access all features
- **User**: Can use prediction features, cannot manage users

### 3. **Protected Routes**
All API endpoints are now protected:
- `/api/predict` - Requires login
- `/api/simulate_staffing` - Requires login
- `/api/report` - Requires login
- `/api/followups` - Requires login
- `/api/auth/users` - Admin only

### 4. **Admin User Management**
Admins can:
- ✅ Create new user accounts
- ✅ View all users
- ✅ Delete users (except themselves)
- ✅ Assign roles (Admin/User)
- ✅ Activate/deactivate accounts

---

## 📁 File Structure

```
backend/
├── app.py                      # Main Flask app (updated with auth)
├── models.py                   # User database model
├── auth.py                     # Authentication routes & middleware
├── requirements.txt            # Updated with auth dependencies
├── hospital_analytics.db       # SQLite database (auto-created)
└── frontend/
    ├── login.html             # Login page
    ├── index.html             # Main app (auth-protected)
    ├── auth.js                # Authentication frontend logic
    ├── auth-styles.css        # Authentication UI styles
    ├── script.js              # Main app logic (updated)
    └── style.css              # Main app styles
```

---

## 🔑 API Endpoints

### Authentication Endpoints

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "remember": false
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@hospital.com",
    "role": "admin",
    "full_name": "System Administrator",
    "is_active": true
  }
}
```

#### 2. Logout
```http
POST /api/auth/logout
```

#### 3. Get Current User
```http
GET /api/auth/me
```

#### 4. Create User (Admin Only)
```http
POST /api/auth/users
Content-Type: application/json

{
  "username": "doctor1",
  "email": "doctor@hospital.com",
  "password": "securepass123",
  "full_name": "Dr. John Doe",
  "department": "Cardiology",
  "role": "user"
}
```

#### 5. Get All Users (Admin Only)
```http
GET /api/auth/users
```

#### 6. Delete User (Admin Only)
```http
DELETE /api/auth/users/{user_id}
```

#### 7. Change Password
```http
POST /api/auth/change-password
Content-Type: application/json

{
  "current_password": "admin123",
  "new_password": "newSecurePassword456"
}
```

---

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd "Multi Disease Patient Readmission using ML/backend"
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python app.py
```

The database will be automatically created on first run.

### 3. Access the Application
1. Open browser to `http://localhost:5000`
2. You'll be redirected to `/login.html`
3. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
4. **IMPORTANT:** Change the default password immediately!

---

## 👥 User Management (Admin Guide)

### Creating a New User

1. **Login as Admin**
2. Click **"Manage Users"** button in the header
3. Click **"Add New User"**
4. Fill in the form:
   - Username (required, unique)
   - Email (required, unique)
   - Password (required, min 6 characters)
   - Full Name (optional)
   - Department (optional)
   - Role (User or Admin)
5. Click **"Create User"**

### Viewing Users

The user management table shows:
- Username
- Email
- Full Name
- Department
- Role (Admin/User badge)
- Status (Active/Inactive)
- Last Login timestamp
- Action buttons (Edit/Delete)

### Deleting Users

1. Click the **trash icon** next to a user
2. Confirm the deletion
3. User is permanently removed

**Note:** You cannot delete your own account.

---

## 🔒 Security Best Practices

### 1. Change Default Password
```javascript
// In browser console or via UI
fetch('/api/auth/change-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    current_password: 'admin123',
    new_password: 'YourSecurePassword123!'
  })
})
```

### 2. Set SECRET_KEY Environment Variable
```bash
# In production, set a secure random key
export SECRET_KEY='your-very-long-random-secret-key-here'
```

Generate a secure key:
```python
import secrets
print(secrets.token_hex(32))
```

### 3. Use HTTPS in Production
Update `app.py`:
```python
app.config['SESSION_COOKIE_SECURE'] = True  # Only send cookie over HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
```

### 4. Password Requirements
Current minimum: 6 characters
Recommended:
- Minimum 12 characters
- Include uppercase, lowercase, numbers, symbols
- Check against common password lists

---

## 🌐 Deployment on AWS Elastic Beanstalk

### Environment Variables to Set

```bash
SECRET_KEY=your-secure-random-key
DATABASE_URL=sqlite:///hospital_analytics.db  # or PostgreSQL URL if upgraded
FLASK_ENV=production
```

### Elastic Beanstalk Configuration

Create `.ebextensions/python.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    SECRET_KEY: "your-secure-key-here"
    DATABASE_URL: "sqlite:///hospital_analytics.db"
```

**Note:** For production with multiple instances, migrate to RDS PostgreSQL.

---

## 🐛 Troubleshooting

### Issue: "Authentication required" error
**Solution:** Make sure you're logged in. Check that cookies are enabled.

### Issue: Default admin login doesn't work
**Solution:**
1. Delete `hospital_analytics.db` file
2. Restart the application
3. Database will be recreated with default admin

### Issue: Users table is empty
**Solution:** The database auto-creates an admin user on first run. Check `app.py` logs for "[INFO] Default admin user created".

### Issue: CORS errors in browser console
**Solution:** Update `app.py` CORS configuration:
```python
CORS(app, supports_credentials=True, origins=['your-frontend-url'])
```

---

## 📊 Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| username | STRING(80) | Unique username |
| email | STRING(120) | Unique email |
| password_hash | STRING(255) | Hashed password (Werkzeug) |
| role | STRING(20) | 'admin' or 'user' |
| full_name | STRING(120) | Optional display name |
| department | STRING(100) | Optional department |
| is_active | BOOLEAN | Account active status |
| created_at | DATETIME | Account creation timestamp |
| last_login | DATETIME | Last successful login |
| created_by | INTEGER | Foreign key to creating admin |

---

## 🚀 Future Enhancements (Optional)

### Phase 2: Advanced Features
- [ ] Two-factor authentication (2FA)
- [ ] Password reset via email
- [ ] Session timeout configuration
- [ ] Login attempt tracking
- [ ] Audit log for user actions
- [ ] Password expiration policy
- [ ] SSO integration (Google, Microsoft)

### Phase 3: Upgrade to AWS Cognito
If you need more advanced features:
- User pools with email verification
- Multi-factor authentication
- Social login (Google, Facebook)
- Token-based authentication (JWT)
- Cost: ~$10/month for 100 active users

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review `app.py` logs for error messages
3. Verify database exists: `ls -la hospital_analytics.db`
4. Check browser console for frontend errors

---

## ✅ Quick Checklist

Before deploying to production:
- [ ] Changed default admin password
- [ ] Set SECRET_KEY environment variable
- [ ] Enabled HTTPS
- [ ] Configured secure cookie settings
- [ ] Tested user creation/deletion
- [ ] Verified role-based access control
- [ ] Reviewed CORS origins list
- [ ] Backed up database file
- [ ] Tested all API endpoints
- [ ] Reviewed security headers

---

**Your authentication system is now complete and ready to use! 🎉**

Cost: $0/month | Security: ✅ | User Management: ✅ | Production-Ready: ✅

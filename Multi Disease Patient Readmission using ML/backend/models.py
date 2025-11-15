"""
User authentication models for the hospital analytics system.
Uses SQLite for free-tier deployment.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(UserMixin, db.Model):
    """User model with role-based access control."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'admin' or 'user'
    full_name = db.Column(db.String(120))
    department = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify the user's password."""
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        """Check if user has admin privileges."""
        return self.role == 'admin'

    def to_dict(self):
        """Convert user object to dictionary (excluding sensitive data)."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name,
            'department': self.department,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def __repr__(self):
        return f'<User {self.username} ({self.role})>'


def init_db(app):
    """Initialize the database and create default admin user."""
    db.init_app(app)

    with app.app_context():
        db.create_all()

        # Create default admin user if no users exist
        if User.query.count() == 0:
            admin = User(
                username='admin',
                email='admin@hospital.com',
                role='admin',
                full_name='System Administrator',
                department='IT'
            )
            admin.set_password('admin123')  # CHANGE THIS IN PRODUCTION
            db.session.add(admin)
            db.session.commit()
            print("[INFO] Default admin user created: username='admin', password='admin123'")
            print("[SECURITY] Please change the default password immediately!")

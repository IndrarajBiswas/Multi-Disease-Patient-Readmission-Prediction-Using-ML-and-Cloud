"""
Authentication routes and middleware for the hospital analytics system.
"""
from flask import Blueprint, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from functools import wraps
from datetime import datetime
from models import db, User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def init_auth(app):
    """Initialize Flask-Login."""
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({'error': 'Authentication required'}), 401

    return login_manager


def admin_required(f):
    """Decorator to require admin role."""
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin():
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(*args, **kwargs)
    return decorated_function


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login endpoint.
    Expected JSON: {"username": "...", "password": "..."}
    """
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400

    user = User.query.filter_by(username=data['username']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403

    # Update last login time
    user.last_login = datetime.utcnow()
    db.session.commit()

    # Login the user
    login_user(user, remember=data.get('remember', False))

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logout endpoint."""
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current user information."""
    return jsonify({'user': current_user.to_dict()}), 200


@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users (admin only)."""
    users = User.query.all()
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200


@auth_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """
    Create a new user (admin only).
    Expected JSON: {
        "username": "...",
        "password": "...",
        "email": "...",
        "full_name": "...",
        "department": "...",
        "role": "user" or "admin"
    }
    """
    data = request.get_json()

    # Validation
    required_fields = ['username', 'password', 'email']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    # Create new user
    try:
        new_user = User(
            username=data['username'],
            email=data['email'],
            role=data.get('role', 'user'),
            full_name=data.get('full_name'),
            department=data.get('department'),
            created_by=current_user.id
        )
        new_user.set_password(data['password'])

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': 'User created successfully',
            'user': new_user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500


@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """
    Update user (admin only).
    Can update: email, full_name, department, role, is_active
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    try:
        if 'email' in data:
            # Check if email is already taken by another user
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email']

        if 'full_name' in data:
            user.full_name = data['full_name']

        if 'department' in data:
            user.department = data['department']

        if 'role' in data and data['role'] in ['admin', 'user']:
            user.role = data['role']

        if 'is_active' in data:
            user.is_active = bool(data['is_active'])

        # Allow password change
        if 'password' in data and data['password']:
            user.set_password(data['password'])

        db.session.commit()

        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete user (admin only). Cannot delete yourself."""
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    user = User.query.get_or_404(user_id)

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """
    Change current user's password.
    Expected JSON: {"current_password": "...", "new_password": "..."}
    """
    data = request.get_json()

    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password required'}), 400

    if not current_user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401

    if len(data['new_password']) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    try:
        current_user.set_password(data['new_password'])
        db.session.commit()
        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to change password: {str(e)}'}), 500

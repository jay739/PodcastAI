import jwt
import bcrypt
import logging
from datetime import datetime, timedelta
from werkzeug.exceptions import Unauthorized
from models.user import User
from database import db

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.secret_key = "your-secret-key"  # TODO: Move to environment variables
        self.token_expiry = timedelta(days=1)

    def login(self, username, password):
        try:
            user = User.query.filter_by(username=username).first()
            if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
                raise Unauthorized("Invalid username or password")

            token = self._generate_token(user)
            return {
                "success": True,
                "user": {
                    "username": user.username,
                    "email": user.email
                },
                "token": token
            }
        except Exception as e:
            logger.error(f"Login error for user {username}: {str(e)}", exc_info=True)
            raise

    def signup(self, username, email, password):
        try:
            if User.query.filter_by(username=username).first():
                raise ValueError("Username already exists")
            
            if User.query.filter_by(email=email).first():
                raise ValueError("Email already registered")

            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            new_user = User(username=username, email=email, password_hash=password_hash)
            
            db.session.add(new_user)
            db.session.commit()

            token = self._generate_token(new_user)
            return {
                "success": True,
                "user": {
                    "username": new_user.username,
                    "email": new_user.email
                },
                "token": token
            }
        except Exception as e:
            db.session.rollback()
            logger.error(f"Signup error for user {username}: {str(e)}", exc_info=True)
            raise

    def verify_token(self, token):
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            user = User.query.get(payload['user_id'])
            
            if not user:
                raise Unauthorized("User not found")
            
            return {
                "success": True,
                "user": {
                    "username": user.username,
                    "email": user.email
                }
            }
        except jwt.ExpiredSignatureError:
            raise Unauthorized("Token has expired")
        except jwt.InvalidTokenError:
            raise Unauthorized("Invalid token")
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}", exc_info=True)
            raise

    def logout(self, token):
        try:
            # In a real application, you might want to blacklist the token
            # For now, we'll just verify it's valid
            self.verify_token(token)
            return {"success": True}
        except Exception as e:
            logger.error(f"Logout error: {str(e)}", exc_info=True)
            raise

    def _generate_token(self, user):
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + self.token_expiry
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

auth_service = AuthService() 
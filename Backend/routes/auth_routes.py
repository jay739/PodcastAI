from flask import Blueprint, request, jsonify
import logging
from services.auth_service import auth_service
from werkzeug.exceptions import BadRequest, Unauthorized

auth_blueprint = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@auth_blueprint.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json(force=True)
        if not data or 'username' not in data or 'password' not in data:
            raise BadRequest("Username and password are required")
        
        result = auth_service.login(data['username'], data['password'])
        logger.info(f"User {data['username']} logged in successfully")
        return jsonify(result)
    except BadRequest as e:
        logger.warning(f"Login failed - Bad request: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Unauthorized as e:
        logger.warning(f"Login failed - Unauthorized: {str(e)}")
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        logger.error(f"Login failed - Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500

@auth_blueprint.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json(force=True)
        required_fields = ['username', 'email', 'password']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            raise BadRequest(f"Missing required fields: {', '.join(missing_fields)}")
        
        result = auth_service.signup(data['username'], data['email'], data['password'])
        logger.info(f"New user registered: {data['username']}")
        return jsonify(result)
    except BadRequest as e:
        logger.warning(f"Signup failed - Bad request: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Signup failed - Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500

@auth_blueprint.route('/verify-token', methods=['POST'])
def verify_token():
    try:
        data = request.get_json(force=True)
        if not data or 'token' not in data:
            raise BadRequest("Token is required")
        
        result = auth_service.verify_token(data['token'])
        logger.info("Token verification successful")
        return jsonify(result)
    except BadRequest as e:
        logger.warning(f"Token verification failed - Bad request: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Unauthorized as e:
        logger.warning(f"Token verification failed - Invalid token: {str(e)}")
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"Token verification failed - Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500

@auth_blueprint.route('/logout', methods=['POST'])
def logout():
    try:
        data = request.get_json(force=True)
        if not data or 'token' not in data:
            raise BadRequest("Token is required")
        
        result = auth_service.logout(data['token'])
        logger.info("User logged out successfully")
        return jsonify(result)
    except BadRequest as e:
        logger.warning(f"Logout failed - Bad request: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Logout failed - Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500 
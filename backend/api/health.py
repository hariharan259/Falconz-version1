from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Basic health check endpoint to verify backend is running.
    """
    return jsonify({
        "status": "UP",
        "service": "FalconZ V1 API",
        "message": "Backend is healthy."
    }), 200

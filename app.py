import os
from flask import Flask, render_template, jsonify, send_from_directory
from config import config

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    @app.route('/')
    def index():
        return render_template('index.html', config=app.config)
    
    @app.route('/kiosk')
    def kiosk():
        return render_template('kiosk.html', config=app.config)
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy', 'config': config_name})
    
    @app.route('/api/images')
    def get_images():
        from utils.image_manager import ImageManager
        
        image_manager = ImageManager(app.config['IMAGE_DIRECTORY'])
        catalog = image_manager.get_image_catalog()
        
        # Add cache headers for performance
        response = jsonify(catalog)
        if app.config['ENABLE_CACHING']:
            response.headers['Cache-Control'] = f'public, max-age={app.config["CACHE_MAX_AGE"]}'
        
        return response
    
    @app.route('/api/pattern/<seed>')
    def get_pattern(seed):
        # TODO: Implement pattern generation
        return jsonify({'pattern': [], 'seed': seed})
    
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('FLASK_PORT', 5000))
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    app.run(host=host, port=port, debug=app.config['DEBUG'])
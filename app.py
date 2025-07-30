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
        
        # Pass the full app config as base config for per-image overrides
        image_manager = ImageManager(app.config['IMAGE_DIRECTORY'], base_config=dict(app.config))
        catalog = image_manager.get_image_catalog()
        
        # Add cache headers for performance
        response = jsonify(catalog)
        if app.config['ENABLE_CACHING']:
            response.headers['Cache-Control'] = f'public, max-age={app.config["CACHE_MAX_AGE"]}'
        
        return response
    
    @app.route('/api/pattern/<seed>')
    def get_pattern(seed):
        """Generate a deterministic pattern sequence from a seed."""
        from utils.image_manager import ImageManager
        import hashlib
        
        try:
            # Get available images
            image_manager = ImageManager(app.config['IMAGE_DIRECTORY'], base_config=dict(app.config))
            catalog = image_manager.get_image_catalog()
            
            if not catalog['images']:
                return jsonify({'error': 'No images available'}), 400
            
            # Generate deterministic sequence
            pattern_length = 100  # Default pattern length
            image_ids = [img['id'] for img in catalog['images']]
            image_ids.sort()  # Ensure consistent ordering
            
            # Create seeded random number generator
            seed_hash = int(hashlib.md5(seed.encode()).hexdigest(), 16) % (2**32)
            
            # Simple linear congruential generator for deterministic results
            def seeded_random():
                nonlocal seed_hash
                seed_hash = (seed_hash * 1664525 + 1013904223) % (2**32)
                return seed_hash / (2**32)
            
            # Generate sequence
            pattern = []
            for i in range(pattern_length):
                random_index = int(seeded_random() * len(image_ids))
                pattern.append(image_ids[random_index])
            
            return jsonify({
                'pattern': pattern,
                'seed': seed,
                'length': len(pattern),
                'total_images': len(image_ids)
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/config')
    def get_config():
        """Get application configuration including initial pattern code."""
        config_data = {
            'initial_pattern_code': app.config.get('INITIAL_PATTERN_CODE'),
            'pattern_seed': app.config.get('PATTERN_SEED', 'auto'),
            'animation_fps': app.config.get('ANIMATION_FPS', 30),
            'max_concurrent_images': app.config.get('MAX_CONCURRENT_IMAGES', 10),
            'preload_buffer_size': app.config.get('PRELOAD_BUFFER_SIZE', 5),
            'lazy_loading': app.config.get('LAZY_LOADING', True),
            'matte_border': app.config.get('MATTE_BORDER', {})
        }
        
        response = jsonify(config_data)
        if app.config['ENABLE_CACHING']:
            response.headers['Cache-Control'] = f'public, max-age={app.config["CACHE_MAX_AGE"]}'
        
        return response
    
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
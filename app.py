import os
import json
import uuid
from datetime import datetime
from flask import Flask, render_template, jsonify, send_from_directory, request
from config import config

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    @app.route('/')
    def index():
        # Check for config changes on page load
        config_obj = config[config_name or 'default']
        config_obj.check_and_reload()
        app.config.from_object(config_obj)
        return render_template('index.html', config=app.config)
    
    @app.route('/kiosk')
    def kiosk():
        # Check for config changes on page load
        config_obj = config[config_name or 'default']
        config_obj.check_and_reload()
        app.config.from_object(config_obj)
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
        """Get application configuration - returns JSON config directly."""
        # Check for config changes before serving config
        config_obj = config[config_name or 'default']
        config_obj.check_and_reload()
        
        # Return the raw JSON configuration data directly
        config_data = config_obj._config_data
        
        response = jsonify(config_data)
        if config_data.get('application', {}).get('enable_caching', True):
            cache_max_age = config_data.get('application', {}).get('cache_max_age', 3600)
            response.headers['Cache-Control'] = f'public, max-age={cache_max_age}'
        
        return response
    
    @app.route('/api/favorites', methods=['POST'])
    def save_favorite():
        """Save a painting state as a favorite."""
        try:
            # Get the painting state from request
            state_data = request.get_json()
            
            if not state_data:
                return jsonify({'error': 'No state data provided'}), 400
            
            if not state_data.get('layers'):
                return jsonify({'error': 'No layers in state data'}), 400
            
            # Generate a unique ID for this favorite
            favorite_id = str(uuid.uuid4())
            
            # Add metadata
            favorite_data = {
                'id': favorite_id,
                'created_at': datetime.utcnow().isoformat(),
                'state': state_data
            }
            
            # Load existing favorites or create new file
            favorites_file = 'favorites.json'
            favorites = {}
            
            if os.path.exists(favorites_file):
                try:
                    with open(favorites_file, 'r') as f:
                        favorites = json.load(f)
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Warning: Could not load existing favorites: {e}")
                    favorites = {}
            
            # Add new favorite
            favorites[favorite_id] = favorite_data
            
            # Save back to file
            try:
                with open(favorites_file, 'w') as f:
                    json.dump(favorites, f, indent=2)
            except IOError as e:
                return jsonify({'error': f'Failed to save favorite: {str(e)}'}), 500
            
            return jsonify({
                'success': True,
                'id': favorite_id,
                'created_at': favorite_data['created_at']
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/favorites/<favorite_id>', methods=['GET'])
    def get_favorite(favorite_id):
        """Retrieve a saved favorite by ID."""
        try:
            favorites_file = 'favorites.json'
            
            if not os.path.exists(favorites_file):
                return jsonify({'error': 'No favorites found'}), 404
            
            with open(favorites_file, 'r') as f:
                favorites = json.load(f)
            
            if favorite_id not in favorites:
                return jsonify({'error': 'Favorite not found'}), 404
            
            favorite_data = favorites[favorite_id]
            
            # Return just the state data (not the metadata)
            return jsonify(favorite_data['state'])
            
        except (json.JSONDecodeError, IOError) as e:
            return jsonify({'error': f'Failed to load favorite: {str(e)}'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/favorites/<favorite_id>', methods=['DELETE'])
    def delete_favorite(favorite_id):
        """Delete a saved favorite by ID."""
        try:
            favorites_file = 'favorites.json'
            
            if not os.path.exists(favorites_file):
                return jsonify({'error': 'No favorites found'}), 404
            
            with open(favorites_file, 'r') as f:
                favorites = json.load(f)
            
            if favorite_id not in favorites:
                return jsonify({'error': 'Favorite not found'}), 404
            
            # Remove the favorite
            del favorites[favorite_id]
            
            # Save back to file
            with open(favorites_file, 'w') as f:
                json.dump(favorites, f, indent=2)
            
            return jsonify({
                'success': True,
                'message': 'Favorite deleted successfully'
            })
            
        except (json.JSONDecodeError, IOError) as e:
            return jsonify({'error': f'Failed to delete favorite: {str(e)}'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/favorites', methods=['GET'])
    def list_favorites():
        """List all saved favorites with metadata."""
        try:
            favorites_file = 'favorites.json'
            
            if not os.path.exists(favorites_file):
                return jsonify([])
            
            with open(favorites_file, 'r') as f:
                favorites = json.load(f)
            
            # Convert to list format with metadata
            favorites_list = []
            for favorite_id, favorite_data in favorites.items():
                favorites_list.append({
                    'id': favorite_id,
                    'created_at': favorite_data.get('created_at'),
                    'layer_count': len(favorite_data.get('state', {}).get('layers', [])),
                    # Generate a simple thumbnail description based on layers
                    'preview': {
                        'layers': favorite_data.get('state', {}).get('layers', [])[:4]  # First 4 layers for preview
                    }
                })
            
            # Sort by creation date (newest first)
            favorites_list.sort(key=lambda x: x['created_at'], reverse=True)
            
            return jsonify(favorites_list)
            
        except (json.JSONDecodeError, IOError) as e:
            return jsonify({'error': f'Failed to load favorites: {str(e)}'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
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
import os
import json
import uuid
from datetime import datetime
from pathlib import Path
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
    
    @app.route('/favicon.ico')
    def favicon():
        return '', 204  # No content
    
    @app.route('/api/images')
    def get_images():
        from utils.image_manager import ImageManager
        
        try:
            # Pass the full app config as base config for per-image overrides
            image_manager = ImageManager(app.config['IMAGE_DIRECTORY'], base_config=dict(app.config))
            catalog = image_manager.get_image_catalog()
            
            # Add cache headers for performance, but not if cache-busting timestamp is present
            response = jsonify(catalog)
            if app.config['ENABLE_CACHING'] and 't' not in request.args:
                response.headers['Cache-Control'] = f'public, max-age={app.config["CACHE_MAX_AGE"]}'
            else:
                # Disable caching for cache-busting requests
                response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response.headers['Pragma'] = 'no-cache'
                response.headers['Expires'] = '0'
            
            return response
        except Exception as e:
            return jsonify({'error': 'Failed to load image catalog', 'message': str(e)}), 500
    
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
            # Get the favorite data from request
            try:
                favorite_request = request.get_json()
            except Exception as json_error:
                return jsonify({'error': 'Invalid JSON format'}), 400
            
            if not favorite_request:
                return jsonify({'error': 'No favorite data provided'}), 400
            
            # Extract state and thumbnail from request
            state_data = favorite_request.get('state')
            thumbnail_data = favorite_request.get('thumbnail')
            
            if not state_data:
                return jsonify({'error': 'No state data provided'}), 400
                
            if not state_data.get('layers'):
                return jsonify({'error': 'No layers in state data'}), 400
            
            # Generate a unique ID for this favorite
            favorite_id = str(uuid.uuid4())
            
            # Add metadata including thumbnail
            favorite_data = {
                'id': favorite_id,
                'created_at': datetime.now().isoformat(),
                'state': state_data,
                'thumbnail': thumbnail_data  # Store base64 thumbnail data
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
            
            # Return the full favorite data (including id, created_at, state, thumbnail)
            return jsonify(favorite_data)
            
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
                    'thumbnail': favorite_data.get('thumbnail')  # Base64 canvas thumbnail
                })
            
            # Sort by creation date (newest first)
            favorites_list.sort(key=lambda x: x['created_at'], reverse=True)
            
            return jsonify(favorites_list)
            
        except (json.JSONDecodeError, IOError) as e:
            return jsonify({'error': f'Failed to load favorites: {str(e)}'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/settings', methods=['GET'])
    def get_settings():
        """Get all application settings."""
        try:
            settings_file = 'settings.json'
            
            # Default settings
            default_settings = {
                'speed': 1,
                'maxLayers': 4,
                'volume': 50,
                'isWhiteBackground': False,
                'gallery': {
                    'brightness': 100,
                    'contrast': 100,
                    'saturation': 100,
                    'whiteBalance': 100,
                    'textureIntensity': 0
                }
            }
            
            if not os.path.exists(settings_file):
                # Create settings file with defaults on first run
                with open(settings_file, 'w') as f:
                    json.dump(default_settings, f, indent=2)
                return jsonify(default_settings)
            
            with open(settings_file, 'r') as f:
                settings = json.load(f)
            
            # Merge with defaults to ensure all keys exist
            merged_settings = {**default_settings, **settings}
            merged_settings['gallery'] = {**default_settings['gallery'], **settings.get('gallery', {})}
            
            return jsonify(merged_settings)
            
        except (json.JSONDecodeError, IOError) as e:
            return jsonify({'error': f'Failed to load settings: {str(e)}'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/settings', methods=['POST'])
    def update_settings():
        """Update application settings (partial or full update)."""
        try:
            settings_file = 'settings.json'
            
            # Get the update data from request
            try:
                update_data = request.get_json()
            except Exception as json_error:
                return jsonify({'error': 'Invalid JSON format'}), 400
            
            if not update_data:
                return jsonify({'error': 'No settings data provided'}), 400
            
            # Load existing settings or use defaults
            current_settings = {}
            if os.path.exists(settings_file):
                try:
                    with open(settings_file, 'r') as f:
                        current_settings = json.load(f)
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Warning: Could not load existing settings: {e}")
            
            # Merge updates with current settings
            if 'gallery' in update_data and 'gallery' in current_settings:
                # Handle gallery settings specially to allow partial updates
                current_settings['gallery'] = {**current_settings.get('gallery', {}), **update_data['gallery']}
                del update_data['gallery']
            
            # Update other settings
            updated_settings = {**current_settings, **update_data}
            
            # Save back to file
            try:
                with open(settings_file, 'w') as f:
                    json.dump(updated_settings, f, indent=2)
            except IOError as e:
                return jsonify({'error': f'Failed to save settings: {str(e)}'}), 500
            
            return jsonify({
                'success': True,
                'settings': updated_settings
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/images/upload', methods=['POST'])
    def upload_image():
        """Upload a new image to the image directory."""
        try:
            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400
            
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # Check file extension
            allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
            filename = file.filename.lower()
            if not any(filename.endswith(ext) for ext in allowed_extensions):
                return jsonify({'error': 'Invalid file type. Supported formats: PNG, JPG, JPEG, GIF, WEBP'}), 400
            
            # Save the file
            image_dir = Path(app.config['IMAGE_DIRECTORY'])
            image_dir.mkdir(exist_ok=True)
            
            file_path = image_dir / file.filename
            
            # Check if file already exists
            if file_path.exists():
                # Return existing image info instead of error for duplicate detection
                from utils.image_manager import ImageManager
                image_manager = ImageManager(app.config['IMAGE_DIRECTORY'])
                image_info = image_manager._get_image_info(file_path)
                
                return jsonify({
                    'success': True,
                    'message': 'File already exists',
                    'duplicate': True,
                    'image': image_info
                })
            
            file.save(str(file_path))
            
            # Validate the uploaded image
            from utils.image_manager import ImageManager
            image_manager = ImageManager(app.config['IMAGE_DIRECTORY'])
            
            if not image_manager.validate_image(file_path):
                # Delete invalid file
                file_path.unlink()
                return jsonify({'error': 'Invalid or corrupted image file'}), 400
            
            # Get image info for response
            image_info = image_manager._get_image_info(file_path)
            
            return jsonify({
                'success': True,
                'message': 'Image uploaded successfully',
                'image': image_info
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/images/<filename>', methods=['DELETE'])
    def delete_image(filename):
        """Delete an image from the image directory."""
        try:
            image_dir = Path(app.config['IMAGE_DIRECTORY'])
            file_path = image_dir / filename
            
            if not file_path.exists():
                return jsonify({'error': 'Image not found'}), 404
            
            # Check if it's actually an image file
            allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
            if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
                return jsonify({'error': 'Not an image file'}), 400
            
            # Delete the image file
            file_path.unlink()
            
            # Also delete associated JSON config file if exists
            config_path = file_path.with_suffix('.json')
            if config_path.exists():
                config_path.unlink()
            
            return jsonify({
                'success': True,
                'message': 'Image deleted successfully'
            })
            
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
    # Use development config by default
    config_name = 'development'
    config_obj = config[config_name]
    
    app = create_app(config_name)
    
    # Use config.json values only
    host = config_obj.FLASK_HOST
    port = config_obj.FLASK_PORT
    print(f"Starting Flask server on {host}:{port}")
    print(f"Debug mode: {app.config['DEBUG']}")
    app.run(host=host, port=port, debug=app.config['DEBUG'])
import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, jsonify, send_from_directory, request
from config import config

# Global variables to track requests
save_favorite_request = {'timestamp': None, 'processed': True}
play_pause_request = {'timestamp': None, 'processed': True, 'action': None}
refresh_images_request = {'timestamp': None, 'processed': True, 'uploaded_images': []}

# Global variable to track remote control heartbeats
remote_heartbeats = {}  # {session_id: timestamp}

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
    
    @app.route('/remote')
    def remote():
        # iPhone remote control interface
        # Check for config changes on page load
        config_obj = config[config_name or 'default']
        config_obj.check_and_reload()
        app.config.from_object(config_obj)
        return render_template('remote.html', config=app.config)
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy', 'config': config_name})
    
    @app.route('/favicon.ico')
    def favicon():
        return '', 204  # No content
    
    @app.route('/service-worker.js')
    def service_worker():
        # Serve the service worker from the static directory
        return send_from_directory('static', 'service-worker.js', mimetype='application/javascript')
    
    
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
        global remote_heartbeats
        
        try:
            # Track heartbeat if provided (from remote control)
            heartbeat = request.args.get('heartbeat')
            if heartbeat:
                session_id = request.remote_addr + '_' + request.headers.get('User-Agent', '')[:50]
                remote_heartbeats[session_id] = float(heartbeat)
                # Clean up old heartbeats (older than 60 seconds)
                cutoff_time = float(heartbeat) - 60000  # 60 seconds ago
                remote_heartbeats = {k: v for k, v in remote_heartbeats.items() if v > cutoff_time}
            settings_file = 'settings.json'
            
            # Default settings
            default_settings = {
                'speed': 1,
                'maxLayers': 4,
                'volume': 50,
                'isWhiteBackground': False,
                'isPlaying': True,  # Animation playing state
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
    
    @app.route('/api/remote-status', methods=['GET'])
    def get_remote_status():
        """Get the status of active remote controls."""
        global remote_heartbeats
        
        try:
            current_time = datetime.now().timestamp() * 1000  # Current time in milliseconds
            active_cutoff = current_time - 35000  # 35 seconds ago
            
            # Count active remotes (heartbeats within last 35 seconds)
            active_remotes = {k: v for k, v in remote_heartbeats.items() if v > active_cutoff}
            active_count = len(active_remotes)
            
            return jsonify({
                'active_remotes': active_count,
                'last_heartbeats': {k: int(v) for k, v in active_remotes.items()},
                'current_time': int(current_time)
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/new-pattern', methods=['POST'])
    def new_pattern():
        """Trigger a new pattern generation on the main display."""
        try:
            # Store the new pattern request timestamp so RemoteSync can detect it
            settings_file = 'settings.json'
            
            # Read current settings
            current_settings = {}
            if os.path.exists(settings_file):
                try:
                    with open(settings_file, 'r') as f:
                        current_settings = json.load(f)
                except json.JSONDecodeError:
                    current_settings = {}
            
            # Add new pattern request timestamp
            import time
            current_settings['newPatternRequest'] = time.time()
            
            # Save updated settings
            try:
                with open(settings_file, 'w') as f:
                    json.dump(current_settings, f, indent=2)
            except IOError as e:
                return jsonify({'error': f'Failed to save new pattern request: {str(e)}'}), 500
            
            return jsonify({
                'success': True,
                'message': 'New pattern triggered'
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/favorites/<favorite_id>/load', methods=['POST'])
    def load_favorite(favorite_id):
        """Load a specific favorite on the main display."""
        try:
            # This endpoint allows remote control to load favorites
            # The main application should poll for favorite loads or use WebSocket
            favorites_file = 'favorites.json'
            
            if not os.path.exists(favorites_file):
                return jsonify({'error': 'No favorites found'}), 404
            
            with open(favorites_file, 'r') as f:
                favorites = json.load(f)
            
            if favorite_id not in favorites:
                return jsonify({'error': 'Favorite not found'}), 404
            
            # Store the favorite to be loaded in a temporary file for polling
            load_request = {
                'timestamp': datetime.now().isoformat(),
                'favorite_id': favorite_id,
                'favorite_data': favorites[favorite_id]
            }
            
            with open('load_favorite.json', 'w') as f:
                json.dump(load_request, f, indent=2)
            
            return jsonify({
                'success': True,
                'message': 'Favorite loaded',
                'favorite_id': favorite_id
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    
    @app.route('/api/save-current-favorite', methods=['POST'])
    def save_current_favorite():
        """Endpoint for remote to request saving current display state as favorite."""
        global save_favorite_request
        save_favorite_request = {
            'timestamp': datetime.now().isoformat(),
            'processed': False
        }
        return jsonify({
            'success': True,
            'message': 'Save favorite request received'
        })
    
    @app.route('/api/check-save-favorite', methods=['GET'])
    def check_save_favorite():
        """Check if there's a pending save favorite request."""
        global save_favorite_request
        if not save_favorite_request['processed']:
            # Mark as processed and return the request
            save_favorite_request['processed'] = True
            return jsonify({
                'has_request': True,
                'timestamp': save_favorite_request['timestamp']
            })
        else:
            return jsonify({
                'has_request': False
            })
    
    @app.route('/api/play-pause', methods=['POST'])
    def play_pause():
        """Endpoint for remote to toggle play/pause state."""
        global play_pause_request
        play_pause_request = {
            'timestamp': datetime.now().isoformat(),
            'processed': False,
            'action': 'toggle'
        }
        return jsonify({
            'success': True,
            'message': 'Play/pause request received'
        })
    
    @app.route('/api/check-play-pause', methods=['GET'])
    def check_play_pause():
        """Check if there's a pending play/pause request."""
        global play_pause_request
        if not play_pause_request['processed']:
            # Mark as processed and return the request
            play_pause_request['processed'] = True
            return jsonify({
                'has_request': True,
                'action': play_pause_request['action'],
                'timestamp': play_pause_request['timestamp']
            })
        else:
            return jsonify({
                'has_request': False
            })
    
    @app.route('/api/load-favorite-status', methods=['GET'])
    def get_load_favorite_status():
        """Check if there's a pending favorite load request."""
        try:
            load_file = 'load_favorite.json'
            if os.path.exists(load_file):
                with open(load_file, 'r') as f:
                    load_request = json.load(f)
                return jsonify({
                    'has_request': True,
                    'request': load_request
                })
            else:
                return jsonify({
                    'has_request': False
                })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/load_favorite.json', methods=['DELETE'])
    def delete_load_favorite_request():
        """Delete the favorite load request file."""
        try:
            load_file = 'load_favorite.json'
            if os.path.exists(load_file):
                os.unlink(load_file)
            return jsonify({'success': True})
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
    
    @app.route('/api/images/refresh', methods=['POST'])
    def refresh_images():
        """Request to refresh ImageManager and trigger newly uploaded images."""
        global refresh_images_request
        
        try:
            data = request.get_json() or {}
            uploaded_image_ids = data.get('uploaded_image_ids', [])
            
            print(f"DEBUG: Image refresh request received with IDs: {uploaded_image_ids}")
            
            # Create refresh request
            refresh_images_request['timestamp'] = datetime.now().isoformat()
            refresh_images_request['processed'] = False
            refresh_images_request['uploaded_images'] = uploaded_image_ids
            
            return jsonify({
                'success': True,
                'message': 'Image refresh requested',
                'uploaded_image_ids': uploaded_image_ids
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/check-refresh-images', methods=['GET'])
    def check_refresh_images():
        """Check for refresh images requests from remote control."""
        global refresh_images_request
        
        try:
            if not refresh_images_request['processed'] and refresh_images_request['timestamp']:
                # Return the request
                return jsonify({
                    'has_request': True,
                    'timestamp': refresh_images_request['timestamp'],
                    'uploaded_image_ids': refresh_images_request['uploaded_images']
                })
            else:
                return jsonify({'has_request': False})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/refresh-images-status', methods=['DELETE'])
    def clear_refresh_images_request():
        """Mark the refresh images request as processed."""
        global refresh_images_request
        
        try:
            refresh_images_request['processed'] = True
            refresh_images_request['timestamp'] = None
            refresh_images_request['uploaded_images'] = []
            
            return jsonify({'success': True})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/debug-log', methods=['POST'])
    def debug_log():
        """Log debug information to a file for analysis."""
        try:
            data = request.get_json()
            if not data or 'message' not in data:
                return jsonify({'error': 'Missing message in request'}), 400
            
            # Create debug log file path
            debug_file = 'debug.log'
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            
            # Format log entry
            log_entry = f"[{timestamp}] {data['message']}\n"
            
            # Append to debug file
            with open(debug_file, 'a', encoding='utf-8') as f:
                f.write(log_entry)
            
            return jsonify({'success': True})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/debug-clear', methods=['POST'])
    def debug_clear():
        """Clear the debug log file."""
        try:
            debug_file = 'debug.log'
            if os.path.exists(debug_file):
                open(debug_file, 'w').close()  # Truncate file
            return jsonify({'success': True, 'message': 'Debug log cleared'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/debug-config')
    def debug_config_info():
        """Debug endpoint to view current config state and environment"""
        try:
            config_obj = config[config_name or 'default']
            
            # Get environment detection info
            import platform
            from launcher import is_raspberry_pi
            
            debug_info = {
                'environment': {
                    'config_name': config_name or 'default',
                    'flask_config_env': os.environ.get('FLASK_CONFIG'),
                    'debug_config_env': os.environ.get('DEBUG_CONFIG'),
                    'platform_system': platform.system(),
                    'platform_machine': platform.machine(),
                    'is_raspberry_pi_detected': is_raspberry_pi(),
                },
                'config_sections': list(config_obj._config_data.keys()),
                'critical_paths': {
                    'transformations_exists': 'transformations' in config_obj._config_data,
                    'translation_exists': config_obj._config_data.get('transformations', {}).get('translation') is not None,
                    'layout_mode': config_obj._config_data.get('transformations', {}).get('translation', {}).get('layout_mode'),
                    'translation_enabled': config_obj._config_data.get('transformations', {}).get('translation', {}).get('enabled'),
                },
                'full_translation_config': config_obj._config_data.get('transformations', {}).get('translation', {}),
                'config_file_path': config_obj._config_path,
                'last_modified': config_obj._last_modified,
            }
            
            return jsonify(debug_info)
            
        except Exception as e:
            return jsonify({'error': str(e), 'traceback': str(e.__class__.__name__)}), 500
    
    @app.route('/api/cpu-temperature')
    def get_cpu_temperature():
        """Get CPU temperature on Raspberry Pi."""
        try:
            import platform
            
            # Check if running on Raspberry Pi (ARM architecture)
            if not (platform.machine().startswith('arm') or platform.machine().startswith('aarch')):
                return jsonify({'error': 'CPU temperature only available on Raspberry Pi'}), 404
            
            # Read temperature from RPi thermal zone
            temp_file = '/sys/class/thermal/thermal_zone0/temp'
            if os.path.exists(temp_file):
                with open(temp_file, 'r') as f:
                    temp_millidegrees = int(f.read().strip())
                    temp_celsius = temp_millidegrees / 1000.0
                    return jsonify({
                        'temperature': round(temp_celsius),
                        'unit': 'C'
                    })
            else:
                return jsonify({'error': 'Temperature sensor not found'}), 404
                
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
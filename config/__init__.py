import os
import json
import time
from threading import Lock

def load_config_from_json(config_name='development'):
    """Load configuration from config.json file"""
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
    
    try:
        with open(config_path, 'r') as f:
            config_data = json.load(f)
    except FileNotFoundError:
        raise RuntimeError(f"Configuration file not found: {config_path}")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON in configuration file: {e}")
    
    # Get base configuration
    base_config = {
        'flask': config_data.get('flask', {}),
        'application': config_data.get('application', {}),
        'animation_timing': config_data.get('animation_timing', {}),
        'layer_management': config_data.get('layer_management', {}),
        'transformations': config_data.get('transformations', {}),
        'color_remapping': config_data.get('color_remapping', {}),
        'performance': config_data.get('performance', {}),
        'audio': config_data.get('audio', {}),
        'canvas_drop_shadow': config_data.get('canvas_drop_shadow', {}),
        'matte_border': config_data.get('matte_border', {})
    }
    
    # Apply environment-specific overrides
    environments = config_data.get('environments', {})
    if config_name in environments:
        env_config = environments[config_name]
        for section, values in env_config.items():
            if section in base_config:
                base_config[section].update(values)
            else:
                base_config[section] = values
    
    return base_config

class Config:
    def __init__(self, config_name='development'):
        self._config_name = config_name
        self._config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
        self._last_modified = 0
        self._lock = Lock()
        self._config_data = load_config_from_json(config_name)
        self._load_configuration()
    
    def _load_configuration(self):
        # Flask configuration
        flask_config = self._config_data.get('flask', {})
        self.DEBUG = flask_config.get('debug', True)
        self.SECRET_KEY = flask_config.get('secret_key', 'dev-secret-key')
        self.FLASK_HOST = flask_config.get('host', '127.0.0.1')
        self.FLASK_PORT = flask_config.get('port', 5000)
        
        # Application configuration
        app_config = self._config_data.get('application', {})
        self.IMAGE_DIRECTORY = app_config.get('image_directory', 'static/images')
        self.MAX_CONCURRENT_IMAGES = app_config.get('max_concurrent_images', 10)
        self.PRELOAD_BUFFER_SIZE = app_config.get('preload_buffer_size', 5)
        self.ANIMATION_FPS = app_config.get('animation_fps', 30)
        self.PATTERN_SEED = app_config.get('pattern_seed', 'auto')
        self.INITIAL_PATTERN_CODE = app_config.get('initial_pattern_code')
        self.ENABLE_CACHING = app_config.get('enable_caching', True)
        self.CACHE_MAX_AGE = app_config.get('cache_max_age', 3600)
        self.LAZY_LOADING = app_config.get('lazy_loading', True)
        
        # Animation timing configuration
        timing_config = self._config_data.get('animation_timing', {})
        self.FADE_IN_MIN_SEC = timing_config.get('fade_in_min_sec', 2.0)
        self.FADE_IN_MAX_SEC = timing_config.get('fade_in_max_sec', 5.0)
        self.FADE_OUT_MIN_SEC = timing_config.get('fade_out_min_sec', 3.0)
        self.FADE_OUT_MAX_SEC = timing_config.get('fade_out_max_sec', 6.0)
        self.MIN_HOLD_TIME_SEC = timing_config.get('min_hold_time_sec', 4.0)
        self.MAX_HOLD_TIME_SEC = timing_config.get('max_hold_time_sec', 12.0)
        self.LAYER_SPAWN_INTERVAL_SEC = timing_config.get('layer_spawn_interval_sec', 4.0)
        
        # Layer management configuration
        layer_config = self._config_data.get('layer_management', {})
        self.MAX_CONCURRENT_LAYERS = layer_config.get('max_concurrent_layers', 5)
        self.MAX_OPACITY = layer_config.get('max_opacity', 0.8)
        self.MIN_OPACITY = layer_config.get('min_opacity', 0.7)
        
        # Transformation configuration
        transform_config = self._config_data.get('transformations', {})
        rotation_config = transform_config.get('rotation', {})
        self.ROTATION_ENABLED = rotation_config.get('enabled', True)
        self.ROTATION_MIN_DEGREES = rotation_config.get('min_degrees', -15)
        self.ROTATION_MAX_DEGREES = rotation_config.get('max_degrees', 15)
        
        scale_config = transform_config.get('scale', {})
        self.SCALE_ENABLED = scale_config.get('enabled', True)
        self.SCALE_MIN_FACTOR = scale_config.get('min_factor', 0.8)
        self.SCALE_MAX_FACTOR = scale_config.get('max_factor', 1.2)
        
        translation_config = transform_config.get('translation', {})
        self.TRANSLATION_ENABLED = translation_config.get('enabled', True)
        self.TRANSLATION_LAYOUT_MODE = translation_config.get('layout_mode', 'random')
        rule_of_thirds_config = translation_config.get('rule_of_thirds', {})
        self.TRANSLATION_RULE_OF_THIRDS_MAX_HORIZONTAL_DEVIATION_PERCENT = rule_of_thirds_config.get('max_horizontal_deviation_percent', 5)
        self.TRANSLATION_RULE_OF_THIRDS_MAX_VERTICAL_DEVIATION_PERCENT = rule_of_thirds_config.get('max_vertical_deviation_percent', 5)
        
        rule_of_thirds_and_centre_config = translation_config.get('rule_of_thirds_and_centre', {})
        self.TRANSLATION_RULE_OF_THIRDS_AND_CENTRE_MAX_HORIZONTAL_DEVIATION_PERCENT = rule_of_thirds_and_centre_config.get('max_horizontal_deviation_percent', 5)
        self.TRANSLATION_RULE_OF_THIRDS_AND_CENTRE_MAX_VERTICAL_DEVIATION_PERCENT = rule_of_thirds_and_centre_config.get('max_vertical_deviation_percent', 5)
        
        rule_of_fifths_thirds_and_centre_config = translation_config.get('rule_of_fifths_thirds_and_centre', {})
        self.TRANSLATION_RULE_OF_FIFTHS_THIRDS_AND_CENTRE_MAX_HORIZONTAL_DEVIATION_PERCENT = rule_of_fifths_thirds_and_centre_config.get('max_horizontal_deviation_percent', 5)
        self.TRANSLATION_RULE_OF_FIFTHS_THIRDS_AND_CENTRE_MAX_VERTICAL_DEVIATION_PERCENT = rule_of_fifths_thirds_and_centre_config.get('max_vertical_deviation_percent', 5)
        
        rule_of_fifths_and_thirds_config = translation_config.get('rule_of_fifths_and_thirds', {})
        self.TRANSLATION_RULE_OF_FIFTHS_AND_THIRDS_MAX_HORIZONTAL_DEVIATION_PERCENT = rule_of_fifths_and_thirds_config.get('max_horizontal_deviation_percent', 5)
        self.TRANSLATION_RULE_OF_FIFTHS_AND_THIRDS_MAX_VERTICAL_DEVIATION_PERCENT = rule_of_fifths_and_thirds_config.get('max_vertical_deviation_percent', 5)
        
        best_fit_scaling_config = transform_config.get('best_fit_scaling', {})
        self.BEST_FIT_SCALING_ENABLED = best_fit_scaling_config.get('enabled', True)
        
        # Color remapping configuration
        color_remapping_config = self._config_data.get('color_remapping', {})
        self.COLOR_REMAPPING_ENABLED = color_remapping_config.get('enabled', False)
        self.COLOR_REMAPPING_PROBABILITY = color_remapping_config.get('probability', 0.3)
        hue_shift_range = color_remapping_config.get('hue_shift_range', {})
        self.COLOR_REMAPPING_HUE_MIN_DEGREES = hue_shift_range.get('min_degrees', 0)
        self.COLOR_REMAPPING_HUE_MAX_DEGREES = hue_shift_range.get('max_degrees', 360)
        
        # Performance configuration
        perf_config = self._config_data.get('performance', {})
        self.ANIMATION_QUALITY = perf_config.get('animation_quality', 'high')
        self.PRELOAD_TRANSFORM_CACHE = perf_config.get('preload_transform_cache', True)
        
        # Audio configuration
        audio_config = self._config_data.get('audio', {})
        self.AUDIO_ENABLED = audio_config.get('enabled', False)
        self.AUDIO_FILE_PATH = audio_config.get('file_path', 'static/audio/ambient.mp3')
        self.AUDIO_VOLUME = audio_config.get('volume', 0.5)
        self.AUDIO_LOOP = audio_config.get('loop', True)
        self.AUDIO_AUTOPLAY = audio_config.get('autoplay', True)
        
        # Matte border configuration
        border_config = self._config_data.get('matte_border', {})
        self.MATTE_BORDER = border_config
        self.MATTE_BORDER_ENABLED = border_config.get('enabled', False)
        self.MATTE_BORDER_BORDER_PERCENT = border_config.get('border_percent', 10)
        self.MATTE_BORDER_COLOR = border_config.get('color', '#F8F8F8')
        self.MATTE_BORDER_STYLE = border_config.get('style', 'classic')
        
        # Matte border image area configuration
        image_area_config = border_config.get('image_area', {})
        self.MATTE_BORDER_IMAGE_AREA_ASPECT_RATIO = image_area_config.get('aspect_ratio', '1:1')
    
    def check_and_reload(self):
        """Check if config file has changed and reload if necessary"""
        try:
            current_modified = os.path.getmtime(self._config_path)
            if current_modified > self._last_modified:
                with self._lock:
                    # Double-check after acquiring lock
                    current_modified = os.path.getmtime(self._config_path)
                    if current_modified > self._last_modified:
                        # Silently reload without print statements to avoid debugger issues
                        self._config_data = load_config_from_json(self._config_name)
                        self._load_configuration()
                        self._last_modified = current_modified
                        return True
        except Exception as e:
            # Use app logger or stderr to avoid debugger issues
            import sys
            sys.stderr.write(f"Error checking/reloading config: {str(e)}\n")
        return False
    

class DevelopmentConfig(Config):
    def __init__(self):
        super().__init__('development')

class ProductionConfig(Config):
    def __init__(self):
        super().__init__('production')

class RaspberryPiConfig(Config):
    def __init__(self):
        super().__init__('raspberry_pi')

config = {
    'development': DevelopmentConfig(),
    'production': ProductionConfig(),
    'raspberry_pi': RaspberryPiConfig(),
    'default': DevelopmentConfig()
}
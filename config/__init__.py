import os
import json

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
        'performance': config_data.get('performance', {})
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
        self.TRANSLATION_X_RANGE = translation_config.get('x_range_percent', 20)
        self.TRANSLATION_Y_RANGE = translation_config.get('y_range_percent', 15)
        
        # Performance configuration
        perf_config = self._config_data.get('performance', {})
        self.ANIMATION_QUALITY = perf_config.get('animation_quality', 'high')
        self.PRELOAD_TRANSFORM_CACHE = perf_config.get('preload_transform_cache', True)

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
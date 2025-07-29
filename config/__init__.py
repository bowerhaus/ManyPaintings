import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    IMAGE_DIRECTORY = os.environ.get('IMAGE_DIRECTORY') or 'static/images'
    MAX_CONCURRENT_IMAGES = int(os.environ.get('MAX_CONCURRENT_IMAGES', '10'))
    PRELOAD_BUFFER_SIZE = int(os.environ.get('PRELOAD_BUFFER_SIZE', '5'))
    ANIMATION_FPS = int(os.environ.get('ANIMATION_FPS', '30'))
    PATTERN_SEED = os.environ.get('PATTERN_SEED', 'auto')
    ENABLE_CACHING = os.environ.get('ENABLE_CACHING', 'true').lower() == 'true'
    CACHE_MAX_AGE = int(os.environ.get('CACHE_MAX_AGE', '3600'))
    LAZY_LOADING = os.environ.get('LAZY_LOADING', 'true').lower() == 'true'

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'

class RaspberryPiConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
    MAX_CONCURRENT_IMAGES = 8
    PRELOAD_BUFFER_SIZE = 3
    ANIMATION_FPS = 24

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'raspberry_pi': RaspberryPiConfig,
    'default': DevelopmentConfig
}
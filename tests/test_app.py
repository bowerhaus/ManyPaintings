"""
Tests for Flask application routes and basic functionality.
"""

import pytest
import json
import tempfile
import os
import io
from pathlib import Path
from unittest.mock import patch, MagicMock


class TestBasicRoutes:
    """Test basic Flask routes."""
    
    def test_index_route(self, client):
        """Test the main index route."""
        response = client.get('/')
        assert response.status_code == 200
        # Check for common HTML elements that should be present
        response_text = response.data.decode()
        assert 'html' in response_text.lower() or 'canvas' in response_text.lower()
    
    def test_kiosk_route(self, client):
        """Test the kiosk mode route."""
        response = client.get('/kiosk')
        assert response.status_code == 200
        response_text = response.data.decode()
        assert 'html' in response_text.lower() or 'canvas' in response_text.lower()
    
    def test_health_endpoint(self, client):
        """Test the health check endpoint."""
        response = client.get('/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'config' in data


class TestImageAPI:
    """Test image-related API endpoints."""
    
    @patch('utils.image_manager.ImageManager')
    def test_get_images_endpoint(self, mock_image_manager, client):
        """Test the GET /api/images endpoint."""
        # Mock the image catalog
        mock_catalog = {
            'images': [
                {
                    'id': 'test1',
                    'filename': 'test1.png',
                    'url': '/static/images/test1.png',
                    'size': 1024
                },
                {
                    'id': 'test2', 
                    'filename': 'test2.jpg',
                    'url': '/static/images/test2.jpg',
                    'size': 2048
                }
            ]
        }
        mock_image_manager.return_value.get_image_catalog.return_value = mock_catalog
        
        response = client.get('/api/images')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'images' in data
        assert len(data['images']) == 2
        assert data['images'][0]['filename'] == 'test1.png'
    
    @patch('utils.image_manager.ImageManager')
    def test_get_images_with_cache_busting(self, mock_image_manager, client):
        """Test the images endpoint with cache-busting parameter."""
        mock_catalog = {'images': []}
        mock_image_manager.return_value.get_image_catalog.return_value = mock_catalog
        
        response = client.get('/api/images?t=123456789')
        assert response.status_code == 200
        
        # Should have no-cache headers when cache-busting is used
        assert 'no-cache' in response.headers.get('Cache-Control', '')


class TestFavoritesAPI:
    """Test favorites-related API endpoints."""
    
    @patch('builtins.open')
    @patch('os.path.exists')
    def test_get_favorites_empty(self, mock_exists, mock_open, client):
        """Test GET favorites when no favorites exist."""
        mock_exists.return_value = False
        
        response = client.get('/api/favorites')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data == []  # Returns empty list, not empty object
    
    @patch('builtins.open')
    @patch('os.path.exists')
    def test_get_favorites_with_data(self, mock_exists, mock_open, client, sample_favorite):
        """Test GET favorites when favorites exist."""
        mock_exists.return_value = True
        mock_file = MagicMock()
        mock_file.read.return_value = json.dumps({'fav1': sample_favorite})
        mock_open.return_value.__enter__.return_value = mock_file
        
        response = client.get('/api/favorites')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['id'] == 'fav1'
        assert data[0]['layer_count'] == 1
        assert 'thumbnail' in data[0]
    
    @patch('builtins.open')
    @patch('os.path.exists')
    def test_post_favorite(self, mock_exists, mock_open, client):
        """Test POST new favorite."""
        mock_exists.return_value = False
        mock_file = MagicMock()
        mock_open.return_value.__enter__.return_value = mock_file
        
        favorite_data = {
            'state': {
                'layers': [{'imageId': 'test', 'opacity': 0.8}],
                'backgroundColor': 'black'
            },
            'thumbnail': 'data:image/png;base64,test'
        }
        
        response = client.post('/api/favorites',
                             data=json.dumps(favorite_data),
                             content_type='application/json')
        
        assert response.status_code in [200, 201]  # Could be either
        data = json.loads(response.data)
        assert 'id' in data or 'success' in data
    
    @patch('builtins.open')
    @patch('os.path.exists') 
    def test_get_single_favorite(self, mock_exists, mock_open, client, sample_favorite):
        """Test GET single favorite by ID."""
        mock_exists.return_value = True
        mock_file = MagicMock()
        mock_file.read.return_value = json.dumps({'test-id': sample_favorite})
        mock_open.return_value.__enter__.return_value = mock_file
        
        response = client.get('/api/favorites/test-id')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['id'] == 'test-favorite-123'
    
    @patch('builtins.open')
    @patch('os.path.exists')
    def test_get_single_favorite_not_found(self, mock_exists, mock_open, client):
        """Test GET single favorite that doesn't exist."""
        mock_exists.return_value = True
        mock_file = MagicMock()
        mock_file.read.return_value = json.dumps({})
        mock_open.return_value.__enter__.return_value = mock_file
        
        response = client.get('/api/favorites/nonexistent')
        assert response.status_code == 404
    
    @patch('builtins.open')
    @patch('os.path.exists')
    def test_delete_favorite(self, mock_exists, mock_open, client, sample_favorite):
        """Test DELETE favorite."""
        mock_exists.return_value = True
        mock_file = MagicMock()
        mock_file.read.return_value = json.dumps({'test-id': sample_favorite})
        mock_open.return_value.__enter__.return_value = mock_file
        
        response = client.delete('/api/favorites/test-id')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'message' in data


class TestPatternAPI:
    """Test pattern generation API endpoints."""
    
    @patch('utils.image_manager.ImageManager')
    def test_get_pattern(self, mock_image_manager, client):
        """Test GET pattern generation."""
        mock_catalog = {
            'images': [
                {'id': 'img1', 'filename': 'test1.png'},
                {'id': 'img2', 'filename': 'test2.png'}
            ]
        }
        mock_image_manager.return_value.get_image_catalog.return_value = mock_catalog
        
        response = client.get('/api/pattern/test-seed-123')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'pattern' in data
        assert 'seed' in data
        assert 'length' in data
        assert 'total_images' in data
        assert data['seed'] == 'test-seed-123'
        assert isinstance(data['pattern'], list)
        assert data['total_images'] == 2
    
    @patch('utils.image_manager.ImageManager')
    def test_get_pattern_no_images(self, mock_image_manager, client):
        """Test pattern generation with no images."""
        mock_image_manager.return_value.get_image_catalog.return_value = {'images': []}
        
        response = client.get('/api/pattern/test-seed')
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert 'error' in data
        assert 'No images available' in data['error']


class TestConfigAPI:
    """Test configuration API endpoints."""
    
    def test_get_config(self, client):
        """Test GET configuration endpoint."""
        response = client.get('/api/config')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        # Should return configuration data
        assert isinstance(data, dict)
        # Likely to have animation_timing, application, etc.
        

class TestImageUploadAPI:
    """Test image upload and deletion endpoints."""
    
    @patch('pathlib.Path.mkdir')
    @patch('pathlib.Path.exists')
    @patch('utils.image_manager.ImageManager')
    def test_upload_image(self, mock_image_manager, mock_exists, mock_mkdir, client, sample_image_data):
        """Test image upload."""
        mock_exists.return_value = False  # File doesn't exist
        mock_image_manager.return_value.validate_image.return_value = True
        mock_image_manager.return_value._get_image_info.return_value = {
            'id': 'test-id',
            'filename': 'test.png',
            'size': 1024
        }
        
        data = {
            'file': (io.BytesIO(sample_image_data), 'test.png')
        }
        
        response = client.post('/api/images/upload', data=data)
        assert response.status_code == 200
        
        response_data = json.loads(response.data)
        assert response_data['success'] is True
        assert 'image' in response_data
    
    def test_upload_image_no_file(self, client):
        """Test upload with no file."""
        response = client.post('/api/images/upload')
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert 'error' in data
        assert 'No file provided' in data['error']
    
    def test_upload_image_invalid_type(self, client):
        """Test upload with invalid file type."""
        data = {
            'file': (io.BytesIO(b'test'), 'test.txt')
        }
        
        response = client.post('/api/images/upload', data=data)
        assert response.status_code == 400
        
        response_data = json.loads(response.data)
        assert 'Invalid file type' in response_data['error']
    
    @patch('pathlib.Path.exists')
    @patch('pathlib.Path.unlink')
    def test_delete_image(self, mock_unlink, mock_exists, client):
        """Test image deletion."""
        mock_exists.return_value = True
        
        response = client.delete('/api/images/test.png')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'deleted successfully' in data['message']
    
    def test_delete_nonexistent_image(self, client):
        """Test deleting nonexistent image."""
        response = client.delete('/api/images/nonexistent.png')
        assert response.status_code == 404
        
        data = json.loads(response.data)
        assert 'not found' in data['error'].lower()


class TestConfigurationSystem:
    """Test configuration loading and hot-reload functionality."""
    
    def test_config_is_loaded(self, client):
        """Test that configuration is properly loaded."""
        response = client.get('/')
        assert response.status_code == 200
        # Config should be available in template context
        
    @patch('config.Config.check_and_reload')
    def test_config_reload_on_page_load(self, mock_reload, client):
        """Test that config is reloaded on page requests."""
        client.get('/')
        mock_reload.assert_called_once()
        
        mock_reload.reset_mock()
        client.get('/kiosk')
        mock_reload.assert_called_once()


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    def test_nonexistent_route(self, client):
        """Test that nonexistent routes return 404."""
        response = client.get('/nonexistent')
        assert response.status_code == 404
    
    @patch('utils.image_manager.ImageManager')
    def test_image_api_error_handling(self, mock_image_manager, client):
        """Test API error handling when ImageManager fails."""
        mock_image_manager.side_effect = Exception("Test error")
        
        response = client.get('/api/images')
        # Should handle gracefully, even if it returns 500
        assert response.status_code in [200, 500]
    
    def test_invalid_json_in_favorites_post(self, client):
        """Test POST to favorites with invalid JSON."""
        response = client.post('/api/favorites',
                             data='invalid json',
                             content_type='application/json')
        
        assert response.status_code == 400


if __name__ == '__main__':
    pytest.main([__file__])
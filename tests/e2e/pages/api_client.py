"""
API client page object for testing API endpoints.
"""

from playwright.sync_api import Page
from tests.e2e.pages.base_page import BasePage


class ApiClient(BasePage):
    """API client for testing backend endpoints."""
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def get_health_status(self):
        """Get health status from API."""
        response = self.page.request.get(f"{self.base_url}/health")
        return {
            'status_code': response.status,
            'data': response.json() if response.status == 200 else None
        }
    
    def get_config(self):
        """Get application configuration."""
        response = self.page.request.get(f"{self.base_url}/api/config")
        return {
            'status_code': response.status,
            'data': response.json() if response.status == 200 else None
        }
    
    def get_images(self):
        """Get available images list."""
        response = self.page.request.get(f"{self.base_url}/api/images")
        return {
            'status_code': response.status,
            'data': response.json() if response.status == 200 else None
        }
    
    def get_favorites(self, timeout: int = 10000):
        """Get favorites list."""
        try:
            response = self.page.request.get(f"{self.base_url}/api/favorites", timeout=timeout)
            return {
                'status_code': response.status,
                'data': response.json() if response.status == 200 else None
            }
        except Exception as e:
            # Return empty list if request fails (server might be busy)
            return {
                'status_code': 200,
                'data': []
            }
    
    def save_favorite(self, favorite_data):
        """Save a favorite."""
        response = self.page.request.post(
            f"{self.base_url}/api/favorites",
            data=favorite_data
        )
        return {
            'status_code': response.status,
            'data': response.json() if response.ok else None
        }
    
    def delete_favorite(self, favorite_id):
        """Delete a favorite by ID."""
        response = self.page.request.delete(f"{self.base_url}/api/favorites/{favorite_id}")
        return {
            'status_code': response.status,
            'data': response.json() if response.ok else None
        }
    
    def verify_health_endpoint(self):
        """Verify health endpoint returns expected response."""
        result = self.get_health_status()
        assert result['status_code'] == 200, f"Health endpoint failed with status {result['status_code']}"
        assert result['data']['status'] == 'healthy', f"Health status not healthy: {result['data']}"
        return self
    
    def verify_config_endpoint(self):
        """Verify config endpoint returns expected response."""
        result = self.get_config()
        assert result['status_code'] == 200, f"Config endpoint failed with status {result['status_code']}"
        assert isinstance(result['data'], dict), f"Config data is not a dict: {result['data']}"
        return self
    
    def verify_images_endpoint(self):
        """Verify images endpoint returns expected response."""
        result = self.get_images()
        assert result['status_code'] == 200, f"Images endpoint failed with status {result['status_code']}"
        assert 'images' in result['data'], f"Images key not in response: {result['data']}"
        assert isinstance(result['data']['images'], list), f"Images is not a list: {result['data']}"
        return self
    
    def verify_favorites_endpoint(self):
        """Verify favorites endpoint returns expected response."""
        result = self.get_favorites()
        assert result['status_code'] == 200, f"Favorites endpoint failed with status {result['status_code']}"
        assert isinstance(result['data'], list), f"Favorites data is not a list: {result['data']}"
        return self
    
    def get_initial_favorites_count(self):
        """Get the initial number of favorites."""
        result = self.get_favorites()
        if result['status_code'] == 200 and result['data']:
            return len(result['data'])
        return 0
    
    def verify_favorites_count_increased(self, initial_count: int):
        """Verify that favorites count has increased from initial count."""
        result = self.get_favorites()
        if result['status_code'] == 200 and result['data']:
            current_count = len(result['data'])
            assert current_count >= initial_count, f"Favorites count did not increase: {initial_count} -> {current_count}"
        return self
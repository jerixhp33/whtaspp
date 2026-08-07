import pytest
import os

# Set dummy env vars for test environment before importing app
os.environ["SUPABASE_URL"] = "https://placeholder.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.placeholder"

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def mock_supabase():
    with patch("app.services.supabase_service.get_supabase_client") as mock_client, \
         patch("app.services.supabase_service.get_supabase_admin_client") as mock_admin_client, \
         patch("app.api.v1.admin.get_supabase_admin_client") as mock_admin_api_client, \
         patch("app.api.v1.users.get_supabase_client") as mock_users_api_client:
        
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        mock_admin_client.return_value = mock_instance
        mock_admin_api_client.return_value = mock_instance
        mock_users_api_client.return_value = mock_instance
        
        yield mock_instance

@pytest.fixture
def mock_regular_user():
    return {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "user@example.com"
    }

@pytest.fixture
def mock_admin_user():
    return {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "email": "admin@example.com"
    }

@pytest.fixture
def mock_api_key():
    return {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "key_prefix": "app_live_123",
        "status": "active",
        "permissions": ["*"]
    }

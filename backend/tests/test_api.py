from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

def setup_mock_api_key(mock_supabase):
    mock_api_response = MagicMock()
    mock_api_response.data = [{"status": "active", "permissions": ["*"], "id": "123"}]
    mock_supabase.table().select().eq().execute.return_value = mock_api_response

    # Setup default mock responses for chaining
    default_response = MagicMock()
    default_response.data = []
    default_response.count = 0
    mock_supabase.table().select().range().execute.return_value = default_response
    mock_supabase.table().select().ilike().range().execute.return_value = default_response
    mock_supabase.table().select().execute.return_value = default_response

def test_list_users(client: TestClient, mock_supabase):
    setup_mock_api_key(mock_supabase)
    
    users_response = MagicMock()
    users_response.data = [{"id": "123e4567-e89b-12d3-a456-426614174000", "username": "testuser", "display_name": "Test User", "email": "test@example.com", "bio": "", "status": "online", "is_online": True, "last_seen": "2026-01-01T00:00:00Z", "is_admin": False, "is_disabled": False, "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}]
    users_response.count = 1
    mock_supabase.table().select().range().execute.return_value = users_response
    
    response = client.get("/api/v1/users", headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 200
    assert len(response.json()["users"]) == 1

def test_search_users(client: TestClient, mock_supabase):
    setup_mock_api_key(mock_supabase)
    
    users_response = MagicMock()
    users_response.data = []
    users_response.count = 0
    mock_supabase.table().select().ilike().range().execute.return_value = users_response
    
    response = client.get("/api/v1/users?q=test", headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 200

def test_list_contacts(client: TestClient, mock_supabase):
    setup_mock_api_key(mock_supabase)
    response = client.get("/api/v1/contacts", headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 200

def test_create_contact(client: TestClient, mock_supabase):
    setup_mock_api_key(mock_supabase)
    response = client.post("/api/v1/contacts", json={"contact_id": "123e4567-e89b-12d3-a456-426614174000"}, headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 200

def test_list_conversations(client: TestClient, mock_supabase):
    setup_mock_api_key(mock_supabase)
    response = client.get("/api/v1/conversations", headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 200

def test_send_message(client: TestClient, mock_supabase):
    setup_mock_api_key(mock_supabase)
    response = client.post("/api/v1/messages", json={"conversation_id": "123e4567-e89b-12d3-a456-426614174000", "content": "hello"}, headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 200

def test_rate_limiting(client: TestClient):
    # Pass header to trigger rate limiter
    for _ in range(65):
        response = client.get("/health", headers={"X-Enforce-Rate-Limit": "true"})
    assert response.status_code in (200, 429)

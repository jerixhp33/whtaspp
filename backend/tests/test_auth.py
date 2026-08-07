from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from fastapi import HTTPException

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@patch("app.auth.supabase.verify_supabase_token")
def test_invalid_token(mock_verify, client: TestClient):
    mock_verify.side_effect = HTTPException(status_code=401, detail="Invalid token")
    # For a protected admin route
    response = client.get("/api/v1/admin/dashboard", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401

def test_missing_token(client: TestClient):
    response = client.get("/api/v1/admin/dashboard")
    assert response.status_code == 403 # Missing token -> not authenticated

def test_invalid_api_key(client: TestClient, mock_supabase):
    response = client.get("/api/v1/users", headers={"Authorization": "Bearer invalid_key"})
    assert response.status_code == 401
    
def test_expired_api_key(client: TestClient, mock_supabase):
    mock_response = MagicMock()
    mock_response.data = [{"status": "active", "expires_at": "2020-01-01T00:00:00Z", "id": "123"}]
    mock_supabase.table().select().eq().execute.return_value = mock_response
    
    response = client.get("/api/v1/users", headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 401
    assert "expired" in response.json()["detail"]

def test_revoked_api_key(client: TestClient, mock_supabase):
    mock_response = MagicMock()
    mock_response.data = [{"status": "revoked", "id": "123"}]
    mock_supabase.table().select().eq().execute.return_value = mock_response
    
    response = client.get("/api/v1/users", headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 401

def test_insufficient_permissions(client: TestClient, mock_supabase):
    mock_response = MagicMock()
    mock_response.data = [{"status": "active", "permissions": ["messages:read"], "id": "123"}]
    mock_supabase.table().select().eq().execute.return_value = mock_response
    
    # Try to write messages
    response = client.post("/api/v1/messages", json={"conversation_id": "123e4567-e89b-12d3-a456-426614174000"}, headers={"Authorization": "Bearer app_live_12345678901234567890123456789012"})
    assert response.status_code == 403

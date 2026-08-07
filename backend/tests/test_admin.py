from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import uuid

def setup_admin_auth(mock_supabase):
    # Mock verify_supabase_token 
    pass

@patch("app.auth.supabase.verify_supabase_token")
def test_dashboard_stats(mock_verify, client: TestClient, mock_supabase):
    mock_verify.return_value = {"id": "123e4567-e89b-12d3-a456-426614174001"}
    
    # Mock admin check
    admin_response = MagicMock()
    admin_response.data = [{"is_admin": True}]
    mock_supabase.table().select().eq().execute.return_value = admin_response
    
    response = client.get("/api/v1/admin/dashboard", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    assert "total_users" in response.json()

@patch("app.auth.supabase.verify_supabase_token")
def test_create_api_key(mock_verify, client: TestClient, mock_supabase):
    mock_verify.return_value = {"id": "123e4567-e89b-12d3-a456-426614174001"}
    
    admin_response = MagicMock()
    admin_response.data = [{"is_admin": True}]
    mock_supabase.table().select().eq().execute.return_value = admin_response
    
    response = client.post("/api/v1/admin/api-keys", json={"name": "test_key", "permissions": ["*"]}, headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    assert "secret" in response.json()
    assert response.json()["secret"].startswith("app_live_")

@patch("app.auth.supabase.verify_supabase_token")
def test_revoke_api_key(mock_verify, client: TestClient, mock_supabase):
    mock_verify.return_value = {"id": "123e4567-e89b-12d3-a456-426614174001"}
    admin_response = MagicMock()
    admin_response.data = [{"is_admin": True}]
    mock_supabase.table().select().eq().execute.return_value = admin_response
    
    key_id = str(uuid.uuid4())
    response = client.post(f"/api/v1/admin/api-keys/{key_id}/revoke", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200

@patch("app.auth.supabase.verify_supabase_token")
def test_rotate_api_key(mock_verify, client: TestClient, mock_supabase):
    mock_verify.return_value = {"id": "123e4567-e89b-12d3-a456-426614174001"}
    admin_response = MagicMock()
    admin_response.data = [{"is_admin": True}]
    mock_supabase.table().select().eq().execute.return_value = admin_response
    
    key_id = str(uuid.uuid4())
    response = client.post(f"/api/v1/admin/api-keys/{key_id}/rotate", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    assert "new_key_prefix" in response.json()
    assert "secret" in response.json()

@patch("app.auth.supabase.verify_supabase_token")
def test_non_admin_access_denied(mock_verify, client: TestClient, mock_supabase):
    mock_verify.return_value = {"id": "123e4567-e89b-12d3-a456-426614174000"}
    
    admin_response = MagicMock()
    admin_response.data = [{"is_admin": False}]
    mock_supabase.table().select().eq().execute.return_value = admin_response
    
    response = client.get("/api/v1/admin/dashboard", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 403

@patch("app.auth.supabase.verify_supabase_token")
def test_list_audit_logs(mock_verify, client: TestClient, mock_supabase):
    mock_verify.return_value = {"id": "123e4567-e89b-12d3-a456-426614174001"}
    admin_response = MagicMock()
    admin_response.data = [{"is_admin": True}]
    mock_supabase.table().select().eq().execute.return_value = admin_response
    
    response = client.get("/api/v1/admin/audit-logs", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200

@patch("app.auth.supabase.verify_supabase_token")
def test_manage_reports(mock_verify, client: TestClient, mock_supabase):
    mock_verify.return_value = {"id": "123e4567-e89b-12d3-a456-426614174001"}
    admin_response = MagicMock()
    admin_response.data = [{"is_admin": True}]
    mock_supabase.table().select().eq().execute.return_value = admin_response
    
    report_id = str(uuid.uuid4())
    response = client.put(f"/api/v1/admin/reports/{report_id}", json={"status": "resolved", "resolution_note": "Done"}, headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200

import { supabase } from '../lib/supabase';

export const adminService = {
  getDashboardStats: async () => supabase.rpc('get_dashboard_stats'),
  getUsers: async () => supabase.from('profiles').select('*'),
  updateUser: async (id: string, updates: any) => supabase.from('profiles').update(updates).eq('id', id),
  getReports: async () => supabase.from('reports').select('*'),
  updateReport: async (id: string, updates: any) => supabase.from('reports').update(updates).eq('id', id),
  getAuditLogs: async () => supabase.from('audit_logs').select('*'),
  createApiKey: async (data: any) => supabase.from('api_keys').insert(data),
  getApiKeys: async () => supabase.from('api_keys').select('*'),
  updateApiKey: async (id: string, updates: any) => supabase.from('api_keys').update(updates).eq('id', id),
  revokeApiKey: async (id: string) => supabase.from('api_keys').update({ status: 'revoked' }).eq('id', id),
  rotateApiKey: async (id: string) => supabase.rpc('rotate_api_key', { key_id: id }),
  disableApiKey: async (id: string) => supabase.from('api_keys').update({ status: 'disabled' }).eq('id', id),
  enableApiKey: async (id: string) => supabase.from('api_keys').update({ status: 'active' }).eq('id', id),
  getApiKeyUsage: async (id: string) => supabase.from('api_usage').select('*').eq('api_key_id', id)
};

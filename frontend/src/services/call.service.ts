import { supabase } from '../lib/supabase';
import { CallType, CallStatus } from '../types';

export const callService = {
  createCall: async (conversationId: string, callType: CallType) => supabase.from('calls').insert({ conversation_id: conversationId, call_type: callType, status: 'initiating' }),
  getCallHistory: async () => supabase.from('calls').select('*').order('created_at', { ascending: false }),
  updateCallStatus: async (callId: string, status: CallStatus) => supabase.from('calls').update({ status }).eq('id', callId)
};

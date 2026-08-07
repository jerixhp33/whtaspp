import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtime = (channelName: string, onUpdate: (payload: any) => void) => {
  useEffect(() => {
    const channel = supabase.channel(channelName)
      .on('broadcast', { event: '*' }, onUpdate)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, onUpdate]);
};

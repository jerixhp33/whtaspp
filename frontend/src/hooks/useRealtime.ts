import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtime = (channelName: string, onUpdate: (payload: any) => void) => {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    const channel = supabase.channel(channelName)
      .on('broadcast', { event: '*' }, (p) => onUpdateRef.current(p))
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);
};

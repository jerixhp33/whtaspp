import { useState } from 'react';

export const useWebRTC = () => {
  const [localStream] = useState<MediaStream | null>(null);
  const [remoteStream] = useState<MediaStream | null>(null);
  
  return { localStream, remoteStream };
};

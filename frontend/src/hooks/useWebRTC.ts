import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface CallUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';

export interface IncomingCallData {
  callId: string;
  caller: CallUser;
  isVideo: boolean;
  offerSdp?: any;
  conversationId: string;
}

interface CallContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStatus: CallStatus;
  isVideoCall: boolean;
  remoteUser: CallUser | null;
  callDuration: number;
  isMuted: boolean;
  isCameraOff: boolean;
  incomingCall: IncomingCallData | null;
  startCall: (targetUser: CallUser, conversationId: string, isVideo: boolean) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextType>({
  localStream: null,
  remoteStream: null,
  callStatus: 'idle',
  isVideoCall: false,
  remoteUser: null,
  callDuration: 0,
  isMuted: false,
  isCameraOff: false,
  incomingCall: null,
  startCall: async () => {},
  answerCall: async () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleCamera: () => {},
});

export const useWebRTC = () => useContext(CallContext);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [remoteUser, setRemoteUser] = useState<CallUser | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const activeRoomChannelRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const localOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  const startDurationTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const cleanupCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (_) {}
      });
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (_) {}
      pcRef.current = null;
    }

    if (activeRoomChannelRef.current) {
      try {
        activeRoomChannelRef.current.send({
          type: 'broadcast',
          event: 'call_ended',
          payload: { sender_id: user?.id }
        });
      } catch (_) {}
      supabase.removeChannel(activeRoomChannelRef.current);
      activeRoomChannelRef.current = null;
    }

    if (currentCallIdRef.current) {
      const callIdToClose = currentCallIdRef.current;
      currentCallIdRef.current = null;
      supabase
        .from('calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', callIdToClose)
        .then();
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setRemoteUser(null);
    setIncomingCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    localOfferRef.current = null;
  }, [localStream, user?.id]);

  // Global Supabase Realtime Listener for new calls inserted in calls table
  useEffect(() => {
    if (!user?.id) return;

    const callsChannel = supabase
      .channel('global-calls-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls'
        },
        async (payload) => {
          const newCall = payload.new as any;
          const callerId = newCall.caller_id || newCall.created_by;
          if (callerId === user.id) return; // skip own initiated calls
          if (newCall.status === 'ended' || newCall.status === 'rejected') return;

          // Check if current user is a member of this conversation
          const { data: memberData } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', newCall.conversation_id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberData) {
            // Fetch caller profile
            const { data: callerProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', callerId)
              .maybeSingle();

            const callerName = callerProfile?.display_name || callerProfile?.username || 'Incoming Call';
            const callerAvatar = callerProfile?.avatar_url;

            currentCallIdRef.current = newCall.id;
            setIncomingCall({
              callId: newCall.id,
              caller: { id: callerId, name: callerName, avatarUrl: callerAvatar },
              isVideo: newCall.call_type === 'video',
              conversationId: newCall.conversation_id
            });
            setCallStatus('ringing');

            // Join call room channel immediately to receive signaling messages
            joinCallRoom(newCall.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls'
        },
        (payload) => {
          const updatedCall = payload.new as any;
          if (updatedCall.id === currentCallIdRef.current && (updatedCall.status === 'ended' || updatedCall.status === 'rejected')) {
            cleanupCall();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callsChannel);
    };
  }, [user?.id, cleanupCall]);

  const addIceCandidates = async (pc: RTCPeerConnection) => {
    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Failed to add queued candidate:', err);
        }
      }
    }
  };

  const joinCallRoom = (callId: string) => {
    if (activeRoomChannelRef.current) {
      supabase.removeChannel(activeRoomChannelRef.current);
    }

    const roomChan = supabase.channel(`call-room-${callId}`);
    activeRoomChannelRef.current = roomChan;

    roomChan
      .on('broadcast', { event: 'call_offer' }, async ({ payload }) => {
        pendingOfferRef.current = payload.sdp;
        if (pcRef.current && pcRef.current.signalingState !== 'closed') {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await addIceCandidates(pcRef.current);
          } catch (err) {
            console.error('Error applying remote offer SDP:', err);
          }
        }
      })
      .on('broadcast', { event: 'call_accepted' }, async () => {
        // Responder has accepted - re-send offer if we are caller
        if (localOfferRef.current && roomChan) {
          roomChan.send({
            type: 'broadcast',
            event: 'call_offer',
            payload: { sdp: localOfferRef.current, caller_id: user?.id }
          });
        }
      })
      .on('broadcast', { event: 'call_answer' }, async ({ payload }) => {
        if (pcRef.current && payload.sdp) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await addIceCandidates(pcRef.current);
            setCallStatus('connected');
            startDurationTimer();
          } catch (err) {
            console.error('Failed to set remote description on answer:', err);
          }
        }
      })
      .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
        if (!payload.candidate) return;
        if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (err) {
            console.error('Failed to add ICE candidate:', err);
          }
        } else {
          pendingCandidatesRef.current.push(payload.candidate);
        }
      })
      .on('broadcast', { event: 'call_ended' }, () => {
        cleanupCall();
      })
      .on('broadcast', { event: 'call_rejected' }, () => {
        cleanupCall();
      })
      .subscribe();
  };

  const acquireUserMedia = async (video: boolean): Promise<MediaStream> => {
    // Attempt preferred constraints first with ideal dimensions
    const videoConstraints = video
      ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        }
      : false;

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: videoConstraints
      });
    } catch (primaryErr: any) {
      console.warn('Primary media constraints failed, trying fallback...', primaryErr);

      // If video failed (e.g. no camera or device error), attempt simple video: true or fallback to audio only
      if (video) {
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
          });
        } catch (videoErr) {
          console.warn('Video device unavailable, falling back to audio only...', videoErr);
          setIsVideoCall(false);
          return await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
        }
      }

      // Audio only request failed
      throw primaryErr;
    }
  };

  const createPeerConnection = (targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && activeRoomChannelRef.current) {
        activeRoomChannelRef.current.send({
          type: 'broadcast',
          event: 'ice_candidate',
          payload: { candidate: event.candidate, sender_id: user?.id }
        });
      }
    };

    const remoteMedia = new MediaStream();
    setRemoteStream(remoteMedia);

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          remoteMedia.addTrack(track);
        });
      } else if (event.track) {
        remoteMedia.addTrack(event.track);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanupCall();
      }
    };

    return pc;
  };

  const startCall = async (targetUser: CallUser, conversationId: string, isVideo: boolean) => {
    if (!user) return;
    setIsVideoCall(isVideo);
    setRemoteUser(targetUser);
    setCallStatus('calling');
    pendingCandidatesRef.current = [];

    let stream: MediaStream | null = null;
    try {
      stream = await acquireUserMedia(isVideo);
      setLocalStream(stream);
    } catch (mediaErr: any) {
      console.error('Permission / Media Error:', mediaErr);
      const isDenied = mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError';
      alert(
        isDenied
          ? 'Camera / Microphone permission denied. Please allow camera and microphone access in your browser settings.'
          : 'Could not access microphone or camera. Please check your device connections.'
      );
      cleanupCall();
      return;
    }

    try {
      // Create record in calls table
      const { data: callData, error: callErr } = await supabase
        .from('calls')
        .insert({
          conversation_id: conversationId,
          caller_id: user.id,
          created_by: user.id,
          call_type: isVideo ? 'video' : 'voice',
          status: 'initiating'
        })
        .select('id')
        .single();

      if (callErr || !callData) {
        throw new Error(callErr?.message || 'Database error initializing call');
      }

      currentCallIdRef.current = callData.id;

      // Join room channel
      joinCallRoom(callData.id);

      const pc = createPeerConnection(targetUser.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream!));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      localOfferRef.current = offer;

      if (activeRoomChannelRef.current) {
        activeRoomChannelRef.current.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            activeRoomChannelRef.current.send({
              type: 'broadcast',
              event: 'call_offer',
              payload: { sdp: offer, caller_id: user.id }
            });
          }
        });
      }
    } catch (err: any) {
      console.error('Failed to start WebRTC call:', err);
      alert(err.message || 'Failed to start call');
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !user) return;
    setIsVideoCall(incomingCall.isVideo);
    setRemoteUser(incomingCall.caller);
    setCallStatus('connecting');

    let stream: MediaStream | null = null;
    try {
      stream = await acquireUserMedia(incomingCall.isVideo);
      setLocalStream(stream);
    } catch (mediaErr: any) {
      console.error('Permission / Media Error on answering:', mediaErr);
      const isDenied = mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError';
      alert(
        isDenied
          ? 'Camera / Microphone permission denied. Please allow microphone and camera access in your browser settings.'
          : 'Could not access microphone or camera.'
      );
      cleanupCall();
      return;
    }

    try {
      const pc = createPeerConnection(incomingCall.caller.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream!));

      // Signal that responder accepted
      if (activeRoomChannelRef.current) {
        activeRoomChannelRef.current.send({
          type: 'broadcast',
          event: 'call_accepted',
          payload: { responder_id: user.id }
        });
      }

      // Update call status to active
      if (currentCallIdRef.current) {
        supabase
          .from('calls')
          .update({ status: 'active', started_at: new Date().toISOString() })
          .eq('id', currentCallIdRef.current)
          .then();
      }

      const offerSdp = pendingOfferRef.current;
      if (offerSdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
        await addIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (activeRoomChannelRef.current) {
          activeRoomChannelRef.current.send({
            type: 'broadcast',
            event: 'call_answer',
            payload: { sdp: answer, responder_id: user.id }
          });
        }

        setIncomingCall(null);
        setCallStatus('connected');
        startDurationTimer();
      } else {
        // Waiting for offer re-broadcast from caller
        setIncomingCall(null);
      }
    } catch (err: any) {
      console.error('Failed to answer call:', err);
      alert(err.message || 'Failed to connect call');
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (activeRoomChannelRef.current) {
      activeRoomChannelRef.current.send({
        type: 'broadcast',
        event: 'call_rejected',
        payload: { responder_id: user?.id }
      });
    }
    if (currentCallIdRef.current) {
      supabase
        .from('calls')
        .update({ status: 'rejected', ended_at: new Date().toISOString() })
        .eq('id', currentCallIdRef.current)
        .then();
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const value = {
    localStream,
    remoteStream,
    callStatus,
    isVideoCall,
    remoteUser,
    callDuration,
    isMuted,
    isCameraOff,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall: cleanupCall,
    toggleMute,
    toggleCamera
  };

  return React.createElement(CallContext.Provider, { value }, children);
}

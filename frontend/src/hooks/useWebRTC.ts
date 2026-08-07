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
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
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

  const startDurationTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const cleanupCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (activeRoomChannelRef.current) {
      activeRoomChannelRef.current.send({
        type: 'broadcast',
        event: 'call_ended',
        payload: { sender_id: user?.id }
      });
      supabase.removeChannel(activeRoomChannelRef.current);
      activeRoomChannelRef.current = null;
    }

    if (currentCallIdRef.current) {
      supabase
        .from('calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', currentCallIdRef.current)
        .then(() => {
          currentCallIdRef.current = null;
        });
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
          if (newCall.created_by === user.id) return; // skip own calls

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
              .eq('id', newCall.created_by)
              .maybeSingle();

            const callerName = callerProfile?.display_name || callerProfile?.username || 'Incoming Call';
            const callerAvatar = callerProfile?.avatar_url;

            currentCallIdRef.current = newCall.id;
            setIncomingCall({
              callId: newCall.id,
              caller: { id: newCall.created_by, name: callerName, avatarUrl: callerAvatar },
              isVideo: newCall.call_type === 'video',
              conversationId: newCall.conversation_id
            });
            setCallStatus('ringing');

            // Join call room channel to listen for SDP offer and candidates
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
          if (updatedCall.id === currentCallIdRef.current && updatedCall.status === 'ended') {
            cleanupCall();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callsChannel);
    };
  }, [user?.id, cleanupCall]);

  const joinCallRoom = (callId: string) => {
    if (activeRoomChannelRef.current) {
      supabase.removeChannel(activeRoomChannelRef.current);
    }

    const roomChan = supabase.channel(`call-room-${callId}`);
    activeRoomChannelRef.current = roomChan;

    roomChan
      .on('broadcast', { event: 'call_offer' }, async ({ payload }) => {
        pendingOfferRef.current = payload.sdp;
      })
      .on('broadcast', { event: 'call_answer' }, async ({ payload }) => {
        if (pcRef.current && payload.sdp) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setCallStatus('connected');
            startDurationTimer();
          } catch (err) {
            console.error('Failed to set remote description on answer:', err);
          }
        }
      })
      .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
        if (pcRef.current && payload.candidate) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (err) {
            console.error('Failed to add ICE candidate:', err);
          }
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
      event.streams[0].getTracks().forEach((track) => {
        remoteMedia.addTrack(track);
      });
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { width: 1280, height: 720 } : false,
        audio: true
      });
      setLocalStream(stream);

      // Create record in calls table (which triggers global realtime monitor on recipient device)
      const { data: callData, error: callErr } = await supabase
        .from('calls')
        .insert({
          conversation_id: conversationId,
          created_by: user.id,
          call_type: isVideo ? 'video' : 'voice',
          status: 'initiated'
        })
        .select('id')
        .single();

      if (callErr || !callData) throw callErr || new Error('Failed to create call record');

      currentCallIdRef.current = callData.id;

      // Join room channel and broadcast SDP offer
      joinCallRoom(callData.id);

      const pc = createPeerConnection(targetUser.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      activeRoomChannelRef.current.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          activeRoomChannelRef.current.send({
            type: 'broadcast',
            event: 'call_offer',
            payload: { sdp: offer, caller_id: user.id }
          });
        }
      });
    } catch (err) {
      console.error('Failed to start WebRTC call:', err);
      alert('Could not access camera/microphone for call.');
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !user) return;
    setIsVideoCall(incomingCall.isVideo);
    setRemoteUser(incomingCall.caller);
    setCallStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.isVideo ? { width: 1280, height: 720 } : false,
        audio: true
      });
      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.caller.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offerSdp = pendingOfferRef.current;
      if (offerSdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      }

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
    } catch (err) {
      console.error('Failed to answer call:', err);
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

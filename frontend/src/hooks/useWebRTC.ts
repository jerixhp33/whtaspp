import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface CallUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const useWebRTC = () => {
  const { user, profile } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [remoteUser, setRemoteUser] = useState<CallUser | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callId?: string;
    caller: CallUser;
    isVideo: boolean;
    offerSdp: any;
    conversationId: string;
  } | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const activeConvIdRef = useRef<string | null>(null);

  // Global signaling channel listener for incoming call offers/answers
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`user-call-signals-${user.id}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'call_offer' }, async ({ payload }) => {
        if (callStatus !== 'idle') {
          // Reject if busy
          channel.send({
            type: 'broadcast',
            event: 'call_busy',
            payload: { caller_id: payload.caller_id }
          });
          return;
        }

        setIncomingCall({
          callId: payload.call_id,
          caller: {
            id: payload.caller_id,
            name: payload.caller_name || 'Incoming Call',
            avatarUrl: payload.caller_avatar
          },
          isVideo: payload.is_video,
          offerSdp: payload.sdp,
          conversationId: payload.conversation_id
        });
        pendingOfferRef.current = payload;
        setCallStatus('ringing');
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
      .on('broadcast', { event: 'call_busy' }, () => {
        alert('User is currently on another call.');
        cleanupCall();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, callStatus]);

  const startDurationTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const createPeerConnection = (targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserId) {
        supabase.channel(`user-call-signals-${targetUserId}`).send({
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
    activeConvIdRef.current = conversationId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { width: 1280, height: 720 } : false,
        audio: true
      });
      setLocalStream(stream);

      const pc = createPeerConnection(targetUser.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Create record in calls table
      const { data: callData } = await supabase
        .from('calls')
        .insert({
          conversation_id: conversationId,
          created_by: user.id,
          call_type: isVideo ? 'video' : 'voice',
          status: 'initiated'
        })
        .select('id')
        .single();

      if (callData) currentCallIdRef.current = callData.id;

      // Broadcast call offer signal to recipient's personal channel
      const targetChan = supabase.channel(`user-call-signals-${targetUser.id}`);
      targetChan.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          targetChan.send({
            type: 'broadcast',
            event: 'call_offer',
            payload: {
              call_id: callData?.id,
              caller_id: user.id,
              caller_name: profile?.display_name || profile?.username || 'Chat User',
              caller_avatar: profile?.avatar_url,
              is_video: isVideo,
              sdp: offer,
              conversation_id: conversationId
            }
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
    const offerPayload = pendingOfferRef.current;
    if (!offerPayload) return;

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

      await pc.setRemoteDescription(new RTCSessionDescription(offerPayload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer back to caller
      const targetChan = supabase.channel(`user-call-signals-${incomingCall.caller.id}`);
      targetChan.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          targetChan.send({
            type: 'broadcast',
            event: 'call_answer',
            payload: { sdp: answer, responder_id: user.id }
          });
        }
      });

      setIncomingCall(null);
      setCallStatus('connected');
      startDurationTimer();
    } catch (err) {
      console.error('Failed to answer call:', err);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      const targetChan = supabase.channel(`user-call-signals-${incomingCall.caller.id}`);
      targetChan.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          targetChan.send({
            type: 'broadcast',
            event: 'call_rejected',
            payload: { responder_id: user?.id }
          });
        }
      });
    }
    cleanupCall();
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

    if (currentCallIdRef.current) {
      supabase
        .from('calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', currentCallIdRef.current)
        .then(() => {
          currentCallIdRef.current = null;
        });
    }

    if (remoteUser?.id) {
      const targetChan = supabase.channel(`user-call-signals-${remoteUser.id}`);
      targetChan.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          targetChan.send({
            type: 'broadcast',
            event: 'call_ended',
            payload: { sender_id: user?.id }
          });
        }
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
  }, [localStream, remoteUser, user]);

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

  return {
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
};

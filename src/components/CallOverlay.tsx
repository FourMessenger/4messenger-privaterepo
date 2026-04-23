import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, RefreshCw } from 'lucide-react';
import { useStore } from '../store';

// Get local STUN server URL from current host
const getIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [];
  
  // Only include local STUN server if we're not on localhost with no custom domain
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    servers.push({ urls: `stun:${host}:3478` });
  }
  
  // Add external STUN servers as fallback
  servers.push(
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Twilio STUN servers (very reliable)
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun1.stunprotocol.org:3478' },
    
    // Mozilla STUN servers
    { urls: 'stun:stun.services.mozilla.com:3478' },
    
    // Other reliable providers
    { urls: 'stun:stun.voip.blackberry.com:3478' },
    { urls: 'stun:stun.nextcloud.com:443' },
    { urls: 'stun:stun.opentelekomcloud.com:3478' }
  );
  
  return servers;
};

interface IncomingCallData {
  from: string;
  type: 'voice' | 'video';
  offer?: RTCSessionDescriptionInit;
}

export function CallOverlay() {
  const { 
    currentUser, 
    users, 
    chats,
    callState, 
    endCall,
    beginCall,
    websocket,
    addNotification
  } = useStore();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'failed' | 'ended'>('connecting');
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<string>('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isInitiatorRef = useRef(false);
  const callStartTimeRef = useRef<number>(0);
  const incomingAcceptedRef = useRef(false);
  const initializationStartedRef = useRef(false);

  const chat = callState.chatId ? chats.find(c => c.id === callState.chatId) : null;
  const otherUserId = chat?.type === 'direct' 
    ? chat.participants.find(p => p !== currentUser?.id) 
    : null;
  const otherUser = otherUserId ? users.find(u => u.id === otherUserId) : null;
  const signalingTargetUserId = incomingCall?.from || otherUserId;

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('[Call] Cleaning up...');
    incomingAcceptedRef.current = false;
    
    // Stop all local media tracks (camera, mic)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[Call] Stopped local track:', track.kind);
      });
      localStreamRef.current = null;
    }

    // Clear remote stream reference
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        console.log('[Call] Remote track stopped:', track.kind);
      });
      remoteStreamRef.current = null;
    }

    // Clear local video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Stop all remote media streams (incoming audio/video)
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders?.()?.forEach(sender => {
        try {
          peerConnectionRef.current?.removeTrack(sender);
        } catch (e) {
          console.log('[Call] Error removing track:', e);
        }
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    pendingCandidatesRef.current = [];
  }, []);

  // Helper function to detect which method to use for adding tracks
  const getTrackAddMethod = (pc: any): string | null => {
    if (typeof pc.addTrack === 'function') return 'addTrack';
    if (typeof pc.addStream === 'function') return 'addStream';
    if (typeof pc.addTransceiver === 'function') return 'addTransceiver';
    return null;
  };

  // Create peer connection with proper configuration
  const createPeerConnection = useCallback(() => {
    console.log('[Call] Creating peer connection with STUN servers');
    
    try {
      // Log environment info
      console.log('[Call] Browser info:', {
        userAgent: navigator.userAgent.substring(0, 50),
        platform: navigator.platform,
        isSecureContext: window.isSecureContext,
        location: window.location.protocol
      });

      // Check if RTCPeerConnection is available
      const RTCPeerConnectionClass = (window as any).RTCPeerConnection || 
                                     (window as any).webkitRTCPeerConnection ||
                                     (window as any).mozRTCPeerConnection;
      
      if (!RTCPeerConnectionClass) {
        throw new Error('RTCPeerConnection is not supported in this browser');
      }

      console.log('[Call] RTCPeerConnection class available');

      const iceServers = getIceServers();
      console.log('[Call] Using STUN servers:', iceServers.length, 'servers');
      
      // Create with minimal config first to test
      let pc: any;
      try {
        pc = new RTCPeerConnectionClass({
          iceServers: iceServers,
          iceCandidatePoolSize: 10,
        });
      } catch (constructorError) {
        console.warn('[Call] Constructor with full config failed, trying minimal config:', constructorError);
        // Fallback to minimal configuration
        pc = new RTCPeerConnectionClass({
          iceServers: iceServers,
        });
      }

      console.log('[Call] Peer connection created');
      
      if (!pc) {
        throw new Error('RTCPeerConnection constructor returned null or undefined');
      }
      
      // Validate that we got a real peer connection object
      const trackMethod = getTrackAddMethod(pc);
      if (!trackMethod) {
        console.error('[Call] Peer connection object:', pc);
        throw new Error('RTCPeerConnection does not support any method to add tracks');
      }
      (pc as any)._trackAddMethod = trackMethod;
      console.log('[Call] Will use track method:', trackMethod);

      // Log ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('[Call] ICE connection state:', pc.iceConnectionState);
        setConnectionInfo(`ICE: ${pc.iceConnectionState}`);
        
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallStatus('connected');
          if (callStartTimeRef.current === 0) {
            callStartTimeRef.current = Date.now();
          }
        } else if (pc.iceConnectionState === 'failed') {
          console.log('[Call] ICE connection failed, attempting restart...');
          setConnectionInfo('ICE failed, reconnecting...');
          // Try ICE restart
          try {
            pc.restartIce();
          } catch (e) {
            console.error('[Call] ICE restart failed:', e);
          }
        } else if (pc.iceConnectionState === 'disconnected') {
          setConnectionInfo('Reconnecting...');
        }
      };

      // Log ICE gathering state
      pc.onicegatheringstatechange = () => {
        console.log('[Call] ICE gathering state:', pc.iceGatheringState);
      };

      // Log signaling state
      pc.onsignalingstatechange = () => {
        console.log('[Call] Signaling state:', pc.signalingState);
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log('[Call] Connection state:', pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
          setConnectionInfo('Connected');
        } else if (pc.connectionState === 'failed') {
          setCallStatus('failed');
          setConnectionInfo('Connection failed');
        } else if (pc.connectionState === 'disconnected') {
          // Give it a moment to reconnect
          setTimeout(() => {
            if (peerConnectionRef.current?.connectionState === 'disconnected') {
              setCallStatus('failed');
              setConnectionInfo('Disconnected');
            }
          }, 5000);
        }
      };

      // Handle incoming tracks (remote stream) - FIXED VERSION
      pc.ontrack = (event) => {
        console.log('[Call] Received remote track:', event.track.kind, 'Streams:', event.streams?.length);
        
        // Ensure we always have a stream to attach
        let stream = event.streams?.[0];
        
        if (!stream) {
          console.log('[Call] No stream in event, creating one');
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(event.track);
          stream = remoteStreamRef.current;
        } else {
          // Store the stream reference
          remoteStreamRef.current = stream;
        }
        
        console.log('[Call] Stream has tracks:', stream.getTracks().length);
        
        // Attach to appropriate element with a delay to ensure DOM is ready
        setTimeout(() => {
          if (event.track.kind === 'audio') {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = stream;
              remoteAudioRef.current.play().catch(e => console.warn('[Call] Audio play error:', e));
              console.log('[Call] Audio stream attached to element, tracks:', stream.getTracks().length);
            } else {
              console.log('[Call] Audio ref not ready yet');
            }
          } else if (event.track.kind === 'video') {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              remoteVideoRef.current.play().catch(e => console.warn('[Call] Video play error:', e));
              console.log('[Call] Video stream attached to element, tracks:', stream.getTracks().length);
            } else {
              console.log('[Call] Video ref not ready yet');
            }
          }
        }, 100);
        
        setCallStatus('connected');
        setConnectionInfo('Connected');
      };

      // Handle ICE candidates - send to peer via signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[Call] Got ICE candidate:', event.candidate.candidate.substring(0, 50) + '...');
          
          if (websocket?.readyState === WebSocket.OPEN && signalingTargetUserId) {
            websocket.send(JSON.stringify({
              type: 'call_ice_candidate',
              targetUserId: signalingTargetUserId,
              candidate: event.candidate.toJSON()
            }));
          }
        } else {
          console.log('[Call] ICE gathering completed');
        }
      };

      return pc;
    } catch (error) {
      console.error('[Call] Failed to create RTCPeerConnection:', error);
      setCallStatus('failed');
      setConnectionInfo(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }, [websocket, signalingTargetUserId]);

  // Add pending ICE candidates
  const addPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (pendingCandidatesRef.current.length > 0 && pc.remoteDescription) {
      console.log('[Call] Adding', pendingCandidatesRef.current.length, 'pending ICE candidates');
      
      for (const candidate of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[Call] Failed to add pending candidate:', e);
        }
      }
      pendingCandidatesRef.current = [];
    }
  }, []);

  // Initialize outgoing call
  const initOutgoingCall = useCallback(async () => {
    if (!websocket || !otherUserId || !currentUser || !callState.chatId) return;
    
    console.log('[Call] Initializing outgoing call to:', otherUserId);
    isInitiatorRef.current = true;
    setCallStatus('ringing');
    setConnectionInfo('Requesting camera/microphone...');

    try {
      // Get local media stream first
      setConnectionInfo('Getting camera/microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callState.type === 'video',
        audio: true
      });
      
      console.log('[Call] Got local stream with tracks:', stream.getTracks().map(t => `${t.kind} (${t.enabled})`));
      localStreamRef.current = stream;
      
      // Set local video with delay to ensure element exists
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          if (callState.type === 'video') {
            localVideoRef.current.play().catch(e => console.warn('[Call] Local video play error:', e));
          }
          console.log('[Call] Local video attached');
        }
      }, 100);

      // Create peer connection
      setConnectionInfo('Creating connection...');
      const pc = createPeerConnection();
      if (!pc) {
        throw new Error('Failed to create peer connection');
      }
      peerConnectionRef.current = pc;

      // Add local tracks to connection
      setConnectionInfo('Setting up streams...');
      const trackMethod = (pc as any)._trackAddMethod;
      
      stream.getTracks().forEach(track => {
        if (!track) return;
        console.log('[Call] Adding local track:', track.kind);
        
        try {
          if (trackMethod === 'addTrack' && typeof pc.addTrack === 'function') {
            pc.addTrack(track, stream);
            console.log('[Call] Added track via addTrack');
          } else if (trackMethod === 'addStream' && typeof pc.addStream === 'function') {
            pc.addStream(stream);
            console.log('[Call] Added track via addStream');
          } else if (trackMethod === 'addTransceiver' && typeof pc.addTransceiver === 'function') {
            pc.addTransceiver(track, { streams: [stream] });
            console.log('[Call] Added track via addTransceiver');
          } else {
            // Fallback to addTrack
            if (typeof pc.addTrack === 'function') {
              pc.addTrack(track, stream);
              console.log('[Call] Added track via fallback addTrack');
            } else {
              throw new Error(`Cannot add track - no method available`);
            }
          }
        } catch (err) {
          console.error('[Call] Error adding track:', err);
          throw err;
        }
      });

      // Create offer BEFORE notifying server
      setConnectionInfo('Creating offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callState.type === 'video',
        iceRestart: false
      });
      
      await pc.setLocalDescription(offer);
      console.log('[Call] Created and set local offer');

      // Send offer to peer
      setConnectionInfo('Sending call request...');
      console.log('[Call] Sending offer to peer');
      websocket.send(JSON.stringify({
        type: 'call_offer',
        targetUserId: otherUserId,
        offer: pc.localDescription,
        callType: callState.type
      }));

      // Notify server that a call is starting
      console.log('[Call] Notifying server of call start');
      websocket.send(JSON.stringify({
        type: 'call_start',
        chatId: callState.chatId,
        callType: callState.type
      }));
      
      setConnectionInfo('Waiting for answer...');

    } catch (error) {
      console.error('[Call] Failed to initialize call:', error);
      setCallStatus('failed');
      setConnectionInfo(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      addNotification(`Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [websocket, otherUserId, currentUser, callState.type, callState.chatId, createPeerConnection, addNotification]);

  // Handle incoming call answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('[Call] No peer connection for answer');
      return;
    }

    try {
      console.log('[Call] Received answer, setting remote description');
      setConnectionInfo('Processing answer...');
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await addPendingCandidates(pc);
      
      // Verify video stream after a delay
      setTimeout(() => {
        if (remoteStreamRef.current && remoteVideoRef.current) {
          console.log('[Call] Verifying video stream after answer');
          if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play().catch(e => console.warn('[Call] Play error:', e));
            console.log('[Call] Video stream reattached after answer');
          }
        }
      }, 200);
      
      setCallStatus('connected');
      setConnectionInfo('Connected');
      if (callStartTimeRef.current === 0) {
        callStartTimeRef.current = Date.now();
      }
    } catch (error) {
      console.error('[Call] Failed to set remote description:', error);
      setCallStatus('failed');
      setConnectionInfo(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [addPendingCandidates]);

  // Answer incoming call
  const handleAnswerCall = useCallback(async () => {
    console.log('[Call] Accept button clicked');
    console.log('[Call] incomingCall:', incomingCall);
    
    if (!incomingCall) {
      console.error('[Call] No incoming call data');
      return;
    }
    
    if (!websocket) {
      console.error('[Call] WebSocket not connected');
      return;
    }
    
    if (!incomingCall.offer) {
      console.error('[Call] No offer in incoming call', incomingCall);
      return;
    }

    console.log('[Call] Answering incoming call from:', incomingCall.from);
    isInitiatorRef.current = false;
    incomingAcceptedRef.current = true;
    setCallStatus('connecting');
    setConnectionInfo('Starting call...');

    try {
      // Activate call state first so UI elements are rendered
      if (currentUser?.id) {
        console.log('[Call] Current user:', currentUser.id);
        const directChat = chats.find(c => 
          c.type === 'direct' && 
          c.participants.includes(currentUser.id) && 
          c.participants.includes(incomingCall.from)
        );
        console.log('[Call] Found direct chat:', directChat?.id);
        beginCall(directChat?.id || null, incomingCall.type, [currentUser.id, incomingCall.from]);
      }

      // Get local media stream
      setConnectionInfo('Requesting camera/microphone...');
      console.log('[Call] Requesting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.type === 'video',
        audio: true
      });
      console.log('[Call] Got media stream with tracks:', stream.getTracks().map(t => `${t.kind} (${t.enabled})`));
      
      localStreamRef.current = stream;
      
      // Set local video with delay
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          if (incomingCall.type === 'video') {
            localVideoRef.current.play().catch(e => console.warn('[Call] Local video play error:', e));
          }
          console.log('[Call] Local video attached');
        }
      }, 100);

      // Create peer connection
      setConnectionInfo('Creating connection...');
      console.log('[Call] Creating peer connection...');
      const pc = createPeerConnection();
      if (!pc) {
        throw new Error('Failed to create peer connection');
      }
      peerConnectionRef.current = pc;

      // Add local tracks
      setConnectionInfo('Setting up streams...');
      const trackMethod = (pc as any)._trackAddMethod;
      
      stream.getTracks().forEach(track => {
        console.log('[Call] Adding local track:', track.kind);
        try {
          if (trackMethod === 'addTrack' && typeof pc.addTrack === 'function') {
            pc.addTrack(track, stream);
          } else if (trackMethod === 'addStream' && typeof pc.addStream === 'function') {
            pc.addStream(stream);
          } else if (trackMethod === 'addTransceiver' && typeof pc.addTransceiver === 'function') {
            pc.addTransceiver(track, { streams: [stream] });
          } else {
            // Fallback
            if (typeof pc.addTrack === 'function') {
              pc.addTrack(track, stream);
            } else {
              throw new Error('Cannot add track');
            }
          }
        } catch (err) {
          console.error('[Call] Error adding track:', err);
        }
      });

      // Set remote description (the offer)
      setConnectionInfo('Processing call data...');
      console.log('[Call] Setting remote description...');
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      console.log('[Call] Remote description set');

      // Add any pending ICE candidates
      console.log('[Call] Adding pending ICE candidates...');
      await addPendingCandidates(pc);

      // Create answer
      setConnectionInfo('Creating answer...');
      console.log('[Call] Creating answer...');
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: incomingCall.type === 'video'
      });
      
      await pc.setLocalDescription(answer);
      console.log('[Call] Answer created and set');

      // Send answer to caller
      setConnectionInfo('Sending answer...');
      console.log('[Call] Sending answer to caller...');
      websocket.send(JSON.stringify({
        type: 'call_answer',
        targetUserId: incomingCall.from,
        answer: pc.localDescription
      }));
      console.log('[Call] Answer sent successfully');

      setIncomingCall(null);
      setConnectionInfo('Connecting...');
      
      // Verify video is working
      if (incomingCall.type === 'video') {
        setTimeout(() => {
          if (remoteVideoRef.current) {
            if (!remoteVideoRef.current.srcObject) {
              console.warn('[Call] Video not playing after 2 seconds');
              setConnectionInfo('Waiting for video...');
            } else {
              console.log('[Call] Video stream confirmed on element');
            }
          }
        }, 2000);
      }

    } catch (error) {
      console.error('[Call] Failed to answer call:', error);
      setCallStatus('failed');
      setConnectionInfo(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      setIncomingCall(null);
      addNotification(`Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      
      // Cleanup on error
      cleanup();
    }
  }, [incomingCall, websocket, createPeerConnection, addPendingCandidates, currentUser, chats, beginCall, addNotification, cleanup]);

  // Reject incoming call
  const handleRejectCall = useCallback(() => {
    if (websocket?.readyState === WebSocket.OPEN && incomingCall) {
      websocket.send(JSON.stringify({
        type: 'call_reject',
        targetUserId: incomingCall.from
      }));
    }
    setIncomingCall(null);
    cleanup();
  }, [websocket, incomingCall, cleanup]);

  // End call
  const handleEndCall = useCallback(() => {
    console.log('[Call] Ending call');
    
    if (websocket?.readyState === WebSocket.OPEN && signalingTargetUserId) {
      websocket.send(JSON.stringify({
        type: 'call_end',
        targetUserId: signalingTargetUserId
      }));
    }

    cleanup();
    setCallStatus('ended');
    endCall();
  }, [websocket, signalingTargetUserId, cleanup, endCall]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const newMutedState = !isMuted;
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
      setIsMuted(newMutedState);
      console.log('[Call] Mute toggled:', newMutedState);
    }
  }, [isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const newVideoState = !isVideoOff;
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !newVideoState;
      });
      setIsVideoOff(newVideoState);
      console.log('[Call] Video toggled:', newVideoState);
    }
  }, [isVideoOff]);

  // Retry connection
  const retryConnection = useCallback(async () => {
    console.log('[Call] Retrying connection...');
    cleanup();
    setCallStatus('connecting');
    setCallDuration(0);
    callStartTimeRef.current = 0;
    setConnectionInfo('Retrying...');
    
    setTimeout(() => {
      initOutgoingCall();
    }, 500);
  }, [cleanup, initOutgoingCall]);

  // Initialize call on mount or when callState becomes active
  useEffect(() => {
    if (callState.active && !incomingCall && !incomingAcceptedRef.current && !initializationStartedRef.current) {
      initializationStartedRef.current = true;
      initOutgoingCall();
    }
  }, [callState.active, incomingCall, initOutgoingCall]);
  
  // Cleanup when call ends or component unmounts
  useEffect(() => {
    return () => {
      if (callState.active === false) {
        cleanup();
        initializationStartedRef.current = false;
      }
    };
  }, [callState.active, cleanup]);

  // Sync streams when call status becomes connected
  useEffect(() => {
    if (callStatus === 'connected') {
      console.log('[Call] Connected - ensuring streams are attached');
      
      // Sync local video
      if (localStreamRef.current && localVideoRef.current) {
        if (localVideoRef.current.srcObject !== localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(e => console.warn('[Call] Local video play on sync:', e));
          console.log('[Call] Local video synced');
        }
      }
      
      // Sync remote video
      if (remoteStreamRef.current) {
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play().catch(e => console.warn('[Call] Remote video play on sync:', e));
          console.log('[Call] Remote video synced');
        }
        if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
          remoteAudioRef.current.play().catch(e => console.warn('[Call] Remote audio play on sync:', e));
          console.log('[Call] Remote audio synced');
        }
      } else if (peerConnectionRef.current) {
        // If no stream yet, wait and try again
        setTimeout(() => {
          if (remoteStreamRef.current && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play().catch(e => console.warn('[Call] Remote video play delayed:', e));
            console.log('[Call] Remote video attached after delay');
          }
        }, 500);
      }
    }
  }, [callStatus]);

  // Handle WebSocket messages for call signaling
  useEffect(() => {
    if (!websocket) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'incoming_call': {
            console.log('[Call] Incoming call from:', data.fromUserId, 'with offer:', !!data.offer);
            if (data.offer) {
              setIncomingCall({
                from: data.fromUserId,
                type: data.callType || 'voice',
                offer: data.offer
              });
            }
            break;
          }
          
          case 'call_started': {
            console.log('[Call] Group call started in', data.chatId, 'by', data.fromUserId);
            break;
          }
          
          case 'call_answer': {
            console.log('[Call] Received call answer');
            if (data.answer) {
              await handleAnswer(data.answer);
            }
            break;
          }
          
          case 'call_ice_candidate': {
            console.log('[Call] Received ICE candidate');
            const pc = peerConnectionRef.current;
            
            if (data.candidate) {
              if (pc && pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                  console.warn('[Call] Failed to add ICE candidate:', e);
                }
              } else {
                console.log('[Call] Queuing ICE candidate');
                pendingCandidatesRef.current.push(data.candidate);
              }
            }
            break;
          }
          
          case 'call_reject': {
            console.log('[Call] Call rejected');
            setIncomingCall(null);
            cleanup();
            setCallStatus('ended');
            endCall();
            addNotification('Call was rejected', 'info');
            break;
          }
          
          case 'call_end': {
            console.log('[Call] Call ended by peer');
            setIncomingCall(null);
            cleanup();
            setCallStatus('ended');
            endCall();
            addNotification('Call ended', 'info');
            break;
          }
        }
      } catch (error) {
        console.error('[Call] Error handling message:', error);
      }
    };

    websocket.addEventListener('message', handleMessage);
    return () => {
      websocket.removeEventListener('message', handleMessage);
    };
  }, [websocket, handleAnswer, cleanup, endCall, addNotification]);

  // Call duration timer
  useEffect(() => {
    if (callStatus !== 'connected') return;
    
    const interval = setInterval(() => {
      if (callStartTimeRef.current > 0) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!callState.active && !incomingCall) return null;

  // Incoming call UI
  if (incomingCall) {
    const caller = users.find(u => u.id === incomingCall.from);
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fadeIn">
        <div className="text-center p-8">
          {/* Animated rings */}
          <div className="relative mx-auto w-40 h-40 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-green-500/20 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-4 rounded-full border-4 border-green-500/10 animate-ping" style={{ animationDelay: '0.4s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-indigo-500/30">
                {caller?.avatar ? (
                  <img src={caller.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  caller?.username?.[0]?.toUpperCase() || '?'
                )}
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            {caller?.displayName || caller?.username || 'Unknown'}
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Incoming {incomingCall.type === 'video' ? 'video' : 'voice'} call...
          </p>
          
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={handleRejectCall}
              className="group relative h-20 w-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40 hover:bg-red-600 hover:scale-110 transition-all duration-200"
            >
              <PhoneOff className="h-8 w-8" />
              <span className="absolute -bottom-8 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition">Decline</span>
            </button>
            <button
              onClick={handleAnswerCall}
              className="group relative h-20 w-20 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/40 hover:bg-green-600 hover:scale-110 transition-all duration-200 animate-pulse"
            >
              <Phone className="h-8 w-8" />
              <span className="absolute -bottom-8 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active call UI
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-950 animate-fadeIn">
      {/* Hidden audio element for remote audio (voice calls) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
      />
      
      {/* Remote video / Avatar */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {callState.type === 'video' && (callStatus === 'connected' || callStatus === 'ringing' || callStatus === 'connecting') ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-transparent to-purple-900/20" />
            
            <div className="relative">
              <div className={`mx-auto h-44 w-44 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl font-bold text-white shadow-2xl ${
                callStatus === 'ringing' ? 'animate-pulse' : ''
              }`}>
                {otherUser?.avatar ? (
                  <img src={otherUser.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  otherUser?.username?.[0]?.toUpperCase() || '?'
                )}
              </div>
              
              {callStatus === 'connected' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">Connected</span>
                </div>
              )}
            </div>
            
            <h2 className="mt-8 text-3xl font-bold text-white">
              {otherUser?.displayName || otherUser?.username || 'Unknown'}
            </h2>
            <p className="mt-3 text-xl text-gray-400">
              {callStatus === 'connecting' && (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Connecting...
                </span>
              )}
              {callStatus === 'ringing' && 'Ringing...'}
              {callStatus === 'connected' && formatDuration(callDuration)}
              {callStatus === 'failed' && (
                <span className="text-red-400">Connection failed</span>
              )}
            </p>
            
            {/* Connection info for debugging */}
            {connectionInfo && callStatus !== 'connected' && (
              <p className="mt-2 text-sm text-gray-500">{connectionInfo}</p>
            )}
            
            {/* Retry button for failed calls */}
            {callStatus === 'failed' && (
              <button
                onClick={retryConnection}
                className="mt-6 px-6 py-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="h-5 w-5" />
                Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {callState.type === 'video' && (
          <div className="absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-gray-500" />
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Call timer (top left when connected) */}
        {callStatus === 'connected' && (
          <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-black/50 backdrop-blur text-white text-sm font-medium flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            {formatDuration(callDuration)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900/95 backdrop-blur py-8 border-t border-white/10">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={toggleMute}
            className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              isMuted 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </button>

          {callState.type === 'video' && (
            <button
              onClick={toggleVideo}
              className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                isVideoOff 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isVideoOff ? <VideoOff className="h-7 w-7" /> : <Video className="h-7 w-7" />}
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40 hover:bg-red-600 hover:scale-105 transition-all duration-200"
          >
            <PhoneOff className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
}

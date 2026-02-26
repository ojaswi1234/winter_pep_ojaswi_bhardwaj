import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Plus, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import Whiteboard from '../components/Whiteboard';
import Toolbar from '../components/Toolbar';
import Chat from '../components/Chat';
import socket from '../utils/socket'; 
import { toast } from 'react-toastify';
import '../App.css';

const Room = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // User State
    const [username, setUsername] = useState(location.state?.username || '');
    const [isHost, setIsHost] = useState(location.state?.isHost || false);
    
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [downloadTrigger, setDownloadTrigger] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(true);
    
    // Mobile Controller State
    const [showQR, setShowQR] = useState(false);
    const [networkIp, setNetworkIp] = useState(window.location.hostname);

    // Advanced Feature States
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // WebRTC / Screen Share States
    const [isSharing, setIsSharing] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({}); 
    const myPeerRef = useRef(null); 

    // Logic States
    const [status, setStatus] = useState('initializing'); 
    const [users, setUsers] = useState([]); 
    const [joinRequests, setJoinRequests] = useState([]); 
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [pages, setPages] = useState([0]); 
    const [clearVersion, setClearVersion] = useState(0);
    const [copied, setCopied] = useState(false);

    // --- TRACK PARTICIPANTS FOR DASHBOARD HISTORY ---
    useEffect(() => {
        if (users.length > 0) {
            const history = JSON.parse(localStorage.getItem('roomHistory') || '[]');
            const existingRoomIndex = history.findIndex(r => r.id === roomId);
            
            // Extract usernames, exclude self
            const participantNames = users.map(u => u.username).filter(name => name !== username);
            
            if (existingRoomIndex !== -1) {
                const existingParticipants = history[existingRoomIndex].participants || [];
                history[existingRoomIndex].participants = [...new Set([...existingParticipants, ...participantNames])];
                localStorage.setItem('roomHistory', JSON.stringify(history));
            }
        }
    }, [users, roomId, username]);

    // --- 1. INITIALIZATION & SOCKETS ---
    useEffect(() => {
        if (!socket.connected) socket.connect();
        document.body.className = isDarkMode ? '' : 'light-mode';

        // Auto-fetch local Network IP
        const fetchIp = async () => {
            try {
                const apiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/local-ip`);
                const data = await res.json();
                if (data.ip) setNetworkIp(data.ip);
            } catch (err) { console.error("Could not fetch network IP", err); }
        };
        fetchIp();

        if (isHost) {
            socket.emit('create-room', { roomId, username });
            setStatus('joined');
        } else {
            const name = username || prompt("Enter your name to join:");
            if (!name) return navigate('/');
            setUsername(name);
            setStatus('requesting');
            socket.emit('request-join', { roomId, username: name });
        }

        const handleRequest = (data) => setJoinRequests(prev => [...prev, data]);
        const handleStatus = (data) => {
            if (data.status === 'accepted') {
                setStatus('joined');
                socket.emit('join-confirmed', { roomId, username });
                toast.success("Joined successfully!");
            } else if (data.status === 'rejected') {
                setStatus('denied');
            } else {
                toast.error(data.message); navigate('/');
            }
        };
        const handleUsers = (list) => setUsers(list);
        const handleClosed = () => { toast.warning("Host closed room"); navigate('/'); };

        // MOBILE CONTROLLER
        const handleMobileCommand = ({ command, value }) => {
            if (command === 'tool') setTool(value);
            if (command === 'color') setColor(value);
            if (command === 'action') {
                if (value === 'undo') handleUndo();
                if (value === 'redo') handleRedo();
            }
            toast.info(`Mobile: ${command} ${value}`);
        };

        // WEBRTC
        const handleUserStartedSharing = ({ userId }) => toast.info("Incoming Screen Share...");
        const handleUserStoppedSharing = () => {
            setRemoteStream(null);
            if(myPeerRef.current) { myPeerRef.current.close(); myPeerRef.current = null; }
            toast.info("Screen Share ended.");
        };
        const handleWebRTCOffer = async ({ sdp, callerId }) => {
            const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            myPeerRef.current = peer;
            peer.onicecandidate = (e) => { if (e.candidate) socket.emit('webrtc-ice-candidate', { target: callerId, candidate: e.candidate }); };
            peer.ontrack = (e) => setRemoteStream(e.streams[0]);
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('webrtc-answer', { target: callerId, sdp: answer });
        };
        const handleWebRTCAnswer = async ({ sdp, responderId }) => {
            const peer = peerConnectionsRef.current[responderId];
            if (peer) await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        };
        const handleWebRTCCandidate = async ({ candidate, senderId }) => {
            const peer = isSharing ? peerConnectionsRef.current[senderId] : myPeerRef.current;
            if (peer) await peer.addIceCandidate(new RTCIceCandidate(candidate));
        };

        socket.on('user-requesting', handleRequest);
        socket.on('join-status', handleStatus);
        socket.on('room-users', handleUsers);
        socket.on('room-closed', handleClosed);
        socket.on('mobile-command-received', handleMobileCommand);
        socket.on('user-started-sharing', handleUserStartedSharing);
        socket.on('user-stopped-sharing', handleUserStoppedSharing);
        socket.on('webrtc-offer', handleWebRTCOffer);
        socket.on('webrtc-answer', handleWebRTCAnswer);
        socket.on('webrtc-ice-candidate', handleWebRTCCandidate);

        return () => {
            socket.off('user-requesting', handleRequest);
            socket.off('join-status', handleStatus);
            socket.off('room-users', handleUsers);
            socket.off('room-closed', handleClosed);
            socket.off('mobile-command-received', handleMobileCommand);
            socket.off('user-started-sharing');
            socket.off('user-stopped-sharing');
            socket.off('webrtc-offer');
            socket.off('webrtc-answer');
            socket.off('webrtc-ice-candidate');
        };
    }, [roomId, isHost, username, navigate, isSharing, isDarkMode]);

    // --- SCREEN SHARING LOGIC ---
    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            setIsSharing(true);
            socket.emit('start-screen-share', { roomId, userId: socket.id });

            stream.getVideoTracks()[0].onended = stopScreenShare;
            users.forEach(user => { if (user.id !== socket.id) createPeerConnection(user.id, stream); });
        } catch (err) { console.error("Screen Share Error:", err); }
    };

    const createPeerConnection = async (targetId, stream) => {
        const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnectionsRef.current[targetId] = peer;
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
        peer.onicecandidate = (e) => { if (e.candidate) socket.emit('webrtc-ice-candidate', { target: targetId, candidate: e.candidate }); };
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('webrtc-offer', { target: targetId, sdp: offer });
    };

    const stopScreenShare = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        setIsSharing(false);
        socket.emit('stop-screen-share', { roomId });
        Object.values(peerConnectionsRef.current).forEach(peer => peer.close());
        peerConnectionsRef.current = {};
    };

    // --- RECORDING LOGIC ---
    const startRecording = async () => {
        try {
            const canvas = document.querySelector('canvas');
            if(!canvas) return;
            const stream = canvas.captureStream(30); 
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Session_Recording_${new Date().getTime()}.webm`;
                a.click();
                recordedChunksRef.current = [];
            };
            recorder.start();
            setIsRecording(true);
            toast.info("Recording started...");
        } catch (err) { toast.error("Recording failed. Check browser support."); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            toast.success("Recording saved!");
        }
    };

    // --- FILE SHARING LOGIC ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) return toast.error("File size limit is 100MB");
        const reader = new FileReader();
        reader.onload = (evt) => {
            socket.emit('upload-file', { roomId, username, fileName: file.name, fileData: evt.target.result, time: new Date().toLocaleTimeString() });
            toast.success("File uploaded to chat!");
        };
        reader.readAsDataURL(file);
    };

    // --- ACTIONS ---
    const handlePermission = (socketId, action) => {
        socket.emit('respond-join', { socketId, action, roomId });
        setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
    };

    const handleClear = () => {
        pages.forEach(p => socket.emit('clear-board', {roomId, pageId: p})); 
        setClearVersion(v => v + 1); 
    };

    const handleDownload = () => setDownloadTrigger(v => v + 1);
    const handleUndo = () => socket.emit('undo', { roomId });
    const handleRedo = () => socket.emit('redo', { roomId });
    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    if (status === 'requesting') return <div className="full-screen" style={{alignItems:'center', justifyContent:'center'}}><h2>Waiting for Host...</h2></div>;
    if (status === 'denied') return <div className="full-screen" style={{alignItems:'center', justifyContent:'center'}}><h2>Access Denied</h2><button onClick={()=>navigate('/')} className="btn-secondary">Home</button></div>;

    // Smart QR Routing
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;
    const isProduction = import.meta.env.PROD;
    const baseHost = isProduction ? window.location.hostname : (networkIp !== 'localhost' ? networkIp : window.location.hostname);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${protocol}//${baseHost}${isProduction ? '' : port}/mobile/${socket.id}`;

    return (
        <div className="room-container">
            {/* Screen Share Overlay */}
            {remoteStream && (
                <div className="screen-share-overlay">
                    <div style={{color:'white', marginBottom:10, fontWeight:'bold'}}>Sharing Screen...</div>
                    <video className="screen-video" autoPlay playsInline ref={video => { if(video) video.srcObject = remoteStream }} />
                    <button onClick={() => setRemoteStream(null)} className="btn-danger" style={{marginTop:10}}>Close View</button>
                </div>
            )}

            {/* Host Popup */}
            {isHost && joinRequests.map(req => (
                <div key={req.socketId} className="glass-panel" style={{ position:'absolute', top:20, left:'50%', transform:'translateX(-50%)', zIndex:200, padding:20, display:'flex', gap:20, alignItems:'center', border:'1px solid var(--primary-yellow)' }}>
                    <span><strong>{req.username}</strong> wants to join</span>
                    <button onClick={()=>handlePermission(req.socketId,'accept')} className="btn-primary" style={{padding:'8px 15px'}}>Allow</button>
                    <button onClick={()=>handlePermission(req.socketId,'deny')} className="btn-danger">Deny</button>
                </div>
            ))}

            {/* Mobile QR Modal */}
            {showQR && (
                <div style={{position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <div className="glass-panel" style={{padding:40, textAlign:'center', position:'relative', background:'var(--bg-panel)'}}>
                        <button onClick={()=>setShowQR(false)} style={{position:'absolute', top:10, right:10, background:'transparent', border:'none', color:'var(--text-main)', cursor:'pointer'}}><X size={20}/></button>
                        <h3 style={{marginTop:0, color:'var(--primary-yellow)'}}>Mobile Controller</h3>
                        <img src={qrUrl} alt="QR Code" style={{border:'5px solid white', borderRadius:8}} />
                        <p style={{fontSize:'0.8rem', color:'var(--text-muted)', marginTop:15}}>Scan to pair your phone</p>
                        <div style={{fontSize: '0.65rem', color: 'var(--glass-border)', marginTop: 10}}>IP: {baseHost}</div>
                    </div>
                </div>
            )}

            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="toggle-btn" style={{ left: isSidebarOpen ? '270px' : '20px', top: '15px' }}>
                {isSidebarOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>}
            </button>

            <div className={`room-sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`} style={{width:260, background:'var(--bg-dark)', borderRight:'1px solid var(--glass-border)', display:'flex', flexDirection:'column'}}>
                <div style={{padding:20, borderBottom:'1px solid var(--glass-border)'}}>
                    <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>{isHost ? 'HOST' : 'GUEST'} SESSION</div>
                    <div className="room-id-display" onClick={()=>{navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(()=>setCopied(false),2000)}}>
                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:160}}>{roomId}</span>
                        {copied ? <Check size={16}/> : <Copy size={16}/>}
                    </div>
                </div>
                <div style={{padding:20, flex:1, overflowY:'auto'}}>
                    <Toolbar 
                        tool={tool} setTool={setTool} color={color} setColor={setColor} lineWidth={lineWidth} setLineWidth={setLineWidth} 
                        onClear={handleClear} onDownload={handleDownload}
                        onScreenShare={isSharing ? stopScreenShare : startScreenShare} isSharing={isSharing}
                        onRecord={isRecording ? stopRecording : startRecording} isRecording={isRecording}
                        onFileUpload={handleFileUpload} isDarkMode={isDarkMode} toggleTheme={toggleTheme}
                        onUndo={handleUndo} onRedo={handleRedo} onOpenQR={() => setShowQR(true)}
                    />
                    
                    <div style={{marginTop:30}}>
                        <label style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>ACTIVE USERS ({users.length})</label>
                        <div style={{marginTop:10}}>
                            {users.map(u => (
                                <div key={u.id} style={{padding:8, borderRadius:6, marginBottom:4, background:u.username===username?'var(--primary-yellow)':'transparent', color:u.username===username?'black':'var(--text-main)', fontSize:'0.9rem'}}>
                                    {u.username} {u.username===username && '(You)'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{padding:20, borderTop:'1px solid var(--glass-border)'}}>
                    <button onClick={()=>navigate('/')} className="btn-danger" style={{width:'100%'}}>Leave Room</button>
                </div>
            </div>

            <div className="canvas-wrapper">
                <div style={{height:'100%', overflowY:'auto', padding:20}}>
                    {pages.map((p, i) => (
                        <div key={p} style={{marginBottom:40, boxShadow:'0 10px 30px rgba(0,0,0,0.1)', borderRadius:8, overflow:'hidden'}}>
                            <div style={{background:'white', padding:10, color:'#64748b', fontWeight:700, borderBottom:'1px solid #e2e8f0'}}>Page {i+1}</div>
                            <Whiteboard tool={tool} color={color} lineWidth={lineWidth} roomId={roomId} pageId={p} username={username} socket={socket} clearVersion={clearVersion} downloadTrigger={downloadTrigger} />
                        </div>
                    ))}
                    <button onClick={()=>setPages([...pages, pages.length])} className="btn-secondary" style={{width:'100%', marginTop:20}}><Plus size={18}/> Add Page</button>
                </div>
            </div>
            <Chat roomId={roomId} username={username} />
        </div>
    );
};
export default Room;
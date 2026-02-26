import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Whiteboard from '../components/Whiteboard';
import Toolbar from '../components/Toolbar';
import Chat from '../components/Chat';
import {socket} from '../utils/socket'; 
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

        // WEBRTC HANDLERS
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

            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="toggle-btn" style={{ left: isSidebarOpen ? '280px' : '20px', top: '15px' }}>
                {isSidebarOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>}
            </button>

            <div className={`room-sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`} style={{width: 280, background:'var(--bg-dark)', borderRight:'1px solid var(--glass-border)', display:'flex', flexDirection:'column'}}>
                <div style={{padding:20, borderBottom:'1px solid var(--glass-border)'}}>
                    <div style={{fontSize:'0.7rem', color:'var(--text-muted)', fontWeight: 'bold', letterSpacing: 1}}>{isHost ? 'HOST SESSION' : 'GUEST SESSION'}</div>
                    <div className="room-id-display" onClick={()=>{navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(()=>setCopied(false),2000)}} style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginTop: 10, background: 'var(--bg-panel)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--glass-border)'}}>
                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:160, color: 'var(--text-main)', fontSize: '0.9rem'}}>{roomId}</span>
                        {copied ? <Check size={16} color="var(--accent-green)"/> : <Copy size={16} color="var(--text-muted)"/>}
                    </div>
                </div>
                
                <div style={{padding: '24px 20px', flex:1, overflowY:'auto'}}>
                    <Toolbar 
                        tool={tool} setTool={setTool} color={color} setColor={setColor} lineWidth={lineWidth} setLineWidth={setLineWidth} 
                        onClear={handleClear} onDownload={handleDownload}
                        onScreenShare={isSharing ? stopScreenShare : startScreenShare} isSharing={isSharing}
                        onRecord={isRecording ? stopRecording : startRecording} isRecording={isRecording}
                        onFileUpload={handleFileUpload} isDarkMode={isDarkMode} toggleTheme={toggleTheme}
                        onUndo={handleUndo} onRedo={handleRedo}
                    />
                    
                    <div style={{marginTop:40, paddingTop: 20, borderTop: '1px solid var(--glass-border)'}}>
                        <label style={{fontSize:'0.7rem', color:'var(--text-muted)', fontWeight: 'bold', letterSpacing: 1}}>ACTIVE USERS ({users.length})</label>
                        <div style={{marginTop:15, display: 'flex', flexDirection: 'column', gap: 8}}>
                            {users.map(u => (
                                <div key={u.id} style={{padding:'10px 12px', borderRadius:8, background:u.username===username?'rgba(245, 158, 11, 0.1)':'var(--bg-panel)', border: u.username===username?'1px solid var(--primary-yellow)':'1px solid var(--glass-border)', color:u.username===username?'var(--primary-yellow)':'var(--text-main)', fontSize:'0.9rem', display: 'flex', alignItems: 'center', gap: 10}}>
                                    <div style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)'}}></div>
                                    {u.username} {u.username===username && '(You)'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div style={{padding:20, borderTop:'1px solid var(--glass-border)'}}>
                    <button onClick={()=>navigate('/')} className="btn-danger" style={{width:'100%', padding: '12px'}}>Leave Session</button>
                </div>
            </div>

            <div className="canvas-wrapper">
                <div style={{height:'100%', overflowY:'auto', padding:20}}>
                    {pages.map((p, i) => (
                        <div key={p} style={{marginBottom:40, boxShadow:'0 10px 40px rgba(0,0,0,0.15)', borderRadius:12, overflow:'hidden', border: '1px solid var(--glass-border)'}}>
                            <div style={{background:'var(--bg-panel)', padding:'12px 20px', color:'var(--text-main)', fontWeight:700, borderBottom:'1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between'}}>
                                <span>Page {i+1}</span>
                                <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>{roomId}</span>
                            </div>
                            <Whiteboard tool={tool} color={color} lineWidth={lineWidth} roomId={roomId} pageId={p} username={username} socket={socket} clearVersion={clearVersion} downloadTrigger={downloadTrigger} />
                        </div>
                    ))}
                    <button onClick={()=>setPages([...pages, pages.length])} className="btn-secondary" style={{width:'100%', marginTop:20, padding: '15px', display: 'flex', justifyContent: 'center', gap: 10, borderStyle: 'dashed'}}><Plus size={20}/> Add New Page</button>
                </div>
            </div>
            <Chat roomId={roomId} username={username} />
        </div>
    );
};
export default Room;
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Plus, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'; // New Icons
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
    
    // User Info
    const [username, setUsername] = useState(location.state?.username || '');
    const [isHost, setIsHost] = useState(location.state?.isHost || false);
    
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Retractable Sidebar

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

    useEffect(() => {
        if (!socket.connected) socket.connect();

        if (isHost) {
            if (!username) { navigate('/'); return; }
            socket.emit('create-room', { roomId, username });
            setStatus('joined');
        } else {
            if (!username) {
                const name = prompt("Enter your name to join:");
                if (!name) { navigate('/'); return; }
                setUsername(name);
                setStatus('requesting');
                socket.emit('request-join', { roomId, username: name });
            } else {
                setStatus('requesting');
                socket.emit('request-join', { roomId, username });
            }
        }

        socket.on('user-requesting', (data) => {
            setJoinRequests(prev => [...prev, data]);
            toast.info(`${data.username} wants to join`);
        });

        socket.on('join-status', (data) => {
            if (data.status === 'accepted') {
                setStatus('joined');
                socket.emit('join-confirmed', { roomId, username });
                toast.success("Joined!");
            } else if (data.status === 'rejected') {
                setStatus('denied');
            } else {
                toast.error(data.message); navigate('/');
            }
        });

        socket.on('room-users', (list) => setUsers(list));
        socket.on('user-joined', (data) => { if(data.id !== socket.id) toast.success(`${data.username} joined`); });
        socket.on('room-closed', () => { toast.warning("Host closed the room"); navigate('/'); });

        return () => {
            socket.off('user-requesting');
            socket.off('join-status');
            socket.off('room-users');
            socket.off('user-joined');
            socket.off('room-closed');
        };
    }, [roomId, isHost, username, navigate]);

    const handlePermission = (socketId, action) => {
        socket.emit('respond-join', { socketId, action, roomId });
        setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        pages.forEach(p => socket.emit('clear-board', {roomId, pageId: p})); 
        setClearVersion(v=>v+1); 
    };

    if (status === 'requesting') return <div className="full-screen" style={{alignItems:'center', justifyContent:'center', color:'white'}}><h2>Waiting for Host...</h2></div>;
    if (status === 'denied') return <div className="full-screen" style={{alignItems:'center', justifyContent:'center', color:'white'}}><h2>Access Denied</h2><button onClick={()=>navigate('/')} className="btn-secondary" style={{marginTop:20}}>Back Home</button></div>;

    return (
        <div className="room-container">
            {/* Host Popup */}
            {isHost && joinRequests.length > 0 && (
                <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: 400 }}>
                    {joinRequests.map(req => (
                        <div key={req.socketId} className="glass-panel" style={{ padding: 15, background: '#0F172A', display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10, border:'1px solid #F59E0B' }}>
                            <span style={{color:'white'}}><strong>{req.username}</strong> wants to join</span>
                            <div style={{display:'flex', gap:10}}>
                                <button onClick={()=>handlePermission(req.socketId,'accept')} className="btn-primary" style={{padding:'6px 12px', fontSize:'0.8rem'}}>Allow</button>
                                <button onClick={()=>handlePermission(req.socketId,'deny')} className="btn-danger" style={{padding:'6px 12px', fontSize:'0.8rem'}}>Deny</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Toggle Button for Room Sidebar */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="toggle-btn"
                style={{ left: isSidebarOpen ? '270px' : '20px', top: '15px' }}
                title={isSidebarOpen ? "Hide Toolbar" : "Show Toolbar"}
            >
                {isSidebarOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>}
            </button>

            {/* Retractable Sidebar */}
            <div className={`room-sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
                <div className="room-header-info">
                    <div style={{fontSize:'0.8rem', color:'#94A3B8', textTransform:'uppercase'}}>{isHost ? 'HOST' : 'GUEST'}</div>
                    <div className="room-id-display" onClick={handleCopy}>
                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:180}}>{roomId}</span>{copied ? <Check size={16}/> : <Copy size={16}/>}
                    </div>
                </div>
                <div className="toolbar-container">
                    <Toolbar tool={tool} setTool={setTool} color={color} setColor={setColor} lineWidth={lineWidth} setLineWidth={setLineWidth} onClear={handleClear}/>
                    <div style={{marginTop:30}}>
                        <label style={{color:'#94A3B8', fontSize:'0.8rem', letterSpacing:1}}>ACTIVE USERS ({users.length})</label>
                        <ul style={{listStyle:'none', padding:0, marginTop:10}}>
                            {users.map((u,i) => (
                                <li key={i} style={{padding:'8px', borderRadius:6, marginBottom:5, fontSize:'0.9rem', color: u.username===username?'black':'white', background: u.username===username?'#F59E0B':'transparent', display:'flex', alignItems:'center', gap:10}}>
                                    <div style={{width:24, height:24, borderRadius:'50%', background: u.username===username?'black':'#10B981', color: u.username===username?'white':'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'0.8rem'}}>{u.username.charAt(0).toUpperCase()}</div>
                                    {u.username} {u.username===username && '(You)'}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div style={{marginTop:30}}>
                         <button onClick={()=>setPages([...pages, pages.length])} className="btn-secondary" style={{width:'100%', display:'flex', justifyContent:'center', alignItems:'center', gap:5}}><Plus size={16}/> Add Page</button>
                    </div>
                </div>
                <div style={{padding:20, borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                     <button onClick={()=>navigate('/')} className="btn-danger" style={{width:'100%', display:'flex', justifyContent:'center', gap:8}}><LogOut size={16}/> Leave</button>
                </div>
            </div>

            <div className="canvas-wrapper">
                <div className="pages-container" style={{height:'100%', overflow:'auto', padding:20}}>
                    {pages.map((p, i) => (
                        <div key={p} className="page-wrapper" style={{marginBottom:40, boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
                            <div style={{background:'white', padding:'8px 16px', borderBottom:'1px solid #eee', color:'#64748b', fontWeight:'bold'}}>Page {i+1}</div>
                            <Whiteboard tool={tool} color={color} lineWidth={lineWidth} roomId={roomId} pageId={p} username={username} socket={socket} clearVersion={clearVersion} />
                        </div>
                    ))}
                </div>
            </div>
            <Chat roomId={roomId} username={username} />
        </div>
    );
};
export default Room;
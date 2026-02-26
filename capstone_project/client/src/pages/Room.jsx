import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Plus, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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

        socket.on('user-requesting', handleRequest);
        socket.on('join-status', handleStatus);
        socket.on('room-users', handleUsers);
        socket.on('room-closed', handleClosed);

        return () => {
            socket.off('user-requesting', handleRequest);
            socket.off('join-status', handleStatus);
            socket.off('room-users', handleUsers);
            socket.off('room-closed', handleClosed);
        };
    }, [roomId, isHost, username, navigate]);

    const handlePermission = (socketId, action) => {
        socket.emit('respond-join', { socketId, action, roomId });
        setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
    };

    const handleClear = () => {
        pages.forEach(p => socket.emit('clear-board', {roomId, pageId: p})); 
        setClearVersion(v => v + 1); 
    };

    const handleDownload = () => {
        setDownloadTrigger(v => v + 1);
    };

    if (status === 'requesting') return <div className="full-screen" style={{alignItems:'center', justifyContent:'center'}}><h2>Waiting for Host...</h2></div>;
    if (status === 'denied') return <div className="full-screen" style={{alignItems:'center', justifyContent:'center'}}><h2>Access Denied</h2><button onClick={()=>navigate('/')} className="btn-secondary">Home</button></div>;

    return (
        <div className="room-container">
            {/* Host Popup */}
            {isHost && joinRequests.map(req => (
                <div key={req.socketId} className="glass-panel" style={{ position:'absolute', top:20, left:'50%', transform:'translateX(-50%)', zIndex:200, padding:20, display:'flex', gap:20, alignItems:'center', border:'1px solid var(--primary-yellow)' }}>
                    <span><strong>{req.username}</strong> wants to join</span>
                    <button onClick={()=>handlePermission(req.socketId,'accept')} className="btn-primary" style={{padding:'8px 15px'}}>Allow</button>
                    <button onClick={()=>handlePermission(req.socketId,'deny')} className="btn-danger">Deny</button>
                </div>
            ))}

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
                        tool={tool} setTool={setTool} 
                        color={color} setColor={setColor} 
                        lineWidth={lineWidth} setLineWidth={setLineWidth} 
                        onClear={handleClear}
                        onDownload={handleDownload}
                    />
                    <div style={{marginTop:30}}>
                        <label style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>ACTIVE USERS ({users.length})</label>
                        <div style={{marginTop:10}}>
                            {users.map(u => (
                                <div key={u.id} style={{padding:8, borderRadius:6, marginBottom:4, background:u.username===username?'var(--primary-yellow)':'transparent', color:u.username===username?'black':'white', fontSize:'0.9rem'}}>
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
                            <Whiteboard 
                                tool={tool} color={color} lineWidth={lineWidth} 
                                roomId={roomId} pageId={p} username={username} socket={socket} 
                                clearVersion={clearVersion} 
                                downloadTrigger={downloadTrigger} 
                            />
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
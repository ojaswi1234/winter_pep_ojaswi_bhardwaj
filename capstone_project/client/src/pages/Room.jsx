import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Plus, LogOut, ShieldAlert } from 'lucide-react';
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
    
    // Room State
    const [status, setStatus] = useState('initializing'); 
    const [users, setUsers] = useState([]); // List of active users
    const [joinRequests, setJoinRequests] = useState([]); 
    
    // Tools State
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [pages, setPages] = useState([0]); 
    const [clearVersion, setClearVersion] = useState(0);
    const [copied, setCopied] = useState(false);

    // --- 1. INITIALIZATION & SOCKET LOGIC ---
    useEffect(() => {
        if (!socket.connected) socket.connect();

        if (isHost) {
            if (!username) {
                toast.error("Host info missing");
                navigate('/'); 
                return;
            }
            // Host creates room
            socket.emit('create-room', { roomId, username });
            setStatus('joined');
        } 
        else {
            if (!username) {
                const nameInput = prompt("Enter your name to join:");
                if (!nameInput) {
                    navigate('/');
                    return;
                }
                setUsername(nameInput);
                setStatus('requesting');
                socket.emit('request-join', { roomId, username: nameInput });
            } else {
                setStatus('requesting');
                socket.emit('request-join', { roomId, username });
            }
        }

        // --- SOCKET LISTENERS ---

        socket.on('user-requesting', (data) => {
            setJoinRequests(prev => [...prev, data]);
            toast.info(`${data.username} wants to join!`);
        });

        socket.on('join-status', (data) => {
            if (data.status === 'accepted') {
                setStatus('joined');
                // IMPORTANT: Tell server we are in, so it adds us to the list
                socket.emit('join-confirmed', { roomId, username });
                toast.success("Joined successfully!");
            } else if (data.status === 'rejected') {
                setStatus('denied');
                toast.error("Host denied your request.");
                setTimeout(() => navigate('/'), 3000);
            } else if (data.status === 'error') {
                toast.error(data.message);
                navigate('/');
            }
        });

        // FIX: Update the Active Users list
        socket.on('room-users', (updatedUsers) => {
            console.log("Updated Users List:", updatedUsers);
            setUsers(updatedUsers);
        });
        
        socket.on('user-joined', (data) => {
            if(data.id !== socket.id) toast.success(`${data.username} joined`);
        });

        socket.on('user-left', (userId) => {
             // Optional: toast specific user left
        });

        socket.on('room-closed', () => {
            toast.warning("Host ended the session.");
            navigate('/');
        });

        return () => {
            socket.off('user-requesting');
            socket.off('join-status');
            socket.off('room-users');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('room-closed');
        };
    }, [roomId, isHost, username, navigate]);

    // --- HOST ACTIONS ---
    const handlePermission = (socketId, action) => {
        socket.emit('respond-join', { socketId, action, roomId });
        setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
    };

    // --- UI ACTIONS ---
    const handleClearBoard = () => {
        pages.forEach(pageId => socket.emit('clear-board', { roomId, pageId }));
        setClearVersion(v => v + 1);
    };

    const handleAddPage = () => {
        setPages([...pages, pages.length > 0 ? Math.max(...pages) + 1 : 0]);
        toast.success('New page added!');
    };

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId).then(() => {
            setCopied(true);
            toast.success('ID Copied!');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (status === 'requesting') {
        return (
            <div className="full-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
                    <h2 style={{ color: 'var(--primary-yellow)' }}>Waiting for Host...</h2>
                    <p style={{ color: 'var(--text-muted)' }}>We've sent your request to join <strong>{roomId}</strong>.</p>
                </div>
            </div>
        );
    }

    if (status === 'denied') {
        return (
            <div className="full-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderColor: 'var(--danger)' }}>
                    <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: 'var(--danger)' }}>Access Denied</h2>
                    <p>The host has declined your request.</p>
                    <button onClick={() => navigate('/')} className="btn-secondary" style={{ marginTop: '20px' }}>Back to Home</button>
                </div>
            </div>
        );
    }

    // --- MAIN ROOM UI ---
    return (
        <div className="room-container">
            {/* Permission Popup (Host Only) */}
            {isHost && joinRequests.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    width: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {joinRequests.map((req) => (
                        <div key={req.socketId} className="glass-panel" style={{ 
                            padding: '15px', 
                            background: 'rgba(15, 23, 42, 0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid var(--primary-yellow)',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}>
                            <div>
                                <strong style={{ color: 'var(--primary-yellow)' }}>{req.username}</strong>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>wants to join</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => handlePermission(req.socketId, 'accept')}
                                    className="btn-primary" 
                                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                >
                                    Allow
                                </button>
                                <button 
                                    onClick={() => handlePermission(req.socketId, 'deny')}
                                    className="btn-danger" 
                                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                >
                                    Deny
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sidebar */}
            <div className="room-sidebar">
                <div className="room-header-info">
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {isHost ? 'Hosting Session' : 'Guest Session'}
                    </div>
                    <div className="room-id-display" onClick={handleCopyRoomId} title="Copy ID">
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'180px' }}>{roomId}</span>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </div>
                </div>

                <div className="toolbar-container">
                    <Toolbar 
                        tool={tool} 
                        setTool={setTool} 
                        color={color} 
                        setColor={setColor} 
                        lineWidth={lineWidth} 
                        setLineWidth={setLineWidth}
                        onClear={handleClearBoard}
                    />
                    
                    <div className="tool-group" style={{ marginTop: '30px' }}>
                        <label>Pages</label>
                        <button onClick={handleAddPage} className="btn-secondary" style={{ width: '100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                            <Plus size={16} /> Add Page
                        </button>
                    </div>

                    <div className="tool-group">
                         <label>Active Users ({users.length})</label>
                         <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {users && users.map((u, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '8px', borderRadius: '6px', background: u.username === username ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                                    <div style={{ width: '24px', height: '24px', background: u.username === username ? 'var(--primary-yellow)' : 'var(--accent-green)', borderRadius: '50%', color: u.username === username ? 'black' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: u.username === username ? 'white' : 'var(--text-muted)' }}>
                                        {u.username} {u.username === username && '(You)'}
                                    </span>
                                </li>
                            ))}
                         </ul>
                    </div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
                    <button onClick={() => navigate('/')} className="btn-danger" style={{ width: '100%', display:'flex', justifyContent:'center', gap:'8px' }}>
                        <LogOut size={16} /> Leave Room
                    </button>
                </div>
            </div>
            
            {/* Canvas Area */}
            <div className="canvas-wrapper" style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f8fafc' }}>
                <div className="pages-container" style={{ height: '100%', overflow: 'auto', padding: '20px' }}>
                    {pages.map((pageId, index) => (
                        <div key={pageId} className="page-wrapper" style={{ marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                            <div className="page-label" style={{ padding: '10px', background: 'white', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#64748b' }}>
                                Page {index + 1}
                            </div>
                            <Whiteboard 
                                tool={tool} 
                                color={color} 
                                lineWidth={lineWidth} 
                                roomId={roomId}
                                pageId={pageId}
                                username={username}
                                socket={socket}
                                clearVersion={clearVersion}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-wrapper">
                 <Chat roomId={roomId} username={username} />
            </div>
        </div>
    );
};

export default Room;
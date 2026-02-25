import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Plus, LogOut } from 'lucide-react';
import Whiteboard from '../components/Whiteboard';
import Toolbar from '../components/Toolbar'; // Ensure Toolbar uses new styles below
import Chat from '../components/Chat';
import { socket } from '../utils/socket';
import { toast } from 'react-toastify';
import '../App.css';

const Room = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // State
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [users, setUsers] = useState([]);
    const [copied, setCopied] = useState(false);
    const [pages, setPages] = useState([0]); 
    const [clearVersion, setClearVersion] = useState(0);
    const [username, setUsername] = useState(location.state?.username || '');

    useEffect(() => {
        // ... (Keep existing socket logic exactly as it was) ...
        let isMounted = true;
        if (!username) {
            setTimeout(() => {
                const name = prompt("Please enter your name to join:");
                if (name && name.trim() && isMounted) {
                    setUsername(name.trim());
                } else if (isMounted) {
                    toast.error("Username is required");
                    navigate('/');
                }
            }, 0);
            return;
        }

        if (!socket.connected) socket.connect();
        socket.emit('join-room', { roomId, username });

        const handleUserJoined = (data) => {
            setUsers((prev) => !prev.some(u => u.id === data.id) ? [...prev, { username: data.username, id: data.id }] : prev);
        };
        const handleRoomUsers = (roomUsers) => setUsers(roomUsers);
        const handleUserLeft = (userId) => setUsers((prev) => prev.filter(u => u.id !== userId));

        socket.on('user-joined', handleUserJoined);
        socket.on('room-users', handleRoomUsers);
        socket.on('user-left', handleUserLeft);

        return () => {
            isMounted = false;
            socket.off('user-joined', handleUserJoined);
            socket.off('room-users', handleRoomUsers);
            socket.off('user-left', handleUserLeft);
            if (socket.connected) socket.disconnect();
        }
    }, [roomId, username, navigate]);

    // Keep existing handlers
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

    return (
        <div className="room-container">
            {/* Renovated Sidebar */}
            <div className="room-sidebar">
                <div className="room-header-info">
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Session</div>
                    <div className="room-id-display" onClick={handleCopyRoomId} title="Copy ID">
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'180px' }}>{roomId}</span>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </div>
                </div>

                <div className="toolbar-container">
                    {/* Pass props to Toolbar */}
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
                         <label>Active Users ({users.length + 1})</label>
                         <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                <div style={{ width: '24px', height: '24px', background: 'var(--primary-yellow)', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    {username.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.9rem' }}>{username} (You)</span>
                            </li>
                            {users.map((u, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '8px' }}>
                                    <div style={{ width: '24px', height: '24px', background: 'var(--accent-green)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{u.username}</span>
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
            
            {/* Canvas Area - Kept mostly same but wrapped in new structure */}
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
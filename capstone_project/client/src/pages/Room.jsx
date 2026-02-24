import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Plus } from 'lucide-react';
import Whiteboard from '../components/Whiteboard';
import Toolbar from '../components/Toolbar';
import Chat from '../components/Chat';
import { socket } from '../utils/socket';
import { toast } from 'react-toastify';
import '../App.css';

const Room = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // State for whiteboard tools
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [users, setUsers] = useState([]);
    const [copied, setCopied] = useState(false);
    const [pages, setPages] = useState([0]); // Array of page IDs
    const [clearVersion, setClearVersion] = useState(0);

    // Get username from navigation state or ask for it
    const [username, setUsername] = useState(location.state?.username || '');

    useEffect(() => {
        let isMounted = true;
        
        if (!username) {
            // Use setTimeout to avoid synchronous state update warning
            setTimeout(() => {
                const name = prompt("Please enter your name to join:");
                if (name && name.trim() && isMounted) {
                    setUsername(name.trim());
                } else if (isMounted) {
                    toast.error("Username is required to join a room");
                    navigate('/'); // Redirect if no name
                }
            }, 0);
            return;
        }

        // Join the room via socket
        if (!socket.connected) {
            socket.connect();
        }
        
        socket.emit('join-room', { roomId, username });

        // Listen for user updates (presence)
        const handleUserJoined = (data) => {
            console.log(`User joined: ${data.username}`);
            // Add the new user to the list
            setUsers((prevUsers) => {
                // Check if user already exists to avoid duplicates
                if (!prevUsers.some(user => user.id === data.id)) {
                    return [...prevUsers, { username: data.username, id: data.id }];
                }
                return prevUsers;
            });
        };
        
        // Listen for user list updates if server sends them
        const handleRoomUsers = (roomUsers) => {
            setUsers(roomUsers);
        };

        const handleUserLeft = (userId) => {
            setUsers((prevUsers) => prevUsers.filter(user => user.id !== userId));
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('room-users', handleRoomUsers);
        socket.on('user-left', handleUserLeft);

        return () => {
            isMounted = false;
            // Clean up listeners but don't disconnect socket
            socket.off('user-joined', handleUserJoined);
            socket.off('room-users', handleRoomUsers);
            socket.off('user-left', handleUserLeft);
            
            // Only disconnect when leaving the room
            if (socket.connected) {
                socket.disconnect();
            }
        }
    }, [roomId, username, navigate]);

    const handleClearBoard = () => {
        // Emit clear event for all pages
        pages.forEach(pageId => {
            socket.emit('clear-board', { roomId, pageId });
        });
        // Locally trigger clear for all Whiteboards
        setClearVersion(v => v + 1);
    };

    const handleAddPage = () => {
        const newPageId = pages.length > 0 ? Math.max(...pages) + 1 : 0;
        setPages([...pages, newPageId]);
        toast.success('New page added!');
    };

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId).then(() => {
            setCopied(true);
            toast.success('Room ID copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            toast.error('Failed to copy Room ID');
        });
    };

    return (
        <div className="room-container">
            <div className="sidebar">
                <div className="room-info">
                    <h3>Room ID</h3>
                    <div className="room-id-box" onClick={handleCopyRoomId} title="Click to copy">
                        <span style={{ flex: 1, wordBreak: 'break-all' }}>{roomId}</span>
                        {copied ? <Check size={18} className="copy-icon" /> : <Copy size={18} className="copy-icon" />}
                    </div>
                    <p>User: <strong>{username || 'Anonymous'}</strong></p>
                    <div className="users-list">
                        <h4>Users Online: {users.length + 1}</h4>
                        <ul>
                            <li className="user-item">
                                <div className="user-avatar">{username ? username.charAt(0).toUpperCase() : 'A'}</div>
                                {username || 'You'} (You)
                            </li>
                            {users.map((u, index) => (
                                <li key={u.id || index} className="user-item">
                                    <div className="user-avatar">{u.username ? u.username.charAt(0).toUpperCase() : 'U'}</div>
                                    {u.username || 'Anonymous'}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <Toolbar 
                    tool={tool} 
                    setTool={setTool} 
                    color={color} 
                    setColor={setColor} 
                    lineWidth={lineWidth} 
                    setLineWidth={setLineWidth}
                    onClear={handleClearBoard}
                />
                <button className="add-page-btn" onClick={handleAddPage}>
                    <Plus size={18} />
                    Add Page
                </button>
                <button className="leave-btn" onClick={() => navigate('/')}>Leave Room</button>
            </div>
            
            <div className="canvas-wrapper">
                <div className="pages-container">
                    {pages.map((pageId, index) => (
                        <div key={pageId} className="page-wrapper">
                            <div className="page-label">Page {index + 1}</div>
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
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Menu, X, Users, Send } from 'lucide-react';
import { socket } from '../utils/socket'; 
import '../App.css'; 

const Home = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [roomId, setRoomId] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedHistoryRoom, setSelectedHistoryRoom] = useState(null); 
    
    const [recentRooms, setRecentRooms] = useState(() => {
        try { return JSON.parse(localStorage.getItem('roomHistory') || '[]'); } 
        catch { return []; }
    });

    // --- GLOBAL SOCKET FOR INVITES ---
    useEffect(() => {
        if (user) {
            if (!socket.connected) socket.connect();
            socket.emit('register-global', user.username);

            const handleInvite = ({ hostUsername, roomId: inviteRoomId }) => {
                toast.info(
                    <div>
                        <p><strong>{hostUsername}</strong> invited you to a session!</p>
                        <button 
                            onClick={() => navigate(`/room/${inviteRoomId}`, { state: { isHost: false, username: user.username } })}
                            style={{background: '#F59E0B', border: 'none', padding: '5px 10px', borderRadius: 5, cursor: 'pointer', marginTop: 5, width: '100%'}}
                        >
                            Accept & Join
                        </button>
                    </div>, 
                    { autoClose: false, closeOnClick: false }
                );
            };

            socket.on('receive-invite', handleInvite);
            return () => socket.off('receive-invite', handleInvite);
        }
    }, [user, navigate]);

    const addToHistory = (id) => {
        const history = JSON.parse(localStorage.getItem('roomHistory') || '[]');
        const existingRoom = history.find(r => r.id === id);
        const newHistory = [
            { id, date: new Date().toLocaleDateString(), participants: existingRoom?.participants || [] }, 
            ...history.filter(r => r.id !== id)
        ].slice(0, 10);
        localStorage.setItem('roomHistory', JSON.stringify(newHistory));
        setRecentRooms(newHistory);
    };

    const createRoom = () => {
        if (!user) return navigate('/login');
        const newRoomId = uuidv4();
        addToHistory(newRoomId);
        navigate(`/room/${newRoomId}`, { state: { isHost: true, username: user.username } });
    };

    const joinRoom = (idToJoin) => {
        const targetId = idToJoin || roomId;
        if (!user) return navigate('/login');
        if(!targetId) return toast.warning("Enter Room ID");
        addToHistory(targetId);
        navigate(`/room/${targetId}`, { state: { isHost: false, username: user.username } });
    };

    const sendInvite = (targetUsername) => {
        const newRoomId = uuidv4(); 
        socket.emit('send-direct-invite', {
            targetUsername,
            hostUsername: user.username,
            roomId: newRoomId,
            type: 'room'
        });
        toast.success(`Invite sent to ${targetUsername}`);
        addToHistory(newRoomId);
        navigate(`/room/${newRoomId}`, { state: { isHost: true, username: user.username } });
    };

    if (!user) {
        return (
             <div className="full-screen">
                <div className="container">
                    <nav className="landing-nav">
                        <div className="logo">Collab<span>Board</span>.</div>
                        <div>
                            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ marginRight: '15px' }}>Sign In</button>
                            <button onClick={() => navigate('/register')} className="btn-primary">Get Started</button>
                        </div>
                    </nav>
                    <main className="hero-section">
                        <h1 className="hero-title">Real-time collaboration<br/><span>at the speed of thought.</span></h1>
                        <button onClick={() => navigate('/register')} className="btn-primary" style={{ fontSize: '1.2rem' }}>Start Collaborating Free</button>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-layout">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="toggle-btn" style={{ left: isSidebarOpen ? '260px' : '20px' }}>
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <aside className={`sidebar-history ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
                <div className="logo" style={{ fontSize: '1.5rem', marginBottom: '30px' }}>Collab<span>Board</span></div>
                <h3 style={{ color: '#94A3B8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Recent Boards</h3>
                
                <div className="history-list">
                    {recentRooms.map((room) => (
                        <div key={room.id} className="history-item" style={{display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, marginBottom: 8}}>
                            <div onClick={() => setSelectedHistoryRoom(selectedHistoryRoom === room.id ? null : room.id)} style={{cursor: 'pointer'}}>
                                <h4 style={{margin: 0}}>Room {room.id.slice(0, 8)}...</h4>
                                <p style={{fontSize:'0.7rem', color:'#64748b', margin: '2px 0 0 0'}}>{room.date}</p>
                            </div>
                            
                            {selectedHistoryRoom === room.id && (
                                <div style={{marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                                    <button onClick={() => joinRoom(room.id)} className="btn-secondary" style={{width: '100%', marginBottom: 10, padding: '5px', fontSize: '0.8rem'}}>Rejoin</button>
                                    <h5 style={{margin: '0 0 5px 0', color: '#94A3B8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 5}}><Users size={12}/> Past Users</h5>
                                    {room.participants && room.participants.length > 0 ? (
                                        room.participants.map(p => (
                                            <div key={p} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: 4}}>
                                                <span>{p}</span>
                                                <button onClick={() => sendInvite(p)} className="icon-btn" style={{padding: 2}} title={`Invite ${p}`}><Send size={10} color="#F59E0B"/></button>
                                            </div>
                                        ))
                                    ) : <span style={{fontSize: '0.7rem', color: '#475569'}}>No records.</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger" style={{ marginTop: 'auto', width: '100%' }}>Sign Out</button>
            </aside>

            <main className="dashboard-main">
                <h2 style={{ fontSize:'2rem' }}>Welcome back, <span style={{ color: '#F59E0B' }}>{user.username}</span></h2>
                <div className="action-card-grid">
                    <div className="glass-panel action-card">
                        <h3>New Whiteboard</h3>
                        <button onClick={createRoom} className="btn-primary" style={{ width: '100%', marginTop:20 }}>Create Room</button>
                    </div>
                    <div className="glass-panel action-card">
                        <h3>Join Session</h3>
                        <input type="text" placeholder="Room ID..." value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-join" style={{width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid #334155', color: 'white', padding: 10, borderRadius: 8, marginBottom: 15}}/>
                        <button onClick={() => joinRoom()} className="btn-secondary" style={{ width: '100%' }}>Join Room</button>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default Home;
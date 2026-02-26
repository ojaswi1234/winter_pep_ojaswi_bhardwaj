import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Menu, X, Users, Send, Plus} from 'lucide-react'; 
import {socket} from '../utils/socket'; 
import '../App.css'; 

const Home = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [roomId, setRoomId] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedHistoryRoom, setSelectedHistoryRoom] = useState(null); 
    
    const [recentRooms, setRecentRooms] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('roomHistory') || '[]');
        } catch { return []; }
    });

    // --- GLOBAL SOCKET LOGIC FOR INVITES ---
    useEffect(() => {
        if (user) {
            if (!socket.connected) socket.connect();
            
            // Register for direct alerts globally
            socket.emit('register-global', user.username);

            // Listen for incoming invites
            const handleInvite = ({ hostUsername, roomId: inviteRoomId, type }) => {
                toast.info(
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>
                            <strong>{hostUsername}</strong> invited you to a {type} session!
                        </p>
                        <button 
                            onClick={() => {
                                addToHistory(inviteRoomId);
                                navigate(`/room/${inviteRoomId}`, { state: { isHost: false, username: user.username } });
                            }}
                            className="btn-primary"
                            style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
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

    // --- HISTORY MANAGEMENT ---
    const addToHistory = (id) => {
        const history = JSON.parse(localStorage.getItem('roomHistory') || '[]');
        const existingRoom = history.find(r => r.id === id);
        
        const newHistory = [
            { id, date: new Date().toLocaleDateString(), participants: existingRoom?.participants || [] }, 
            ...history.filter(r => r.id !== id)
        ].slice(0, 10); // Keep last 10 rooms
        
        localStorage.setItem('roomHistory', JSON.stringify(newHistory));
        setRecentRooms(newHistory);
    };

    // --- ROOM ACTIONS ---
    const createRoom = () => {
        if (!user) { toast.error("Please login first"); navigate('/login'); return; }
        const newRoomId = uuidv4();
        addToHistory(newRoomId);
        navigate(`/room/${newRoomId}`, { state: { isHost: true, username: user.username } });
    };

    const joinRoom = (idToJoin) => {
        const targetId = idToJoin || roomId;
        if (!user) { toast.error("Please login first"); navigate('/login'); return; }
        if (!targetId) { toast.warning("Enter Room ID"); return; }
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

    // --- GUEST LANDING PAGE (Unauthenticated) ---
    if (!user) {
        return (
             <div className="full-screen">
                <div className="container">
                    <nav className="landing-nav">
                        <div className="logo">Collab<span>Board</span>.</div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => navigate('/login')} className="btn-secondary">Sign In</button>
                            <button onClick={() => navigate('/register')} className="btn-primary">Get Started</button>
                        </div>
                    </nav>
                    <main className="hero-section">
                        <span className="hero-badge">Beta Access Live</span>
                        <h1 className="hero-title">
                            Real-time collaboration<br/>
                            <span>at the speed of thought.</span>
                        </h1>
                        <p className="hero-subtitle">
                            The professional whiteboard for engineering teams. Design, sketch, and brainstorm together.
                        </p>
                        <button 
                            onClick={() => navigate('/register')} 
                            className="btn-primary" 
                            style={{ padding: '16px 40px', fontSize: '1.2rem' }}
                        >
                            Start Collaborating Free
                        </button>
                    </main>
                </div>
            </div>
        );
    }

    // --- MAIN DASHBOARD (Authenticated) ---
    return (
        <div className="dashboard-layout">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="toggle-btn" style={{ left: isSidebarOpen ? '260px' : '20px', top: '20px' }}>
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <aside className={`sidebar-history ${!isSidebarOpen ? 'sidebar-closed' : ''}`} style={{width: 280, background: 'var(--bg-panel)', padding: 24, display:'flex', flexDirection:'column', borderRight: '1px solid var(--glass-border)'}}>
                <div style={{fontSize:'1.5rem', fontWeight:800, marginBottom:40}}>Collab<span>Board</span></div>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 }}>Recent Boards</h3>
                
                <div style={{flex:1, overflowY:'auto', paddingRight: 5}}>
                    {recentRooms.map((room) => (
                        <div key={room.id} className="history-item" style={{display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: 12, borderRadius: 8, marginBottom: 10}}>
                            <div 
                                onClick={() => setSelectedHistoryRoom(selectedHistoryRoom === room.id ? null : room.id)} 
                                style={{cursor: 'pointer'}}
                            >
                                <h4 style={{margin: 0, fontSize: '0.95rem', color: 'var(--text-main)'}}>Room {room.id.slice(0, 8)}...</h4>
                                <p style={{fontSize:'0.75rem', color:'var(--text-muted)', margin: '5px 0 0 0'}}>{room.date}</p>
                            </div>
                            
                            {selectedHistoryRoom === room.id && (
                                <div style={{marginTop: 15, paddingTop: 15, borderTop: '1px solid var(--glass-border)'}}>
                                    <button onClick={() => joinRoom(room.id)} className="btn-secondary" style={{width: '100%', marginBottom: 15, padding: '8px', fontSize: '0.85rem', justifyContent: 'center'}}>Rejoin Room</button>
                                    
                                    <h5 style={{margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5}}>
                                        <Users size={14}/> Past Participants
                                    </h5>
                                    {room.participants && room.participants.length > 0 ? (
                                        room.participants.map(p => (
                                            <div key={p} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: 8, background: 'var(--bg-dark)', padding: '6px 10px', borderRadius: 6}}>
                                                <span style={{color: 'var(--text-main)'}}>{p}</span>
                                                <button onClick={() => sendInvite(p)} className="icon-btn" style={{padding: 6, background: 'transparent', border: 'none'}} title={`Invite ${p} to new room`}>
                                                    <Send size={14} color="var(--primary-yellow)"/>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic'}}>No external users recorded.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger" style={{ marginTop: '20px', width: '100%', padding: '12px' }}>Sign Out</button>
            </aside>

            <main style={{flex:1, padding:60, background:'var(--bg-dark)', overflowY: 'auto'}}>
                <header style={{ marginBottom: '40px', paddingLeft: isSidebarOpen ? '0' : '40px', transition: 'padding 0.3s' }}>
                    <h2 style={{ fontSize:'2.5rem', margin: 0, color: 'var(--text-main)' }}>Welcome back, <span style={{ color: 'var(--primary-yellow)' }}>{user.username}</span></h2>
                </header>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:30}}>
                    <div className="glass-panel" style={{padding:40}}>
                        <div style={{background: 'rgba(245, 158, 11, 0.1)', width: 60, height: 60, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20}}>
                            <Plus size={30} color="var(--primary-yellow)"/>
                        </div>
                        <h3 style={{marginTop:0, fontSize: '1.5rem', color: 'var(--text-main)'}}>New Whiteboard</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '1rem' }}>Start a fresh collaborative canvas.</p>
                        <button onClick={createRoom} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>Launch Board</button>
                    </div>
                    <div className="glass-panel" style={{padding:40}}>
                         <div style={{background: 'rgba(16, 185, 129, 0.1)', width: 60, height: 60, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20}}>
                            <Users size={30} color="var(--accent-green)"/>
                        </div>
                        <h3 style={{marginTop:0, fontSize: '1.5rem', color: 'var(--text-main)'}}>Join Session</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '1rem' }}>Paste an existing Room ID.</p>
                        <input type="text" placeholder="Enter Room ID..." value={roomId} onChange={(e) => setRoomId(e.target.value)} style={{width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '14px', borderRadius: 8, marginBottom: 20, fontSize: '1rem', outline: 'none'}}/>
                        <button onClick={() => joinRoom()} className="btn-secondary" style={{ width: '100%', padding: '14px', fontSize: '1rem', justifyContent: 'center' }}>Join Room</button>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default Home;
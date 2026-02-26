import React, { useState, useContext } from 'react'; // Removed useEffect import
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../App.css'; 

const Home = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [roomId, setRoomId] = useState('');
    
    // FIX: Initialize state directly from localStorage (Lazy Initialization)
    // This prevents the "cascading render" error entirely.
    const [recentRooms, setRecentRooms] = useState(() => {
        try {
            const history = localStorage.getItem('roomHistory');
            return history ? JSON.parse(history) : [];
        } catch (err) {
            console.log("Error parsing room history from localStorage:", err);
            return [

            ];
            
        }
    });

    const addToHistory = (id) => {
        // Create new history based on current state
        const newHistory = [{ id, date: new Date().toLocaleDateString() }, ...recentRooms.filter(r => r.id !== id)].slice(0, 10);
        
        // Update LocalStorage
        localStorage.setItem('roomHistory', JSON.stringify(newHistory));
        
        // Update State immediately (so the UI sidebar updates without refreshing)
        setRecentRooms(newHistory);
    };

    const createRoom = () => {
        if (!user) {
            toast.error("Please login to create a room");
            navigate('/login');
            return;
        }
        const newRoomId = uuidv4();
        addToHistory(newRoomId);
        navigate(`/room/${newRoomId}`);
    };

    const joinRoom = (idToJoin) => {
        const targetId = idToJoin || roomId;
        if (!user) {
            toast.error("Please login to join a room");
            navigate('/login');
            return;
        }
        if(!targetId) {
            toast.warning("Please enter a Room ID");
            return;
        }
        addToHistory(targetId);
        navigate(`/room/${targetId}`);
    };

    // --- GUEST LANDING PAGE ---
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
                        <span className="hero-badge">Beta Access Now Live</span>
                        <h1 className="hero-title">
                            Real-time collaboration <br />
                            <span>at the speed of thought.</span>
                        </h1>
                        <p className="hero-subtitle">
                            The professional whiteboard for engineering teams. 
                            Sketch architecture, brainstorm ideas, and conduct interviews in real-time.
                        </p>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                                Start Collaborating Free
                            </button>
                            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                                Existing User?
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // --- USER DASHBOARD ---
    return (
        <div className="dashboard-layout">
            {/* Sidebar History */}
            <aside className="sidebar-history">
                <div className="logo" style={{ fontSize: '1.5rem', marginBottom: '30px' }}>Collab<span>Board</span></div>
                
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Menu</h3>
                    <div className="history-item" style={{ background: 'var(--primary-yellow)', color: 'var(--bg-dark)', fontWeight: 'bold' }}>
                        Dashboard
                    </div>
                </div>

                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Boards</h3>
                <div className="history-list">
                    {recentRooms.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No recent rooms</p>}
                    {recentRooms.map((room) => (
                        <div key={room.id} onClick={() => joinRoom(room.id)} className="history-item">
                            <h4>Room {room.id.slice(0, 8)}...</h4>
                            <p>Opened: {room.date}</p>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.username}</span>
                     </div>
                     <button onClick={() => {
                        logout();
                        navigate('/login');
                     }} className="btn-danger" style={{ width: '100%' }}>Sign Out</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '2rem', margin: 0 }}>Welcome back, <span style={{ color: 'var(--primary-yellow)' }}>{user.username}</span></h2>
                    <p style={{ color: 'var(--text-muted)' }}>Ready to collaborate? Create a new space or jump back in.</p>
                </header>

                <div className="action-card-grid">
                    {/* Create Room Card */}
                    <div className="glass-panel action-card">
                        <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                        <h3>New Whiteboard</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 'auto' }}>Start a fresh session. Generate a unique link to share with your team instantly.</p>
                        <button onClick={createRoom} className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                            Create Room
                        </button>
                    </div>

                    {/* Join Room Card */}
                    <div className="glass-panel action-card">
                         <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                        </div>
                        <h3>Join Session</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Enter an existing Room ID to collaborate with others.</p>
                        <input
                            type="text"
                            placeholder="Enter Room ID..."
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="input-join"
                        />
                        <button onClick={() => joinRoom()} className="btn-secondary" style={{ width: '100%' }}>Join Room</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
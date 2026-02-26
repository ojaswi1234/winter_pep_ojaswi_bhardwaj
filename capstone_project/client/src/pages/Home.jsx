import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Menu, X } from 'lucide-react'; // Import icons
import '../App.css'; 

const Home = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [roomId, setRoomId] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Toggle State
    
    const [recentRooms, setRecentRooms] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('roomHistory') || '[]');
        } catch { return []; }
    });

    const addToHistory = (id) => {
        const newHistory = [{ id, date: new Date().toLocaleDateString() }, ...recentRooms.filter(r => r.id !== id)].slice(0, 10);
        localStorage.setItem('roomHistory', JSON.stringify(newHistory));
        setRecentRooms(newHistory);
    };

    const createRoom = () => {
        if (!user) { toast.error("Please login first"); navigate('/login'); return; }
        const newRoomId = uuidv4();
        addToHistory(newRoomId);
        navigate(`/room/${newRoomId}`, { state: { isHost: true, username: user.username } });
    };

    const joinRoom = (idToJoin) => {
        const targetId = idToJoin || roomId;
        if (!user) { toast.error("Please login first"); navigate('/login'); return; }
        if(!targetId) { toast.warning("Enter Room ID"); return; }
        addToHistory(targetId);
        navigate(`/room/${targetId}`, { state: { isHost: false, username: user.username } });
    };

    if (!user) {
        // Guest Landing (Unchanged)
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
                        <span style={{background:'rgba(16, 185, 129, 0.1)', color:'#10B981', padding:'5px 15px', borderRadius:20, fontSize:'0.9rem'}}>Beta Access Live</span>
                        <h1 className="hero-title">Real-time collaboration<br/><span>at the speed of thought.</span></h1>
                        <p style={{color:'#94A3B8', maxWidth:600, margin:'0 auto 40px'}}>The professional whiteboard for engineering teams.</p>
                        <button onClick={() => navigate('/register')} className="btn-primary" style={{ fontSize: '1.2rem' }}>Start Collaborating Free</button>
                    </main>
                </div>
            </div>
        )
    }

    // Authenticated Dashboard
    return (
        <div className="dashboard-layout">
            {/* Toggle Button */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="toggle-btn"
                style={{ left: isSidebarOpen ? '260px' : '20px' }} // Moves with sidebar
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Retractable Sidebar */}
            <aside className={`sidebar-history ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
                <div className="logo" style={{ fontSize: '1.5rem', marginBottom: '30px' }}>Collab<span>Board</span></div>
                <h3 style={{ color: '#94A3B8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Recent Boards</h3>
                <div className="history-list">
                    {recentRooms.map((room) => (
                        <div key={room.id} onClick={() => joinRoom(room.id)} className="history-item">
                            <h4>Room {room.id.slice(0, 8)}...</h4>
                            <p style={{fontSize:'0.8rem', color:'#64748b'}}>{room.date}</p>
                        </div>
                    ))}
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger" style={{ marginTop: 'auto', width: '100%' }}>Sign Out</button>
            </aside>

            <main className="dashboard-main">
                <header style={{ marginBottom: '40px', paddingLeft: isSidebarOpen ? '0' : '40px' }}>
                    <h2 style={{ fontSize:'2rem' }}>Welcome, <span style={{ color: '#F59E0B' }}>{user.username}</span></h2>
                </header>
                <div className="action-card-grid">
                    <div className="glass-panel action-card">
                        <h3 style={{marginTop:0}}>New Whiteboard</h3>
                        <p style={{ color: '#94A3B8', marginBottom: 'auto' }}>Start a fresh session.</p>
                        <button onClick={createRoom} className="btn-primary" style={{ width: '100%', marginTop:20 }}>Create Room</button>
                    </div>
                    <div className="glass-panel action-card">
                        <h3 style={{marginTop:0}}>Join Session</h3>
                        <p style={{ color: '#94A3B8', marginBottom: '20px' }}>Enter Room ID.</p>
                        <input type="text" placeholder="Room ID..." value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-join"/>
                        <button onClick={() => joinRoom()} className="btn-secondary" style={{ width: '100%' }}>Join Room</button>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default Home;
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../App.css'; 

const Home = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [roomId, setRoomId] = useState('');

    const createRoom = () => {
        if (!user) {
            toast.error("Please login to create a room");
            navigate('/login');
            return;
        }
        const newRoomId = uuidv4();
        navigate(`/room/${newRoomId}`);
    };

    const joinRoom = () => {
        if (!user) {
            toast.error("Please login to join a room");
            navigate('/login');
            return;
        }
        if(!roomId) {
            toast.warning("Please enter a Room ID");
            return;
        }
        navigate(`/room/${roomId}`);
    };

    if (!user) {
        return (
            <div className="home-container">
                <div className="form-wrapper">
                    <div className="home-header">
                        <h1>CollabBoard</h1>
                        <p className="subtitle">Real-time collaboration made simple.</p>
                    </div>
                    <div className="action-group">
                         <button onClick={() => navigate('/login')} className="btn-primary full-width">Login</button>
                         <button onClick={() => navigate('/register')} className="btn-secondary full-width" style={{marginTop: '10px'}}>Register</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="form-wrapper">
                <div className="home-header">
                    <h1>CollabBoard</h1>
                    <p className="subtitle">Welcome, {user.username}!</p>
                </div>
                
                <div className="action-group">
                    <button onClick={createRoom} className="btn-primary full-width">
                        Create New Room
                    </button>
                </div>

                <div className="separator">
                    <span>OR</span>
                </div>

                <div className="action-group">
                    <input
                        type="text"
                        placeholder="Enter Room ID to Join"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="input-field"
                    />
                    <button onClick={joinRoom} className="btn-secondary full-width">Join Room</button>
                </div>
            </div>
        </div>
    );
};

export default Home;

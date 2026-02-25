import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../App.css'; 

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await login(email, password);
            toast.success("Logged in successfully");
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.msg || "Login Failed");
        }
    };

    const handleGoogleLogin = () => {
        const server = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        window.open(`${server.replace(/\/+$/,'')}/api/auth/google`, "_self");
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div style={{ marginBottom: '30px' }}>
                    <Link to="/" className="logo" style={{ fontSize: '1.5rem', textDecoration:'none' }}>Collab<span>Board</span>.</Link>
                </div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Welcome Back</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Sign in to access your dashboard</p>
                
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={email} 
                            onChange={onChange} 
                            required 
                            placeholder="name@company.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={password} 
                            onChange={onChange} 
                            required 
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Sign In</button>
                </form>

                <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ height: '1px', background: 'var(--glass-border)', flex: 1 }}></div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</span>
                    <div style={{ height: '1px', background: 'var(--glass-border)', flex: 1 }}></div>
                </div>

                <button 
                    onClick={handleGoogleLogin}
                    className="btn-secondary"
                    style={{ width: '100%', borderColor: '#DB4437', color: '#fff', background: '#DB4437' }}
                >
                    Sign in with Google
                </button>

                <div style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ fontWeight: 'bold' }}>Create Account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
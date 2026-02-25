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

    // standard login only - no oauth

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Welcome Back</h2>
                <p>Sign in to continue to your whiteboard</p>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={email} 
                            onChange={onChange} 
                            required 
                            placeholder="user@example.com"
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
                    <button type="submit" className="btn-primary full-width">Sign In</button>
                </form>


                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../App.css';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const { username, email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await register(username, email, password);
             toast.success("Registered successfully");
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.msg || "Registration Failed");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Account</h2>
                <p>Join to start collaborating</p>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            name="username" 
                            value={username} 
                            onChange={onChange} 
                            required 
                            placeholder="johndoe"
                        />
                    </div>
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
                    <button type="submit" className="btn-primary full-width">Sign Up</button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
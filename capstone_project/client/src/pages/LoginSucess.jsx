import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { dispatch } = useContext(AuthContext); 

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (token) {
            // store token and reload so AuthContext picks it up
            localStorage.setItem('token', token);
            window.location.href = '/';
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="auth-container">
            <h2>Logging you in...</h2>
        </div>
    );
};

export default LoginSuccess;

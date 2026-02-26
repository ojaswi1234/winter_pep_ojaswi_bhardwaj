import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoginSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            window.location.href = '/'; 
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="full-screen" style={{alignItems:'center', justifyContent:'center', background:'#0B1120', color:'white'}}>
            <h2>Verifying Login...</h2>
        </div>
    );
};
export default LoginSuccess;
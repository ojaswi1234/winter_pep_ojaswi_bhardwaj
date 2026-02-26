import React, { useState, useEffect, useRef } from 'react';
import {socket} from '../utils/socket';
import { Send, MessageSquare, X } from 'lucide-react';

const Chat = ({ roomId, username }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const handleMessage = (data) => {
            setMessages((prev) => [...prev, data]);
            if (!isOpen) setUnread(prev => prev + 1);
            setTimeout(()=>messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        };
        socket.on('receive-message', handleMessage);
        return () => socket.off('receive-message', handleMessage);
    }, [isOpen]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const msgData = { roomId, username, message: message.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            socket.emit('send-message', msgData);
            setMessages((prev) => [...prev, msgData]);
            setMessage('');
            setTimeout(()=>messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
    };

    if (!isOpen) {
        return (
            <div onClick={() => { setIsOpen(true); setUnread(0); }} style={{ position: 'fixed', bottom: 30, right: 30, width: 60, height: 60, background: '#F59E0B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', zIndex: 1000 }}>
                <MessageSquare color="black" size={28} />
                {unread > 0 && <div style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{unread}</div>}
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ position: 'fixed', bottom: 30, right: 30, width: 350, height: 500, display: 'flex', flexDirection: 'column', zIndex: 1000, background:'rgba(15, 23, 42, 0.95)', border:'1px solid #334155' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color:'white' }}>
                <h4 style={{ margin: 0 }}>Team Chat</h4>
                <X size={20} style={{cursor:'pointer'}} onClick={()=>setIsOpen(false)}/>
            </div>
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((msg, i) => {
                    const isMe = msg.username === username;
                    return (
                        <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            {!isMe && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 2 }}>{msg.username}</div>}
                            <div style={{ background: isMe ? '#F59E0B' : '#334155', color: isMe ? 'black' : 'white', padding: '8px 12px', borderRadius: 8, fontSize: '0.9rem' }}>{msg.message}</div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} style={{ padding: 16, borderTop: '1px solid #334155', display: 'flex', gap: 10 }}>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', padding: 10, borderRadius: 8, color: 'white', outline: 'none' }} />
                <button type="submit" style={{ background: '#F59E0B', border: 'none', padding: '0 12px', borderRadius: 8, cursor: 'pointer' }}><Send size={18} /></button>
            </form>
        </div>
    );
};
export default Chat;
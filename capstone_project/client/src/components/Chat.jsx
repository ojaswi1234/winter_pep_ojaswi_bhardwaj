import React, { useState, useEffect, useRef } from 'react';
import {socket} from '../utils/socket';
import { Send, MessageSquare, X, File, Download } from 'lucide-react';

const Chat = ({ roomId, username }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Message Listener
        const handleMessage = (data) => {
            setMessages((prev) => [...prev, data]);
            if (!isOpen) setUnread(prev => prev + 1);
            setTimeout(()=>messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        };

        // File Listener
        const handleFile = (data) => {
            const fileMsg = {
                ...data,
                type: 'file' // Distinguish file messages
            };
            setMessages((prev) => [...prev, fileMsg]);
            if (!isOpen) setUnread(prev => prev + 1);
            setTimeout(()=>messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        };

        socket.on('receive-message', handleMessage);
        socket.on('receive-file', handleFile);

        return () => {
            socket.off('receive-message', handleMessage);
            socket.off('receive-file', handleFile);
        };
    }, [isOpen]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const msgData = { 
                roomId, 
                username, 
                message: message.trim(), 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'text'
            };
            socket.emit('send-message', msgData);
            setMessage('');
        }
    };

    if (!isOpen) {
        return (
            <div onClick={() => { setIsOpen(true); setUnread(0); }} style={{ position: 'fixed', bottom: 30, right: 30, width: 60, height: 60, background: 'var(--primary-yellow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 1000 }}>
                <MessageSquare color="black" size={28} />
                {unread > 0 && <div style={{ position: 'absolute', top: 0, right: 0, background: '#EF4444', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{unread}</div>}
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ position: 'fixed', bottom: 30, right: 30, width: 350, height: 500, display: 'flex', flexDirection: 'column', zIndex: 1000, background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color:'var(--text-main)' }}>
                <h4 style={{ margin: 0 }}>Team Chat</h4>
                <X size={20} style={{cursor:'pointer'}} onClick={()=>setIsOpen(false)}/>
            </div>
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((msg, i) => {
                    const isMe = msg.username === username;
                    return (
                        <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            {!isMe && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{msg.username}</div>}
                            
                            <div style={{ background: isMe ? 'var(--primary-yellow)' : 'var(--bg-panel)', color: isMe ? 'black' : 'var(--text-main)', padding: '8px 12px', borderRadius: 8, fontSize: '0.9rem', border: isMe ? 'none' : '1px solid var(--glass-border)' }}>
                                {msg.type === 'file' ? (
                                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                                        <File size={16}/>
                                        <div>
                                            <div style={{fontWeight:'bold', fontSize:'0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150}}>{msg.fileName}</div>
                                            <a href={msg.fileData} download={msg.fileName} style={{color: isMe?'black':'var(--primary-yellow)', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:4, textDecoration:'none'}}>
                                                <Download size={12}/> Download
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    msg.message
                                )}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop:2, textAlign: isMe?'right':'left' }}>{msg.time}</div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} style={{ padding: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10 }}>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: 10, borderRadius: 8, color: 'var(--text-main)', outline: 'none' }} />
                <button type="submit" style={{ background: 'var(--primary-yellow)', border: 'none', padding: '0 12px', borderRadius: 8, cursor: 'pointer', color:'var(--bg-dark)' }}><Send size={18} /></button>
            </form>
        </div>
    );
};
export default Chat;
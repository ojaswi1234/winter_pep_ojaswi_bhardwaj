import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../utils/socket';
import { Send, MessageSquare, X, MinusCircle } from 'lucide-react';
import '../App.css'; 

const Chat = ({ roomId, username }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false); // Collapsible state
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const handleMessage = (data) => {
            setMessages((prev) => [...prev, data]);
            if (!isOpen) setUnread(prev => prev + 1);
            setTimeout(scrollToBottom, 100);
        };

        socket.on('receive-message', handleMessage);
        return () => socket.off('receive-message', handleMessage);
    }, [isOpen]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const msgData = {
                roomId,
                username,
                message: message.trim(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            socket.emit('send-message', msgData);
            setMessages((prev) => [...prev, msgData]);
            setMessage('');
            setTimeout(scrollToBottom, 100);
        }
    };

    // If closed, show a floating bubble
    if (!isOpen) {
        return (
            <div 
                onClick={() => { setIsOpen(true); setUnread(0); }}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    background: 'var(--primary-yellow)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                    zIndex: 1000,
                    transition: 'all 0.3s'
                }}
            >
                <MessageSquare color="black" size={28} />
                {unread > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: 'red',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>{unread}</div>
                )}
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '350px',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid var(--glass-border)'
        }}>
            {/* Header */}
            <div style={{ 
                padding: '16px', 
                background: 'rgba(0,0,0,0.3)', 
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%' }}></span>
                    Team Chat
                </h4>
                <button 
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div style={{ 
                flex: 1, 
                padding: '20px', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(0,0,0,0.2)'
            }}>
                {messages.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '50%' }}>
                        No messages yet. Start the conversation!
                    </p>
                )}
                {messages.map((msg, index) => {
                    const isMe = msg.username === username;
                    return (
                        <div key={index} style={{ 
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%'
                        }}>
                            {!isMe && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{msg.username}</span>}
                            <div style={{
                                background: isMe ? 'var(--primary-yellow)' : 'var(--bg-panel)',
                                color: isMe ? 'black' : 'white',
                                padding: '10px 14px',
                                borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                border: isMe ? 'none' : '1px solid var(--glass-border)',
                                fontSize: '0.95rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {msg.message}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: isMe ? 'right' : 'left', marginTop: '4px', padding: '0 4px' }}>
                                {msg.time}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} style={{ 
                padding: '16px', 
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '10px',
                background: 'rgba(0,0,0,0.3)'
            }}>
                <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        padding: '10px',
                        borderRadius: '8px',
                        color: 'white',
                        outline: 'none'
                    }}
                />
                <button 
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0 12px', borderRadius: '8px' }}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../utils/socket';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

const Chat = ({ roomId, username }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Listen for incoming messages
    const handleMessage = (data) => {
      // Add unique identifier to prevent duplicates
      const messageWithId = {
        ...data,
        id: `${data.timestamp}-${data.user}-${Math.random()}`
      };
      
      setMessages((prev) => {
        // Check if message already exists (basic deduplication)
        const isDuplicate = prev.some(msg => 
          msg.timestamp === data.timestamp && 
          msg.user === data.user && 
          msg.text === data.text
        );
        
        if (isDuplicate) {
          return prev;
        }
        
        return [...prev, messageWithId];
      });
    };

    socket.on('chat-message', handleMessage);

    // Clean up listener
    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    
    const trimmedMessage = newMessage.trim();
    
    if (!trimmedMessage) return;

    if (!username) {
        toast.error("Please set a username first in the room.");
        return;
    }

    // Validate message length
    if (trimmedMessage.length > 1000) {
        toast.error("Message is too long (max 1000 characters)");
        return;
    }

    const messageData = {
      roomId,
      user: username,
      text: trimmedMessage,
      timestamp: new Date().toISOString()
    };

    // Send to server - server will broadcast to ALL including sender
    if (socket.connected) {
      socket.emit('chat-message', messageData);
      setNewMessage('');
    } else {
      toast.error("Not connected to chat server");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} />
            <span>Chat Room</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '20px', fontSize: '0.9rem' }}>
                No messages yet. Start the conversation!
            </div>
        )}
        {messages.map((msg) => {
          const isMyMessage = msg.user === username;
          return (
            <div
              key={msg.id || `${msg.timestamp}-${msg.user}`}
              className={`message ${isMyMessage ? 'my-message' : 'other-message'}`}
            >
              {!isMyMessage && <span className="msg-user">{msg.user}</span>}
              {msg.text}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default Chat;

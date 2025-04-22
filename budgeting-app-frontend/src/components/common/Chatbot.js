import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './Chatbot.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://budgetbuddy-backend-eq1x.onrender.com';

const Chatbot = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Hello! I\'m your BudgetBuddy assistant. How can I help you today?', 
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;
    
    const newUserMessage = {
      sender: 'user',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsTyping(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chatbot/`, {
        message: userMessage,
        user_id: localStorage.getItem('user_id')
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      
      const botMessage = {
        sender: 'bot',
        text: response.data.response,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const botMessage = {
        sender: 'bot',
        text: "I'm having trouble connecting to the server. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      setChatMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className={`chatbot-container ${chatbotOpen ? 'open' : ''}`}>
      <div className="chatbot-header" onClick={() => setChatbotOpen(!chatbotOpen)}>
        <h3>BudgetBuddy Assistant</h3>
        <button 
          className="btn-icon" 
          onClick={(e) => {
            e.stopPropagation();
            setChatbotOpen(false);
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      {chatbotOpen && (
        <div className="chatbot-content">
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <p>{message.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}</p>
                <small>{message.timestamp}</small>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <p>Typing...</p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="chat-input">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Ask me about your budget..."
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !userMessage.trim()}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
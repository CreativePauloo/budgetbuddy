import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://budgetbuddy-backend-eq1x.onrender.com';

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_BASE_URL}/forgot-password/`, { email });
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response ? error.response.data.error : 'An error occurred');
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <h1 className="forgot-password-title">Forgot Password</h1>
                <p className="forgot-password-subtitle">
                    Enter your email address to reset your password.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <button type="submit" className="forgot-password-button">Reset Password</button>
                </form>

                {message && <p className="message">{message}</p>}

                <p className="login-link">
                    Remember your password? <a href="/login">Log in</a>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
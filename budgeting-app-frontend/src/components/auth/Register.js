import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://budgetbuddy-backend-eq1x.onrender.com/api';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const usernameRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        usernameRef.current?.focus();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');

        if (name === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic client-side
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (formData.username.length < 4) {
            setError('Username must be at least 4 characters');
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/register/`, {
                username: formData.username,
                email: formData.email,
                password: formData.password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            setSuccessMessage('Registration successful! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            if (err.response) {
                // Handle Django validation errors
                const serverErrors = err.response.data;
                if (typeof serverErrors === 'object') {
                    // Join all error messages
                    const errorMsg = Object.values(serverErrors).flat().join(' ');
                    setError(errorMsg);
                } else {
                    setError('Registration failed. Please try again.');
                }
            } else {
                setError('Network error. Please check your connection.');
            }
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h1 className="register-title">Welcome to</h1>
                <h1 className="register-title" style={{ color: '#007bff' }}>BudgetBuddy</h1>
                <p className="register-subtitle">Create an account to start managing your finances.</p>

                {successMessage && (
                    <div style={{ 
                        color: '#28a745',
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div style={{ 
                        color: '#dc3545',
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            ref={usernameRef}
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            required
                        />
                        {formData.password && (
                            <div style={{
                                display: 'flex',
                                gap: '4px',
                                marginTop: '4px'
                            }}>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} style={{
                                        height: '4px',
                                        flex: 1,
                                        backgroundColor: passwordStrength >= i ? 
                                            ['#dc3545', '#ffc107', '#17a2b8', '#28a745'][i-1] : 
                                            '#e9ecef'
                                    }} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat your password"
                            required
                        />
                    </div>

                    <button type="submit" className="register-button">Sign Up</button>
                </form>

                <p className="login-link">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
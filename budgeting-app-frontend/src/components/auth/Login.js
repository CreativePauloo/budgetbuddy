import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '', 
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const response = await axios.post('http://localhost:8000/api/login/', formData);
            console.log('Login successful:', response.data);
            localStorage.setItem('access_token', response.data.access); // Store token
            navigate('/dashboard'); // Redirect to dashboard
        } catch (error) {
            console.error('Login failed:', error);
            
            // Set user-friendly error message
            if (error.response) {
                if (error.response.status === 401) {
                    setError('Invalid username or password. Please try again.');
                } else {
                    setError('An error occurred. Please try again later.');
                }
            } else if (error.request) {
                setError('Network error. Please check your internet connection.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Welcome Back to</h1>
                <h1 className="login-title" style={{color: '#007bff'}}>BudgetBuddy</h1>
                <p className="login-subtitle">Sign in to continue managing your finances.</p>

                {/* Error message display */}
                {error && (
                    <div className="error-message" style={{
                        color: '#dc3545',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
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
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="forgot-password">
                    <a href="/forgot-password">Forgot password?</a>
                </p>

                <p className="register-link">
                    Don't have an account? <a href="/register">Sign up</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
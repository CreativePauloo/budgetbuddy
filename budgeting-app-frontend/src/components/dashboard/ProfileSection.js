import React, { useState } from 'react';
import axios from 'axios';
import './ProfileSection.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://budgetbuddy-backend.onrender.com';

const ProfileSection = ({ user, setUser }) => {
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/user/`, 
        profileForm, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data);
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="profile-content">
      <h2>Profile Information</h2>
      
      {editMode ? (
        <form onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value={profileForm.first_name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={profileForm.last_name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profileForm.email}
              onChange={handleInputChange}
              disabled
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setEditMode(false);
                setProfileForm({
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  email: user.email
                });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>First Name:</strong> {user.first_name || 'Not set'}</p>
          <p><strong>Last Name:</strong> {user.last_name || 'Not set'}</p>
          <p><strong>Email:</strong> {user.email}</p>
          
          <button 
            className="btn btn-primary" 
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck,faBell } from '@fortawesome/free-solid-svg-icons';
import './NotificationsList.css';

const NotificationsList = ({ notifications, markNotificationAsRead }) => {
  return (
    <div className="notifications-content">
      <h2>
        <FontAwesomeIcon icon={faBell} /> Notifications
      </h2>
      
      {notifications.length === 0 ? (
        <p>No notifications to display</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map(notification => (
            <li 
              key={notification.id} 
              className={`notification ${notification.notification_type} ${notification.is_read ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </div>
              
              {!notification.is_read && (
                <button 
                  className="btn-icon" 
                  onClick={() => markNotificationAsRead(notification.id)}
                  title="Mark as read"
                >
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsList;
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faMoneyBillWave, faChartLine, 
  faUser, faBell, faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = ({ activeMenu, setActiveMenu, notifications, handleLogout }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>BudgetBuddy</h2>
      </div>
      
      <ul className="sidebar-menu">
        {[
          { id: 'dashboard', icon: faHome, label: 'Dashboard' },
          { id: 'expenses', icon: faMoneyBillWave, label: 'Expenses' },
          { id: 'overview', icon: faChartLine, label: 'Overview' },
          { id: 'profile', icon: faUser, label: 'Profile' },
          { id: 'notifications', icon: faBell, label: 'Notifications' }
        ].map(item => (
          <li 
            key={item.id}
            className={activeMenu === item.id ? 'active' : ''}
            onClick={() => setActiveMenu(item.id)}
          >
            <FontAwesomeIcon icon={item.icon} />
            <span>{item.label}</span>
            {item.id === 'notifications' && notifications.filter(n => !n.is_read).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </li>
        ))}
        
        <li onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Logout</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
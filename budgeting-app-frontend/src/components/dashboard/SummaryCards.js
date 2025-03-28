import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, faMoneyBillWave, 
  faExchangeAlt, faFileAlt 
} from '@fortawesome/free-solid-svg-icons';
import { formatMoney } from '../common/helpers';
import './SummaryCards.css';

const SummaryCards = ({ income, expenses, savings, savings_goal, progressPercentage }) => {
  return (
    <div className="summary-cards">
      <div className="card income-card">
        <div className="card-icon">
          <FontAwesomeIcon icon={faWallet} />
        </div>
        <div className="card-content">
          <h3>Income</h3>
          <p>${formatMoney(income)}</p>
        </div>
      </div>
      
      <div className="card expense-card">
        <div className="card-icon">
          <FontAwesomeIcon icon={faMoneyBillWave} />
        </div>
        <div className="card-content">
          <h3>Expenses</h3>
          <p>${formatMoney(expenses)}</p>
        </div>
      </div>
      
      <div className="card savings-card">
        <div className="card-icon">
          <FontAwesomeIcon icon={faExchangeAlt} />
        </div>
        <div className="card-content">
          <h3>Savings</h3>
          <p>${formatMoney(savings)}</p>
        </div>
      </div>
      
      <div className="card goal-card">
        <div className="card-icon">
          <FontAwesomeIcon icon={faFileAlt} />
        </div>
        <div className="card-content">
          <h3>Savings Goal</h3>
          <p>${formatMoney(savings_goal.current_amount)} / ${formatMoney(savings_goal.target_amount)}</p>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
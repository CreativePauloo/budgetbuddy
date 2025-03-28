import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { formatMoney, getCategoryIcon } from '../common/helpers';
import BudgetForm from './BudgetForm';
import './BudgetSummary.css';

const BudgetSummary = ({ budgets, expenseCategories }) => {
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const handleOpen = () => {
    console.log("Opening budget modal...");
    setShowBudgetForm(true);
  };

  const handleClose = () => {
    console.log("Closing budget modal...");
    setShowBudgetForm(false);
  };

  return (
    <div className="budget-summary">
      <div className="budget-header">
        <h3>Budget Summary</h3>
        <button className="btn btn-primary" onClick={handleOpen}>
          <FontAwesomeIcon icon={faPlus} /> Add Budget
        </button>
      </div>
      
      <div className="budgets-grid">
        {budgets.length > 0 ? (
          budgets.map(budget => {
            const spent = expenseCategories.find(c => c.name === budget.category)?.amount || 0;
            const percentage = (spent / budget.limit) * 100;
            const isOverBudget = percentage > 100;

            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-header">
                  <div className="budget-icon">
                    <FontAwesomeIcon icon={getCategoryIcon(budget.category)} />
                  </div>
                  <h4>{budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}</h4>
                  <small>({budget.period})</small>
                </div>

                <div className="budget-progress">
                  <div className="progress-info">
                    <span>${formatMoney(spent)} of ${formatMoney(budget.limit)}</span>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress ${isOverBudget ? 'over' : ''}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="budget-actions">
                  <button className="btn btn-small">Edit</button>
                  <button className="btn btn-small btn-secondary">History</button>
                </div>
              </div>
            );
          })
        ) : (
          <p>No budgets set up yet. Create your first budget to track spending.</p>
        )}
      </div>

      {/* Place the modal outside of the grid to avoid styling conflicts */}
      {showBudgetForm && (
        <BudgetForm 
          onClose={handleClose}
          onBudgetAdded={() => window.location.reload()}
          expenseCategories={expenseCategories}
        />
      )}
    </div>
  );
};

export default BudgetSummary;
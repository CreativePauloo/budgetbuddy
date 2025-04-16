import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './BudgetForm.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://budgetbuddy-backend.onrender.com';

const BudgetForm = ({ 
  isOpen, 
  onClose, 
  onBudgetAdded, 
  expenseCategories = [] 
}) => {
  const [newBudget, setNewBudget] = useState({
    category: expenseCategories.length > 0 ? expenseCategories[0].name : '',
    limit: '',
    period: 'monthly'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/budgets/`,
        {
          category: newBudget.category,
          limit: parseFloat(newBudget.limit),
          period: newBudget.period
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (onBudgetAdded) onBudgetAdded(response.data);
      setNewBudget({
        category: expenseCategories.length > 0 ? expenseCategories[0].name : '',
        limit: '',
        period: 'monthly'
      });
      onClose();
    } catch (error) {
      console.error('Budget creation error:', error.response?.data);
      setError(error.response?.data?.detail || 'Failed to create budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="budget-modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="budget-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Budget</h2>
          <button 
            className="close-btn" 
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {error && <div className="form-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="budget-category">Category</label>
            <select
              id="budget-category"
              value={newBudget.category}
              onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
              required
              disabled={isSubmitting}
            >
              {expenseCategories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="budget-limit">Amount</label>
            <input
              type="number"
              id="budget-limit"
              value={newBudget.limit}
              onChange={(e) => setNewBudget({...newBudget, limit: e.target.value})}
              step="0.01"
              min="0.01"
              placeholder="Budget limit"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="budget-period">Period</label>
            <select
              id="budget-period"
              value={newBudget.period}
              onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
              required
              disabled={isSubmitting}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
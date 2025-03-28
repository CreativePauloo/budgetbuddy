import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './BudgetForm.css';

const BudgetForm = ({ onClose, onBudgetAdded, expenseCategories }) => {
  const [newBudget, setNewBudget] = useState({
    category: 'food',
    limit: '',
    period: 'monthly'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await axios.post(
        'http://localhost:8000/api/budgets/', 
        { 
          ...newBudget, 
          limit: parseFloat(newBudget.limit) 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onBudgetAdded(response.data);
      setNewBudget({ category: 'food', limit: '', period: 'monthly' }); // Reset form state
      onClose();
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget. Please try again.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create New Budget</h3>
          <button 
            className="btn-icon" 
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="budget-category">Category</label>
            <select
              id="budget-category" // Added id
              name="category" // Added name
              value={newBudget.category}
              onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
              autoComplete="off" // Added valid autocomplete value
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
              id="budget-limit" // Added id
              name="limit" // Added name
              step="0.01"
              min="0.01"
              value={newBudget.limit}
              onChange={(e) => setNewBudget({...newBudget, limit: e.target.value})}
              placeholder="Budget limit"
              required
              autoComplete="off" // Added valid autocomplete value
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="budget-period">Period</label>
            <select
              id="budget-period" // Added id
              name="period" // Added name
              value={newBudget.period}
              onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
              autoComplete="off" // Added valid autocomplete value
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Create Budget
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
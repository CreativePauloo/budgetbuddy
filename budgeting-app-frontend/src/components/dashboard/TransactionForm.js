import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faMinus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './TransactionForm.css';

const TransactionForm = ({ onClose, onSubmit, initialData }) => {
  const [transaction, setTransaction] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0] // Default to today's date
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = [
    'food', 'transportation', 'housing', 
    'entertainment', 'utilities', 'health', 
    'education', 'other'
  ];

  const incomeCategories = [
    'salary', 'bonus', 'freelance',
    'investment', 'gift', 'other'
  ];

  useEffect(() => {
    if (initialData) {
      setTransaction({
        type: initialData.type || 'expense',
        amount: initialData.amount || '',
        description: initialData.description || '',
        category: initialData.category || 'food',
        date: initialData.date 
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransaction(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!transaction.amount || isNaN(transaction.amount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (Number(transaction.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!transaction.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!transaction.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...transaction,
        amount: parseFloat(transaction.amount),
        date: new Date(transaction.date).toISOString()
      });
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to save transaction. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2 id="transaction-form-title">
            {initialData ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button 
            className="btn-icon" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} aria-labelledby="transaction-form-title">
          <div className="form-group">
            <fieldset>
              <legend className="visually-hidden">Transaction Type</legend>
              <div className="radio-group">
                <label htmlFor="type-income" className="radio-label">
                  <input
                    type="radio"
                    id="type-income" // Added id
                    name="type"
                    value="income"
                    checked={transaction.type === 'income'}
                    onChange={handleChange}
                    className="radio-input"
                  />
                  <span className="radio-custom"></span>
                  Income
                </label>
                <label htmlFor="type-expense" className="radio-label">
                  <input
                    type="radio"
                    id="type-expense" // Added id
                    name="type"
                    value="expense"
                    checked={transaction.type === 'expense'}
                    onChange={handleChange}
                    className="radio-input"
                  />
                  <span className="radio-custom"></span>
                  Expense
                </label>
              </div>
            </fieldset>
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <input
              type="number"
              id="amount" // Added id
              name="amount" // Added name
              step="0.01"
              min="0.01"
              value={transaction.amount}
              onChange={handleChange}
              placeholder="0.00"
              autoComplete="off" // Added valid autocomplete value
              aria-invalid={!!errors.amount}
              aria-describedby="amount-error"
              required
            />
            {errors.amount && (
              <span id="amount-error" className="error-message">
                {errors.amount}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              value={transaction.description}
              onChange={handleChange}
              placeholder="What was this for?"
              autoComplete="off" 
              aria-invalid={!!errors.description}
              aria-describedby="description-error"
              required
            />
            {errors.description && (
              <span id="description-error" className="error-message">
                {errors.description}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="category">
              {transaction.type === 'income' ? 'Income Category' : 'Expense Category'}
            </label>
            <select
              id="category"
              name="category" 
              value={transaction.category}
              onChange={handleChange}
              aria-invalid={!!errors.category}
              aria-describedby="category-error"
              required
            >
              {(transaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            {errors.category && (
              <span id="category-error" className="error-message">
                {errors.category}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date" 
              value={transaction.date}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              aria-invalid={!!errors.date}
              aria-describedby="date-error"
              required
            />
            {errors.date && (
              <span id="date-error" className="error-message">
                {errors.date}
              </span>
            )}
          </div>
          
          {errors.submit && (
            <div className="form-error">
              <span className="error-message">{errors.submit}</span>
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Processing...
                </>
              ) : (
                <>
                  {transaction.type === 'income' ? (
                    <FontAwesomeIcon icon={faPlus} />
                  ) : (
                    <FontAwesomeIcon icon={faMinus} />
                  )}
                  {` ${initialData ? 'Update' : 'Add'} ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`}
                </>
              )}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './TransactionForm.css';

const TransactionForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  categories = [],
  incomeCategories = [],
  isSubmitting = false,
  error = ''
}) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: categories.length > 0 ? categories[0] : '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const initialDate = initialData.date 
          ? initialData.date.includes('T') 
            ? initialData.date.split('T')[0] 
            : initialData.date
          : new Date().toISOString().split('T')[0];

        setFormData({
          type: initialData.type || 'expense',
          amount: initialData.amount ? initialData.amount.toString() : '',
          description: initialData.description || '',
          category: initialData.category || (categories.length > 0 ? categories[0] : ''),
          date: initialDate
        });
      } else {
        setFormData({
          type: 'expense',
          amount: '',
          description: '',
          category: categories.length > 0 ? categories[0] : '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, initialData, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        category: value === 'income' 
          ? (incomeCategories.length > 0 ? incomeCategories[0] : '')
          : (categories.length > 0 ? categories[0] : '')
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: formData.date || new Date().toISOString().split('T')[0]
    };
    onSubmit(transactionData);
  };

  const currentCategories = formData.type === 'income' ? incomeCategories : categories;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button 
            className="close-btn" 
            onClick={() => !isSubmitting && onClose()} 
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-content">
          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Transaction Type</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span className="radio-custom"></span>
                  Expense
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span className="radio-custom"></span>
                  Income
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                {currentCategories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => !isSubmitting && onClose()}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : initialData ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
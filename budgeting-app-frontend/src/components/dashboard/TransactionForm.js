import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faMagic, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './TransactionForm.css';

// Memoized Suggestion Button Component
const SuggestionButton = React.memo(({ suggestion, onClick }) => (
  <button
    type="button"
    className={`suggestion ${suggestion.isSelected ? 'selected' : ''}`}
    onClick={onClick}
  >
    {suggestion.name}
    <span className="confidence-badge">
      {Math.round(suggestion.confidence * 100)}%
    </span>
    {suggestion.isSelected && (
      <FontAwesomeIcon icon={faCheckCircle} className="selected-icon" />
    )}
  </button>
));

const TransactionForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isSubmitting = false,
  error = '',
  categories = [],
  incomeCategories = []
}) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: categories.length > 0 ? categories[0] : '',
    date: new Date().toISOString().split('T')[0]
  });

  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const timerRef = useRef(null);
  const formDataRef = useRef(formData);

  // Sync ref with formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Reset form when opening or when initialData changes
  useEffect(() => {
    if (isOpen) {
      const newData = initialData ? {
        type: initialData.type,
        amount: initialData.amount.toString(),
        description: initialData.description,
        category: initialData.category,
        date: initialData.date?.split('T')[0] || new Date().toISOString().split('T')[0]
      } : {
        type: 'expense',
        amount: '',
        description: '',
        category: categories.length > 0 ? categories[0] : '',
        date: new Date().toISOString().split('T')[0]
      };
      
      setFormData(newData);
      setAiSuggestions([]);
    }
  }, [isOpen, initialData, categories]);

  // Stable callback for suggestion selection
  const handleSuggestionSelect = useCallback((category) => {
    setFormData(prev => ({ ...prev, category }));
    setAiSuggestions(prev => 
      prev.map(suggestion => ({
        ...suggestion,
        isSelected: suggestion.name === category
      }))
    );
  }, []);

  // Handle AI suggestions without infinite loops
  useEffect(() => {
    if (!isOpen || isPredicting) return;

    const { description, amount } = formData;
    const { description: prevDesc, amount: prevAmt } = formDataRef.current;

    const shouldFetch = description.length > 3 && 
                       amount && 
                       (description !== prevDesc || amount !== prevAmt);

    if (shouldFetch) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setIsPredicting(true);
        try {
          const response = await axios.post(
            'https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/predict-category/',
            {
              description: formData.description,
              amount: formData.amount,
              date: formData.date
            }
          );
          
          setAiSuggestions(prev => {
            const newSuggestions = [
              { 
                name: response.data.category, 
                confidence: response.data.confidence,
                isSelected: false 
              },
              ...response.data.alternatives.map(alt => ({
                name: alt.category,
                confidence: alt.score,
                isSelected: false
              }))
            ];
            
            // Preserve selection if category is already selected
            return newSuggestions.map(suggestion => ({
              ...suggestion,
              isSelected: suggestion.name === formData.category
            }));
          });

          if (response.data.confidence > 0.7) {
            setFormData(prev => ({
              ...prev,
              category: response.data.category
            }));
          }
        } catch (error) {
          console.error('Prediction failed:', error);
        } finally {
          setIsPredicting(false);
        }
      }, 500);
    }

    return () => clearTimeout(timerRef.current);
  }, [formData.description, formData.amount, formData.date, isOpen, isPredicting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'type') {
      const newCategories = value === 'income' ? incomeCategories : categories;
      setFormData(prev => ({
        ...prev,
        category: newCategories.length > 0 ? newCategories[0] : ''
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
    <div className="transaction-modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="transaction-modal" onClick={e => e.stopPropagation()}>
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
              <div className="description-with-ai">
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
                {isPredicting && (
                  <span className="ai-loading">
                    <FontAwesomeIcon icon={faMagic} spin />
                  </span>
                )}
              </div>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="ai-suggestions">
                <label>AI Suggestions</label>
                <div className="suggestion-buttons">
                  {aiSuggestions.map((suggestion) => (
                    <SuggestionButton
                      key={suggestion.name}
                      suggestion={suggestion}
                      onClick={() => handleSuggestionSelect(suggestion.name)}
                    />
                  ))}
                </div>
              </div>
            )}

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
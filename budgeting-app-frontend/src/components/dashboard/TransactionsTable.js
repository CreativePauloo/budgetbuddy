import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import { formatMoney, getCategoryIcon } from '../common/helpers';
import TransactionForm from './TransactionForm';
import './TransactionsTable.css';

const TransactionsTable = ({ 
  transactions = [], 
  title = 'Transactions', 
  showFilters = false, 
  searchTerm = '', 
  setSearchTerm = () => {}, 
  selectedCategory = 'all', 
  setSelectedCategory = () => {},
  expenseCategories = [],
  onDelete = () => {},
  onEdit = () => {},
  onAdd = () => {}
}) => {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionType, setTransactionType] = useState('all'); // New state for transaction type filter

  const filteredTransactions = showFilters 
    ? transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
        const matchesType = transactionType === 'all' || transaction.type === transactionType;
        return matchesSearch && matchesCategory && matchesType;
      })
    : transactions;

  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDelete = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDelete(transactionId);
    }
  };

  const handleSubmit = (transaction) => {
    if (editingTransaction) {
      onEdit({ ...transaction, id: editingTransaction.id });
    } else {
      onAdd(transaction);
    }
    setShowTransactionForm(false);
    setEditingTransaction(null);
  };

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h3>{title}</h3>
        {showFilters && (
          <div className="transactions-summary">
            <span className="income-summary">
              Income: ${formatMoney(incomeTotal)}
            </span>
            <span className="expense-summary">
              Expenses: ${formatMoney(expenseTotal)}
            </span>
            <button 
              className="btn btn-primary"
              onClick={() => setShowTransactionForm(true)}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Transaction
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="filters">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {expenseCategories.map(category => (
              <option key={category.name} value={category.name}>
                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </option>
            ))}
          </select>

          {/* Add transaction type filter */}
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      )}

      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              {showFilters && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>{transaction.description}</td>
                  <td>
                    <span className="category-tag">
                      <FontAwesomeIcon icon={getCategoryIcon(transaction.category)} />
                      {transaction.category}
                    </span>
                  </td>
                  <td>{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                  <td className={transaction.type === 'income' ? 'income' : 'expense'}>
                    {transaction.type === 'income' ? '+' : '-'}${formatMoney(Number(transaction.amount))}
                  </td>
                  {showFilters && (
                    <td className="actions">
                      <button 
                        className="btn-icon edit"
                        onClick={() => handleEdit(transaction)}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="btn-icon delete"
                        onClick={() => handleDelete(transaction.id)}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={showFilters ? 6 : 5} className="no-transactions">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showTransactionForm && (
        <TransactionForm 
          isOpen={showTransactionForm}
          onClose={() => {
            setShowTransactionForm(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingTransaction}
        />
      )}
    </div>
  );
};

export default TransactionsTable;
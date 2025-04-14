import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFilePdf, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import SummaryCards from './SummaryCards';
import ChartsSection from './ChartsSection';
import TransactionsTable from './TransactionsTable';
import TransactionForm from './TransactionForm';
import BudgetForm from './BudgetForm';
import BudgetSummary from './BudgetSummary';
import ProfileSection from './ProfileSection';
import NotificationsList from './NotificationsList';
import Chatbot from '../common/Chatbot';
import { formatMoney, getCategoryIcon, formatMonthlyData } from '../common/helpers';
import './Dashboard.css';

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expenseTransactions, setExpenseTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    setIsDataLoading(true);
    try {
      const [dashboardRes, userRes, notificationsRes, budgetsRes, monthlyRes] = await Promise.all([
        axios.get('https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/user/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/notifications/', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get('https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/budgets/', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get('https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/transactions/monthly/', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      const processedData = {
        ...dashboardRes.data,
        savings_goal: {
          ...dashboardRes.data.savings_goal,
          current_amount: Number(dashboardRes.data.savings_goal.current_amount),
          target_amount: Number(dashboardRes.data.savings_goal.target_amount)
        }
      };
      
      setDashboardData(processedData);
      setUser(userRes.data);
      setNotifications(notificationsRes.data);
      setBudgets(budgetsRes.data);
      setMonthlyTrends(formatMonthlyData(monthlyRes.data));

      if (dashboardRes.data.recent_transactions) {
        const expenses = dashboardRes.data.recent_transactions.filter(t => t.type === 'expense');
        setExpenseTransactions(expenses);
        
        const categoryTotals = {};
        expenses.forEach(expense => {
          if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
          }
          categoryTotals[expense.category] += Number(expense.amount);
        });
        
        setExpenseCategories(Object.entries(categoryTotals).map(([name, amount]) => ({
          name,
          amount,
          icon: getCategoryIcon(name)
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      localStorage.removeItem('access_token');
      navigate('/login');
    } finally {
      setIsDataLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('access_token');
      navigate('/login');
    }
  };

  const handleAddNewTransaction = useCallback(() => {
    setEditingTransaction(null);
    setShowTransactionForm(true);
  }, []);

  const handleEditTransaction = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  }, []);

  const handleTransactionSubmit = useCallback(async (transactionData) => {
    setIsSubmitting(true);
    setFormError('');
    
    try {
      const token = localStorage.getItem('access_token');
      if (editingTransaction) {
        await axios.put(
          `https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/transactions/${editingTransaction.id}/`,
          transactionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          'https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/transactions/',
          transactionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await refreshData();
      setShowTransactionForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Transaction error:', error);
      setFormError(error.response?.data?.detail || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTransaction]);

  const markNotificationAsRead = useCallback(async (id) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.patch(
        `https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/notifications/${id}/`, 
        { is_read: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const handleAddBudget = useCallback(async (budget) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(
        'https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/budgets/',
        budget,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshData();
      setShowBudgetForm(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget. Please try again.');
    }
  }, []);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(
        `https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/transactions/${transactionId}/`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(`Failed to delete transaction. ${error.response?.data?.detail || 'Please try again.'}`);
    }
  }, []);

  const refreshData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    try {
      const [dashboardRes, monthlyRes, budgetsRes] = await Promise.all([
        axios.get('https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/dashboard/', {
          headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get('https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/transactions/monthly/', {
          headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get('https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/budgets/', {
          headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      setDashboardData(dashboardRes.data);
      setMonthlyTrends(formatMonthlyData(monthlyRes.data));
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  const generateReport = useCallback(async (type = 'monthly') => {
    try {
      const response = await axios.get(`https://budgetbuddy-application-60a2fed9b30b.herokuapp.com/api/reports/?type=${type}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `budget_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  }, []);

  if (!dashboardData || !user) {
    return <div className="loading">Loading...</div>;
  }

  const { income, expenses, savings_goal, recent_transactions } = dashboardData;
  const savings = income - expenses;
  const progressPercentage = savings_goal.target_amount > 0 
    ? (savings_goal.current_amount / savings_goal.target_amount) * 100 
    : 0;

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        notifications={notifications}
        handleLogout={handleLogout}
      />

      <div className="main-content">
        <div className="content-header">
          <h1>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}</h1>
          <div className="header-actions">
            {activeMenu === 'transactions' && (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddNewTransaction}
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon={faPlus} /> 
                  {isSubmitting ? 'Processing...' : 'Add Transaction'}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowBudgetForm(true)}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add Budget
                </button>
              </>
            )}
            {activeMenu === 'overview' && (
              <button 
                className="btn btn-secondary"
                onClick={() => generateReport()}
              >
                <FontAwesomeIcon icon={faFilePdf} /> Generate Report
              </button>
            )}
            <button 
              className="btn btn-secondary"
              onClick={handleLogout}
              title="Logout"
            >
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </button>
          </div>
        </div>

        {activeMenu === 'dashboard' && (
          <>
            <SummaryCards 
              income={income}
              expenses={expenses}
              savings={savings}
              savings_goal={savings_goal}
              progressPercentage={progressPercentage}
            />
            <ChartsSection 
              income={income}
              expenses={expenses}
              monthlyTrends={monthlyTrends}
              expenseCategories={expenseCategories}
              budgets={budgets}
            />
            <TransactionsTable 
              transactions={recent_transactions}
              title="Recent Transactions"
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
            />
          </>
        )}

        {activeMenu === 'transactions' && (
          <TransactionsTable 
            transactions={dashboardData.recent_transactions || []}
            title="Transactions"
            showFilters={true}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            expenseCategories={expenseCategories}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            onAdd={handleAddNewTransaction}
          />
        )}

        {activeMenu === 'overview' && (
          <>
            <ChartsSection 
              income={income}
              expenses={expenses}
              monthlyTrends={monthlyTrends}
              expenseCategories={expenseCategories}
              budgets={budgets}
              showBudgetChart={true}
            />
            <BudgetSummary 
              budgets={budgets}
              expenseCategories={expenseCategories}
            />
          </>
        )}

        {activeMenu === 'profile' && (
          <ProfileSection 
            user={user} 
            setUser={setUser}
          />
        )}

        {activeMenu === 'notifications' && (
          <NotificationsList 
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
          />
        )}
      </div>

      <Chatbot />
      
      {showTransactionForm && (
        <TransactionForm 
          isOpen={showTransactionForm}
          onClose={() => {
            setShowTransactionForm(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleTransactionSubmit}
          initialData={editingTransaction}
          isSubmitting={isSubmitting}
          error={formError}
          categories={[
            'food', 'transportation', 'housing',
            'entertainment', 'utilities', 'health',
            'education', 'other'
          ]}
          incomeCategories={[
            'salary', 'freelance', 'investments',
            'gifts', 'other-income'
          ]}
        />
      )}

      {showBudgetForm && (
        <BudgetForm 
          isOpen={showBudgetForm}
          onClose={() => setShowBudgetForm(false)}
          onBudgetAdded={handleAddBudget}
          expenseCategories={expenseCategories}
        />
      )}
    </div>
  );
};

export default Dashboard;
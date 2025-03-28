import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import SummaryCards from './SummaryCards';
import ChartsSection from './ChartsSection';
import TransactionsTable from './TransactionsTable';
import TransactionForm from './TransactionForm';
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const [dashboardRes, userRes, notificationsRes, budgetsRes, monthlyRes] = await Promise.all([
          axios.get('http://localhost:8000/api/dashboard/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/user/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/notifications/', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: [] })),
          axios.get('http://localhost:8000/api/budgets/', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: [] })),
          axios.get('http://localhost:8000/api/transactions/monthly/', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: [] }))
        ]);

        // Process dashboard data
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

        // Process transactions and categories
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
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const markNotificationAsRead = async (id) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.patch(`http://localhost:8000/api/notifications/${id}/`, 
        { is_read: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const generateReport = async (type = 'monthly') => {
    try {
      const response = await axios.get(`http://localhost:8000/api/reports/?type=${type}`, {
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
  };

  const handleAddTransaction = async (transaction) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(
        'http://localhost:8000/api/transactions/',
        {
          ...transaction,
          user: user.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  };

  const handleEditTransaction = async (transaction) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.put(
        `http://localhost:8000/api/transactions/${transaction.id}/`,
        transaction,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshData();
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction. Please try again.');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(
        `http://localhost:8000/api/transactions/${transactionId}/`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await refreshData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(`Failed to delete transaction. ${error.response?.data?.detail || 'Please try again.'}`);
    }
  };

  const refreshData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const [dashboardRes, monthlyRes, budgetsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/transactions/monthly/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/budgets/', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setDashboardData(dashboardRes.data);
      setMonthlyTrends(formatMonthlyData(monthlyRes.data));
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

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
            {activeMenu === 'expenses' && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowTransactionForm(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Transaction
              </button>
            )}
            {activeMenu === 'overview' && (
              <button 
                className="btn btn-secondary"
                onClick={() => generateReport()}
              >
                <FontAwesomeIcon icon={faFilePdf} /> Generate Report
              </button>
            )}
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
              onAdd={handleAddTransaction}
            />
          </>
        )}

        {activeMenu === 'expenses' && (
          <TransactionsTable 
            transactions={expenseTransactions}
            title="Expenses"
            showFilters={true}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            expenseCategories={expenseCategories}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            onAdd={handleAddTransaction}
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
          <ProfileSection user={user} />
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
          onClose={() => setShowTransactionForm(false)}
          onSubmit={async (transaction) => {
            await handleAddTransaction(transaction);
            setShowTransactionForm(false);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
import React from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import './ChartsSection.css';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
  BarElement, PointElement, LineElement, Filler
);

const ChartsSection = ({ income, expenses, monthlyTrends, expenseCategories, budgets, showBudgetChart = false }) => {
  const doughnutData = {
    labels: ['Income', 'Expenses'],
    datasets: [{
      label: 'Amount',
      data: [income, expenses],
      backgroundColor: ['#4CAF50', '#F44336'],
      hoverBackgroundColor: ['#66BB6A', '#EF5350'],
    }],
  };

  const categoryData = {
    labels: expenseCategories.map(cat => cat.name),
    datasets: [{
      label: 'Expenses by Category',
      data: expenseCategories.map(cat => cat.amount),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
      ]
    }]
  };

  const budgetData = {
    labels: budgets.map(budget => budget.category),
    datasets: [{
      label: 'Budget Usage',
      data: budgets.map(budget => {
        const spent = expenseCategories.find(c => c.name === budget.category)?.amount || 0;
        return (spent / budget.limit) * 100;
      }),
      backgroundColor: budgets.map(budget => {
        const spent = expenseCategories.find(c => c.name === budget.category)?.amount || 0;
        const percentage = (spent / budget.limit) * 100;
        return percentage > 90 ? '#FF6384' : 
               percentage > 70 ? '#FFCE56' : '#4CAF50';
      })
    }]
  };

  return (
    <div className="charts-section">
      <div className="chart-container">
        <h3>Financial Overview</h3>
        <Doughnut data={doughnutData} />
      </div>
      
      <div className="chart-container">
        <h3>Monthly Cash Flow</h3>
        {monthlyTrends ? (
          <Line data={monthlyTrends} />
        ) : (
          <p>Monthly trend data not available</p>
        )}
      </div>
      
      {showBudgetChart && budgets.length > 0 && (
        <div className="chart-container">
          <h3>Budget Progress</h3>
          <Bar 
            data={budgetData} 
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: value => `${value}%`
                  }
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ChartsSection;
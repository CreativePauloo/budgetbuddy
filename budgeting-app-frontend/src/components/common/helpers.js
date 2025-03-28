import { 
    faUtensils, faCar, faHouse, 
    faFilm, faBolt, faMoneyBillWave 
  } from '@fortawesome/free-solid-svg-icons';
  
  export const formatMoney = (amount) => {
    return amount?.toLocaleString('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) || '0.00';
  };
  
  export const getCategoryIcon = (category) => {
    switch (category) {
      case 'food': return faUtensils;
      case 'transportation': return faCar;
      case 'housing': return faHouse;
      case 'entertainment': return faFilm;
      case 'utilities': return faBolt;
      default: return faMoneyBillWave;
    }
  };
  
  export const formatMonthlyData = (data) => ({
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: data.map(item => item.income),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Expenses',
        data: data.map(item => item.expenses),
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  });
  
  export const getBudgetProgressColor = (percentage) => {
    if (percentage > 90) return '#FF6384';
    if (percentage > 70) return '#FFCE56';
    return '#4CAF50';
  };
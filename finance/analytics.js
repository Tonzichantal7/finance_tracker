// Analytics page functionality

let expenseChart = null;
let comparisonChart = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sidebarContainer').innerHTML = renderSidebar('analytics');
    document.getElementById('headerContainer').innerHTML = renderHeader();
    document.getElementById('pageTitle').textContent = 'Analytics';
    
    // Wait for auth state
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.replace('index.html');
            return;
        }
        loadAnalytics();
    });
    
    initAuth();
});

// Prevent unauthorized access via browser back button
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Page was restored from cache (user clicked back)
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.replace('index.html');
            }
        });
    }
});

function loadAnalytics() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('transactions')
        .where('userId', '==', user.uid)
        .get()
        .then((snapshot) => {
            const categoryExpenses = {};
            const monthlyData = {};
            let ytdIncome = 0;
            let ytdExpense = 0;
            const currentYear = new Date().getFullYear();
            const monthlyIncome = [];
            const monthlyExpense = [];

            snapshot.forEach((doc) => {
                const transaction = doc.data();
                const date = new Date(transaction.date);
                const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                const year = date.getFullYear();

                // Category expenses
                if (transaction.type === 'expense') {
                    categoryExpenses[transaction.category] = 
                        (categoryExpenses[transaction.category] || 0) + transaction.amount;
                }

                // YTD calculations
                if (year === currentYear) {
                    if (transaction.type === 'income') {
                        ytdIncome += transaction.amount;
                    } else {
                        ytdExpense += transaction.amount;
                    }
                }

                // Monthly data
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expense: 0 };
                }
                if (transaction.type === 'income') {
                    monthlyData[monthKey].income += transaction.amount;
                } else {
                    monthlyData[monthKey].expense += transaction.amount;
                }
            });

            // Calculate top category
            let topCategory = '-';
            let topAmount = 0;
            Object.keys(categoryExpenses).forEach(cat => {
                if (categoryExpenses[cat] > topAmount) {
                    topAmount = categoryExpenses[cat];
                    topCategory = cat;
                }
            });

            // Calculate averages and savings rate
            const months = Object.keys(monthlyData);
            let totalMonthlyIncome = 0;
            let totalMonthlyExpense = 0;
            months.forEach(month => {
                totalMonthlyIncome += monthlyData[month].income;
                totalMonthlyExpense += monthlyData[month].expense;
            });
            const avgMonthlyIncome = months.length > 0 ? totalMonthlyIncome / months.length : 0;
            const avgMonthlyExpense = months.length > 0 ? totalMonthlyExpense / months.length : 0;
            const savingsRate = avgMonthlyIncome > 0 ? ((avgMonthlyIncome - avgMonthlyExpense) / avgMonthlyIncome * 100) : 0;

            // Update summary
            document.getElementById('topCategory').textContent = topAmount > 0 ? formatCurrency(topAmount) : '-';
            document.getElementById('ytdIncome').textContent = formatCurrency(ytdIncome);
            document.getElementById('ytdExpense').textContent = formatCurrency(ytdExpense);
            document.getElementById('savingsRate').textContent = `${savingsRate.toFixed(0)}%`;
            document.getElementById('avgMonthlyExpense').textContent = formatCurrency(avgMonthlyExpense);
            document.getElementById('avgMonthlyIncome').textContent = formatCurrency(avgMonthlyIncome);

            updateExpenseChart(categoryExpenses);
            updateComparisonChart(monthlyData);
        })
        .catch((error) => {
            console.error('Error loading analytics:', error);
        });
}

function updateExpenseChart(categoryExpenses) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    const canvas = ctx.getContext('2d');
    
    if (expenseChart) {
        expenseChart.destroy();
    }

    const labels = Object.keys(categoryExpenses);
    const data = Object.values(categoryExpenses);

    if (labels.length === 0) {
        canvas.clearRect(0, 0, ctx.width, ctx.height);
        canvas.font = '16px sans-serif';
        canvas.fillStyle = '#6B7280';
        canvas.textAlign = 'center';
        canvas.fillText('No expense data available', ctx.width / 2, ctx.height / 2);
        return;
    }

    expenseChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#10B981',
                    '#059669',
                    '#34D399',
                    '#6EE7B7',
                    '#A7F3D0',
                    '#F59E0B',
                    '#EF4444',
                    '#F97316'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateComparisonChart(monthlyData) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    
    const canvas = ctx.getContext('2d');
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(month => monthlyData[month].income);
    const expenseData = months.map(month => monthlyData[month].expense);

    if (months.length === 0) {
        canvas.clearRect(0, 0, ctx.width, ctx.height);
        canvas.font = '16px sans-serif';
        canvas.fillStyle = '#6B7280';
        canvas.textAlign = 'center';
        canvas.fillText('No data available', ctx.width / 2, ctx.height / 2);
        return;
    }

    comparisonChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Income',
                data: incomeData,
                backgroundColor: '#10B981'
            }, {
                label: 'Expense',
                data: expenseData,
                backgroundColor: '#EF4444'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}


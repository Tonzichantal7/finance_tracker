// Dashboard specific functionality

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Render sidebar and header
    document.getElementById('sidebarContainer').innerHTML = renderSidebar('dashboard');
    document.getElementById('headerContainer').innerHTML = renderHeader();
    document.getElementById('pageTitle').textContent = 'Dashboard';
    
    // Initialize auth - wait for auth state before loading data
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Initialize transaction modal
        initTransactionModal();
        handleTransactionSubmit(loadDashboardData);
        
        // Load dashboard data after auth is ready
        loadDashboardData();
    });
    
    // Also call initAuth for logout button
    initAuth();
});

// Chart instance
let balanceChart = null;

// Load Dashboard Data
function loadDashboardData() {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user found');
        return;
    }

    console.log('Loading transactions for user:', user.uid);

    // Use get() instead of onSnapshot to handle errors better
    // Try with orderBy first, fallback if index needed
    db.collection('transactions')
        .where('userId', '==', user.uid)
        .orderBy('date', 'desc')
        .get()
        .then((snapshot) => {
            console.log('Transactions snapshot:', snapshot.size, 'documents');
            const transactionsList = document.getElementById('transactionsList');
            transactionsList.innerHTML = '';
            
            let totalIncome = 0;
            let totalExpense = 0;
            let monthlyIncomeTotal = 0;
            let monthlyExpenseTotal = 0;
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            // First collect all transactions
            const allTransactions = [];
            snapshot.forEach((doc) => {
                const transaction = { id: doc.id, ...doc.data() };
                allTransactions.push(transaction);
            });
            
            if (snapshot.empty) {
                transactionsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p>No transactions yet. Add your first transaction!</p>
                    </div>
                `;
                // Still show empty chart with zero balances (show key dates only)
                const today = new Date();
                const chartDays = [];
                const chartBalances = [];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const keyDates = [1, 5, 10, 15, 20, 25];
                
                for (let i = 29; i >= 0; i--) {
                    const dayDate = new Date();
                    dayDate.setDate(dayDate.getDate() - i);
                    const dayNum = dayDate.getDate();
                    const shouldShow = i === 0 || keyDates.includes(dayNum) && (i >= 5 || dayNum === 1);
                    
                    if (shouldShow) {
                        let label = '';
                        if (i === 0) {
                            label = 'Today';
                        } else {
                            label = `${months[dayDate.getMonth()]} ${dayDate.getDate()}`;
                        }
                        chartDays.push(label);
                        chartBalances.push(0);
                    }
                }
                
                updateSummary(0, 0, 0);
                updateBalanceChart(chartDays, chartBalances);
                return;
            }

            // Calculate cumulative balance for chart (last 30 days)
            const today = new Date();
            const chartDays = [];
            const chartBalances = [];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // Calculate balance for each of the last 30 days
            // But only show key dates on X-axis: 1st, 5th, 10th, 15th, 20th, 25th, and Today
            const keyDayNumbers = [1, 5, 10, 15, 20, 25]; // Day numbers to show on X-axis
            
            // First, calculate balance for all 30 days (we need all data points for smooth line)
            const allDaysData = [];
            for (let i = 29; i >= 0; i--) {
                const dayDate = new Date();
                dayDate.setDate(dayDate.getDate() - i);
                dayDate.setHours(23, 59, 59, 999);
                
                let balance = 0;
                allTransactions.forEach(transaction => {
                    const transDate = new Date(transaction.date);
                    transDate.setHours(23, 59, 59, 999);
                    
                    if (transDate <= dayDate) {
                        if (transaction.type === 'income') {
                            balance += transaction.amount;
                        } else {
                            balance -= transaction.amount;
                        }
                    }
                });
                
                allDaysData.push({
                    date: dayDate,
                    balance: balance,
                    dayIndex: i,
                    dayNumber: dayDate.getDate()
                });
            }
            
            // Now filter to show only key dates on the chart
            allDaysData.forEach((dayData) => {
                const shouldShow = dayData.dayIndex === 0 || // Always show Today
                                  keyDayNumbers.includes(dayData.dayNumber); // Show if day number matches
                
                if (shouldShow) {
                    let label = '';
                    if (dayData.dayIndex === 0) {
                        label = 'Today';
                    } else {
                        label = `${months[dayData.date.getMonth()]} ${dayData.date.getDate()}`;
                    }
                    
                    chartDays.push(label);
                    chartBalances.push(dayData.balance);
                }
            });

            // Process transactions (show only recent 5, sorted by date)
            allTransactions.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });
            
            let recentCount = 0;
            allTransactions.slice(0, 5).forEach(transaction => {
                displayTransaction(transaction);
                recentCount++;
            });

            // Calculate totals
            allTransactions.forEach(transaction => {
                const transactionDate = new Date(transaction.date);
                const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                                       transactionDate.getFullYear() === currentYear;

                if (transaction.type === 'income') {
                    totalIncome += transaction.amount;
                    if (isCurrentMonth) {
                        monthlyIncomeTotal += transaction.amount;
                    }
                } else {
                    totalExpense += transaction.amount;
                    if (isCurrentMonth) {
                        monthlyExpenseTotal += transaction.amount;
                    }
                }
            });

            const totalBalanceAmount = totalIncome - totalExpense;
            updateSummary(totalBalanceAmount, monthlyIncomeTotal, monthlyExpenseTotal);
            updateBalanceChart(chartDays, chartBalances);
        })
        .catch((error) => {
            // Handle missing index error silently (fallback will handle it)
            if (error.code === 'failed-precondition') {
                console.log('Index not available, using fallback method (this is normal)');
                loadTransactionsWithoutOrderBy();
            } else {
                // Only log real errors
                console.error('Error loading transactions:', error);
                // Still try fallback as a last resort
                console.log('Trying fallback method anyway...');
                loadTransactionsWithoutOrderBy();
            }
        });
}

// Fallback function without orderBy
function loadTransactionsWithoutOrderBy() {
    const user = auth.currentUser;
    if (!user) return;

    console.log('Loading transactions without orderBy (fallback method)');
    
    db.collection('transactions')
        .where('userId', '==', user.uid)
        .get()
        .then((snapshot) => {
            console.log('Loaded transactions without orderBy:', snapshot.size);
            const transactionsList = document.getElementById('transactionsList');
            if (!transactionsList) {
                console.error('transactionsList element not found');
                return;
            }
            transactionsList.innerHTML = '';
            
            // Collect all transactions first
            const allTransactions = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Transaction data:', data);
                allTransactions.push({ id: doc.id, ...data });
            });
            
            if (snapshot.empty || allTransactions.length === 0) {
                transactionsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p>No transactions yet. Add your first transaction!</p>
                    </div>
                `;
                // Still show empty chart and zero summary (show key dates only)
                const today = new Date();
                const chartDays = [];
                const chartBalances = [];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const keyDates = [1, 5, 10, 15, 20, 25];
                
                for (let i = 29; i >= 0; i--) {
                    const dayDate = new Date();
                    dayDate.setDate(dayDate.getDate() - i);
                    const dayNum = dayDate.getDate();
                    const shouldShow = i === 0 || keyDates.includes(dayNum) && (i >= 5 || dayNum === 1);
                    
                    if (shouldShow) {
                        let label = '';
                        if (i === 0) {
                            label = 'Today';
                        } else {
                            label = `${months[dayDate.getMonth()]} ${dayDate.getDate()}`;
                        }
                        chartDays.push(label);
                        chartBalances.push(0);
                    }
                }
                
                updateSummary(0, 0, 0);
                updateBalanceChart(chartDays, chartBalances);
                return;
            }
            
            // Sort by date descending
            allTransactions.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });
            
            // Show only recent 5 transactions
            let recentCount = 0;
            allTransactions.slice(0, 5).forEach(transaction => {
                displayTransaction(transaction);
                recentCount++;
            });
            
            // Calculate summary and charts
            let totalIncome = 0;
            let totalExpense = 0;
            let monthlyIncomeTotal = 0;
            let monthlyExpenseTotal = 0;
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            allTransactions.forEach(transaction => {
                const transactionDate = new Date(transaction.date);
                const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                                       transactionDate.getFullYear() === currentYear;

                if (transaction.type === 'income') {
                    totalIncome += transaction.amount;
                    if (isCurrentMonth) {
                        monthlyIncomeTotal += transaction.amount;
                    }
                } else {
                    totalExpense += transaction.amount;
                    if (isCurrentMonth) {
                        monthlyExpenseTotal += transaction.amount;
                    }
                }
            });
            
            const totalBalanceAmount = totalIncome - totalExpense;
            updateSummary(totalBalanceAmount, monthlyIncomeTotal, monthlyExpenseTotal);
            
            // Update balance chart with data (use full 30 days for calculation)
            const today = new Date();
            const chartDays = [];
            const chartBalances = [];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // Calculate balance for key dates only: 1st, 5th, 10th, 15th, 20th, 25th, and Today
            const keyDayNumbers = [1, 5, 10, 15, 20, 25]; // Day numbers to show on X-axis
            
            // First, calculate balance for all 30 days to get accurate cumulative balances
            const allDaysData = [];
            for (let i = 29; i >= 0; i--) {
                const dayDate = new Date();
                dayDate.setDate(dayDate.getDate() - i);
                dayDate.setHours(23, 59, 59, 999);
                
                let balance = 0;
                allTransactions.forEach(transaction => {
                    const transDate = new Date(transaction.date);
                    transDate.setHours(23, 59, 59, 999);
                    
                    // Add all transactions up to and including this day (cumulative)
                    if (transDate <= dayDate) {
                        if (transaction.type === 'income') {
                            balance += transaction.amount;
                        } else {
                            balance -= transaction.amount;
                        }
                    }
                });
                
                allDaysData.push({
                    date: dayDate,
                    balance: balance,
                    dayIndex: i,
                    dayNumber: dayDate.getDate()
                });
            }
            
            // Now filter to show only key dates on the chart
            allDaysData.forEach((dayData) => {
                const shouldShow = dayData.dayIndex === 0 || // Always show Today
                                  keyDayNumbers.includes(dayData.dayNumber); // Show if day number matches
                
                if (shouldShow) {
                    let label = '';
                    if (dayData.dayIndex === 0) {
                        label = 'Today';
                    } else {
                        label = `${months[dayData.date.getMonth()]} ${dayData.date.getDate()}`;
                    }
                    
                    chartDays.push(label);
                    chartBalances.push(dayData.balance);
                }
            });
            
            updateBalanceChart(chartDays, chartBalances);
        })
        .catch((error) => {
            console.error('Error loading transactions in fallback:', error);
            // Don't show alert for fallback errors, just log them
            const transactionsList = document.getElementById('transactionsList');
            if (transactionsList) {
                transactionsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <p>Error loading transactions. Please refresh the page.</p>
                    </div>
                `;
            }
        });
}

// Display Transaction
function displayTransaction(transaction) {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) {
        console.error('transactionsList element not found');
        return;
    }
    
    if (!transaction || !transaction.category || !transaction.description || !transaction.date || transaction.amount === undefined) {
        console.error('Invalid transaction data:', transaction);
        return;
    }
    
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    
    const icon = categoryIcons[transaction.category] || categoryIcons['Other'];
    
    const dotColor = transaction.type === 'income' ? '#10B981' : '#EF4444';
    const badgeColor = transaction.type === 'income' ? 'income' : 'expense';
    
    transactionItem.innerHTML = `
        <div class="transaction-item-left">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor}; flex-shrink: 0;"></div>
            <div class="transaction-icon">${icon}</div>
            <div class="transaction-info">
                <div class="transaction-description">${transaction.description}</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    <span class="category-type-badge ${badgeColor}">${transaction.category}</span>
                    <span class="transaction-date">${formatDateShort(transaction.date)}</span>
                </div>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </div>
            <div class="transaction-actions" style="display: flex; gap: 8px;">
                <button class="btn-edit" onclick="window.editTransaction('${transaction.id}')" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.3333 2.00004C11.5084 1.82493 11.7163 1.68605 11.9452 1.59131C12.174 1.49658 12.4192 1.44775 12.6667 1.44775C12.9141 1.44775 13.1593 1.49658 13.3882 1.59131C13.617 1.68605 13.8249 1.82493 14 2.00004C14.1751 2.17515 14.314 2.3831 14.4087 2.61196C14.5035 2.84082 14.5523 3.08601 14.5523 3.33337C14.5523 3.58073 14.5035 3.82593 14.4087 4.05479C14.314 4.28365 14.1751 4.4916 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="btn-delete" onclick="window.deleteTransaction('${transaction.id}').then((success) => { if(success) loadDashboardData(); })" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H14M6 4V2C6 1.73478 6.10536 1.48043 6.29289 1.29289C6.48043 1.10536 6.73478 1 7 1H9C9.26522 1 9.51957 1.10536 9.70711 1.29289C9.89464 1.48043 10 1.73478 10 2V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33334 13.687 3.33334 13.3333V4H12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    transactionsList.appendChild(transactionItem);
    console.log('Transaction displayed successfully');
}

// Update Summary
function updateSummary(balance, monthlyIncomeAmount, monthlyExpenseAmount) {
    const totalBalance = document.getElementById('totalBalance');
    const monthlyIncome = document.getElementById('monthlyIncome');
    const monthlyExpense = document.getElementById('monthlyExpense');
    
    if (totalBalance) totalBalance.textContent = formatCurrency(balance);
    if (monthlyIncome) monthlyIncome.textContent = formatCurrency(monthlyIncomeAmount);
    if (monthlyExpense) monthlyExpense.textContent = formatCurrency(monthlyExpenseAmount);
}

// Update Balance Chart
function updateBalanceChart(labels, balances) {
    const canvasElement = document.getElementById('balanceChart');
    if (!canvasElement) {
        console.error('balanceChart element not found');
        return;
    }
    
    console.log('Updating balance chart with', balances.length, 'data points');
    console.log('Labels:', labels.slice(0, 5));
    console.log('Sample balances:', balances.slice(0, 5));
    
    if (balanceChart) {
        balanceChart.destroy();
        balanceChart = null;
    }

    if (!balances || balances.length === 0 || labels.length === 0) {
        console.log('No balance data or labels');
        return;
    }

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded. Please check if the script is included.');
        return;
    }

    try {
        // Calculate min and max for better scale
        const minBalance = Math.min(...balances);
        const maxBalance = Math.max(...balances);
        const range = maxBalance - minBalance;
        
        // Set Y-axis to start at 0 and have nice round increments
        // Calculate appropriate max based on data, rounding up to nearest nice number
        let yMax = Math.max(0, maxBalance);
        if (yMax > 0) {
            // Round up to nearest nice number (like 500, 1000, 1500, 2000, 2500, 3000, etc.)
            const magnitude = Math.pow(10, Math.floor(Math.log10(yMax)));
            const normalized = yMax / magnitude;
            let niceMax;
            if (normalized <= 1) niceMax = 1 * magnitude;
            else if (normalized <= 2) niceMax = 2 * magnitude;
            else if (normalized <= 2.5) niceMax = 2.5 * magnitude;
            else if (normalized <= 5) niceMax = 5 * magnitude;
            else niceMax = 10 * magnitude;
            
            yMax = niceMax;
        } else {
            yMax = 1000; // Default max if all balances are 0 or negative
        }
        
        balanceChart = new Chart(canvasElement, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Balance',
                    data: balances,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#10B981',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1F2937',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: yMax,
                        beginAtZero: true,
                        grid: {
                            color: '#E5E7EB',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6B7280',
                            stepSize: yMax / 4, // Show 4 major ticks (like 0, 750, 1500, 2250, 3000)
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6B7280',
                            maxRotation: 0,
                            minRotation: 0
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        console.log('Balance chart created successfully');
    } catch (error) {
        console.error('Error creating chart:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}


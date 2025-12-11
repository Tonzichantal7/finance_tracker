// Transactions page functionality

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sidebarContainer').innerHTML = renderSidebar('transactions');
    document.getElementById('headerContainer').innerHTML = renderHeader();
    document.getElementById('pageTitle').textContent = 'Transactions';
    
    // Wait for auth state before loading
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        initTransactionModal();
        handleTransactionSubmit(() => {
            if (typeof window.loadTransactions === 'function') {
                window.loadTransactions();
            }
        });
        initFilters();
        initExport();
        initSearch();
        initClearFilters();
        
        // Load transactions after auth is ready
        if (typeof window.loadTransactions === 'function') {
            window.loadTransactions();
        } else {
            // Fallback: load directly
            loadTransactionsFallback();
        }
    });
    
    // Also call initAuth for logout button
    initAuth();
});

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (typeof window.loadTransactions === 'function') {
                window.loadTransactions();
            } else {
                loadTransactionsFallback();
            }
        });
    }
}

function initClearFilters() {
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('filterType').value = 'all';
            document.getElementById('filterCategory').value = 'all';
            document.getElementById('filterDate').value = '';
            document.getElementById('searchInput').value = '';
            if (typeof window.loadTransactions === 'function') {
                window.loadTransactions();
            } else {
                loadTransactionsFallback();
            }
        });
    }
}

function initExport() {
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
}

function exportToCSV() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('transactions')
        .where('userId', '==', user.uid)
        .get()
        .then((snapshot) => {
            let csv = 'Date,Description,Category,Type,Amount\n';
            const transactions = [];
            
            snapshot.forEach((doc) => {
                transactions.push({ id: doc.id, ...doc.data() });
            });

            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            transactions.forEach(transaction => {
                csv += `${transaction.date},${transaction.description},${transaction.category},${transaction.type},${transaction.amount}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
            console.error('Error exporting CSV:', error);
            alert('Error exporting transactions. Please try again.');
        });
}

// Edit function is now in common.js as window.editTransaction

function initFilters() {
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const filterDate = document.getElementById('filterDate');
    
    if (filterType) {
        filterType.addEventListener('change', () => {
            if (typeof window.loadTransactions === 'function') {
                window.loadTransactions();
            } else {
                loadTransactionsFallback();
            }
        });
    }
    if (filterCategory) {
        filterCategory.addEventListener('change', () => {
            if (typeof window.loadTransactions === 'function') {
                window.loadTransactions();
            } else {
                loadTransactionsFallback();
            }
        });
    }
    if (filterDate) {
        filterDate.addEventListener('change', () => {
            if (typeof window.loadTransactions === 'function') {
                window.loadTransactions();
            } else {
                loadTransactionsFallback();
            }
        });
    }
}

// Make function global
window.loadTransactions = function() {
    const user = auth.currentUser;
    if (!user) return;

    console.log('Loading transactions for user:', user.uid);

    // Try with orderBy first using get() to properly catch index errors
    db.collection('transactions')
        .where('userId', '==', user.uid)
        .orderBy('date', 'desc')
        .get()
        .then((snapshot) => {
            console.log('Transactions loaded:', snapshot.size, 'documents');
            displayTransactionsFromSnapshot(snapshot);
            
            // If successful, set up real-time listener
            db.collection('transactions')
                .where('userId', '==', user.uid)
                .orderBy('date', 'desc')
                .onSnapshot((snapshot) => {
                    displayTransactionsFromSnapshot(snapshot);
                });
        })
        .catch((error) => {
            console.error('Error loading transactions:', error);
            if (error.code === 'failed-precondition') {
                console.log('Index required, using fallback method (this is normal for new Firebase projects)');
                loadTransactionsFallback();
            } else {
                console.error('Error loading transactions:', error);
                // Still try fallback as last resort
                loadTransactionsFallback();
            }
        });
}

function displayTransactionsFromSnapshot(snapshot) {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) {
        console.error('transactionsList element not found');
        return;
    }
    transactionsList.innerHTML = '';
    
    const filterType = document.getElementById('filterType')?.value || 'all';
    const filterCategory = document.getElementById('filterCategory')?.value || 'all';
    const filterDate = document.getElementById('filterDate')?.value || '';
    const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';

    // Collect all transactions first
    const allTransactions = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        allTransactions.push({ id: doc.id, ...data });
    });

    // Calculate summary stats
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    allTransactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
            incomeCount++;
        } else {
            totalExpense += transaction.amount;
            expenseCount++;
        }
    });

    const netBalance = totalIncome - totalExpense;
    
    // Update summary cards
    updateTransactionsSummary(totalIncome, totalExpense, netBalance, incomeCount, expenseCount, allTransactions.length);

    if (snapshot.empty) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>No transactions found. Add your first transaction!</p>
            </div>
        `;
        return;
    }

    // Sort by date descending
    allTransactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });

    let hasTransactions = false;
    allTransactions.forEach((transaction) => {
        // Apply filters
        if (filterType !== 'all' && transaction.type !== filterType) return;
        if (filterCategory !== 'all' && transaction.category !== filterCategory) return;
        if (filterDate && transaction.date !== filterDate) return;
        if (searchInput && !transaction.description.toLowerCase().includes(searchInput) && !transaction.category.toLowerCase().includes(searchInput)) return;
        
        displayTransaction(transaction);
        hasTransactions = true;
        
        // Update category filter options
        updateCategoryFilter(transaction.category);
    });

    if (!hasTransactions) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No transactions match your filters.</p>
            </div>
        `;
    }
}

function updateTransactionsSummary(income, expense, balance, incomeCount, expenseCount, totalCount) {
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const netBalanceEl = document.getElementById('netBalance');
    const incomeBadgeEl = document.getElementById('incomeBadge');
    const expenseBadgeEl = document.getElementById('expenseBadge');
    const balanceBadgeEl = document.getElementById('balanceBadge');

    if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(income);
    if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(expense);
    if (netBalanceEl) netBalanceEl.textContent = formatCurrency(balance);
    if (incomeBadgeEl) incomeBadgeEl.textContent = `+${incomeCount}`;
    if (expenseBadgeEl) expenseBadgeEl.textContent = expenseCount.toString();
    if (balanceBadgeEl) balanceBadgeEl.textContent = `${totalCount} total`;
}

// Fallback function without orderBy (works without Firestore indexes)
function loadTransactionsFallback() {
    const user = auth.currentUser;
    if (!user) return;

    console.log('Using fallback method to load transactions (no index required)');

    db.collection('transactions')
        .where('userId', '==', user.uid)
        .get()
        .then((snapshot) => {
            console.log('Fallback: Loaded transactions:', snapshot.size);
            displayTransactionsFromSnapshot(snapshot);
            
            // Set up real-time listener without orderBy (updates will come unsorted)
            db.collection('transactions')
                .where('userId', '==', user.uid)
                .onSnapshot((snapshot) => {
                    displayTransactionsFromSnapshot(snapshot);
                });
        })
        .catch((error) => {
            console.error('Error loading transactions in fallback:', error);
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

function updateCategoryFilter(category) {
    const filterCategory = document.getElementById('filterCategory');
    if (!filterCategory) return;
    
    const options = Array.from(filterCategory.options).map(opt => opt.value);
    if (!options.includes(category)) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategory.appendChild(option);
    }
}

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
                    <span class="transaction-date">${formatDateTransaction(transaction.date)}</span>
                </div>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </div>
            <span class="category-type-badge ${badgeColor}" style="font-size: 12px;">${transaction.type}</span>
            <div class="transaction-actions" style="display: flex; gap: 8px;">
                <button class="btn-edit" onclick="editTransaction('${transaction.id}')" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.3333 2.00004C11.5084 1.82493 11.7163 1.68605 11.9452 1.59131C12.174 1.49658 12.4192 1.44775 12.6667 1.44775C12.9141 1.44775 13.1593 1.49658 13.3882 1.59131C13.617 1.68605 13.8249 1.82493 14 2.00004C14.1751 2.17515 14.314 2.3831 14.4087 2.61196C14.5035 2.84082 14.5523 3.08601 14.5523 3.33337C14.5523 3.58073 14.5035 3.82593 14.4087 4.05479C14.314 4.28365 14.1751 4.4916 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="btn-delete" onclick="window.deleteTransaction('${transaction.id}').then((success) => { if(success && typeof window.loadTransactions === 'function') window.loadTransactions(); })" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H14M6 4V2C6 1.73478 6.10536 1.48043 6.29289 1.29289C6.48043 1.10536 6.73478 1 7 1H9C9.26522 1 9.51957 1.10536 9.70711 1.29289C9.89464 1.48043 10 1.73478 10 2V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33334 13.687 3.33334 13.3333V4H12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    transactionsList.appendChild(transactionItem);
}


// DOM Elements
const authContainer = document.getElementById('authContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const signInTab = document.getElementById('signInTab');
const signUpTab = document.getElementById('signUpTab');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const signInFormElement = document.getElementById('signInFormElement');
const signUpFormElement = document.getElementById('signUpFormElement');
const googleSignIn = document.getElementById('googleSignIn');
const googleSignUp = document.getElementById('googleSignUp');
const authError = document.getElementById('authError');
const signUpError = document.getElementById('signUpError');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const transactionModal = document.getElementById('transactionModal');
const closeModal = document.getElementById('closeModal');
const cancelTransaction = document.getElementById('cancelTransaction');
const transactionForm = document.getElementById('transactionForm');
const transactionsList = document.getElementById('transactionsList');
const totalBalance = document.getElementById('totalBalance');
const monthlyIncome = document.getElementById('monthlyIncome');
const monthlyExpense = document.getElementById('monthlyExpense');
const userEmail = document.getElementById('userEmail');
const transactionCategory = document.getElementById('transactionCategory');
const transactionDate = document.getElementById('transactionDate');

// Set today's date as default
transactionDate.valueAsDate = new Date();

// Transaction categories
const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other'],
    expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other']
};

// Chart instance
let balanceChart = null;

// Initialize categories dropdown
function initializeCategories() {
    const type = document.getElementById('transactionType').value;
    transactionCategory.innerHTML = '<option value="">Select Category</option>';
    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        transactionCategory.appendChild(option);
    });
}

// Tab switching
signInTab.addEventListener('click', () => {
    signInTab.classList.add('active');
    signUpTab.classList.remove('active');
    signInForm.classList.add('active');
    signUpForm.classList.remove('active');
    authError.classList.remove('show');
    signUpError.classList.remove('show');
});

signUpTab.addEventListener('click', () => {
    signUpTab.classList.add('active');
    signInTab.classList.remove('active');
    signUpForm.classList.add('active');
    signInForm.classList.remove('active');
    authError.classList.remove('show');
    signUpError.classList.remove('show');
});

// Update categories when type changes
document.getElementById('transactionType').addEventListener('change', initializeCategories);

// Sign In
signInFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        authError.classList.remove('show');
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.add('show');
    }
});

// Sign Up
signUpFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signUpName').value;
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        signUpError.classList.remove('show');
    } catch (error) {
        signUpError.textContent = error.message;
        signUpError.classList.add('show');
    }
});

// Google Sign In
googleSignIn.addEventListener('click', async () => {
    try {
        await auth.signInWithPopup(googleProvider);
        authError.classList.remove('show');
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.add('show');
    }
});

// Google Sign Up
googleSignUp.addEventListener('click', async () => {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        signUpError.classList.remove('show');
    } catch (error) {
        signUpError.textContent = error.message;
        signUpError.classList.add('show');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in - redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        // User is signed out - show auth container
        authContainer.style.display = 'flex';
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
        }
        // Clear any cached user data
        sessionStorage.clear();
        localStorage.removeItem('lastUserEmail');
    }
});

// Modal functions
addTransactionBtn.addEventListener('click', () => {
    transactionModal.classList.add('show');
    transactionForm.reset();
    transactionDate.valueAsDate = new Date();
    initializeCategories();
});

closeModal.addEventListener('click', () => {
    transactionModal.classList.remove('show');
});

cancelTransaction.addEventListener('click', () => {
    transactionModal.classList.remove('show');
});

transactionModal.addEventListener('click', (e) => {
    if (e.target === transactionModal) {
        transactionModal.classList.remove('show');
    }
});

// Add Transaction
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const description = document.getElementById('transactionDescription').value;
    const date = document.getElementById('transactionDate').value;

    try {
        await db.collection('transactions').add({
            userId: user.uid,
            type: type,
            amount: amount,
            category: category,
            description: description,
            date: date,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        transactionModal.classList.remove('show');
        transactionForm.reset();
        loadTransactions();
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Error adding transaction. Please try again.');
    }
});

// Load Transactions
function loadTransactions() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('transactions')
        .where('userId', '==', user.uid)
        .orderBy('date', 'desc')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            transactionsList.innerHTML = '';
            let totalIncome = 0;
            let totalExpense = 0;
            let monthlyIncomeTotal = 0;
            let monthlyExpenseTotal = 0;
            const balanceData = [];
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            // Get last 30 days for balance trend
            const days = [];
            const balances = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                balances.push(0);
            }

            if (snapshot.empty) {
                transactionsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p>No transactions yet. Add your first transaction!</p>
                    </div>
                `;
            }

            snapshot.forEach((doc) => {
                const transaction = { id: doc.id, ...doc.data() };
                displayTransaction(transaction);

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

            // Calculate balance for each day (running total)
            days.forEach((dayLabel, index) => {
                const dayDate = new Date();
                dayDate.setDate(dayDate.getDate() - (29 - index));
                dayDate.setHours(23, 59, 59, 999); // End of day
                
                let balance = 0;
                snapshot.forEach((doc) => {
                    const transaction = { id: doc.id, ...doc.data() };
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
                balances[index] = balance;
            });

            const totalBalanceAmount = totalIncome - totalExpense;
            updateSummary(totalBalanceAmount, monthlyIncomeTotal, monthlyExpenseTotal);
            updateBalanceChart(days, balances);
        }, (error) => {
            console.error('Error loading transactions:', error);
        });
}

// Display Transaction
function displayTransaction(transaction) {
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    transactionItem.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-category">${transaction.category}</div>
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-date">${formatDate(transaction.date)}</div>
        </div>
        <div class="transaction-amount ${transaction.type}">
            ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
        </div>
        <div class="transaction-actions">
            <button class="btn-icon" onclick="deleteTransaction('${transaction.id}')" title="Delete">
                🗑️
            </button>
        </div>
    `;
    transactionsList.appendChild(transactionItem);
}

// Delete Transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        await db.collection('transactions').doc(id).delete();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction. Please try again.');
    }
}

// Update Summary
function updateSummary(balance, monthlyIncomeAmount, monthlyExpenseAmount) {
    totalBalance.textContent = `$${balance.toFixed(2)}`;
    monthlyIncome.textContent = `$${monthlyIncomeAmount.toFixed(2)}`;
    monthlyExpense.textContent = `$${monthlyExpenseAmount.toFixed(2)}`;
}

// Update Balance Chart
function updateBalanceChart(labels, balances) {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    
    if (balanceChart) {
        balanceChart.destroy();
    }

    if (balances.length === 0 || balances.every(b => b === 0)) {
        // Show empty state
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#6B7280';
        ctx.textAlign = 'center';
        ctx.fillText('No balance data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    balanceChart = new Chart(ctx, {
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
                            return '$' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#E5E7EB',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6B7280',
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
                        color: '#6B7280'
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
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}


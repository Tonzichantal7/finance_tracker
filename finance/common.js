// Common utility functions shared across pages

// Global authentication guard
function initAuth() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.replace('index.html');
        }
    });
}

// Prevent back button access after logout
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.replace('index.html');
            }
        });
    }
});

// Transaction categories
const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other'],
    expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other']
};

// Category icons/emojis
const categoryIcons = {
    'Food': '🍔',
    'Transport': '🚗',
    'Shopping': '🛍️',
    'Bills': '💳',
    'Entertainment': '🎬',
    'Healthcare': '🏥',
    'Education': '📚',
    'Salary': '💰',
    'Freelance': '💼',
    'Investment': '📈',
    'Bonus': '🎁',
    'Other': '📦'
};

// Format date to match "Dec 03, 2024" format
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

// Format date short format for recent transactions (e.g., "Dec 2", "Nov 29")
function formatDateShort(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
}

// Format date for transactions page (e.g., "12/2/2025")
function formatDateTransaction(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Load custom categories from Firebase
async function loadCustomCategories() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const customCategories = userData.customCategories || [];
            
            // Add custom categories to the categories object
            customCategories.forEach(cat => {
                if (cat.name && cat.type && (cat.type === 'income' || cat.type === 'expense')) {
                    if (!categories[cat.type].includes(cat.name)) {
                        categories[cat.type].push(cat.name);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading custom categories:', error);
    }
}

// Initialize categories dropdown
async function initializeCategories() {
    const typeSelect = document.getElementById('transactionType');
    const categorySelect = document.getElementById('transactionCategory');
    
    if (!typeSelect || !categorySelect) return;
    
    // Load custom categories from Firebase first
    await loadCustomCategories();
    
    function updateCategories() {
        const type = typeSelect.value;
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }
    
    // Remove existing change listener if any (to avoid duplicates)
    const newTypeSelect = typeSelect.cloneNode(true);
    typeSelect.parentNode.replaceChild(newTypeSelect, typeSelect);
    
    newTypeSelect.addEventListener('change', updateCategories);
    updateCategories();
}

// Transaction modal functionality
function initTransactionModal() {
    const addBtn = document.getElementById('addTransactionBtn');
    const modal = document.getElementById('transactionModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelTransaction');
    const form = document.getElementById('transactionForm');
    const dateInput = document.getElementById('transactionDate');
    
    if (!modal) return;
    
    // Set default date
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    // Open modal
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            modal.classList.add('show');
            if (form) form.reset();
            if (dateInput) dateInput.valueAsDate = new Date();
            initializeCategories();
        });
    }
    
    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Store current editing transaction ID
let editingTransactionId = null;

// Reset transaction form
function resetTransactionForm() {
    const form = document.getElementById('transactionForm');
    const modal = document.getElementById('transactionModal');
    const dateInput = document.getElementById('transactionDate');
    const modalTitle = modal?.querySelector('.modal-header h2');

    if (form) form.reset();
    if (dateInput) dateInput.valueAsDate = new Date();
    if (modalTitle) modalTitle.textContent = 'Add Transaction';
    if (modal) modal.classList.remove('show');
    editingTransactionId = null; // Clear editing state
}

// Transaction form submission
function handleTransactionSubmit(callback) {
    const form = document.getElementById('transactionForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const category = document.getElementById('transactionCategory').value;
        const description = document.getElementById('transactionDescription').value;
        const date = document.getElementById('transactionDate').value;

        try {
            const transactionData = {
                userId: user.uid,
                type: type,
                amount: amount,
                category: category,
                description: description,
                date: date,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // If editing, update existing transaction
            if (editingTransactionId) {
                await db.collection('transactions').doc(editingTransactionId).update(transactionData);
                console.log('Transaction updated with ID:', editingTransactionId);
                editingTransactionId = null;
            } else {
                // Add new transaction
                transactionData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = await db.collection('transactions').add(transactionData);
                console.log('Transaction added with auto-generated ID:', docRef.id);
            }
            
            resetTransactionForm();
            
            if (callback) callback();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Error saving transaction: ' + error.message);
        }
    });
}

// Edit transaction function (make global)
window.editTransaction = async function(id) {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to edit transactions');
        return;
    }

    try {
        const doc = await db.collection('transactions').doc(id).get();
        if (!doc.exists) {
            alert('Transaction not found');
            return;
        }

        const transaction = doc.data();
        
        // Verify ownership
        if (transaction.userId !== user.uid) {
            alert('You do not have permission to edit this transaction');
            return;
        }
        
        // Pre-fill form
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionAmount').value = transaction.amount;
        document.getElementById('transactionCategory').value = transaction.category;
        document.getElementById('transactionDescription').value = transaction.description;
        document.getElementById('transactionDate').value = transaction.date;

        // Update categories dropdown
        initializeCategories();

        // Set editing mode
        editingTransactionId = id;

        // Update modal title
        const modal = document.getElementById('transactionModal');
        const modalTitle = modal?.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Transaction';
        }

        // Open modal
        if (modal) modal.classList.add('show');
    } catch (error) {
        console.error('Error loading transaction for edit:', error);
        alert('Error loading transaction: ' + error.message);
    }
};

// Delete transaction (make global)
window.deleteTransaction = async function(id) {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        return false;
    }

    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to delete transactions');
        return false;
    }

    // Verify the transaction belongs to the current user
    const doc = await db.collection('transactions').doc(id).get();
    if (!doc.exists) {
        alert('Transaction not found');
        return false;
    }

    const transaction = doc.data();
    if (transaction.userId !== user.uid) {
        alert('You do not have permission to delete this transaction');
        return false;
    }

    try {
        await db.collection('transactions').doc(id).delete();
        console.log('Transaction deleted:', id);
        return true;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction. Please try again.');
    }
};


// Categories page functionality

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sidebarContainer').innerHTML = renderSidebar('categories');
    document.getElementById('headerContainer').innerHTML = renderHeader();
    document.getElementById('pageTitle').textContent = 'Categories';
    
    // Wait for auth state
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.replace('index.html');
            return;
        }
        
        initCategoryModal();
        loadCategories();
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

function initCategoryModal() {
    const addBtn = document.getElementById('addCategoryBtn');
    const modal = document.getElementById('categoryModal');
    const closeBtn = document.getElementById('closeCategoryModal');
    const cancelBtn = document.getElementById('cancelCategory');
    const form = document.getElementById('categoryForm');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('categoryModalTitle').textContent = 'Add Category';
            document.getElementById('categoryName').value = '';
            document.getElementById('categoryType').value = 'expense';
            
            // Clear edit mode
            const form = document.getElementById('categoryForm');
            if (form) {
                form.removeAttribute('data-original-name');
                form.removeAttribute('data-original-type');
                form.removeAttribute('data-is-edit');
            }
            
            modal.classList.add('show');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            const form = document.getElementById('categoryForm');
            if (form) {
                form.reset();
                form.removeAttribute('data-original-name');
                form.removeAttribute('data-original-type');
                form.removeAttribute('data-is-edit');
            }
            modal.classList.remove('show');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                alert('You must be logged in to manage categories');
                return;
            }

            const newName = document.getElementById('categoryName').value.trim();
            const newType = document.getElementById('categoryType').value;
            const isEdit = form.dataset.isEdit === 'true';
            const originalName = form.dataset.originalName;
            const originalType = form.dataset.originalType;

            if (!newName) {
                alert('Category name cannot be empty');
                return;
            }

            try {
                if (isEdit && originalName) {
                    // Editing existing category - update all transactions
                    const transactionsSnapshot = await db.collection('transactions')
                        .where('userId', '==', user.uid)
                        .where('category', '==', originalName)
                        .where('type', '==', originalType)
                        .get();

                    if (transactionsSnapshot.size > 0) {
                        const batch = db.batch();
                        let updateCount = 0;
                        transactionsSnapshot.forEach((doc) => {
                            batch.update(doc.ref, {
                                category: newName,
                                type: newType
                            });
                            updateCount++;
                        });
                        await batch.commit();
                        console.log(`Updated ${updateCount} transaction(s) from "${originalName}" to "${newName}"`);
                        
                        // Reset form and close modal first
                        form.reset();
                        form.removeAttribute('data-original-name');
                        form.removeAttribute('data-original-type');
                        form.removeAttribute('data-is-edit');
                        modal.classList.remove('show');

                        // Reload categories to reflect changes
                        loadCategories();
                        
                        alert(`Category "${originalName}" updated to "${newName}". ${updateCount} transaction${updateCount !== 1 ? 's' : ''} updated in database.`);
                    } else {
                        alert(`No transactions found in category "${originalName}".`);
                        
                        // Reset form
                        form.reset();
                        form.removeAttribute('data-original-name');
                        form.removeAttribute('data-original-type');
                        form.removeAttribute('data-is-edit');
                        modal.classList.remove('show');
                    }
                } else {
                    // Adding new category - add it to the categories list so it's available in dropdowns
                    try {
                        // Add to categories object for immediate use
                        if (!categories[newType].includes(newName)) {
                            categories[newType].push(newName);
                        }
                        
                        // Store custom category in user's document for persistence
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        const userData = userDoc.exists ? userDoc.data() : {};
                        const customCategories = userData.customCategories || [];
                        
                        // Check if category already exists
                        const exists = customCategories.some(cat => cat.name === newName && cat.type === newType);
                        if (!exists) {
                            customCategories.push({ name: newName, type: newType });
                            await db.collection('users').doc(user.uid).set({
                                customCategories: customCategories
                            }, { merge: true });
                        }
                        
                        console.log(`Category "${newName}" added successfully`);
                        
                        // Reset form and close modal first
                        form.reset();
                        form.removeAttribute('data-original-name');
                        form.removeAttribute('data-original-type');
                        form.removeAttribute('data-is-edit');
                        modal.classList.remove('show');
                        
                        // Small delay to ensure Firebase has saved, then reload categories
                        setTimeout(() => {
                            loadCategories();
                        }, 500);
                        
                        alert(`Category "${newName}" added successfully! It will appear in the categories list.`);
                    } catch (error) {
                        console.error('Error adding category:', error);
                        alert('Error adding category: ' + error.message);
                    }
                }
            } catch (error) {
                console.error('Error saving category:', error);
                alert('Error saving category: ' + error.message);
            }
        });
    }
}

async function loadCategories() {
    const user = auth.currentUser;
    if (!user) return;

    const incomeCategoriesEl = document.getElementById('incomeCategories');
    const expenseCategoriesEl = document.getElementById('expenseCategories');
    incomeCategoriesEl.innerHTML = '';
    expenseCategoriesEl.innerHTML = '';

    try {
        // Load all transactions to find unique categories
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', user.uid)
            .get();

        const incomeCategories = new Set();
        const expenseCategories = new Set();

        transactionsSnapshot.forEach((doc) => {
            const transaction = doc.data();
            if (transaction.type === 'income') {
                incomeCategories.add(transaction.category);
            } else if (transaction.type === 'expense') {
                expenseCategories.add(transaction.category);
            }
        });

        // Also load custom categories from user document (even if no transactions yet)
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const customCategories = userData.customCategories || [];
                
                customCategories.forEach(cat => {
                    if (cat.name && cat.type) {
                        if (cat.type === 'income') {
                            incomeCategories.add(cat.name);
                        } else if (cat.type === 'expense') {
                            expenseCategories.add(cat.name);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading custom categories:', error);
        }

        let incomeCount = 0;
        let expenseCount = 0;

        // Load income categories (both from transactions and custom)
        incomeCategories.forEach(cat => {
            loadCategoryStats('income', cat, incomeCategoriesEl);
            incomeCount++;
        });
        
        // Load expense categories (both from transactions and custom)
        expenseCategories.forEach(cat => {
            loadCategoryStats('expense', cat, expenseCategoriesEl);
            expenseCount++;
        });

        // Update counts
        document.getElementById('incomeTitle').textContent = `Income Categories (${incomeCount})`;
        document.getElementById('expenseTitle').textContent = `Expense Categories (${expenseCount})`;
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function loadCategoryStats(type, categoryName, container) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('transactions')
        .where('userId', '==', user.uid)
        .where('type', '==', type)
        .where('category', '==', categoryName)
        .get()
        .then((snapshot) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-list-item';
            
            const dotColor = type === 'income' ? '#10B981' : '#EF4444';
            
            // Count transactions in this category
            let transactionCount = snapshot.size;
            let totalAmount = 0;
            snapshot.forEach((doc) => {
                const transaction = doc.data();
                totalAmount += transaction.amount || 0;
            });
            
            categoryItem.innerHTML = `
                <div class="category-list-item-left">
                    <div class="category-dot" style="background: ${dotColor};"></div>
                    <div>
                        <span class="category-name-text">${categoryName}</span>
                        <span class="category-type-badge ${type}">${type === 'income' ? 'Income' : 'Expense'}</span>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn-edit" onclick="event.stopPropagation(); editCategory('${categoryName}', '${type}')" title="Edit Category">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.3333 2.00004C11.5084 1.82493 11.7163 1.68605 11.9452 1.59131C12.174 1.49658 12.4192 1.44775 12.6667 1.44775C12.9141 1.44775 13.1593 1.49658 13.3882 1.59131C13.617 1.68605 13.8249 1.82493 14 2.00004C14.1751 2.17515 14.314 2.3831 14.4087 2.61196C14.5035 2.84082 14.5523 3.08601 14.5523 3.33337C14.5523 3.58073 14.5035 3.82593 14.4087 4.05479C14.314 4.28365 14.1751 4.4916 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteCategory('${categoryName}', '${type}')" title="Delete Category">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4H14M6 4V2C6 1.73478 6.10536 1.48043 6.29289 1.29289C6.48043 1.10536 6.73478 1 7 1H9C9.26522 1 9.51957 1.10536 9.70711 1.29289C9.89464 1.48043 10 1.73478 10 2V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33334 13.687 3.33334 13.3333V4H12.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
            
            container.appendChild(categoryItem);
        })
        .catch((error) => {
            console.error('Error loading category stats:', error);
        });
}


async function editCategory(name, type) {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to edit categories');
        return;
    }

    // Open modal for editing
    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('categoryModalTitle');
    const categoryNameInput = document.getElementById('categoryName');
    const categoryTypeSelect = document.getElementById('categoryType');
    const form = document.getElementById('categoryForm');

    if (!modal || !modalTitle || !categoryNameInput || !categoryTypeSelect || !form) {
        console.error('Category modal elements not found');
        return;
    }

    // Pre-fill form
    modalTitle.textContent = 'Edit Category';
    categoryNameInput.value = name;
    categoryTypeSelect.value = type;
    
    // Store original name and type for updating transactions
    form.dataset.originalName = name;
    form.dataset.originalType = type;
    form.dataset.isEdit = 'true';

    modal.classList.add('show');
}

async function deleteCategory(name, type) {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to delete categories');
        return;
    }

    // Check if there are transactions using this category
    const transactionsSnapshot = await db.collection('transactions')
        .where('userId', '==', user.uid)
        .where('category', '==', name)
        .where('type', '==', type)
        .get();

    const transactionCount = transactionsSnapshot.size;

    let message = `Are you sure you want to delete the category "${name}"?`;
    if (transactionCount > 0) {
        message += `\n\nThis category has ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''}. `;
        message += 'These transactions will be deleted as well. This action cannot be undone.';
    } else {
        message += '\n\nThis action cannot be undone.';
    }

    // Show confirmation dialog
    if (!confirm(message)) {
        return; // User clicked cancel
    }

    // User clicked OK/Delete - proceed with deletion
    try {
        // Delete all transactions in this category
        if (transactionCount > 0) {
            const batch = db.batch();
            transactionsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`Deleted ${transactionCount} transaction(s) for category "${name}"`);
        }

        // Reload categories - this will remove the category since transactions are deleted
        loadCategories();
        
        console.log(`Category "${name}" and ${transactionCount} transaction(s) deleted successfully from database`);
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category: ' + error.message);
        // Reload categories on error to ensure consistency
        loadCategories();
    }
}


// Shared Sidebar Navigation Component
function renderSidebar(activePage = 'dashboard') {
    return `
        <aside class="sidebar">
            <div class="sidebar-brand">
                <h1 class="brand-title">Finance</h1>
                <p class="brand-subtitle">Personal Tracker</p>
            </div>
            
            <nav class="sidebar-nav">
                <a href="dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor"/>
                        <rect x="11" y="3" width="6" height="6" rx="1" fill="currentColor"/>
                        <rect x="3" y="11" width="6" height="6" rx="1" fill="currentColor"/>
                        <rect x="11" y="11" width="6" height="6" rx="1" fill="currentColor"/>
                    </svg>
                    <span>Dashboard</span>
                </a>
                <a href="transactions.html" class="nav-item ${activePage === 'transactions' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M2.5 5L10 10L17.5 5M3.33333 15H16.6667C17.5871 15 18.3333 14.2538 18.3333 13.3333V6.66667C18.3333 5.74619 17.5871 5 16.6667 5H3.33333C2.41286 5 1.66667 5.74619 1.66667 6.66667V13.3333C1.66667 14.2538 2.41286 15 3.33333 15Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                    <span>Transactions</span>
                </a>
                <a href="categories.html" class="nav-item ${activePage === 'categories' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M7.5 7.5H12.5M7.5 10H12.5M7.5 12.5H10M3.33333 5.83333H16.6667C17.5871 5.83333 18.3333 6.57952 18.3333 7.5V15.8333C18.3333 16.7538 17.5871 17.5 16.6667 17.5H3.33333C2.41286 17.5 1.66667 16.7538 1.66667 15.8333V7.5C1.66667 6.57952 2.41286 5.83333 3.33333 5.83333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                    <span>Categories</span>
                </a>
                <a href="analytics.html" class="nav-item ${activePage === 'analytics' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3.33333 15L3.33333 12.5M8.33333 15L8.33333 8.33333M13.3333 15L13.3333 5M16.6667 15L16.6667 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                    <span>Analytics</span>
                </a>
                <a href="settings.html" class="nav-item ${activePage === 'settings' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        <path d="M16.0917 13.3083L15.8333 13.5167L13.6917 15.6583L13.4833 15.9167C13.175 16.2917 12.6583 16.325 12.3083 15.9917L10.575 14.4167C10.4333 14.3 10.2417 14.2583 10.0583 14.3L9.39167 14.4583C8.875 14.575 8.325 14.3083 8.04167 13.8333L7.16667 12.325C6.925 11.9083 7.01667 11.3833 7.375 11.0833L8.04167 10.5167C8.19167 10.3917 8.28333 10.2 8.29167 10L8.43333 9.33333C8.53333 8.81667 8.3 8.29167 7.875 8.04167L6.36667 7.16667C5.95 6.925 5.425 7.01667 5.125 7.375L4.55833 8.04167C4.43333 8.19167 4.24167 8.28333 4.04167 8.29167L3.375 8.43333C2.85833 8.53333 2.33333 8.3 2.08333 7.875L1.20833 6.36667C0.966667 5.95 1.05833 5.425 1.41667 5.125L2.08333 4.55833C2.23333 4.43333 2.275 4.24167 2.20833 4.05833L1.80833 2.66667C1.64167 2.19167 1.88333 1.66667 2.35833 1.5L3.75 1.1C4.225 0.933333 4.75 1.175 4.91667 1.65L5.25 2.70833C5.31667 2.89167 5.45833 3.03333 5.64167 3.1L6.7 3.43333C7.175 3.6 7.40833 4.11667 7.24167 4.59167L6.84167 5.98333C6.775 6.16667 6.81667 6.35833 6.94167 6.50833L7.50833 7.175C7.80833 7.53333 7.71667 8.05833 7.3 8.3L8.175 9.80833C8.41667 10.225 8.325 10.75 7.96667 11.05L7.3 11.6167C7.15 11.7417 7.05833 11.9333 7.05 12.1333L6.90833 12.8C6.80833 13.3167 7.04167 13.8417 7.46667 14.0917L8.975 14.9667C9.39167 15.2083 9.91667 15.1167 10.2167 14.7583L10.7833 14.0917C10.9333 13.9667 11.125 13.925 11.3083 13.9917L12.7 14.3917C13.175 14.5583 13.7 14.3167 13.8667 13.8417L14.2667 12.45C14.3333 12.2667 14.475 12.125 14.6583 12.0583L15.7167 11.725C16.1917 11.5583 16.7167 11.8 16.8833 12.275L17.2833 13.6667C17.35 13.85 17.3083 14.0417 17.1833 14.1917L16.6167 14.8583C16.3167 15.2167 16.4083 15.7417 16.825 15.9833L18.3333 16.8583C18.75 17.1 18.8417 17.625 18.4833 17.925L17.8167 18.4917C17.6667 18.6167 17.625 18.8083 17.6917 18.9917L18.0917 20.3833C18.2583 20.8583 18.0167 21.3833 17.5417 21.55L16.15 21.95C15.675 22.1167 15.15 21.875 14.9833 21.4L14.65 20.3417C14.5833 20.1583 14.4417 20.0167 14.2583 19.95L13.2 19.6167C12.725 19.45 12.4917 18.9333 12.6583 18.4583L13.0583 17.0667C13.125 16.8833 13.0833 16.6917 12.9583 16.5417L12.3917 15.875C12.0917 15.5167 12.1833 14.9917 12.6 14.75L13.775 14.0833" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                    <span>Settings</span>
                </a>
            </nav>
            
            <button class="btn-signout" id="logoutBtn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10.6667 11.3333L14 8L10.6667 4.66667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Sign Out
            </button>
        </aside>
    `;
}

// Shared auth and header functionality
function renderHeader() {
    return `
        <header class="main-header">
            <h1 class="page-title" id="pageTitle">Dashboard</h1>
            <div class="user-info" id="userInfo">
                <div class="user-details">
                    <span class="user-name" id="userName">User</span>
                    <span class="user-email" id="userEmail">user@example.com</span>
                </div>
                <div class="user-avatar">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="20" fill="#E6F7F0"/>
                        <path d="M20 20C22.7614 20 25 17.7614 25 15C25 12.2386 22.7614 10 20 10C17.2386 10 15 12.2386 15 15C15 17.7614 17.2386 20 20 20Z" fill="#10B981"/>
                        <path d="M20 22.5C15.5817 22.5 11.85 25.1 10 28.75C10 29.9441 10.5268 31.0897 11.4645 31.8936C12.4021 32.6974 13.6739 33.0833 15 33.0833H25C26.3261 33.0833 27.5979 32.6974 28.5355 31.8936C29.4732 31.0897 30 29.9441 30 28.75C28.15 25.1 24.4183 22.5 20 22.5Z" fill="#10B981"/>
                    </svg>
                </div>
            </div>
        </header>
    `;
}

// Initialize auth state and user info
function initAuth() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Update user info in header
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        
        if (userNameEl) {
            userNameEl.textContent = user.displayName || user.email?.split('@')[0] || 'User';
        }
        if (userEmailEl) {
            userEmailEl.textContent = user.email || '';
        }
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}


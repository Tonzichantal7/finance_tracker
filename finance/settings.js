// Settings page functionality

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sidebarContainer').innerHTML = renderSidebar('settings');
    document.getElementById('headerContainer').innerHTML = renderHeader();
    document.getElementById('pageTitle').textContent = 'Settings';
    
    // Wait for auth state
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.replace('index.html');
            return;
        }
        
        loadUserSettings();
        initSettingsForms();
        initSettingsTabs();
        initPasswordModal();
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

function initSettingsTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.settings-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active to clicked
            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
}

function initPasswordModal() {
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const passwordModal = document.getElementById('passwordModal');
    const closePasswordModal = document.getElementById('closePasswordModal');
    const cancelPassword = document.getElementById('cancelPassword');

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            passwordModal.classList.add('show');
        });
    }

    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', () => {
            passwordModal.classList.remove('show');
        });
    }

    if (cancelPassword) {
        cancelPassword.addEventListener('click', () => {
            passwordModal.classList.remove('show');
        });
    }

    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) {
                passwordModal.classList.remove('show');
            }
        });
    }
}

function loadUserSettings() {
    const user = auth.currentUser;
    if (!user) return;

    const displayName = document.getElementById('displayName');
    const email = document.getElementById('email');

    if (displayName) {
        displayName.value = user.displayName || '';
    }
    if (email) {
        email.value = user.email || '';
    }
    
    // Load preferences from Firestore
    loadPreferences();
}

function loadPreferences() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const currency = document.getElementById('currency');
                const emailNotifications = document.getElementById('emailNotifications');
                
                if (currency && data.currency) {
                    currency.value = data.currency;
                }
                
                if (emailNotifications !== null) {
                    emailNotifications.checked = data.emailNotifications !== false; // Default to true
                }
            } else {
                // Set defaults
                const emailNotifications = document.getElementById('emailNotifications');
                if (emailNotifications !== null) {
                    emailNotifications.checked = true;
                }
            }
        })
        .catch((error) => {
            console.error('Error loading preferences:', error);
        });
}

function initSettingsForms() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const currency = document.getElementById('currency');
    const emailNotifications = document.getElementById('emailNotifications');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const displayName = document.getElementById('displayName').value;

            try {
                await user.updateProfile({ displayName });
                await db.collection('users').doc(user.uid).update({
                    name: displayName
                });
                alert('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Error updating profile. Please try again.');
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                alert('New passwords do not match!');
                return;
            }

            try {
                await user.updatePassword(newPassword);
                alert('Password changed successfully!');
                passwordForm.reset();
            } catch (error) {
                console.error('Error changing password:', error);
                alert('Error changing password. Please try again.');
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            showDeleteConfirmation();
        });
    }

    // Save preferences
    if (currency) {
        currency.addEventListener('change', () => {
            savePreferences();
        });
    }

    if (emailNotifications) {
        emailNotifications.addEventListener('change', () => {
            savePreferences();
        });
    }
}

function savePreferences() {
    const user = auth.currentUser;
    if (!user) return;

    const currency = document.getElementById('currency')?.value || 'USD';
    const emailNotifications = document.getElementById('emailNotifications')?.checked !== false;

    db.collection('users').doc(user.uid).set({
        currency: currency,
        emailNotifications: emailNotifications
    }, { merge: true })
        .then(() => {
            console.log('Preferences saved successfully');
        })
        .catch((error) => {
            console.error('Error saving preferences:', error);
            alert('Error saving preferences. Please try again.');
        });
}

function showDeleteConfirmation() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
        deleteAccount();
    }
}

async function deleteAccount() {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to delete your account');
        return;
    }

    const userUid = user.uid;

    try {
        await user.delete();
        
        // Delete Firestore data
        const batch = db.batch();
        
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', userUid)
            .get();
        
        transactionsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        batch.delete(db.collection('users').doc(userUid));
        await batch.commit();

        await auth.signOut();
        alert('Account deleted successfully!');
        window.location.href = 'index.html';
        
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            const password = prompt('For security, please enter your password to confirm account deletion:');
            if (password) {
                await reauthenticateAndDelete(password);
            }
        } else {
            alert('Error deleting account: ' + error.message);
        }
    }
}

async function reauthenticateAndDelete(password) {
    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    
    try {
        await user.reauthenticateWithCredential(credential);
        await deleteAccount();
    } catch (error) {
        alert('Authentication failed. Please check your password and try again.');
    }
}


// Settings page functionality

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sidebarContainer').innerHTML = renderSidebar('settings');
    document.getElementById('headerContainer').innerHTML = renderHeader();
    document.getElementById('pageTitle').textContent = 'Settings';
    
    // Wait for auth state
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        loadUserSettings();
        initSettingsForms();
        initSettingsTabs();
        initPasswordModal();
    });
    
    initAuth();
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
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.')) {
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                alert('You must be logged in to delete your account');
                return;
            }

            const userUid = user.uid; // Store UID before deletion
            const userEmail = user.email; // Store email for logging

            try {
                console.log('Starting account deletion for user:', userUid);
                
                // IMPORTANT: Try to delete Firebase Auth account FIRST
                // This way if it fails, we don't lose Firestore data
                console.log('Attempting to delete Firebase Auth account...');
                try {
                    await user.delete();
                    console.log('Firebase Auth account deleted successfully');
                } catch (authError) {
                    console.error('Auth deletion error:', authError);
                    if (authError.code === 'auth/requires-recent-login') {
                        alert('For security reasons, Firebase requires recent authentication to delete your account.\n\nPlease log out and log back in, then try deleting your account again.\n\nYour data has NOT been deleted.');
                        return; // Don't proceed with Firestore deletion
                    } else {
                        // Other auth errors - still try to proceed but warn user
                        throw authError; // Re-throw to be caught by outer catch
                    }
                }
                
                // Only delete Firestore data if Auth deletion succeeded
                console.log('Deleting Firestore data...');
                const batch = db.batch();
                
                // Delete all transactions
                const transactionsSnapshot = await db.collection('transactions')
                    .where('userId', '==', userUid)
                    .get();
                
                console.log(`Found ${transactionsSnapshot.size} transactions to delete`);
                transactionsSnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                // Delete user document
                const userRef = db.collection('users').doc(userUid);
                batch.delete(userRef);

                await batch.commit();
                console.log('Firestore data deleted successfully');

                // Sign out to clear local session
                await auth.signOut();
                console.log('User signed out');

                alert('Account deleted successfully! You will be redirected to the login page.');
                
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                
            } catch (error) {
                console.error('Error deleting account:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                
                // Check if Auth account was deleted but Firestore deletion failed
                // In that case, try to clean up what we can
                if (error.code === 'auth/user-token-expired' || error.code === 'auth/user-not-found') {
                    // Auth account might already be deleted, try to delete Firestore data with admin-like approach
                    // But we can't do this from client side, so just inform user
                    alert('Account deletion partially completed. Some data may remain. Please contact support if you continue to see issues.');
                    await auth.signOut();
                    window.location.href = 'index.html';
                    return;
                }
                
                if (error.code === 'auth/requires-recent-login') {
                    alert('For security reasons, you need to log out and log back in before deleting your account. Please try again after logging in.');
                } else {
                    alert('Error deleting account: ' + error.message + '\n\nError code: ' + error.code + '\n\nPlease try logging out and logging back in, then try again.');
                }
            }
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


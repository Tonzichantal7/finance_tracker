// Simple authentication system
document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('authContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    
    // ALWAYS show auth page first
    authContainer.style.display = 'flex';
    dashboardContainer.style.display = 'none';
    
    // Sign In
    document.getElementById('signInFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            document.getElementById('authError').textContent = error.message;
            document.getElementById('authError').classList.add('show');
        }
    });
    
    // Sign Up
    document.getElementById('signUpFormElement').addEventListener('submit', async (e) => {
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
        } catch (error) {
            document.getElementById('signUpError').textContent = error.message;
            document.getElementById('signUpError').classList.add('show');
        }
    });
    
    // Tab switching
    document.getElementById('signInTab').addEventListener('click', () => {
        document.getElementById('signInTab').classList.add('active');
        document.getElementById('signUpTab').classList.remove('active');
        document.getElementById('signInForm').classList.add('active');
        document.getElementById('signUpForm').classList.remove('active');
    });
    
    document.getElementById('signUpTab').addEventListener('click', () => {
        document.getElementById('signUpTab').classList.add('active');
        document.getElementById('signInTab').classList.remove('active');
        document.getElementById('signUpForm').classList.add('active');
        document.getElementById('signInForm').classList.remove('active');
    });
    
    // Auth state observer - MUST authenticate first
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User authenticated - show dashboard
            authContainer.style.display = 'none';
            dashboardContainer.style.display = 'flex';
            
            // Update user info
            document.getElementById('userName').textContent = user.displayName || 'User';
            document.getElementById('userEmail').textContent = user.email;
            
            // Prevent back button
            history.pushState(null, null, location.href);
        } else {
            // No user - stay on auth page
            authContainer.style.display = 'flex';
            dashboardContainer.style.display = 'none';
        }
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
    });
    
    // Prevent back button after login
    window.addEventListener('popstate', () => {
        if (auth.currentUser) {
            history.pushState(null, null, location.href);
        }
    });
});
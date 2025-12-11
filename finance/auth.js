// FORCE AUTH PAGE - NO DASHBOARD ACCESS WITHOUT LOGIN
document.getElementById('authContainer').style.display = 'flex';
document.getElementById('dashboardContainer').style.display = 'none';
document.body.style.visibility = 'visible';

document.addEventListener('DOMContentLoaded', () => {
    
    // Sign In
    document.getElementById('signInFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: name,
                email: email,
                createdAt: serverTimestamp()
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
    
});

// Auth observer - MUST LOGIN FIRST
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Show dashboard only after login
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'flex';
        document.getElementById('userName').textContent = user.displayName || 'User';
        document.getElementById('userEmail').textContent = user.email;
    } else {
        // Force auth page
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('dashboardContainer').style.display = 'none';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth);
    sessionStorage.clear();
    localStorage.clear();
});

// Prevent back button after login
window.addEventListener('popstate', () => {
    if (auth.currentUser) {
        history.pushState(null, null, location.href);
    }
});

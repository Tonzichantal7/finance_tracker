# Finance Tracker

A modern, full-featured finance tracking application built with HTML, CSS, and JavaScript, integrated with Firebase for authentication and data storage.

## Features

- 🔐 **User Authentication**
  - Email/Password sign up and sign in
  - Google OAuth authentication
  - Secure session management

- 💰 **Transaction Management**
  - Add income and expense transactions
  - Categorize transactions
  - Delete transactions
  - View transaction history

- 📊 **Dashboard**
  - Real-time summary cards (Total Income, Total Expenses, Balance)
  - Visual expense breakdown by category (Doughnut chart)
  - Responsive design

- 🎨 **Modern UI**
  - Clean, intuitive interface
  - Responsive design for all devices
  - Smooth animations and transitions

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Enable "Google" provider
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set security rules (see below)

### 2. Firebase Security Rules

**IMPORTANT:** You must set up Firestore security rules for the app to work properly. 

Go to Firebase Console > Firestore Database > Rules and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      // Allow read if user is authenticated and owns the transaction
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Allow create if user is authenticated and sets their own userId
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      
      // Allow update/delete if user is authenticated and owns the transaction
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

**After pasting the rules, click "Publish" to save them.**

> **Note:** A file named `firestore.rules` is included in this project with these same rules for reference.

### 3. Configure Firebase

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click on the Web icon (`</>`) to add a web app
4. Copy your Firebase configuration
5. Open `firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Configure Google OAuth (Optional but Recommended)

1. In Firebase Console, go to Authentication > Sign-in method
2. Click on Google provider
3. Enable it and add your authorized domains
4. Configure OAuth consent screen in Google Cloud Console if needed

### 5. Firestore Indexes

The app queries transactions by `userId`, `date`, and `createdAt`. Firebase will prompt you to create the necessary indexes when you first use the app. Click the link in the error message to create them automatically.

Alternatively, you can create the index manually:
- Collection: `transactions`
- Fields: `userId` (Ascending), `date` (Descending), `createdAt` (Descending)

### 6. Run the Application

1. You can use any static file server:
   - **VS Code**: Install "Live Server" extension and right-click `index.html` > "Open with Live Server"
   - **Python**: `python -m http.server 8000`
   - **Node.js**: `npx serve`
   - Or simply open `index.html` in a modern browser (may have CORS restrictions)

2. Open the application in your browser
3. Create an account or sign in
4. Start adding your transactions!

## File Structure

```
finance/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── app.js              # Main JavaScript application logic
├── firebase-config.js  # Firebase configuration
└── README.md           # This file
```

## Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Application logic
- **Firebase Authentication** - User authentication
- **Cloud Firestore** - Database
- **Chart.js** - Data visualization

## Transaction Categories

### Income Categories
- Salary
- Freelance
- Investment
- Bonus
- Other

### Expense Categories
- Food
- Transport
- Shopping
- Bills
- Entertainment
- Healthcare
- Education
- Other

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions, please check:
- Firebase Documentation: https://firebase.google.com/docs
- Chart.js Documentation: https://www.chartjs.org/docs/


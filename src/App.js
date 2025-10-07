import React, { useState, useEffect } from 'react';
// Import the necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { 
  getAuth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
// User's actual project credentials have been inserted here.
const firebaseConfig = {
  apiKey: "AIzaSyAM5fhzTSWEff4YbXIrrfeBc0YaVqNVteo",
  authDomain: "lms-webapp-9a28a.firebaseapp.com",
  projectId: "lms-webapp-9a28a",
  storageBucket: "lms-webapp-9a28a.appspot.com",
  messagingSenderId: "974434104133",
  appId: "1:974434104133:web:6a085f2faf49f6d1b1842c"
};

// Initialize Firebase and export the services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// --- END OF FIREBASE CONFIGURATION ---


// Main App component now acts as the router and state manager
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('login');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleView = () => {
    setAuthView(currentView => (currentView === 'login' ? 'register' : 'login'));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (user) {
    return <DashboardPage />;
  } else {
    return authView === 'login' ? <LoginPage onToggleView={toggleView} /> : <RegisterPage onToggleView={toggleView} />;
  }
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// AUTHENTICATION PAGE COMPONENTS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const AuthLogo = () => (
    <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </div>
);
const AuthFormHeader = ({ type }) => (
    <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Progresso</h1>
        <p className="text-gray-500 mt-1">{type === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
    </div>
);
const AuthFormInput = ({ id, type, label, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
        <input id={id} type={type} value={value} onChange={onChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder={placeholder} />
    </div>
);

// --- Login Page ---
const LoginForm = ({ onToggleView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error("Login error:", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6 w-full">
      <AuthFormInput id="email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" />
      <AuthFormInput id="password" type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div><button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-gray-800 hover:bg-gray-900 focus:outline-none">Login</button></div>
      <div className="flex justify-between items-center text-sm">
        <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Forgot Password?</a>
        <p className="text-gray-600">Need an account? <button type="button" onClick={onToggleView} className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none">Sign up</button></p>
      </div>
    </form>
  );
};

const LoginPage = ({ onToggleView }) => (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      <div className="w-1/2 bg-blue-800 hidden lg:block"></div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8"><div className="max-w-md w-full"><div className="flex flex-col items-center"><AuthLogo /><AuthFormHeader type="login" /></div><LoginForm onToggleView={onToggleView} /><p className="text-center text-xs text-gray-400 mt-10">&copy; Powered by DFS</p></div></div>
    </div>
);

// --- Register Page (Now with Full Name) ---
const RegisterForm = ({ onToggleView }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store user's full name and other info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: user.email,
        createdAt: new Date(),
        enrolledCourses: []
      });
    } catch (err) {
      setError('Failed to create an account. The email may already be in use.');
      console.error("Registration error:", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6 w-full">
      <AuthFormInput id="reg-name" type="text" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
      <AuthFormInput id="reg-email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" />
      <AuthFormInput id="reg-password" type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      <AuthFormInput id="reg-confirm-password" type="password" label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div><button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-gray-800 hover:bg-gray-900 focus:outline-none">Create Account</button></div>
      <div className="text-center text-sm"><p className="text-gray-600">Already have an account? <button type="button" onClick={onToggleView} className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none">Log in</button></p></div>
    </form>
  );
};

const RegisterPage = ({ onToggleView }) => (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      <div className="w-1/2 bg-blue-800 hidden lg:block"></div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8"><div className="max-w-md w-full"><div className="flex flex-col items-center"><AuthLogo /><AuthFormHeader type="register" /></div><RegisterForm onToggleView={onToggleView} /><p className="text-center text-xs text-gray-400 mt-10">&copy; Powered by DFS</p></div></div>
    </div>
);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// NEW DYNAMIC DASHBOARD PAGE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const SidebarNavItem = ({ icon, children, active }) => (
    <a href="#" className={`flex items-center px-4 py-2.5 text-gray-600 rounded-lg transition-colors duration-200 ${active ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-gray-100'}`}>
        {icon} <span className="ml-3">{children}</span>
    </a>
);
const StatCard = ({ icon, title, value, color }) => (
    <div className={`flex items-center p-5 bg-${color}-100 rounded-xl`}>
        <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-${color}-200 text-${color}-600`}>{icon}</div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const DashboardPage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserData(userDocSnap.data());
                    setLoading(false); // Stop loading ONLY when data is successfully fetched
                } else {
                    // This handles the case where the user is authenticated but their data is missing from Firestore
                    // (e.g., if the 'users' collection was cleared). We force a logout.
                    console.error("User data not found in Firestore. Forcing logout.");
                    handleLogout();
                }
            } else {
                // If there's no current user for some reason, stop loading.
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    };

    const icons = {
        logo: <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" /></svg>,
        dashboard: <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>,
        courses: <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 005.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0014.5 16c1.255 0 2.443-.29 3.5-.804V4.804A7.968 7.968 0 0014.5 4z" /></svg>,
        settings: <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>,
        logout: <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>,
        notification: <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
        enrolled: <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" /></svg>,
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
    }
    
    // Extract the first name for a personal welcome
    const firstName = userData?.fullName?.split(' ')[0] || 'User';

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
                <div className="h-16 flex items-center px-4">
                    <div className="bg-indigo-600 p-2 rounded-lg mr-3">{icons.logo}</div>
                    <span className="text-xl font-bold text-gray-800">Progresso</span>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-2">
                    <SidebarNavItem icon={icons.dashboard} active>Dashboard</SidebarNavItem>
                    <SidebarNavItem icon={icons.courses}>My Courses</SidebarNavItem>
                </nav>
                <div className="px-4 py-4 space-y-2">
                    <SidebarNavItem icon={icons.settings}>Settings</SidebarNavItem>
                    <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2.5 text-gray-600 rounded-lg transition-colors duration-200 hover:bg-gray-100">
                        {icons.logout} <span className="ml-3">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {firstName}!</h1>
                        <p className="text-sm text-gray-500">Here's your learning dashboard for today.</p>
                    </div>
                    <div className="flex items-center space-x-6">
                        <button className="p-2 rounded-full hover:bg-gray-100">{icons.notification}</button>
                    </div>
                </header>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <StatCard icon={icons.enrolled} title="Enrolled Courses" value={userData?.enrolledCourses?.length || 0} color="indigo" />
                        {/* Placeholders for future functionality */}
                        <StatCard icon={icons.enrolled} title="Courses Completed" value="0" color="green" />
                        <StatCard icon={icons.enrolled} title="Pending Assignments" value="0" color="yellow" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 mb-4">My Courses</h2>
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <p className="text-gray-600 text-center">You are not enrolled in any courses yet. Explore our course catalog to get started!</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;



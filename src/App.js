/// Version 2.2
/// Last updated: 2025-10-15
/// Implemented live Firebase data for Admissions and Finance modules.

import React, { useState, useEffect } from 'react';

// --- Firebase SDK Imports ---
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';

// --- UI & Helper Library Imports ---
import toast, { Toaster } from 'react-hot-toast';

// --- Firebase Configuration ---
// Placed directly here for the sandboxed environment.
// In production, use environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyAM5fhzTSWEff4YbXIrrfeBc0YaVqNVteo",
  authDomain: "lms-webapp-9a28a.firebaseapp.com",
  projectId: "lms-webapp-9a28a",
  storageBucket: "lms-webapp-9a28a.appspot.com",
  messagingSenderId: "974434104133",
  appId: "1:974434104133:web:6a085f2faf49f6d1b1842c"
};


// --- Pre-initialization Check for Firebase Config ---
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

// --- Firebase Service Initialization (only if configured) ---
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const auth = isFirebaseConfigured ? getAuth(app) : null;
const db = isFirebaseConfigured ? getFirestore(app) : null;
const storage = isFirebaseConfigured ? getStorage(app) : null;

// =================================================================================================
// --- HELPER & UTILITY COMPONENTS ---
// =================================================================================================

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`}></div>
);

const MissingFirebaseConfig = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg text-center border-t-4 border-red-500">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Firebase Configuration Missing</h1>
      <p className="text-gray-600 mb-6">
        Your application is not configured to connect to Firebase. This can happen if the configuration object is empty.
      </p>
       <div className="bg-gray-50 p-4 rounded-md text-left">
        <p className="font-semibold mb-2">How to fix this:</p>
         <p className="text-sm text-gray-700">Ensure the `firebaseConfig` object in `App.js` is filled with your project's credentials from the Firebase console.</p>
      </div>
    </div>
  </div>
);


// =================================================================================================
// --- CORE APP COMPONENT ---
// =================================================================================================

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('login');
  const [adminView, setAdminView] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAdminView('dashboard');
      setSelectedStudentId(null);
      toast.success('Signed out successfully.');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast.error('Failed to sign out.');
    }
  };

  const toggleAuthView = () => {
    setAuthView(currentView => (currentView === 'login' ? 'register' : 'login'));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-sans text-gray-600">Loading Application...</div>;
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {user ? (
        <AdminLayout 
          adminView={adminView} 
          setAdminView={setAdminView} 
          handleLogout={handleLogout} 
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
        />
      ) : (
        authView === 'login' 
          ? <LoginPage onToggleView={toggleAuthView} /> 
          : <RegisterPage onToggleView={toggleAuthView} />
      )}
    </>
  );
};

// =================================================================================================
// --- ADMIN PANEL COMPONENTS ---
// =================================================================================================

const AdminLayout = ({ adminView, setAdminView, handleLogout, selectedStudentId, setSelectedStudentId }) => {
  const icons = {
    dashboard: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    student: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    admissions: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    finance: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    course: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" /></svg>,
    logout: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
  };

  const isStudentViewActive = ['all_students', 'enroll_student', 'student_profile'].includes(adminView);
  const isAdmissionsViewActive = ['admissions_overview', 'inquiry_list', 'admission_form', 'applications_management'].includes(adminView);
  const isFinanceViewActive = ['fees_dashboard', 'student_fee_records'].includes(adminView);

  const renderCurrentView = () => {
    switch (adminView) {
      case 'dashboard': return <AdminDashboard setAdminView={setAdminView} />;
      case 'all_students': return <AllStudentsPage setAdminView={setAdminView} setSelectedStudentId={setSelectedStudentId} />;
      case 'enroll_student': return <EnrollStudentPage setAdminView={setAdminView} />;
      case 'student_profile': return <StudentProfilePage setAdminView={setAdminView} studentId={selectedStudentId} />;
      case 'course_management': return <CourseManagementPage />;
      case 'admissions_overview': return <AdmissionsOverviewPage setAdminView={setAdminView} />;
      case 'inquiry_list': return <InquiryListPage setAdminView={setAdminView} />;
      case 'admission_form': return <AdmissionFormPage setAdminView={setAdminView} />;
      case 'applications_management': return <ApplicationsManagementPage setAdminView={setAdminView} />;
      case 'fees_dashboard': return <FeesDashboardPage setAdminView={setAdminView} />;
      case 'student_fee_records': return <StudentFeeRecordsPage setAdminView={setAdminView} />;
      default: return <AdminDashboard setAdminView={setAdminView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b px-4">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem icon={icons.dashboard} label="Dashboard" onClick={() => setAdminView('dashboard')} isActive={adminView === 'dashboard'} />
          <NavItem icon={icons.student} label="Students" onClick={() => setAdminView('all_students')} isActive={isStudentViewActive} />
          <NavItem icon={icons.admissions} label="Admissions" onClick={() => setAdminView('admissions_overview')} isActive={isAdmissionsViewActive} />
          <NavItem icon={icons.course} label="Courses" onClick={() => setAdminView('course_management')} isActive={adminView === 'course_management'} />
          <NavItem icon={icons.finance} label="Finance" onClick={() => setAdminView('fees_dashboard')} isActive={isFinanceViewActive} />
        </nav>
        <div className="px-4 py-4 border-t">
          <NavItem icon={icons.logout} label="Logout" onClick={handleLogout} />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {renderCurrentView()}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex items-center w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
    {icon} <span className="ml-3">{label}</span>
  </button>
);

const AdminDashboard = ({ setAdminView }) => {
  const [studentCount, setStudentCount] = useState(null);
  const [courseCount, setCourseCount] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const studentsSnap = await getDocs(collection(db, 'students'));
        const coursesSnap = await getDocs(collection(db, 'courses'));
        setStudentCount(studentsSnap.size);
        setCourseCount(coursesSnap.size);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        toast.error('Could not load dashboard data.');
      }
    };
    fetchCounts();
  }, []);

  const Card = ({ title, icon, onClick }) => (
    <div onClick={onClick} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all">
      <div className="text-4xl mb-3">{icon}</div>
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
    </div>
  );

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      </header>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center">
            <div className="text-3xl mr-4">🎓</div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold">{studentCount === null ? <Skeleton className="h-8 w-12" /> : studentCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center">
            <div className="text-3xl mr-4">📚</div>
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold">{courseCount === null ? <Skeleton className="h-8 w-12" /> : courseCount}</p>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="View All Students" icon="🧑‍🤝‍🧑" onClick={() => setAdminView('all_students')} />
          <Card title="Enroll New Student" icon="➕" onClick={() => setAdminView('enroll_student')} />
          <Card title="Manage Courses" icon="📖" onClick={() => setAdminView('course_management')} />
        </div>
      </div>
    </>
  );
};


// =================================================================================================
// --- ADMISSIONS COMPONENTS ---
// =================================================================================================

const AdmissionsOverviewPage = ({ setAdminView }) => {
    const admissionsCards = [
        { title: 'Inquiry', icon: '❓', view: 'inquiry_list' },
        { title: 'Admission Form', icon: '📝', view: 'admission_form' },
        { title: 'New Applicants', icon: '🆕', view: 'applications_management' },
        { title: 'Pending Applications', icon: '🕒', view: 'applications_management' },
        { title: 'Approved Admissions', icon: '✅', view: 'applications_management' },
    ];

    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
                <h1 className="text-2xl font-bold text-gray-800">Admissions Overview</h1>
            </header>
            <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {admissionsCards.map(card => (
                        <div key={card.title} onClick={() => setAdminView(card.view)} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all aspect-square">
                            <div className="text-5xl mb-4">{card.icon}</div>
                            <h2 className="text-lg font-semibold text-gray-700">{card.title}</h2>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

const InquiryListPage = ({ setAdminView }) => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const inquiryList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setInquiries(inquiryList);
            } catch (error) {
                console.error("Error fetching inquiries:", error);
                toast.error("Could not fetch inquiries.");
            } finally {
                setLoading(false);
            }
        };
        fetchInquiries();
    }, []);

    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
                <button onClick={() => setAdminView('admissions_overview')} className="mr-4 text-blue-600 hover:text-blue-800">← Back</button>
                <h1 className="text-2xl font-bold text-gray-800">Inquiry Details</h1>
            </header>
            <div className="p-8">
                <p className="text-gray-600 mb-6">Manage and respond to parent inquiries. Sorted by latest.</p>
                <div className="mb-6 flex gap-4">
                    <input type="text" placeholder="Search inquiries by name..." className="w-full p-2 border rounded-lg" />
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Search</button>
                </div>
                <div className="space-y-4">
                    {loading && Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full"/>)}
                    {!loading && inquiries.length === 0 && <p className="text-center text-gray-500 py-8">No inquiries found.</p>}
                    {!loading && inquiries.map(inquiry => (
                        <div key={inquiry.id} className="bg-white p-4 rounded-lg shadow-sm border grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <div className="md:col-span-2">
                                <p className="font-semibold">{inquiry.parentName}</p>
                                <p className="text-sm text-gray-500">{inquiry.parentContact}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Child Name</p>
                                <p>{inquiry.childName}</p>
                            </div>
                            <div className="md:col-span-1">
                                <p className="text-sm text-gray-500">Class</p>
                                <p>{inquiry.grade}</p>
                            </div>
                            <p className="md:col-span-6 text-gray-700">{inquiry.message}</p>
                            <p className="md:col-span-1 text-sm text-gray-500 text-right">{inquiry.createdAt.toDate().toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

const AdmissionFormPage = ({ setAdminView }) => {
    const [formData, setFormData] = useState({
        childFirstName: '', childLastName: '', parentFirstName: '', parentLastName: '', parentPhone: '', parentEmail: ''
    });
    const [files, setFiles] = useState([]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if(e.target.files.length + files.length > 5) {
            toast.error("You can only upload a maximum of 5 files.");
            return;
        }
        setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Submitting application...");

        try {
            const attachmentUrls = await Promise.all(
                files.map(async file => {
                    const storageRef = ref(storage, `attachments/${Date.now()}_${file.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, file);
                    await uploadTask;
                    return getDownloadURL(uploadTask.snapshot.ref);
                })
            );

            await addDoc(collection(db, "applications"), {
                ...formData,
                attachments: attachmentUrls,
                status: 'New',
                createdAt: new Date()
            });

            toast.success("Application submitted successfully!", { id: toastId });
            setAdminView('admissions_overview');
        } catch (error) {
            console.error("Error submitting application: ", error);
            toast.error("Failed to submit application.", { id: toastId });
        }
    };
    
    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
                 <button onClick={() => setAdminView('admissions_overview')} className="mr-4 text-blue-600 hover:text-blue-800">← Back</button>
                <h1 className="text-2xl font-bold text-gray-800">Admission Form</h1>
            </header>
            <div className="p-8">
                <div className="bg-white p-8 rounded-lg shadow-sm border max-w-4xl mx-auto">
                    <p className="text-gray-600 mb-6">Please fill out the form below to begin the admissions process.</p>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput name="childFirstName" label="Child's First Name" onChange={handleChange} required/>
                            <FormInput name="childLastName" label="Child's Last Name" onChange={handleChange} required/>
                            <FormInput name="parentFirstName" label="Parent's First Name" onChange={handleChange} required/>
                            <FormInput name="parentLastName" label="Parent's Last Name" onChange={handleChange} required/>
                            <FormInput name="parentPhone" label="Parent's Phone Number" type="tel" onChange={handleChange} required/>
                            <FormInput name="parentEmail" label="Parent's Email" type="email" onChange={handleChange} required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                             <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                            <span>Upload up to 5 files</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                {files.map((file, i) => <div key={i}>{file.name}</div>)}
                            </div>
                        </div>
                         <div className="text-right">
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Submit Application</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

const ApplicationsManagementPage = ({ setAdminView }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const appList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setApplications(appList);
            } catch (error) {
                console.error("Error fetching applications:", error);
                toast.error("Could not fetch applications.");
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);
    
    const getStatusChip = (status) => {
      const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
      switch(status) {
        case 'New': return `${baseClasses} bg-blue-100 text-blue-800`;
        case 'In Review': return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'Approved': return `${baseClasses} bg-green-100 text-green-800`;
        case 'Rejected': return `${baseClasses} bg-red-100 text-red-800`;
        default: return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    };
    
    return (
      <>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
            <button onClick={() => setAdminView('admissions_overview')} className="mr-4 text-blue-600 hover:text-blue-800">← Back</button>
            <h1 className="text-2xl font-bold text-gray-800">Applications Management</h1>
        </header>
        <div className="p-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Application Stage</label>
                        <select className="w-full mt-1 p-2 border rounded-lg bg-gray-50"><option>New</option><option>In Review</option></select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Class</label>
                        <select className="w-full mt-1 p-2 border rounded-lg bg-gray-50"><option>All Classes</option></select>
                    </div>
                    <div>
                         <label className="text-sm font-medium text-gray-700">Date</label>
                         <input type="date" className="w-full mt-1 p-2 border rounded-lg bg-gray-50"/>
                    </div>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 h-10">Apply</button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b"><tr>
                        {['Student Full Name', 'Parent Full Name', 'Class', 'Date', 'Application Status', ''].map(h => <th key={h} className="p-4 font-semibold text-sm text-gray-600 uppercase">{h}</th>)}
                    </tr></thead>
                    <tbody>
                        {loading && Array(4).fill(0).map((_, i) => <tr key={i}><td colSpan="6" className="p-4"><Skeleton className="h-6"/></td></tr>)}
                        {!loading && applications.length === 0 && <tr><td colSpan="6" className="text-center p-6 text-gray-500">No applications found.</td></tr>}
                        {!loading && applications.map(app => (
                            <tr key={app.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                <td className="p-4 font-medium">{app.childFirstName} {app.childLastName}</td>
                                <td className="p-4">{app.parentFirstName} {app.parentLastName}</td>
                                <td className="p-4">{app.class || 'N/A'}</td>
                                <td className="p-4">{app.createdAt.toDate().toLocaleDateString()}</td>
                                <td className="p-4"><span className={getStatusChip(app.status)}>{app.status}</span></td>
                                <td className="p-4 text-center">...</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </>
    );
};

// =================================================================================================
// --- FINANCE COMPONENTS ---
// =================================================================================================

const FeesDashboardPage = ({ setAdminView }) => {
    const [summaryData, setSummaryData] = useState({
        totalFees: 0,
        totalCollections: 0,
        totalBalance: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeeSummary = async () => {
            setLoading(true);
            try {
                const studentsSnapshot = await getDocs(collection(db, 'students'));
                let totalFees = 0;
                let totalCollections = 0;
                
                const transactionPromises = studentsSnapshot.docs.map(async (studentDoc) => {
                    const studentData = studentDoc.data();
                    const studentTotalFees = studentData.totalFees || 0;
                    totalFees += studentTotalFees;

                    const financialsCol = collection(db, 'students', studentDoc.id, 'financials');
                    const financialsSnapshot = await getDocs(financialsCol);
                    
                    let studentPaid = 0;
                    financialsSnapshot.forEach(doc => {
                        const transaction = doc.data();
                        if (transaction.status === 'Paid') {
                            studentPaid += transaction.amount || 0;
                        }
                    });
                    return studentPaid;
                });

                const allPaidAmounts = await Promise.all(transactionPromises);
                totalCollections = allPaidAmounts.reduce((sum, amount) => sum + amount, 0);
                
                setSummaryData({
                    totalFees,
                    totalCollections,
                    totalBalance: totalFees - totalCollections,
                });

            } catch (error) {
                console.error("Error fetching fee summary:", error);
                toast.error("Could not load fee summary data.");
            } finally {
                setLoading(false);
            }
        };

        fetchFeeSummary();
    }, []);
    
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
                <h1 className="text-2xl font-bold text-gray-800">Fees Dashboard</h1>
            </header>
            <div className="p-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Fees Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {loading ? (
                        <>
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </>
                    ) : (
                        <>
                            <SummaryCard title="Total Fees" amount={formatCurrency(summaryData.totalFees)} />
                            <SummaryCard title="Total Collections" amount={formatCurrency(summaryData.totalCollections)} />
                            <SummaryCard title="Total Balance" amount={formatCurrency(summaryData.totalBalance)} />
                        </>
                    )}
                </div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Fee Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MenuCard title="Student Fee Records" icon="📄" onClick={() => setAdminView('student_fee_records')} />
                    <MenuCard title="Send Reminders" icon="➤" />
                    <MenuCard title="Print Receipt" icon="🖨️" />
                    <MenuCard title="Update Fee Records" icon="🔄" />
                </div>
            </div>
        </>
    );
};

const StudentFeeRecordsPage = ({ setAdminView }) => {
    const [feeRecords, setFeeRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeeRecords = async () => {
            try {
                const studentsSnapshot = await getDocs(collection(db, 'students'));
                const records = await Promise.all(studentsSnapshot.docs.map(async (studentDoc) => {
                    const studentData = studentDoc.data();
                    const financialsSnapshot = await getDocs(collection(db, 'students', studentDoc.id, 'financials'));
                    const payments = financialsSnapshot.docs
                        .map(doc => doc.data())
                        .filter(tx => tx.status === 'Paid')
                        .reduce((sum, tx) => sum + tx.amount, 0);
                    
                    const totalFees = studentData.totalFees || 0;
                    const balance = totalFees - payments;

                    return {
                        id: studentDoc.id,
                        student: `${studentData.firstName} ${studentData.lastName}`,
                        parent: studentData.parentFullName,
                        phone: studentData.phone,
                        email: studentData.email,
                        class: studentData.class,
                        total: totalFees,
                        balance: balance
                    };
                }));
                setFeeRecords(records);
            } catch (error) {
                console.error("Error fetching fee records:", error);
                toast.error("Could not fetch fee records.");
            } finally {
                setLoading(false);
            }
        };

        fetchFeeRecords();
    }, []);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
                <button onClick={() => setAdminView('fees_dashboard')} className="mr-4 text-blue-600 hover:text-blue-800">← Back</button>
                <h1 className="text-2xl font-bold text-gray-800">Student Fee Records</h1>
            </header>
            <div className="p-8">
                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b"><tr>
                            {['Student Name', 'Parent Name', 'Phone', 'Email', 'Class', 'Total Fees', 'Balance Fees'].map(h => <th key={h} className="p-4 font-semibold text-sm text-gray-600 uppercase">{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {loading && Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan="7" className="p-4"><Skeleton className="h-6"/></td></tr>)}
                            {!loading && feeRecords.length === 0 && <tr><td colSpan="7" className="text-center p-6 text-gray-500">No student fee records found.</td></tr>}
                            {!loading && feeRecords.map((rec) => (
                                <tr key={rec.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                    <td className="p-4">{rec.student}</td>
                                    <td className="p-4">{rec.parent}</td>
                                    <td className="p-4">{rec.phone}</td>
                                    <td className="p-4">{rec.email}</td>
                                    <td className="p-4">{rec.class}</td>
                                    <td className="p-4">{formatCurrency(rec.total)}</td>
                                    <td className="p-4 font-semibold text-red-600">{formatCurrency(rec.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const SummaryCard = ({ title, amount }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{amount}</p>
    </div>
);

const MenuCard = ({ title, icon, onClick = () => {} }) => (
    <div onClick={onClick} className="bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all">
        <div className="text-4xl mb-3">{icon}</div>
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
    </div>
);


// =================================================================================================
// --- EXISTING COMPONENTS (Course, Student Pages etc.) ---
// =================================================================================================

const CourseManagementPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', description: '', instructor: '' });
  
    useEffect(() => {
      const fetchCourses = async () => {
        setLoading(true);
        try {
          const coursesSnap = await getDocs(collection(db, 'courses'));
          const list = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setCourses(list);
        } catch (err) {
          toast.error('Failed to load courses.');
        } finally {
          setLoading(false);
        }
      };
      fetchCourses();
    }, []);
  
    const handleFormChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
  
    const handleCreateCourse = async (e) => {
      e.preventDefault();
      if (!formData.name || !formData.code) {
        toast.error('Course Name and Code are required.');
        return;
      }
      const toastId = toast.loading('Creating course...');
      try {
        const docRef = await addDoc(collection(db, 'courses'), { ...formData, createdAt: new Date() });
        setCourses(prev => [...prev, { id: docRef.id, ...formData }]);
        setFormData({ name: '', code: '', description: '', instructor: '' });
        setShowForm(false);
        toast.success('Course created successfully!', { id: toastId });
      } catch (err) {
        toast.error('Failed to create course.', { id: toastId });
      }
    };
  
    return (
      <>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
          <button onClick={() => setShowForm(s => !s)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            {showForm ? 'Cancel' : '＋ Create Course'}
          </button>
        </header>
        <div className="p-8">
          {showForm && (
            <form onSubmit={handleCreateCourse} className="bg-white p-6 rounded-lg shadow-sm border mb-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">New Course Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="name" label="Course Name" value={formData.name} onChange={handleFormChange} placeholder="e.g., Introduction to Physics" required />
                <FormInput name="code" label="Course Code" value={formData.code} onChange={handleFormChange} placeholder="e.g., PHY101" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} name="description" onChange={handleFormChange} className="w-full p-2 border rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500" rows="3"></textarea>
              </div>
              <FormInput name="instructor" label="Instructor" value={formData.instructor} onChange={handleFormChange} placeholder="e.g., Dr. Smith" />
              <div className="flex justify-end gap-4 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Course</button>
              </div>
            </form>
          )}
  
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Course Name</th>
                    <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Code</th>
                    <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Instructor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan="3" className="p-4"><Skeleton className="h-6 w-full" /></td></tr>)
                ) : courses.length === 0 ? (
                  <tr><td colSpan="3" className="text-center p-6 text-gray-500">No courses found. Add one to get started!</td></tr>
                ) : (
                  courses.map(course => (
                    <tr key={course.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800">{course.name}</td>
                      <td className="p-4 text-gray-600">{course.code}</td>
                      <td className="p-4 text-gray-600">{course.instructor || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
};

const AllStudentsPage = ({ setAdminView, setSelectedStudentId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const studentList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching students: ", error);
        toast.error('Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleViewProfile = (studentId) => {
    setSelectedStudentId(studentId);
    setAdminView('student_profile');
  };

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <h1 className="text-2xl font-bold text-gray-800">Student Directory</h1>
        <button onClick={() => setAdminView('enroll_student')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Enroll Student
        </button>
      </header>
      <div className="p-8">
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-1/3 pl-4 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Name</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Class</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Email</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Phone</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b"><td className="p-4" colSpan="5"><Skeleton className="h-8 w-full"/></td></tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-6 text-gray-500">No students found matching your search.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800 flex items-center">
                      <img src={student.photoURL || `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=random`} alt="avatar" className="w-8 h-8 rounded-full mr-3 object-cover"/>
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="p-4 text-gray-600">{student.class || 'N/A'}</td>
                    <td className="p-4 text-gray-600">{student.email}</td>
                    <td className="p-4 text-gray-600">{student.phone || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleViewProfile(student.id)} className="font-semibold text-blue-600 hover:text-blue-800">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const EnrollStudentPage = ({ setAdminView }) => {
    const [formData, setFormData] = useState({
      firstName: '', lastName: '', dob: '', gender: '', email: '', phone: '',
      parentFullName: '', parentRelation: '', parentPhone: '', parentEmail: '',
      class: '', section: '', previousSchool: '', aadhaarId: '', totalFees: 0
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prevState => ({ ...prevState, [name]: value }));
    };
  
    const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      const toastId = toast.loading('Enrolling student...');
  
      try {
        let studentData = { ...formData, enrolledAt: new Date(), photoURL: '', totalFees: Number(formData.totalFees) };

        if (imageFile) {
          toast.loading('Uploading photo...', { id: toastId });
          const storageRef = ref(storage, `student_photos/${Date.now()}_${imageFile.name}`);
          const uploadTask = uploadBytesResumable(storageRef, imageFile);

          const downloadURL = await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
              null, 
              (error) => {
                console.error("Upload failed:", error);
                reject(error);
              }, 
              async () => {
                resolve(await getDownloadURL(uploadTask.snapshot.ref));
              }
            );
          });
          studentData.photoURL = downloadURL;
        }
        
        toast.loading('Saving student details...', { id: toastId });
        await addDoc(collection(db, "students"), studentData);
        toast.success('Student enrolled successfully!', { id: toastId });
        setAdminView('all_students');

      } catch (error) {
        console.error("Error enrolling student: ", error);
        toast.error('Failed to enroll student.', { id: toastId });
      }
    };
  
    return (
        <>
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
            <h1 className="text-2xl font-bold text-gray-800">Enroll New Student</h1>
          </header>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-sm border">
              <Section title="Student Information">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <FormInput name="firstName" label="First Name" required value={formData.firstName} onChange={handleChange} />
                  <FormInput name="lastName" label="Last Name" required value={formData.lastName} onChange={handleChange} />
                  <FormInput name="dob" label="Date of Birth" type="date" required value={formData.dob} onChange={handleChange} />
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                      <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </div>
                  <FormInput name="email" label="Email" type="email" required value={formData.email} onChange={handleChange} />
                  <FormInput name="phone" label="Phone" type="tel" value={formData.phone} onChange={handleChange} />
                </div>
              </Section>
  
              <Section title="Student Photo">
                <div className="mt-1 flex items-center gap-6">
                  <span className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                    {imagePreview ? 
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> :
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    }
                  </span>
                  <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a photo</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleFileChange} />
                  </label>
                </div>
              </Section>
  
              <Section title="Parent/Guardian Information">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <FormInput name="parentFullName" label="Full Name" value={formData.parentFullName} onChange={handleChange} />
                  <FormInput name="parentRelation" label="Relation" value={formData.parentRelation} onChange={handleChange} />
                  <FormInput name="parentPhone" label="Phone Number" value={formData.parentPhone} onChange={handleChange} />
                  <FormInput name="parentEmail" label="Email Address" type="email" value={formData.parentEmail} onChange={handleChange} />
                </div>
              </Section>
              
              <Section title="Academic & Financial Information">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <FormInput name="class" label="Class" value={formData.class} onChange={handleChange} />
                  <FormInput name="section" label="Section" value={formData.section} onChange={handleChange} />
                  <FormInput name="totalFees" label="Total Annual Fees" type="number" value={formData.totalFees} onChange={handleChange} />
                  <FormInput name="previousSchool" label="Previous School" value={formData.previousSchool} onChange={handleChange} />
                  <FormInput name="aadhaarId" label="Aadhaar ID" value={formData.aadhaarId} onChange={handleChange} />
                </div>
              </Section>
              
              <div className="flex justify-end gap-4 pt-5 border-t">
                <button type="button" onClick={() => setAdminView('all_students')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Enroll Student</button>
              </div>
            </form>
          </div>
        </>
      );
};
  
const StudentProfilePage = ({ studentId, setAdminView }) => {
    const [studentData, setStudentData] = useState(null);
    const [financials, setFinancials] = useState({ transactions: [], summary: null });
    const [academics, setAcademics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
  
    useEffect(() => {
      const fetchAllData = async () => {
        if (!studentId) { setLoading(false); return; }
        setLoading(true);
        try {
          const studentDocRef = doc(db, 'students', studentId);
          const studentDocSnap = await getDoc(studentDocRef);
  
          if (!studentDocSnap.exists()) throw new Error("Student not found");
          const studentInfo = studentDocSnap.data();
          setStudentData(studentInfo);

          const financialsCol = collection(db, 'students', studentId, 'financials');
          const academicsCol = collection(db, 'students', studentId, 'academics');
          
          const [financialSnapshot, academicSnapshot] = await Promise.all([
            getDocs(financialsCol), getDocs(academicsCol)
          ]);

          const transactions = financialSnapshot.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date.toDate() }));
          const totalFees = studentInfo.totalFees || 0;
          const feesPaid = transactions.filter(t => t.status === 'Paid').reduce((s, t) => s + t.amount, 0);
          setFinancials({ transactions, summary: { totalFees, feesPaid, balanceFees: totalFees - feesPaid } });
  
          const academicResults = academicSnapshot.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date.toDate() }));
          setAcademics(academicResults);
  
        } catch (error) { 
          console.error("Error fetching data:", error); 
          toast.error("Could not fetch student data.");
          setStudentData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchAllData();
    }, [studentId]);
  
    if (loading) return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  
    if (!studentData) return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Student Not Found</h2>
        <p className="text-gray-500 mt-2">The selected student could not be found. Please go back and try again.</p>
        <button onClick={() => setAdminView('all_students')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          &larr; Back to Students
        </button>
      </div>
    );
    
    return (
      <div className="p-8">
        <header className="mb-8">
          <button onClick={() => setAdminView('all_students')} className="text-blue-600 hover:text-blue-800 mb-4 flex items-center">
            &larr; Back to Student Directory
          </button>
          <div className="flex items-center space-x-6">
            <img src={studentData.photoURL || `https://ui-avatars.com/api/?name=${studentData.firstName}+${studentData.lastName}&background=random`} alt="Student" className="w-24 h-24 bg-gray-200 rounded-full object-cover flex-shrink-0 border-4 border-white shadow-md"/>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{studentData.firstName} {studentData.lastName}</h1>
              <p className="text-gray-500">Student ID: {studentId.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </header>
        
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <TabButton name="profile" activeTab={activeTab} setActiveTab={setActiveTab}>Profile Details</TabButton>
            <TabButton name="academics" activeTab={activeTab} setActiveTab={setActiveTab}>Academics</TabButton>
            <TabButton name="fees" activeTab={activeTab} setActiveTab={setActiveTab}>Fees & Financials</TabButton>
          </nav>
        </div>
        
        <div className="mt-8">
          {activeTab === 'profile' && <ProfileTab studentData={studentData} />}
          {activeTab === 'academics' && <AcademicsTab academics={academics} />}
          {activeTab === 'fees' && <FeesTab financials={financials} />}
        </div>
      </div>
    );
};

// --- Helper Components for Student Profile & Forms ---
const FormInput = ({ name, label, type = 'text', required = false, placeholder = '', value, onChange }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} id={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
    </div>
);

const Section = ({ title, children }) => (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">{title}</h2>
      {children}
    </section>
);

const TabButton = ({ name, activeTab, setActiveTab, children }) => (
    <button onClick={() => setActiveTab(name)} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === name ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
      {children}
    </button>
);
  
const ProfileDetail = ({ label, value }) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || 'N/A'}</p>
    </div>
);
  
const ProfileTab = ({ studentData }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
        <ProfileDetail label="First Name" value={studentData.firstName} />
        <ProfileDetail label="Last Name" value={studentData.lastName} />
        <ProfileDetail label="Date of Birth" value={studentData.dob} />
        <ProfileDetail label="Gender" value={studentData.gender} />
        <ProfileDetail label="Phone Number" value={studentData.phone} />
        <ProfileDetail label="Email Address" value={studentData.email} />
        <ProfileDetail label="Parent Full Name" value={studentData.parentFullName} />
        <ProfileDetail label="Relation" value={studentData.parentRelation} />
        <ProfileDetail label="Parent Phone" value={studentData.parentPhone} />
      </div>
    </div>
);
  
const AcademicsTab = ({ academics }) => (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Academic Progress</h3>
      </div>
      {academics.length > 0 ? (
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Date</th>
            <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Test Name</th>
            <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Subject</th>
            <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Marks</th>
          </tr></thead>
          <tbody>
            {academics.map(item => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">{item.date.toLocaleDateString()}</td>
                <td className="p-4">{item.testName}</td>
                <td className="p-4">{item.subject}</td>
                <td className="p-4 font-medium">{item.marksObtained} / {item.totalMarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="p-6 text-center text-gray-500">No academic records found for this student.</p>
      )}
    </div>
);
  
const FeesTab = ({ financials }) => {
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    const getStatusChip = (status) => {
      switch(status) {
        case 'Paid': return 'bg-green-100 text-green-800';
        case 'Due': return 'bg-yellow-100 text-yellow-800';
        case 'Overdue': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
  
    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Fee Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div><p className="text-sm text-gray-500">Total Fees</p><p className="text-2xl font-bold text-gray-800">{formatCurrency(financials.summary?.totalFees || 0)}</p></div>
            <div><p className="text-sm text-gray-500">Fees Paid</p><p className="text-2xl font-bold text-green-600">{formatCurrency(financials.summary?.feesPaid || 0)}</p></div>
            <div><p className="text-sm text-gray-500">Balance</p><p className="text-2xl font-bold text-red-600">{formatCurrency(financials.summary?.balanceFees || 0)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b"><h3 className="text-lg font-semibold text-gray-800">Transaction History</h3></div>
          {financials.transactions.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Date</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Description</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Amount</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase">Status</th>
              </tr></thead>
              <tbody>
                {financials.transactions.map(tx => (
                  <tr key={tx.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-4">{tx.date.toLocaleDateString()}</td>
                    <td className="p-4">{tx.description}</td>
                    <td className="p-4 font-medium">{formatCurrency(tx.amount)}</td>
                    <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(tx.status)}`}>{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-center text-gray-500">No transaction history found.</p>
          )}
        </div>
      </div>
    );
};

const PlaceholderPage = ({ title }) => (
  <>
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    </header>
    <div className="p-8">
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <h2 className="text-xl font-semibold">Coming Soon!</h2>
        <p className="text-gray-500 mt-2">This feature is under development and will be available shortly.</p>
      </div>
    </div>
  </>
);


// =================================================================================================
// --- AUTHENTICATION COMPONENTS ---
// =================================================================================================

const AuthLayout = ({ children, headerText, onToggleView, toggleText, toggleActionText }) => (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 items-center justify-center p-12 text-white">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 leading-tight">{headerText.title}</h2>
          <p className="max-w-md text-indigo-100">{headerText.subtitle}</p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AuthLogo />
            <AuthFormHeader type={headerText.type} />
          </div>
          {children}
          <div className="text-center text-sm">
            <p className="text-gray-600">{toggleText} <button type="button" onClick={onToggleView} className="font-medium text-blue-600 hover:text-blue-500">{toggleActionText}</button></p>
          </div>
        </div>
      </div>
    </div>
);
  
const AuthLogo = () => ( 
    <div className="w-16 h-16 bg-blue-100 rounded-full mb-6 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"></path><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path></svg>
    </div>
);
  
const AuthFormHeader = ({ type }) => (
    <div>
        <h2 className="text-3xl font-bold text-gray-900">{type === 'login' ? 'Sign in to your account' : 'Create a new account'}</h2>
    </div>
);
  
const AuthFormInput = ({ id, type, value, onChange, placeholder, icon }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</span>
        <input id={id} type={type} value={value} onChange={onChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder={placeholder} />
    </div>
);

const LoginForm = ({ onToggleView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      const toastId = toast.loading('Signing in...');
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully!', { id: toastId });
      } catch (err) {
        toast.error('Invalid email or password.', { id: toastId });
      }
    };
    
    const emailIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>;
    const passwordIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <AuthFormInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" icon={emailIcon} />
        <AuthFormInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={passwordIcon} />
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Sign in
        </button>
      </form>
    );
};
  
const RegisterForm = ({ onToggleView }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (password !== confirmPassword) {
        toast.error("Passwords don't match!");
        return;
      }
      const toastId = toast.loading('Creating account...');
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "admins", user.uid), {
          uid: user.uid, fullName, email: user.email, createdAt: new Date(), role: 'admin',
        });
        toast.success('Account created successfully!', { id: toastId });
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          toast.error('This email is already registered.', { id: toastId });
        } else {
          toast.error('Failed to create account.', { id: toastId });
        }
      }
    };
    
    const userIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    const emailIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>;
    const passwordIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <AuthFormInput id="reg-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" icon={userIcon} />
        <AuthFormInput id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" icon={emailIcon} />
        <AuthFormInput id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" icon={passwordIcon} />
        <AuthFormInput id="reg-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" icon={passwordIcon}/>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Create Account
        </button>
      </form>
    );
};
  
const LoginPage = ({ onToggleView }) => (
    <AuthLayout
      onToggleView={onToggleView}
      headerText={{
        type: 'login',
        title: "Learning Management System",
        subtitle: "Streamline administration and unlock student potential.",
      }}
      toggleText="Don't have an account?"
      toggleActionText="Sign up"
    >
      <LoginForm onToggleView={onToggleView} />
    </AuthLayout>
);
  
const RegisterPage = ({ onToggleView }) => (
    <AuthLayout
      onToggleView={onToggleView}
      headerText={{
        type: 'register',
        title: "Join a Community of Learners",
        subtitle: "Start your educational journey with us today.",
      }}
      toggleText="Already have an account?"
      toggleActionText="Log in"
    >
      <RegisterForm onToggleView={onToggleView} />
    </AuthLayout>
);

export default App;


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
import { getFirestore, doc, setDoc, collection, addDoc, getDocs, getDoc } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
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


// Main App component
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('login');
  const [adminView, setAdminView] = useState('dashboard'); // State for admin navigation
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAdminView('dashboard'); // Reset admin view on logout
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const toggleView = () => {
    setAuthView(currentView => (currentView === 'login' ? 'register' : 'login'));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // SIMPLIFIED: If a user is logged in, show the Admin Panel.
  if (user) {
    return <AdminLayout setAdminView={setAdminView} adminView={adminView} handleLogout={handleLogout} setSelectedStudentId={setSelectedStudentId} selectedStudentId={selectedStudentId} />;
  } else {
    return authView === 'login' ? <LoginPage onToggleView={toggleView} /> : <RegisterPage onToggleView={toggleView} />;
  }
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ADMIN COMPONENTS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const AdminLayout = ({ adminView, setAdminView, handleLogout, selectedStudentId, setSelectedStudentId }) => {
  const icons = {
      dashboard: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      student: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      course: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" /></svg>,
      attendance: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
      reports: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-8M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  };

  const NavItem = ({ icon, label, isActive }) => (
    <a href="#" className={`flex items-center px-4 py-2.5 text-gray-700 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
      {icon} <span className="ml-3">{label}</span>
    </a>
  );

  let currentView;
  if (adminView === 'dashboard') {
    currentView = <AdminDashboard setAdminView={setAdminView} />;
  } else if (adminView === 'all_students') {
    currentView = <AllStudentsPage setAdminView={setAdminView} setSelectedStudentId={setSelectedStudentId} />;
  } else if (adminView === 'enroll_student') {
    currentView = <EnrollStudentPage setAdminView={setAdminView} />;
  } else if (adminView === 'student_profile') {
    currentView = <StudentProfilePage setAdminView={setAdminView} studentId={selectedStudentId} />;
  }
  else {
    currentView = <AdminDashboard setAdminView={setAdminView} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem icon={icons.dashboard} label="Dashboard" isActive={adminView === 'dashboard-main'} />
          <NavItem icon={icons.student} label="Student Management" isActive={adminView.includes('student') || adminView === 'dashboard'} />
          <NavItem icon={icons.course} label="Course Management" isActive={adminView.includes('course')} />
          <NavItem icon={icons.attendance} label="Attendance" isActive={adminView.includes('attendance')} />
          <NavItem icon={icons.reports} label="Reports" isActive={adminView.includes('reports')} />
        </nav>
        <div className="px-4 py-4 border-t">
          <button onClick={handleLogout} className="w-full text-left text-gray-700">Logout</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {currentView}
      </main>
    </div>
  );
};

const AdminDashboard = ({ setAdminView }) => {
  const Card = ({ title, icon, onClick }) => (
    <div onClick={onClick} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all">
      <div className="text-4xl mb-3">{icon}</div>
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
    </div>
  );

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
        <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
      </header>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="All Students" icon="🎓" onClick={() => setAdminView('all_students')} />
          <Card title="Enroll Student" icon="➕" onClick={() => setAdminView('enroll_student')} />
          <Card title="Search a Student" icon="🔍" onClick={() => setAdminView('all_students')} />
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
        const studentsCollection = collection(db, 'students');
        const studentSnapshot = await getDocs(studentsCollection);
        const studentList = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching students: ", error);
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
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
        <button onClick={() => setAdminView('dashboard')} className="text-gray-600 hover:text-gray-900 mr-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
      </header>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-1/3">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <select className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Classes</option>
          </select>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Name</th>
                <th className="p-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Class</th>
                <th className="p-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Email</th>
                <th className="p-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Phone</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center p-4 text-gray-500">Loading students...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-4 text-gray-500">No students found.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-4 whitespace-nowrap">{student.firstName} {student.lastName}</td>
                    <td className="p-4 whitespace-nowrap">{student.class || 'N/A'}</td>
                    <td className="p-4 whitespace-nowrap">{student.email}</td>
                    <td className="p-4 whitespace-nowrap">{student.phone}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleViewProfile(student.id)} className="text-blue-600 hover:text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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

const FormInput = ({ name, label, type = 'text', required = false, placeholder = '', value, onChange }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} id={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
    </div>
  );
  
const EnrollStudentPage = ({ setAdminView }) => {
    const [formData, setFormData] = useState({
      firstName: '', lastName: '', dob: '', gender: '', email: '', phone: '',
      parentFullName: '', parentRelation: '', parentPhone: '', parentEmail: '',
      class: '', section: '', previousSchool: '', aadhaarId: '',
    });
    const [imageFile, setImageFile] = useState(null);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prevState => ({ ...prevState, [name]: value }));
    };
  
    const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        setImageFile(e.target.files[0]);
      }
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await addDoc(collection(db, "students"), { ...formData, enrolledAt: new Date() });
        alert('Student enrolled successfully!');
        setAdminView('dashboard');
      } catch (error) {
        console.error("Error enrolling student: ", error);
        alert('Failed to enroll student.');
      }
    };
  
    return (
        <>
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
            <h1 className="text-2xl font-bold text-gray-800">Enroll New Student</h1>
          </header>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <FormInput name="firstName" label="First Name" placeholder="Enter first name" required value={formData.firstName} onChange={handleChange} />
                  <FormInput name="lastName" label="Last Name" placeholder="Enter last name" required value={formData.lastName} onChange={handleChange} />
                  <FormInput name="dob" label="Date of Birth" type="date" required value={formData.dob} onChange={handleChange} />
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <FormInput name="email" label="Email" type="email" placeholder="Enter email" value={formData.email} onChange={handleChange} />
                  <FormInput name="phone" label="Phone" type="tel" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} />
                </div>
              </section>
    
              <section className="sm:col-span-3">
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </section>
    
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <FormInput name="parentFullName" label="Full Name" placeholder="Enter parent's full name" value={formData.parentFullName} onChange={handleChange} />
                  <FormInput name="parentRelation" label="Relation" placeholder="e.g., Father, Mother" value={formData.parentRelation} onChange={handleChange} />
                  <FormInput name="parentPhone" label="Phone Number" placeholder="Enter phone number" value={formData.parentPhone} onChange={handleChange} />
                  <FormInput name="parentEmail" label="Email Address" type="email" placeholder="Enter email address" value={formData.parentEmail} onChange={handleChange} />
                </div>
              </section>
              
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <FormInput name="class" label="Class" placeholder="e.g., Class 10" value={formData.class} onChange={handleChange} />
                  <FormInput name="section" label="Section" placeholder="e.g., A" value={formData.section} onChange={handleChange} />
                  <FormInput name="previousSchool" label="Previous School" placeholder="If applicable" value={formData.previousSchool} onChange={handleChange} />
                  <FormInput name="aadhaarId" label="Aadhaar ID" placeholder="Enter 12-digit ID" value={formData.aadhaarId} onChange={handleChange} />
                </div>
              </section>
              
              <div className="flex justify-end gap-4 pt-5 border-t">
                <button type="button" onClick={() => setAdminView('dashboard')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Enroll Student</button>
              </div>
            </form>
          </div>
        </>
      );
  };
  
const StudentProfilePage = ({ studentId, setAdminView }) => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
  
    useEffect(() => {
      const fetchStudentData = async () => {
        if (!studentId) return;
        try {
          const studentDocRef = doc(db, 'students', studentId);
          const studentDocSnap = await getDoc(studentDocRef);
          if (studentDocSnap.exists()) {
            setStudentData(studentDocSnap.data());
          } else {
            console.log('No such student!');
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchStudentData();
    }, [studentId]);
  
    if (loading) return <div className="p-8">Loading student profile...</div>;
    if (!studentData) return <div className="p-8">Student not found.</div>;
    
    const ProfileDetail = ({ label, value }) => (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-medium text-gray-800">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="p-8">
            <header className="mb-6">
                <button onClick={() => setAdminView('all_students')} className="text-blue-600 mb-4 flex items-center">
                    &larr; Back to Students
                </button>
                <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex-shrink-0">
                        {/* Image placeholder */}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{studentData.firstName} {studentData.lastName}</h1>
                        <p className="text-gray-500">Student ID: {studentId.slice(0, 8)}</p>
                    </div>
                </div>
            </header>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Profile</button>
                    <button onClick={() => setActiveTab('academics')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'academics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Academics</button>
                    <button onClick={() => setActiveTab('fees')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'fees' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Fees & Financials</button>
                </nav>
            </div>
            
            <div className="mt-8">
                {activeTab === 'profile' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                           <ProfileDetail label="First Name" value={studentData.firstName} />
                           <ProfileDetail label="Last Name" value={studentData.lastName} />
                           <ProfileDetail label="Date of Birth" value={studentData.dob} />
                           <ProfileDetail label="Gender" value={studentData.gender} />
                           <ProfileDetail label="Phone Number" value={studentData.phone} />
                           <ProfileDetail label="Email Address" value={studentData.email} />
                           <ProfileDetail label="Parent Full Name" value={studentData.parentFullName} />
                           <ProfileDetail label="Relation" value={studentData.parentRelation} />
                        </div>
                    </div>
                )}
                 {activeTab === 'academics' && <div>Academic records coming soon.</div>}
                 {activeTab === 'fees' && <div>Fee records coming soon.</div>}
            </div>

             <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Attendance Tracking</h3>
                <div className="flex space-x-8">
                    <div>
                        <p className="text-sm text-gray-500">Days Present</p>
                        <p className="text-2xl font-bold text-green-600">150</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Days Absent</p>
                        <p className="text-2xl font-bold text-red-600">5</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
  
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// AUTHENTICATION COMPONENTS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const AuthLogo = () => (
    <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </div>
);
const AuthFormHeader = ({ type }) => (
    <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">LMS_WebApp</h1>
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
      <div className="text-center text-sm">
        <p className="text-gray-600">Need an account? <button type="button" onClick={onToggleView} className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none">Sign up</button></p>
      </div>
    </form>
  );
};

const LoginPage = ({ onToggleView }) => (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      <div className="w-1/2 bg-blue-800 hidden lg:block"></div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8"><div className="max-w-md w-full"><div className="flex flex-col items-center"><AuthLogo /><AuthFormHeader type="login" /></div><LoginForm onToggleView={onToggleView} /><p className="text-center text-xs text-gray-400 mt-10">&copy; Powered by LMS_WebApp</p></div></div>
    </div>
);

// --- Register Page ---
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

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: user.email,
        createdAt: new Date(),
        role: 'student', // All new users are students by default
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

export default App;


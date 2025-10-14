/// Version 1.6.7
/// Last updated: 2024-10-01

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
// UI helpers
import toast, { Toaster } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
      setAdminView('dashboard');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast.error('Failed to sign out.');
    }
  };

  const toggleView = () => {
    setAuthView(currentView => (currentView === 'login' ? 'register' : 'login'));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-sans">Loading...<Toaster /></div>;
  }

  if (user) {
    return <><AdminLayout setAdminView={setAdminView} adminView={adminView} handleLogout={handleLogout} setSelectedStudentId={setSelectedStudentId} selectedStudentId={selectedStudentId} /><Toaster /></>;
  } else {
    return <>{authView === 'login' ? <LoginPage onToggleView={toggleView} /> : <RegisterPage onToggleView={toggleView} />}<Toaster /></>;
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

  const NavItem = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center w-full text-left px-4 py-2.5 text-gray-700 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
      {icon} <span className="ml-3">{label}</span>
    </button>
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
  } else if (adminView === 'attendance') {
    currentView = <AttendancePage />;
  } else if (adminView === 'reports') {
    currentView = <ReportsPage />;
  } else if (adminView === 'course_management') {
    currentView = <CourseManagementPage setAdminView={setAdminView} />;
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
          <NavItem icon={icons.dashboard} label="Dashboard" onClick={() => setAdminView('dashboard')} isActive={adminView === 'dashboard'} />
          <NavItem icon={icons.student} label="Student Management" onClick={() => setAdminView('all_students')} isActive={adminView.includes('student') || adminView === 'dashboard'} />
          <NavItem icon={icons.course} label="Course Management" onClick={() => setAdminView('course_management')} isActive={adminView.includes('course')} />
          <NavItem icon={icons.attendance} label="Attendance" onClick={() => setAdminView('attendance')} isActive={adminView.includes('attendance')} />
          <NavItem icon={icons.reports} label="Reports" onClick={() => setAdminView('reports')} isActive={adminView.includes('reports')} />
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
              <p className="text-2xl font-bold">{studentCount === null ? <Skeleton width={50} /> : studentCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center">
            <div className="text-3xl mr-4">📚</div>
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold">{courseCount === null ? <Skeleton width={50} /> : courseCount}</p>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-700">Student Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="All Students" icon="🧑‍🤝‍🧑" onClick={() => setAdminView('all_students')} />
          <Card title="Enroll Student" icon="➕" onClick={() => setAdminView('enroll_student')} />
          <Card title="Search a Student" icon="🔍" onClick={() => setAdminView('all_students')} />
        </div>
      </div>
    </>
  );
};

const CourseManagementPage = ({ setAdminView }) => {
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
        toast.error('Failed to load courses');
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
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
        <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
      </header>
      <div className="p-8">
        <div className="flex justify-end items-center mb-6">
          <button onClick={() => setShowForm(s => !s)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {showForm ? 'Cancel' : 'Create New Course'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateCourse} className="bg-white p-6 rounded-lg shadow-sm border mb-8 space-y-4">
            <h3 className="text-lg font-semibold">New Course Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput name="name" label="Course Name" value={formData.name} onChange={handleFormChange} placeholder="e.g., Introduction to Physics" required />
              <FormInput name="code" label="Course Code" value={formData.code} onChange={handleFormChange} placeholder="e.g., PHY101" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} name="description" onChange={handleFormChange} className="w-full p-2 border rounded-md bg-gray-50" rows="3"></textarea>
            </div>
            <FormInput name="instructor" label="Instructor" value={formData.instructor} onChange={handleFormChange} placeholder="e.g., Dr. Smith" />
            <div className="text-right">
              <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Course</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow-sm border">
            <table className="w-full text-left">
                <thead className="bg-gray-50"><tr className="border-b"><th className="p-4">Course Name</th><th className="p-4">Code</th><th className="p-4">Instructor</th></tr></thead>
                <tbody>
                {loading ? (
                    Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan="3" className="p-4"><Skeleton/></td></tr>)
                ) : courses.length === 0 ? (
                    <tr><td colSpan="3" className="text-center p-4">No courses found.</td></tr>
                ) : (
                    courses.map(course => (
                        <tr key={course.id} className="border-b last:border-b-0">
                            <td className="p-4 font-medium">{course.name}</td>
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
            &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
      </header>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-1/3">
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border rounded-lg"/>
          </div>
          <select className="px-4 py-2 border rounded-lg">
            <option>All Classes</option>
          </select>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-4">Name</th>
                <th className="p-4">Class</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b"><td className="p-4" colSpan="5"><Skeleton /></td></tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-4">No students found.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-4">{student.firstName} {student.lastName}</td>
                    <td className="p-4">{student.class || 'N/A'}</td>
                    <td className="p-4">{student.email}</td>
                    <td className="p-4">{student.phone}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleViewProfile(student.id)} className="text-blue-600">
                        View
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
    const [imagePreview, setImagePreview] = useState(null);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prevState => ({ ...prevState, [name]: value }));
    };
  
    const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const f = e.target.files[0];
        setImageFile(f);
        const url = URL.createObjectURL(f);
        setImagePreview(url);
      }
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      const toastId = toast.loading('Enrolling student...');
      try {
        await addDoc(collection(db, "students"), { ...formData, enrolledAt: new Date() });
        toast.success('Student enrolled successfully!', { id: toastId });
        setAdminView('dashboard');
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
                    {imagePreview ? 
                      <img src={imagePreview} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-full mb-2" /> :
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
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
                  <FormInput name="parentFullName" label="Full Name" placeholder="Enter parent's name" value={formData.parentFullName} onChange={handleChange} />
                  <FormInput name="parentRelation" label="Relation" placeholder="e.g., Father, Mother" value={formData.parentRelation} onChange={handleChange} />
                  <FormInput name="parentPhone" label="Phone Number" placeholder="Enter parent's phone" value={formData.parentPhone} onChange={handleChange} />
                  <FormInput name="parentEmail" label="Email Address" type="email" placeholder="Enter parent's email" value={formData.parentEmail} onChange={handleChange} />
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
    const [selectedSubject, setSelectedSubject] = useState('All');

    useEffect(() => {
        const fetchAllData = async () => {
            if (!studentId) return;
            setLoading(true);
            try {
                const studentDocRef = doc(db, 'students', studentId);
                const financialsCol = collection(db, 'students', studentId, 'financials');
                const academicsCol = collection(db, 'students', studentId, 'academics');
                const [studentDocSnap, financialSnapshot, academicSnapshot] = await Promise.all([
                    getDoc(studentDocRef), getDocs(financialsCol), getDocs(academicsCol)
                ]);
                
                let studentInfo = null;
                if (studentDocSnap.exists()) {
                    studentInfo = studentDocSnap.data();
                    setStudentData(studentInfo);
                } else { setLoading(false); return; }

                const transactions = financialSnapshot.docs.map(d => ({ ...d.data(), date: d.data().date.toDate() }));
                const totalFees = studentInfo.totalFees || 0;
                const feesPaid = transactions.filter(t => t.status === 'Paid').reduce((s, t) => s + t.amount, 0);
                setFinancials({ transactions, summary: { totalFees, feesPaid, balanceFees: totalFees - feesPaid } });

                const academicResults = academicSnapshot.docs.map(d => ({ ...d.data(), date: d.data().date.toDate() }));
                setAcademics(academicResults);

            } catch (error) { console.error("Error fetching data:", error); } 
            finally { setLoading(false); }
        };
        fetchAllData();
    }, [studentId]);
  
    if (loading) return <div className="p-8"><Skeleton count={10}/></div>;
    if (!studentData) return <div className="p-8">Student not found.</div>;
    
    const ProfileDetail = ({ label, value }) => (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-medium text-gray-800">{value || 'N/A'}</p>
        </div>
    );
    
    const subjects = ['All', ...new Set(academics.map(item => item.subject))];
    const filteredAcademics = selectedSubject === 'All' ? academics : academics.filter(item => item.subject === selectedSubject);
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    return (
        <div className="p-8">
            <header className="mb-6">
                <button onClick={() => setAdminView('all_students')} className="text-blue-600 mb-4 flex items-center">
                    &larr; Back to Students
                </button>
                <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div>
                        <h1 className="text-3xl font-bold">{studentData.firstName} {studentData.lastName}</h1>
                        <p className="text-gray-500">Student ID: {studentId.slice(0, 8)}</p>
                    </div>
                </div>
            </header>
            
            <div className="border-b">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}>Profile</button>
                    <button onClick={() => setActiveTab('academics')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'academics' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}>Academics</button>
                    <button onClick={() => setActiveTab('fees')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'fees' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}>Fees & Financials</button>
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
                
                {activeTab === 'academics' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Academic Progress</h3>
                            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-4 py-2 border rounded-lg">
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <table className="w-full text-left">
                           <thead><tr><th>Date</th><th>Test Name</th><th>Subject</th><th>Marks</th></tr></thead>
                            <tbody>
                                {filteredAcademics.map((item, i) => (
                                    <tr key={i}><td className="p-4">{item.date.toLocaleDateString()}</td><td>{item.testName}</td><td>{item.subject}</td><td>{item.marksObtained} / {item.totalMarks}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {activeTab === 'fees' && (
                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold mb-4">Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><p>Total Fees</p><p>{formatCurrency(financials.summary?.totalFees || 0)}</p></div>
                                <div><p>Fees Paid</p><p>{formatCurrency(financials.summary?.feesPaid || 0)}</p></div>
                                <div><p>Balance Fees</p><p>{formatCurrency(financials.summary?.balanceFees || 0)}</p></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border">
                            <h3>Transaction History</h3>
                            <table>
                                <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>
                                    {financials.transactions.map((tx, i) => (
                                        <tr key={i}><td>{tx.date.toLocaleDateString()}</td><td>{tx.description}</td><td>{formatCurrency(tx.amount)}</td><td><span>{tx.status}</span></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
            <p className="text-gray-500 mt-2">This feature is under development.</p>
        </div>
      </div>
    </>
);

const AttendancePage = () => <PlaceholderPage title="Attendance" />;
const ReportsPage = () => <PlaceholderPage title="Reports" />;
  
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// AUTHENTICATION COMPONENTS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const AuthLogo = () => ( 
    <div className="w-16 h-16 bg-blue-100 rounded-full mb-6 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 14l9-5-9-5-9 5 9 5z"></path><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path></svg>
    </div>
);
const AuthFormHeader = ({ type }) => (
    <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">LMS_WebApp</h1>
        <p className="text-gray-500 mt-2">{type === 'login' ? 'Welcome back! Please sign in.' : 'Create your new account'}</p>
    </div>
);
const AuthFormInput = ({ id, type, value, onChange, placeholder, icon }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">{icon}</span>
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
      toast.error('Invalid credentials.', { id: toastId });
    }
  };
  
  const emailIcon = <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>;
  const passwordIcon = <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <AuthFormInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" icon={emailIcon} />
        <AuthFormInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={passwordIcon} />
      <div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
            Sign in
        </button>
      </div>
      <div className="text-center text-sm">
        <p className="text-gray-600">Don't have an account? <button type="button" onClick={onToggleView} className="font-medium text-blue-600 hover:text-blue-500">Sign up</button></p>
      </div>
    </form>
  );
};

const LoginPage = ({ onToggleView }) => (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 items-center justify-center p-12 text-white">
          <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Empowering the Next Generation</h2>
              <p className="max-w-md">Our platform provides the tools to unlock every student's potential.</p>
          </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
              <AuthLogo />
              <AuthFormHeader type="login" />
              <LoginForm onToggleView={onToggleView}/>
          </div>
      </div>
    </div>
);

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

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: user.email,
        createdAt: new Date(),
        role: 'student',
      });
      toast.success('Account created successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to create account.', { id: toastId });
    }
  };
  
  const userIcon = <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const emailIcon = <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>;
  const passwordIcon = <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <AuthFormInput id="reg-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" icon={userIcon} />
      <AuthFormInput id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" icon={emailIcon} />
      <AuthFormInput id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={passwordIcon} />
      <AuthFormInput id="reg-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" icon={passwordIcon}/>
      <div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
          Create Account
        </button>
      </div>
      <div className="text-center text-sm"><p className="text-gray-600">Already have an account? <button type="button" onClick={onToggleView} className="font-medium text-blue-600 hover:text-blue-500">Log in</button></p></div>
    </form>
  );
};

const RegisterPage = ({ onToggleView }) => (
    <div className="min-h-screen flex">
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 items-center justify-center p-12 text-white">
          <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Join a Community of Learners</h2>
              <p className="max-w-md">Start your educational journey with us today.</p>
          </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
              <AuthLogo />
              <AuthFormHeader type="register" />
              <RegisterForm onToggleView={onToggleView}/>
          </div>
      </div>
    </div>
);

export default App;
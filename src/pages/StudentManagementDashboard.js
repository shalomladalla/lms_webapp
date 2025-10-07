import React from 'react';
import { Link } from 'react-router-dom'; // Make sure to import Link

const StudentManagementDashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Student Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* We'll turn these into links later */}
        <div className="p-4 border rounded-lg text-center hover:bg-gray-100 cursor-pointer">
          <h2 className="text-xl font-semibold">All Students</h2>
        </div>
        <div className="p-4 border rounded-lg text-center hover:bg-gray-100 cursor-pointer">
          <h2 className="text-xl font-semibold">Enroll Student</h2>
        </div>
        <div className="p-4 border rounded-lg text-center hover:bg-gray-100 cursor-pointer">
          <h2 className="text-xl font-semibold">Search a Student</h2>
        </div>
      </div>
    </div>
  );
};

export default StudentManagementDashboard;
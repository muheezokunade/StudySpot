import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Course {
  id: number;
  code: string;
  title: string;
}

interface ExamTimetableEntry {
  id: number;
  courseId: number;
  userId: number;
  examDate: string;
  location: string;
  notes: string;
  course?: Course;
}

interface NewExamEntry {
  courseId: number;
  examDate: string;
  location: string;
  notes: string;
}

const ExamTimetable: React.FC = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<ExamTimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  
  const [newEntry, setNewEntry] = useState<NewExamEntry>({
    courseId: 0,
    examDate: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch enrolled courses
      const enrollmentsResponse = await axios.get('/api/enrollments');
      const enrolledCoursesData = enrollmentsResponse.data.enrollments
        ? enrollmentsResponse.data.enrollments
            .filter((enrollment: any) => enrollment.course)
            .map((enrollment: any) => enrollment.course)
        : [];
      
      setEnrolledCourses(enrolledCoursesData);
      
      // Fetch exam timetable
      const timetableResponse = await axios.get('/api/exam-timetable');
      setTimetableEntries(timetableResponse.data.timetables);
      
      // Only set the courseId if we have enrolled courses
      if (enrolledCoursesData && enrolledCoursesData.length > 0 && enrolledCoursesData[0]?.id) {
        setNewEntry(prev => ({ ...prev, courseId: enrolledCoursesData[0].id }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetForm = () => {
    setNewEntry({
      courseId: enrolledCourses.length > 0 ? enrolledCourses[0].id : 0,
      examDate: '',
      location: '',
      notes: ''
    });
    setShowAddForm(false);
    setEditingEntryId(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (editingEntryId) {
        // Update existing entry
        await axios.put(`/api/exam-timetable/${editingEntryId}`, newEntry);
      } else {
        // Create new entry
        await axios.post('/api/exam-timetable', newEntry);
      }
      
      // Refresh data
      await fetchData();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save exam timetable entry');
      console.error('Error saving exam timetable entry:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (entry: ExamTimetableEntry) => {
    setEditingEntryId(entry.id);
    setNewEntry({
      courseId: entry.courseId,
      examDate: new Date(entry.examDate).toISOString().split('T')[0],
      location: entry.location || '',
      notes: entry.notes || ''
    });
    setShowAddForm(true);
  };
  
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this exam timetable entry?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/exam-timetable/${id}`);
      
      // Refresh data
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete exam timetable entry');
      console.error('Error deleting exam timetable entry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && timetableEntries.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show message if no courses are enrolled
  if (enrolledCourses.length === 0 && !isLoading) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Exam Timetable</h2>
        </div>
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
          <p className="text-yellow-600 dark:text-yellow-400">
            You need to enroll in courses before adding exam entries. 
            <a href="/courses" className="ml-2 underline">Go to Courses</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Exam Timetable</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Exam'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{editingEntryId ? 'Edit Exam' : 'Add New Exam'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select
                  name="courseId"
                  value={newEntry.courseId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select a course</option>
                  {enrolledCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Exam Date</label>
                <input
                  type="date"
                  name="examDate"
                  value={newEntry.examDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newEntry.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Room 101, Building A"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={newEntry.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information about the exam..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 mr-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : editingEntryId ? 'Update Exam' : 'Add Exam'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {timetableEntries.length === 0 ? (
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No exam timetable entries yet. Add your first exam by clicking the "Add Exam" button above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="p-3 border-b border-gray-300 dark:border-gray-700">Course</th>
                <th className="p-3 border-b border-gray-300 dark:border-gray-700">Date</th>
                <th className="p-3 border-b border-gray-300 dark:border-gray-700">Location</th>
                <th className="p-3 border-b border-gray-300 dark:border-gray-700">Notes</th>
                <th className="p-3 border-b border-gray-300 dark:border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timetableEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 border-b border-gray-300 dark:border-gray-700">
                    {entry.course ? `${entry.course.code} - ${entry.course.title}` : 'Unknown Course'}
                  </td>
                  <td className="p-3 border-b border-gray-300 dark:border-gray-700">
                    {new Date(entry.examDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 border-b border-gray-300 dark:border-gray-700">
                    {entry.location || 'Not specified'}
                  </td>
                  <td className="p-3 border-b border-gray-300 dark:border-gray-700">
                    {entry.notes || 'No notes'}
                  </td>
                  <td className="p-3 border-b border-gray-300 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExamTimetable; 
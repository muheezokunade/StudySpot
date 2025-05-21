import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseEnrollment from '../CourseEnrollment';
import { UserEnrollmentsProvider } from '../../../context/UserEnrollmentsContext';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the UserEnrollmentsContext
jest.mock('../../../context/UserEnrollmentsContext', () => ({
  UserEnrollmentsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useUserEnrollments: () => ({
    enrolledCourses: [
      { id: 1, courseId: 101, userId: 1, enrolledAt: '2023-05-18', isActive: true, 
        course: { id: 101, code: 'MTH101', title: 'Mathematics 101', description: 'Intro to Math', level: '100L' } 
      }
    ],
    enrollInCourse: jest.fn(),
    unenrollFromCourse: jest.fn(),
    isEnrolled: (courseId: number) => courseId === 101,
    loading: false
  })
}));

describe('CourseEnrollment Component', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({
      data: {
        courses: [
          { id: 101, code: 'MTH101', title: 'Mathematics 101', description: 'Intro to Math', level: '100L' },
          { id: 102, code: 'ENG101', title: 'English 101', description: 'Intro to English', level: '100L' },
        ]
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders available courses', async () => {
    render(
      <BrowserRouter>
        <UserEnrollmentsProvider>
          <CourseEnrollment />
        </UserEnrollmentsProvider>
      </BrowserRouter>
    );

    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Available Courses')).toBeInTheDocument();
      expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
      expect(screen.getByText('English 101')).toBeInTheDocument();
    });
  });

  test('shows enrolled status for enrolled courses', async () => {
    render(
      <BrowserRouter>
        <UserEnrollmentsProvider>
          <CourseEnrollment />
        </UserEnrollmentsProvider>
      </BrowserRouter>
    );

    // Wait for courses to load
    await waitFor(() => {
      const enrollButtons = screen.getAllByRole('button', { name: /enroll/i });
      
      // Find the button for MTH101 (already enrolled)
      const mth101Card = screen.getByText('Mathematics 101').closest('.course-card');
      const mth101Button = mth101Card ? mth101Card.querySelector('button') : null;
      
      // Find the button for ENG101 (not enrolled)
      const eng101Card = screen.getByText('English 101').closest('.course-card');
      const eng101Button = eng101Card ? eng101Card.querySelector('button') : null;
      
      // Verify button states
      expect(mth101Button?.textContent).toContain('Enrolled');
      expect(eng101Button?.textContent).toContain('Enroll');
    });
  });

  test('handles enrollment action', async () => {
    const enrollInCourse = jest.fn();
    
    jest.mock('../../../context/UserEnrollmentsContext', () => ({
      UserEnrollmentsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      useUserEnrollments: () => ({
        enrolledCourses: [],
        enrollInCourse,
        unenrollFromCourse: jest.fn(),
        isEnrolled: () => false,
        loading: false
      })
    }));

    render(
      <BrowserRouter>
        <UserEnrollmentsProvider>
          <CourseEnrollment />
        </UserEnrollmentsProvider>
      </BrowserRouter>
    );

    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('English 101')).toBeInTheDocument();
    });

    // Find and click the enroll button for ENG101
    const eng101Card = screen.getByText('English 101').closest('.course-card');
    const enrollButton = eng101Card ? eng101Card.querySelector('button') : null;
    
    if (enrollButton) {
      fireEvent.click(enrollButton);
      expect(enrollInCourse).toHaveBeenCalledWith(102); // ENG101 course ID
    }
  });

  test('renders course enrollment', () => {
    render(<CourseEnrollment />);
    // Basic test to ensure component renders without errors
    expect(document.body).toBeTruthy();
  });
}); 
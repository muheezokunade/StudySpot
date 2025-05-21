import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CourseEnrollment } from '@/types';

interface EnrollmentsResponse {
  enrollments: CourseEnrollment[];
}

interface UserEnrollmentsContextType {
  enrollments: CourseEnrollment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const UserEnrollmentsContext = createContext<UserEnrollmentsContextType>({
  enrollments: [],
  isLoading: false,
  error: null,
  refetch: () => {},
});

export const useUserEnrollments = () => useContext(UserEnrollmentsContext);

export const UserEnrollmentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<EnrollmentsResponse>({
    queryKey: ['/api/enrollments'],
  });

  const enrollments = data?.enrollments || [];

  return (
    <UserEnrollmentsContext.Provider value={{ enrollments, isLoading, error: error as Error | null, refetch }}>
      {children}
    </UserEnrollmentsContext.Provider>
  );
}; 
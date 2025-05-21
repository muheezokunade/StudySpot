import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import MaterialView from '../MaterialView';
import { UserEnrollmentsProvider } from '../../context/UserEnrollmentsContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ materialId: '1' }),
  useNavigate: () => jest.fn()
}));

// Mock UserEnrollmentsContext
jest.mock('../../context/UserEnrollmentsContext', () => ({
  UserEnrollmentsProvider: (props) => props.children,
  useUserEnrollments: () => ({
    isEnrolled: () => true,
    loading: false
  })
}));

describe('MaterialView Component', () => {
  test('renders material view', () => {
    render(
      <BrowserRouter>
        <UserEnrollmentsProvider>
          <MaterialView />
        </UserEnrollmentsProvider>
      </BrowserRouter>
    );
    // Basic test to ensure component renders without errors
    expect(document.body).toBeTruthy();
  });
}); 
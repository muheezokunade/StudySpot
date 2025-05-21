import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExamTimetable from '../ExamTimetable';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// UI component mocks are automatically loaded from __mocks__/@/components/ui

describe('ExamTimetable Component', () => {
  test('renders exam timetable', () => {
    render(<ExamTimetable />);
    // Basic test to ensure component renders without errors
    expect(document.body).toBeTruthy();
  });
}); 
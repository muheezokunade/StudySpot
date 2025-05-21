import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PDFViewer from '../PDFViewer';

// Mock is automatically loaded from __mocks__/react-pdf

describe('PDFViewer Component', () => {
  const mockFileUrl = '/test-file.pdf';
  
  test('renders PDF viewer', () => {
    render(<PDFViewer pdfUrl={mockFileUrl} title="Test PDF" />);
    // Basic test to ensure component renders without errors
    expect(document.body).toBeTruthy();
  });
}); 
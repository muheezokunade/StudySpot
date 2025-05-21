// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the matchMedia function for components that use window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Setup mocks without JSX syntax
jest.mock('react-pdf', () => {
  return {
    pdfjs: {
      GlobalWorkerOptions: {
        workerSrc: '',
      },
    },
    Document: jest.fn().mockImplementation(props => {
      // Simulate onLoadSuccess callback if provided
      setTimeout(() => {
        if (props.onLoadSuccess) {
          props.onLoadSuccess({ numPages: 5 });
        }
      }, 0);
      return null;
    }),
    Page: jest.fn().mockImplementation(() => null),
  };
});

// Mock UI components without JSX
jest.mock('@/components/ui/button', () => ({
  Button: jest.fn().mockImplementation(() => null),
}));

jest.mock('@/components/ui/card', () => ({
  Card: jest.fn().mockImplementation(() => null),
  CardHeader: jest.fn().mockImplementation(() => null),
  CardTitle: jest.fn().mockImplementation(() => null),
  CardDescription: jest.fn().mockImplementation(() => null),
  CardContent: jest.fn().mockImplementation(() => null),
  CardFooter: jest.fn().mockImplementation(() => null),
}));

jest.mock('@/components/ui/input', () => ({
  Input: jest.fn().mockImplementation(() => null),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: jest.fn().mockImplementation(() => null),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: jest.fn().mockImplementation(() => null),
  DialogTrigger: jest.fn().mockImplementation(() => null),
  DialogContent: jest.fn().mockImplementation(() => null),
  DialogHeader: jest.fn().mockImplementation(() => null),
  DialogTitle: jest.fn().mockImplementation(() => null),
  DialogDescription: jest.fn().mockImplementation(() => null),
  DialogFooter: jest.fn().mockImplementation(() => null),
  DialogClose: jest.fn().mockImplementation(() => null),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: jest.fn().mockImplementation(() => null),
  Clock: jest.fn().mockImplementation(() => null),
  MapPin: jest.fn().mockImplementation(() => null),
  Pencil: jest.fn().mockImplementation(() => null),
  Trash2: jest.fn().mockImplementation(() => null),
})); 
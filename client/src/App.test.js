import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  // Mock the context since we're not testing it here
  jest.mock('./context/AIContext', () => ({
    useAI: () => ({ 
      aiCharacters: [],
      posts: [],
      loading: false
    }),
    AIContextProvider: ({ children }) => <>{children}</>
  }));

  // This test simply verifies the App component renders without crashing
  render(<App />);
});
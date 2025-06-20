import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the context to avoid contract initialization issues in tests
jest.mock('./context/DAOContext', () => ({
  useDAO: () => ({
    connected: true,
    address: '0x1234567890abcdef',
    error: null,
    daoService: {},
    tokenBalance: '100',
    voteStake: { amount: '10', timestamp: 0 },
    proposalStake: { amount: '20', timestamp: 0 },
    proposals: [],
    refreshData: jest.fn(),
  }),
  DAOProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

test('renders DAO Governance header', () => {
  render(<App />);
  const headerElement = screen.getByText(/DAO Governance/i);
  expect(headerElement).toBeInTheDocument();
});

import React from 'react';
import { ChakraProvider, Box, Container } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DAOProvider } from './context/DAOContext';
import Header from './components/Header';
import ProposalsList from './pages/ProposalsList';
import StakingPage from './pages/StakingPage';
import CreateProposal from './pages/CreateProposal';
import ProposalDetail from './pages/ProposalDetail';

/**
 * Main App component with routes for Conjunto A requirements:
 * - Proposals list (with filters)
 * - Proposal detail (with voting and per-proposal delegation)
 * - Create proposal
 * - Staking page (includes token buy functionality)
 */
function App() {
  return (
    <DAOProvider>
      <Router>
        <Box minH="100vh">
          <Header />
          <Container maxW="container.xl" pt={4}>
            <Routes>
              {/* Default route redirects to proposals list */}
              <Route path="/" element={<ProposalsList />} />
              
              {/* Proposals management */}
              <Route path="/proposals" element={<ProposalsList />} />
              <Route path="/proposals/create" element={<CreateProposal />} />
              <Route path="/proposals/:id" element={<ProposalDetail />} />
              
              {/* Staking and token functionality */}
              <Route path="/staking" element={<StakingPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </DAOProvider>
  );
}

export default App;

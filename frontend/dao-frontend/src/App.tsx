import React from 'react';
import { ChakraProvider, Box, Container } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DAOProvider } from './context/DAOContext';
import Header from './components/Header';
import ProposalsList from './pages/ProposalsList';
import StakingPage from './pages/StakingPage';
import CreateProposal from './pages/CreateProposal';
import ProposalDetail from './pages/ProposalDetail';
import DelegationPage from './pages/DelegationPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <DAOProvider>
      <Router>
        <Box minH="100vh">
          <Header />
          <Container maxW="container.xl" pt={4}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/proposals" element={<ProposalsList />} />
              <Route path="/proposals/create" element={<CreateProposal />} />
              <Route path="/proposals/:id" element={<ProposalDetail />} />
              <Route path="/staking" element={<StakingPage />} />
              <Route path="/delegation" element={<DelegationPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </DAOProvider>
  );
}

export default App;

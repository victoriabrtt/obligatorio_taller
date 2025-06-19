import React from 'react';
import { ChakraProvider, Box, Container } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DAOProvider } from './context/DAOContext';
import Header from './components/Header';
import ProposalsList from './pages/ProposalsList';
import StakingPage from './pages/StakingPage';

function App() {
  return (
    <DAOProvider>
      <Router>
        <Box minH="100vh">
          <Header />
          <Container maxW="container.xl" pt={4}>
            <Routes>
              <Route path="/" element={<ProposalsList />} />
              <Route path="/proposals" element={<ProposalsList />} />
              <Route path="/staking" element={<StakingPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </DAOProvider>
  );
}

export default App;

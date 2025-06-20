import React from 'react';
import { Box, Flex, Heading, Button, Text, Link as ChakraLink, Tag, TagLabel } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useDAO } from '../context/DAOContext';

/**
 * Header component for the DAO application
 * Shows navigation links and user address
 * Based on Conjunto A requirements
 */
const Header: React.FC = () => {
  const { connected, address, tokenBalance, connectWallet } = useDAO();

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error("Error al conectar wallet:", err);
    }
  };

  return (
    <Flex 
      as="header" 
      width="100%" 
      align="center" 
      justifyContent="space-between"
      bg="blue.700"
      color="white"
      p={4}
    >
      <Heading size="md">DAO Governance</Heading>
      
      <Flex align="center">
        {/* Navigation menu - only required pages for Conjunto A */}
        <Flex mr={8} gap={6}>
          <ChakraLink as={RouterLink} to="/proposals" _hover={{ color: 'blue.100' }}>Propuestas</ChakraLink>
          <ChakraLink as={RouterLink} to="/proposals/create" _hover={{ color: 'blue.100' }}>Crear Propuesta</ChakraLink>
          <ChakraLink as={RouterLink} to="/staking" _hover={{ color: 'blue.100' }}>Staking & Tokens</ChakraLink>
        </Flex>
        
        {/* Wallet connection */}
        <Flex alignItems="center">
          {!connected ? (
            <Button 
              colorScheme="green" 
              size="sm" 
              onClick={handleConnectWallet} 
              mr={3}
            >
              Conectar Wallet
            </Button>
          ) : (
            <Flex alignItems="center">
              <Tag colorScheme="green" size="sm" mr={3}>
                <TagLabel>✓ Conectado</TagLabel>
              </Tag>
              
              {/* Display balance if connected */}
              <Text fontSize="sm" mr={4} display={{ base: 'none', md: 'block' }}>
                Balance: {tokenBalance} MTK
              </Text>
              
              {/* Display user's address */}
              <Text fontSize="sm">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Header;

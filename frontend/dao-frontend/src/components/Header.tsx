import React from 'react';
import { Box, Flex, Heading, Button, Text, Link as ChakraLink } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useDAO } from '../context/DAOContext';

const Header: React.FC = () => {
  const { connected, address } = useDAO();

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
        <Flex mr={8} gap={6}>
          <ChakraLink as={RouterLink} to="/" _hover={{ color: 'blue.100' }}>Dashboard</ChakraLink>
          <ChakraLink as={RouterLink} to="/proposals" _hover={{ color: 'blue.100' }}>Propuestas</ChakraLink>
          <ChakraLink as={RouterLink} to="/staking" _hover={{ color: 'blue.100' }}>Staking</ChakraLink>
          <ChakraLink as={RouterLink} to="/proposals/create" _hover={{ color: 'blue.100' }}>Crear Propuesta</ChakraLink>
          <ChakraLink as={RouterLink} to="/delegation" _hover={{ color: 'blue.100' }}>Delegación</ChakraLink>
        </Flex>
        
        <Text mr={4} fontSize="sm">
          DAO Address: {address?.slice(0, 6)}...{address?.slice(-4)}
        </Text>
      </Flex>
    </Flex>
  );
};

export default Header;

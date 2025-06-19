import React from 'react';
import { Box, Flex, Heading, Button, Text } from '@chakra-ui/react';
import { useDAO } from '../context/DAOContext';

const Header: React.FC = () => {
  const { connected, address, wallet, disconnect } = useDAO();
  const handleDisconnect = () => {
    disconnect();
    // Podríamos agregar un toast aquí si instalamos la dependencia necesaria
    console.log('Usuario desconectado');
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
      
      {connected ? (
        <Flex align="center">
          <Text mr={4} fontSize="sm">
            Connected with {wallet}: {address?.slice(0, 6)}...{address?.slice(-4)}
          </Text>
          <Button colorScheme="blue" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </Flex>
      ) : (
        <Text fontSize="sm">Not connected</Text>
      )}
    </Flex>
  );
};

export default Header;

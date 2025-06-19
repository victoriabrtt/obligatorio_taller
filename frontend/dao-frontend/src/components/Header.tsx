import React from 'react';
import { Box, Flex, Heading, Button, Text } from '@chakra-ui/react';
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
        <Text mr={4} fontSize="sm">
          DAO Address: {address?.slice(0, 6)}...{address?.slice(-4)}
        </Text>
      </Flex>
    </Flex>
  );
};

export default Header;

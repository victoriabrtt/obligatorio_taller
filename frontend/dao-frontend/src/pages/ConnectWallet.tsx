import React from 'react';
import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { useDAO } from '../context/DAOContext';
import { wallets } from '../connectors';

const ConnectWallet: React.FC = () => {
  const { connect, connecting, error } = useDAO();

  return (
    <Flex
      direction="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
      p={8}
    >
      <Stack direction="column" align="center" maxW="500px" width="100%" gap={8}>
        <Heading size="xl">Bienvenido a la DAO</Heading>
        <Text textAlign="center">
          Conéctate con tu wallet para acceder a la gobernanza de la DAO.
          Podrás ver y crear propuestas, votar y participar en la toma de decisiones.
        </Text>
        
        <Box width="100%" borderWidth={1} borderRadius="lg" p={6}>
          <Stack direction="column" gap={4}>
            <Heading size="md" mb={2}>Conectar Wallet</Heading>
            
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                width="100%"
                onClick={() => connect(wallet)}
                disabled={connecting}
                variant="outline"
                colorScheme="blue"
              >
                {connecting ? 'Conectando...' : wallet.name}
              </Button>
            ))}
            
            {error && (
              <Text color="red.500" fontSize="sm" mt={2}>
                {error}
              </Text>
            )}
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
};

export default ConnectWallet;

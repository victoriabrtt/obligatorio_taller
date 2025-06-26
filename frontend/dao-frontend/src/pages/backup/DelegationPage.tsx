import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Flex, Heading, Text, Input, FormControl, 
  FormLabel, FormHelperText, VStack, Alert, AlertIcon, useToast
} from '@chakra-ui/react';
import { useDAO } from '../context/DAOContext';

const DelegationPage: React.FC = () => {
  const toast = useToast();
  const { daoService, refreshData } = useDAO();
  
  const [delegateAddress, setDelegateAddress] = useState('');
  const [currentDelegate, setCurrentDelegate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el delegado actual cuando la página se monte
  useEffect(() => {
    const fetchCurrentDelegate = async () => {
      try {
        const delegate = await daoService.getCurrentDelegate();
        setCurrentDelegate(delegate === '0x0000000000000000000000000000000000000000' ? null : delegate);
      } catch (err) {
        console.error("Error al cargar el delegado actual:", err);
      }
    };
    
    fetchCurrentDelegate();
  }, [daoService]);

  // Manejar la delegación
  const handleDelegate = async () => {
    if (!delegateAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await daoService.delegate(delegateAddress);
      
      toast({
        title: 'Delegación exitosa',
        description: `Has delegado tus votos a ${delegateAddress}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setDelegateAddress('');
      setCurrentDelegate(delegateAddress);
      await refreshData();
    } catch (err: any) {
      setError(`Error al delegar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar la revocación de delegación
  const handleRevokeDelegate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Para revocar, delegamos a la dirección cero (0x0)
      await daoService.delegate('0x0000000000000000000000000000000000000000');
      
      toast({
        title: 'Delegación revocada',
        description: 'Has revocado tu delegación de votos',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      setCurrentDelegate(null);
      await refreshData();
    } catch (err: any) {
      setError(`Error al revocar delegación: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <Heading size="lg" mb={6}>Delegación de Votos</Heading>
      
      <VStack spacing={8} align="stretch">
        {/* Información sobre la delegación */}
        <Box p={6} borderWidth="1px" borderRadius="lg" bg="gray.50">
          <Heading size="md" mb={4}>¿Qué es la delegación de votos?</Heading>
          <Text mb={4}>
            La delegación de votos te permite asignar tu poder de voto a otra dirección. 
            Esto es útil si no puedes participar activamente en todas las votaciones 
            pero confías en que otra persona votará según tus intereses.
          </Text>
          <Text fontWeight="bold">
            Importante: Puedes revocar tu delegación en cualquier momento.
          </Text>
        </Box>
        
        {/* Estado actual de delegación */}
        <Box p={6} borderWidth="1px" borderRadius="lg">
          <Heading size="md" mb={4}>Estado actual de delegación</Heading>
          
          {currentDelegate ? (
            <VStack align="stretch" spacing={4}>
              <Text>
                Actualmente estás delegando tus votos a:
              </Text>
              <Alert status="info" variant="subtle">
                <AlertIcon />
                <Text fontFamily="monospace" fontWeight="bold">{currentDelegate}</Text>
              </Alert>
              <Button 
                colorScheme="red" 
                size="md" 
                width="full" 
                onClick={handleRevokeDelegate}
                isLoading={loading}
              >
                Revocar delegación
              </Button>
            </VStack>
          ) : (
            <Text color="gray.600">
              No estás delegando tus votos a nadie actualmente.
            </Text>
          )}
        </Box>
        
        {/* Formulario de delegación */}
        <Box p={6} borderWidth="1px" borderRadius="lg">
          <Heading size="md" mb={4}>Delegar votos</Heading>
          
          <FormControl>
            <FormLabel>Dirección del delegado</FormLabel>
            <Input 
              value={delegateAddress}
              onChange={(e) => setDelegateAddress(e.target.value)}
              placeholder="0x..."
              mb={2}
            />
            <FormHelperText mb={4}>
              Introduce la dirección de la persona a la que quieres delegar tus votos.
            </FormHelperText>
            
            <Button 
              colorScheme="blue" 
              width="full" 
              onClick={handleDelegate}
              isDisabled={!delegateAddress}
              isLoading={loading}
            >
              Delegar votos
            </Button>
          </FormControl>
        </Box>
        
        {/* Mensaje de error */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default DelegationPage;

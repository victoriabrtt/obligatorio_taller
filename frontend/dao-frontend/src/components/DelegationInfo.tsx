import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Button,
  Tooltip,
  useColorModeValue,
  Collapse,
  Icon,
  Spinner
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, WarningIcon } from '@chakra-ui/icons';
import { useDAO } from '../context/DAOContext';
import { shortenAddress } from '../utils/addressUtils';

interface DelegationInfoProps {
  proposalId?: number;
}

const DelegationInfo: React.FC<DelegationInfoProps> = ({ proposalId }) => {
  const { daoService, address } = useDAO();
  const [isLoading, setIsLoading] = useState(true);
  const [delegatedTo, setDelegatedTo] = useState<string | null>(null);
  const [delegatedToForProposal, setDelegatedToForProposal] = useState<string | null>(null);
  const [delegators, setDelegators] = useState<string[]>([]);
  const [delegatorsForProposal, setDelegatorsForProposal] = useState<string[]>([]);
  const [showDelegators, setShowDelegators] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchDelegationData = async () => {
      if (!address) return;
      
      try {
        setIsLoading(true);
        
        // Comprobar a quién ha delegado el usuario
        const effectiveDelegate = await daoService.getEffectiveDelegate(address);
        if (effectiveDelegate !== address) {
          setDelegatedTo(effectiveDelegate);
        }
        
        // Si se proporciona el ID de propuesta, comprobar delegación específica
        if (proposalId !== undefined) {
          const effectiveDelegateForProposal = await daoService.getEffectiveDelegateForProposal(proposalId, address);
          if (effectiveDelegateForProposal !== address && effectiveDelegateForProposal !== effectiveDelegate) {
            setDelegatedToForProposal(effectiveDelegateForProposal);
          }
        }
        
        // Comprobar quién ha delegado al usuario
        const userDelegators = await daoService.getDelegators(address);
        setDelegators(userDelegators.filter((d: string) => d !== address));
        
        // Comprobar quién ha delegado al usuario para esta propuesta específica
        if (proposalId !== undefined) {
          const proposalDelegators = await daoService.getDelegatorsForProposal(proposalId, address);
          setDelegatorsForProposal(proposalDelegators.filter((d: string) => d !== address));
        }
      } catch (error) {
        console.error("Error fetching delegation data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDelegationData();
  }, [address, daoService, proposalId]);
  
  const handleRevokeGeneral = async () => {
    try {
      await daoService.revokeDelegate();
      setDelegatedTo(null);
    } catch (error) {
      console.error("Error revoking delegation:", error);
    }
  };
  
  const handleRevokeForProposal = async () => {
    if (proposalId === undefined) return;
    
    try {
      await daoService.revokeDelegateForProposal(proposalId);
      setDelegatedToForProposal(null);
    } catch (error) {
      console.error("Error revoking proposal delegation:", error);
    }
  };
  
  const hasDelegation = delegatedTo !== null || delegatedToForProposal !== null;
  const hasDelegators = delegators.length > 0 || delegatorsForProposal.length > 0;
  
  if (isLoading) {
    return (
      <Box p={5} borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor}>
        <HStack justify="center" spacing={3} p={4}>
          <Spinner size="sm" color="blue.500" />
          <Text>Cargando información de delegación...</Text>
        </HStack>
      </Box>
    );
  }
  
  if (!hasDelegation && !hasDelegators) {
    return (
      <Box p={5} borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor} opacity={0.8}>
        <Text fontSize="sm" textAlign="center" color="gray.500">
          No tienes delegaciones activas en este momento
        </Text>
      </Box>
    );
  }

  return (
    <Box p={5} borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor}>
      <VStack spacing={4} align="stretch">
        <Heading size="md">Información de Delegación</Heading>
        
        {hasDelegation && (
          <Box>
            <Text fontWeight="medium" mb={2}>Tus delegaciones activas:</Text>
            <VStack spacing={3} align="stretch">
              {delegatedTo && (
                <HStack justify="space-between" p={3} bg="blue.50" borderRadius="md">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm">Delegación general a:</Text>
                    <Text fontWeight="bold">{shortenAddress(delegatedTo)}</Text>
                  </VStack>
                  <Tooltip label="Revocar tu delegación general">
                    <Button size="sm" colorScheme="red" variant="outline" onClick={handleRevokeGeneral}>
                      Revocar
                    </Button>
                  </Tooltip>
                </HStack>
              )}
              
              {delegatedToForProposal && (
                <HStack justify="space-between" p={3} bg="purple.50" borderRadius="md">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm">Delegación para propuesta #{proposalId} a:</Text>
                    <Text fontWeight="bold">{shortenAddress(delegatedToForProposal)}</Text>
                  </VStack>
                  <Tooltip label={`Revocar tu delegación para la propuesta #${proposalId}`}>
                    <Button size="sm" colorScheme="red" variant="outline" onClick={handleRevokeForProposal}>
                      Revocar
                    </Button>
                  </Tooltip>
                </HStack>
              )}
              
              <Text fontSize="xs" color="gray.500" mt={1}>
                <Icon as={WarningIcon} color="orange.500" mr={1} />
                No podrás votar directamente mientras tengas una delegación activa.
              </Text>
            </VStack>
          </Box>
        )}
        
        {hasDelegation && hasDelegators && <Divider my={2} />}
        
        {hasDelegators && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="medium">Delegaciones recibidas:</Text>
              <Button 
                variant="link" 
                rightIcon={showDelegators ? <ChevronUpIcon /> : <ChevronDownIcon />}
                onClick={() => setShowDelegators(!showDelegators)}
                size="sm"
              >
                {showDelegators ? "Ocultar" : "Mostrar"}
              </Button>
            </HStack>
            
            <Collapse in={showDelegators} animateOpacity>
              <VStack spacing={2} align="stretch" mt={2}>
                {delegators.length > 0 && (
                  <Box>
                    <HStack mb={1}>
                      <Badge colorScheme="blue">General</Badge>
                      <Text fontSize="sm">{delegators.length} direcciones</Text>
                    </HStack>
                    <Box 
                      maxH="120px" 
                      overflowY="auto" 
                      p={2} 
                      bg="gray.50" 
                      borderRadius="md"
                    >
                      {delegators.map((delegator, idx) => (
                        <Text key={`delegator-${idx}`} fontSize="sm" mb={1}>
                          {shortenAddress(delegator)}
                        </Text>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {delegatorsForProposal.length > 0 && (
                  <Box mt={delegators.length > 0 ? 2 : 0}>
                    <HStack mb={1}>
                      <Badge colorScheme="purple">Propuesta #{proposalId}</Badge>
                      <Text fontSize="sm">{delegatorsForProposal.length} direcciones</Text>
                    </HStack>
                    <Box 
                      maxH="120px" 
                      overflowY="auto" 
                      p={2} 
                      bg="gray.50" 
                      borderRadius="md"
                    >
                      {delegatorsForProposal.map((delegator, idx) => (
                        <Text key={`proposal-delegator-${idx}`} fontSize="sm" mb={1}>
                          {shortenAddress(delegator)}
                        </Text>
                      ))}
                    </Box>
                  </Box>
                )}
              </VStack>
            </Collapse>
            
            <Text fontSize="xs" color="gray.500" mt={2}>
              Tu voto tendrá más peso debido a estas delegaciones.
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default DelegationInfo;

import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Heading, Stack, Text, Badge, Alert, AlertIcon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useDAO } from '../context/DAOContext';

// Tipos de estado de propuestas
type ProposalStatus = 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

// Enumeración de tipos de propuestas
enum ProposalType {
  Simple = 0,
  Transaction = 1,
  ParameterChange = 2,
  TokenMint = 3
}

const ProposalsList: React.FC = () => {
  const navigate = useNavigate();
  const { proposals, refreshData, isPaused } = useDAO();
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'ALL'>('ALL');
  
  // Filtrar propuestas por estado
  const filteredProposals = proposals.filter(proposal => {
    if (filterStatus === 'ALL') return true;
    return proposal.status === filterStatus;
  });

  // Traducir el tipo de propuesta a texto
  const getProposalTypeText = (type: number): string => {
    switch (type) {
      case ProposalType.Simple: return 'Simple';
      case ProposalType.Transaction: return 'Transacción';
      case ProposalType.ParameterChange: return 'Cambio de Parámetro';
      case ProposalType.TokenMint: return 'Minteo de Tokens';
      default: return 'Desconocido';
    }
  };

  // Color de badge según estado
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE': return 'blue';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'EXECUTED': return 'purple';
      default: return 'gray';
    }
  };

  // Refrescar datos
  useEffect(() => {
    refreshData();
  }, []);

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex alignItems="center" gap={3}>
          <Heading size="lg">Propuestas</Heading>
          <Badge 
            colorScheme={isPaused ? "red" : "green"} 
            fontSize="md" 
            px={3} 
            py={1}
            borderRadius="md"
          >
            DAO {isPaused ? "PAUSADA" : "ACTIVA"}
          </Badge>
        </Flex>
        <Button onClick={refreshData} colorScheme="blue" size="sm">
          Refrescar
        </Button>
      </Flex>

      {isPaused && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">La DAO está en modo pausa (circuit breaker)</Text>
            <Text fontSize="sm">No se pueden crear o ejecutar propuestas hasta que se active la DAO desde el contrato multisig de emergencia.</Text>
          </Box>
        </Alert>
      )}

      <Flex direction="row" gap={4} mb={6}>
        <Button 
          variant={filterStatus === 'ALL' ? 'solid' : 'outline'} 
          colorScheme="blue" 
          onClick={() => setFilterStatus('ALL')}
        >
          Todas
        </Button>
        <Button 
          variant={filterStatus === 'ACTIVE' ? 'solid' : 'outline'} 
          colorScheme="blue" 
          onClick={() => setFilterStatus('ACTIVE')}
        >
          Activas
        </Button>
        <Button 
          variant={filterStatus === 'APPROVED' ? 'solid' : 'outline'} 
          colorScheme="blue" 
          onClick={() => setFilterStatus('APPROVED')}
        >
          Aprobadas
        </Button>
        <Button 
          variant={filterStatus === 'REJECTED' ? 'solid' : 'outline'} 
          colorScheme="blue" 
          onClick={() => setFilterStatus('REJECTED')}
        >
          Rechazadas
        </Button>
        <Button 
          variant={filterStatus === 'EXECUTED' ? 'solid' : 'outline'} 
          colorScheme="blue" 
          onClick={() => setFilterStatus('EXECUTED')}
        >
          Ejecutadas
        </Button>
      </Flex>

      <Stack direction="column" gap={4}>
        {filteredProposals.length === 0 ? (
          <Text>No hay propuestas para mostrar</Text>
        ) : (
          filteredProposals.map((proposal) => (
            <Box 
              key={proposal.id} 
              p={5} 
              shadow="md" 
              borderWidth="1px" 
              borderRadius="lg"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Heading fontSize="xl">Propuesta #{proposal.id}</Heading>
                <Badge colorScheme={getStatusColor(proposal.status)}>
                  {proposal.status}
                </Badge>
              </Flex>

              <Text mb={2}>
                <strong>Tipo:</strong> {getProposalTypeText(proposal.proposalType)}
              </Text>
              
              <Text mb={4}>{proposal.description}</Text>
              
              <Flex justify="space-between" fontSize="sm" color="gray.600">
                <Text>Creada por: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</Text>
                <Text>
                  A favor: {proposal.votesFor} | En contra: {proposal.votesAgainst}
                </Text>
              </Flex>

              <Flex mt={4} justify="flex-end">
                <Button 
                  size="sm" 
                  colorScheme="blue" 
                  mr={2}
                  onClick={() => navigate(`/proposals/${proposal.id}`)}
                >
                  Ver Detalles
                </Button>
              </Flex>
            </Box>
          ))
        )}
      </Stack>
    </Box>
  );
};

export default ProposalsList;

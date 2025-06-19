import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Heading, Text, Button, VStack, HStack, Divider, 
  Badge, Flex, Progress, Stat, StatLabel, StatNumber, 
  StatHelpText, Card, CardHeader, CardBody, Input, 
  FormControl, FormLabel, Alert, AlertIcon, useToast 
} from '@chakra-ui/react';
import { useDAO } from '../context/DAOContext';

// Enums para traducir los tipos de propuestas
enum ProposalTypeLabels {
  'Simple',
  'Transacción',
  'Cambio de Parámetro',
  'Mint de Tokens'
}

// Componente principal de detalles de una propuesta
const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { proposals, daoService, voteStake, refreshData } = useDAO();

  const [proposal, setProposal] = useState<any>(null);
  const [delegateAddress, setDelegateAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar la propuesta cuando cambia el ID o se actualizan las propuestas
  useEffect(() => {
    if (id && proposals.length > 0) {
      const proposalId = parseInt(id);
      const foundProposal = proposals.find(p => p.id === proposalId);
      
      if (foundProposal) {
        setProposal(foundProposal);
      } else {
        // Redirigir si no se encuentra la propuesta
        navigate('/proposals');
      }
    }
  }, [id, proposals, navigate]);

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Calcular porcentaje de votos a favor
  const calculateVotePercentage = () => {
    if (!proposal) return 0;
    
    const totalVotes = Number(proposal.votesFor) + Number(proposal.votesAgainst);
    if (totalVotes === 0) return 0;
    
    return (Number(proposal.votesFor) / totalVotes) * 100;
  };

  // Traducir tipo de propuesta
  const getProposalTypeLabel = (type: number) => {
    return ProposalTypeLabels[type] || 'Desconocido';
  };

  // Votar en la propuesta
  const handleVote = async (inFavor: boolean) => {
    if (!proposal) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await daoService.voteProposal(proposal.id, inFavor);
      
      toast({
        title: 'Voto registrado',
        description: `Has votado ${inFavor ? 'a favor' : 'en contra'} de la propuesta #${proposal.id}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      await refreshData();
    } catch (err: any) {
      setError(`Error al votar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delegar el voto para esta propuesta específica
  const handleDelegateForProposal = async () => {
    if (!proposal || !delegateAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await daoService.delegateForProposal(proposal.id, delegateAddress);
      
      toast({
        title: 'Voto delegado',
        description: `Has delegado tu voto para la propuesta #${proposal.id} a ${delegateAddress}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setDelegateAddress('');
      await refreshData();
    } catch (err: any) {
      setError(`Error al delegar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar la propuesta si está aprobada y finalizada
  const handleExecuteProposal = async () => {
    if (!proposal) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await daoService.executeProposal(proposal.id);
      
      toast({
        title: 'Propuesta ejecutada',
        description: `La propuesta #${proposal.id} ha sido ejecutada correctamente`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      await refreshData();
    } catch (err: any) {
      setError(`Error al ejecutar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!proposal) {
    return (
      <Box p={8} textAlign="center">
        <Text>Cargando propuesta...</Text>
      </Box>
    );
  }
  
  // Parsear título y descripción (están combinados en el campo description)
  const [title, ...descriptionParts] = proposal.description.split('\n\n');
  const description = descriptionParts.join('\n\n');
  
  // Determinar si el usuario puede votar
  const canVote = Number(voteStake.amount) > 0 && 
                  proposal.status === 'ACTIVE';
  
  // Determinar si la propuesta se puede ejecutar
  const canExecute = proposal.status === 'APPROVED' && 
                    !proposal.executed;

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Button 
        onClick={() => navigate('/proposals')} 
        mb={6} 
        leftIcon={<span>←</span>}
      >
        Volver a propuestas
      </Button>
      
      <Card variant="outline" mb={6}>
        <CardHeader bg="gray.50" p={6}>
          <Flex justify="space-between" align="flex-start">
            <Box>
              <Flex align="center" gap={3} mb={2}>
                <Badge 
                  colorScheme={
                    proposal.status === 'ACTIVE' ? 'blue' :
                    proposal.status === 'APPROVED' ? 'green' :
                    proposal.status === 'EXECUTED' ? 'teal' :
                    'red'
                  }
                  p={1}
                >
                  {proposal.status === 'ACTIVE' ? 'Activa' :
                   proposal.status === 'APPROVED' ? 'Aprobada' :
                   proposal.status === 'EXECUTED' ? 'Ejecutada' :
                   'Rechazada'}
                </Badge>
                
                <Badge colorScheme="purple" p={1}>
                  {getProposalTypeLabel(proposal.proposalType)}
                </Badge>
              </Flex>
              
              <Heading size="lg" mb={1}>{title}</Heading>
              <Text color="gray.500">
                Propuesta #{proposal.id} por {proposal.proposer.substring(0, 6)}...{proposal.proposer.substring(38)}
              </Text>
            </Box>
          </Flex>
        </CardHeader>
        
        <CardBody p={6}>
          <VStack spacing={6} align="stretch">
            {/* Información de la propuesta */}
            <Box>
              <Heading size="sm" mb={3}>Información</Heading>
              <HStack spacing={8} flexWrap="wrap">
                <Stat>
                  <StatLabel>Creada</StatLabel>
                  <StatNumber fontSize="md">{formatDate(proposal.createdAt)}</StatNumber>
                </Stat>
                
                <Stat>
                  <StatLabel>Finaliza</StatLabel>
                  <StatNumber fontSize="md">{formatDate(proposal.endTime)}</StatNumber>
                  <StatHelpText>
                    {Date.now() > proposal.endTime * 1000 ? 'Finalizada' : 'En proceso'}
                  </StatHelpText>
                </Stat>
              </HStack>
            </Box>
            
            <Divider />
            
            {/* Descripción */}
            <Box>
              <Heading size="sm" mb={3}>Descripción</Heading>
              <Text whiteSpace="pre-wrap">{description}</Text>
            </Box>
            
            <Divider />
            
            {/* Estado de la votación */}
            <Box>
              <Heading size="sm" mb={3}>Estado de la votación</Heading>
              
              <Flex mb={2}>
                <Text flex="1">A favor: {proposal.votesFor}</Text>
                <Text flex="1" textAlign="right">En contra: {proposal.votesAgainst}</Text>
              </Flex>
              
              <Progress 
                value={calculateVotePercentage()} 
                colorScheme="green" 
                backgroundColor="red.100"
                height="24px"
                borderRadius="md"
              />
              
              <Text fontSize="sm" mt={2} textAlign="center">
                {calculateVotePercentage().toFixed(2)}% a favor
              </Text>
            </Box>
            
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}
            
            {/* Acciones según el estado de la propuesta */}
            {proposal.status === 'ACTIVE' && (
              <>
                <Divider />
                
                {/* Sección para votar */}
                <Box>
                  <Heading size="sm" mb={3}>Votar</Heading>
                  
                  <HStack spacing={4}>
                    <Button 
                      colorScheme="green" 
                      onClick={() => handleVote(true)}
                      isLoading={loading}
                      isDisabled={!canVote}
                      flex="1"
                    >
                      Votar a favor
                    </Button>
                    
                    <Button 
                      colorScheme="red" 
                      onClick={() => handleVote(false)}
                      isLoading={loading}
                      isDisabled={!canVote}
                      flex="1"
                    >
                      Votar en contra
                    </Button>
                  </HStack>
                  
                  {!canVote && Number(voteStake.amount) === 0 && (
                    <Alert status="warning" mt={3}>
                      <AlertIcon />
                      Necesitas tener tokens en stake para votar
                    </Alert>
                  )}
                </Box>
                
                <Divider />
                
                {/* Sección para delegar voto */}
                <Box>
                  <Heading size="sm" mb={3}>Delegar voto para esta propuesta</Heading>
                  
                  <FormControl>
                    <FormLabel>Dirección del delegado</FormLabel>
                    <HStack>
                      <Input 
                        value={delegateAddress}
                        onChange={(e) => setDelegateAddress(e.target.value)}
                        placeholder="0x..."
                        flex="3"
                      />
                      
                      <Button 
                        colorScheme="blue" 
                        onClick={handleDelegateForProposal}
                        isLoading={loading}
                        isDisabled={!delegateAddress || !canVote}
                        flex="1"
                      >
                        Delegar
                      </Button>
                    </HStack>
                  </FormControl>
                </Box>
              </>
            )}
            
            {/* Sección para ejecutar propuesta si está aprobada */}
            {canExecute && (
              <Box mt={4}>
                <Button 
                  colorScheme="teal" 
                  size="lg" 
                  width="full"
                  onClick={handleExecuteProposal}
                  isLoading={loading}
                >
                  Ejecutar propuesta
                </Button>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ProposalDetail;

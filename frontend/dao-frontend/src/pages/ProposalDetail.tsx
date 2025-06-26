import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Heading, Text, Button, VStack, HStack, Divider, 
  Badge, Flex, Progress, Stat, StatLabel, StatNumber, 
  StatHelpText, Card, CardHeader, CardBody, Grid, GridItem,
  Container, Icon, Tabs, TabList, TabPanels, Tab, TabPanel,
  useColorModeValue, useToast, Alert, AlertIcon, FormControl, FormLabel, Input
} from '@chakra-ui/react';
import { CheckIcon, TimeIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { useDAO } from '../context/DAOContext';
import VotingForm from '../components/VotingForm';
import DelegationForm from '../components/DelegationForm';
import DelegationInfo from '../components/DelegationInfo';
import TransactionFeedback, { TransactionStatus } from '../components/TransactionFeedback';
import { ethers } from 'ethers';

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
  const [error, setError] = useState<string | null>(null);
  
  const [executionLoading, setExecutionLoading] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Cargar la propuesta cuando cambia el ID o se actualizan las propuestas
  useEffect(() => {
    if (id && proposals.length > 0) {
      const proposalId = parseInt(id);
      const foundProposal = proposals.find(p => p.id === proposalId);
      
      if (foundProposal) {
        // Añadir información adicional a la propuesta para los componentes
        const enhancedProposal = {
          ...foundProposal,
          votingEnds: foundProposal.creationTime + (foundProposal.votingPeriod * 86400)
        };
        setProposal(enhancedProposal);
      } else {
        // Redirigir si no se encuentra la propuesta
        navigate('/proposals');
        toast({
          title: "Propuesta no encontrada",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }, [id, proposals, navigate, toast]);

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Calcular tiempo restante hasta el final de la votación
  const getTimeRemaining = () => {
    if (!proposal) return "";
    
    const endTime = proposal.creationTime + (proposal.votingPeriod * 86400);
    const now = Math.floor(Date.now() / 1000);
    const diff = endTime - now;
    
    if (diff <= 0) return "Votación finalizada";
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };
  
  // Calcular porcentaje de votos a favor
  const calculateVotePercentage = () => {
    if (!proposal) return 0;
    
    const votesFor = Number(ethers.formatEther(proposal.votesFor || 0));
    const votesAgainst = Number(ethers.formatEther(proposal.votesAgainst || 0));
    const totalVotes = votesFor + votesAgainst;
    
    if (totalVotes === 0) return 0;
    return (votesFor / totalVotes) * 100;
  };

  // Traducir tipo de propuesta
  const getProposalTypeLabel = (type: number) => {
    return ProposalTypeLabels[type] || 'Desconocido';
  };

  // Ejecutar la propuesta si está aprobada y finalizada
  const handleExecuteProposal = async () => {
    if (!proposal) return;
    
    try {
      setExecutionLoading('pending');
      setError(null);
      
      const tx = await daoService.executeProposal(proposal.id);
      setTxHash(tx.hash);
      
      await tx.wait();
      setExecutionLoading('success');
      
      toast({
        title: 'Propuesta ejecutada',
        description: `La propuesta #${proposal.id} ha sido ejecutada correctamente`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      await refreshData();
    } catch (err: any) {
      console.error("Error al ejecutar propuesta:", err);
      setExecutionLoading('error');
      setError(`Error al ejecutar: ${err.message}`);
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
      
      <Card variant="outline" mb={6} boxShadow="md">
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
                  p={2}
                  borderRadius="md"
                  fontSize="sm"
                >
                  {proposal.status === 'ACTIVE' ? 'Activa' :
                   proposal.status === 'APPROVED' ? 'Aprobada' :
                   proposal.status === 'EXECUTED' ? 'Ejecutada' :
                   'Rechazada'}
                </Badge>
                
                <Badge colorScheme="purple" p={2} borderRadius="md" fontSize="sm">
                  {getProposalTypeLabel(proposal.proposalType)}
                </Badge>
                
                {getTimeRemaining() !== "Votación finalizada" && (
                  <HStack bg="blue.50" p={1} borderRadius="md">
                    <Icon as={TimeIcon} color="blue.500" />
                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                      {getTimeRemaining()}
                    </Text>
                  </HStack>
                )}
              </Flex>
              
              <Heading size="lg" mb={1}>{title}</Heading>
              <Text color="gray.500" className="eth-address">
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
            
            {/* Tabs de interacción */}
            <Tabs isFitted variant="enclosed" colorScheme="blue" mt={4}>
              <TabList>
                <Tab>Estado</Tab>
                <Tab>Votar</Tab>
                <Tab>Delegar</Tab>
              </TabList>
              <TabPanels>
                {/* Tab de Estado */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="sm" mb={3}>Estado de la votación</Heading>
                      
                      <Flex mb={2}>
                        <Text flex="1">A favor: {parseFloat(ethers.formatEther(proposal.votesFor || 0)).toFixed(2)}</Text>
                        <Text flex="1" textAlign="right">En contra: {parseFloat(ethers.formatEther(proposal.votesAgainst || 0)).toFixed(2)}</Text>
                      </Flex>
                      
                                    <Box className="vote-progress" position="relative">
                        <Progress 
                          value={calculateVotePercentage()} 
                          colorScheme="green" 
                          backgroundColor="red.100"
                          height="24px"
                          borderRadius="md"
                          hasStripe
                        />
                        <Text 
                          className="vote-label"
                          fontSize="sm" 
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          color="white"
                          fontWeight="bold"
                          textShadow="0 0 2px rgba(0,0,0,0.7)"
                        >
                          {calculateVotePercentage().toFixed(2)}% a favor
                        </Text>
                      </Box>
                    </Box>
                    
                    {error && (
                      <Alert status="error">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}
                    
                    {/* Mostrar información de delegación */}
                    <Box mt={4}>
                      <Heading size="sm" mb={3}>Información de Delegación</Heading>
                      <DelegationInfo proposalId={parseInt(id!)} />
                    </Box>
                    
                    {/* Acción para ejecutar propuesta */}
                    {canExecute && (
                      <Box mt={4}>
                        <Button 
                          colorScheme="teal" 
                          size="lg" 
                          width="full"
                          onClick={handleExecuteProposal}
                          isLoading={executionLoading === 'pending'}
                        >
                          Ejecutar propuesta
                        </Button>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
                
                {/* Tab de Votación */}
                <TabPanel>
                  {proposal.status === 'ACTIVE' ? (
                    <VotingForm 
                      proposalId={parseInt(id!)} 
                      proposal={proposal}
                      onSuccess={refreshData} 
                    />
                  ) : (
                    <Alert status="info">
                      <AlertIcon />
                      Esta propuesta ya no está activa para votación.
                    </Alert>
                  )}
                </TabPanel>
                
                {/* Tab de Delegación */}
                <TabPanel>
                  {proposal.status === 'ACTIVE' ? (
                    <DelegationForm 
                      proposalId={parseInt(id!)} 
                      onSuccess={refreshData} 
                    />
                  ) : (
                    <Alert status="info">
                      <AlertIcon />
                      No es posible delegar votos en una propuesta finalizada.
                    </Alert>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
            
            {/* Sección para ejecutar propuesta si está aprobada */}
            {canExecute && (
              <Box mt={4}>                        <Button 
                          colorScheme="teal" 
                          size="lg" 
                          width="full"
                          onClick={handleExecuteProposal}
                          isLoading={executionLoading === 'pending'}
                          className="blockchain-button"
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

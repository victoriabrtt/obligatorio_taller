import React, { useState, useEffect } from 'react';
import { 
  Box, Heading, Text, Flex, Stat, StatLabel, StatNumber, 
  StatHelpText, StatArrow, SimpleGrid, Progress, Card, CardHeader, 
  CardBody, Divider, Button, HStack
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useDAO } from '../context/DAOContext';

const DashboardPage: React.FC = () => {
  const { daoService, proposals, tokenBalance, voteStake, proposalStake, refreshData } = useDAO();
  
  const [daoInfo, setDaoInfo] = useState({
    stakingToVote: '0',
    stakingToPropose: '0',
    minStakingTime: '0',
    proposalDurationDays: '0',
    totalProposals: 0,
    activeProposals: 0,
    isPaused: false,
  });
  
  useEffect(() => {
    const fetchDAOInfo = async () => {
      try {
        // Obtener parámetros del DAO
        const stakingToVote = await daoService.getStakingToVote();
        const stakingToPropose = await daoService.getStakingToPropose();
        const minStakingTime = await daoService.getMinStakingTime();
        const proposalDurationDays = await daoService.getProposalDurationDays();
        const isPaused = await daoService.getIsPaused();
        
        // Calcular estadísticas de propuestas
        const activeProposals = proposals.filter(p => p.status === 'ACTIVE').length;
        
        setDaoInfo({
          stakingToVote,
          stakingToPropose,
          minStakingTime,
          proposalDurationDays,
          totalProposals: proposals.length,
          activeProposals,
          isPaused,
        });
      } catch (err) {
        console.error('Error al cargar información del DAO:', err);
      }
    };
    
    fetchDAOInfo();
  }, [daoService, proposals]);
  
  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} segundos`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas`;
    return `${Math.floor(seconds / 86400)} días`;
  };
  
  // Calcular porcentaje de propuestas activas
  const activeProposalsPercentage = daoInfo.totalProposals > 0 
    ? (daoInfo.activeProposals / daoInfo.totalProposals) * 100 
    : 0;
  
  // Obtener propuestas recientes limitadas a 3
  const recentProposals = [...proposals]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);
  
  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Dashboard DAO</Heading>
        <Button onClick={refreshData} colorScheme="blue" size="sm">
          Refrescar
        </Button>
      </Flex>
      
      {daoInfo.isPaused && (
        <Box bg="red.100" p={4} borderRadius="md" mb={6}>
          <Text color="red.800" fontWeight="bold">
            ⚠️ El DAO se encuentra actualmente pausado. Las operaciones están restringidas.
          </Text>
        </Box>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat p={4} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Balance de Tokens</StatLabel>
          <StatNumber>{tokenBalance}</StatNumber>
          <StatHelpText>MTK Token</StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Tokens en Stake para Votar</StatLabel>
          <StatNumber>{voteStake.amount}</StatNumber>
          <StatHelpText>
            {Number(voteStake.amount) > 0 && <StatArrow type="increase" />}
            MTK
          </StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Tokens en Stake para Propuestas</StatLabel>
          <StatNumber>{proposalStake.amount}</StatNumber>
          <StatHelpText>
            {Number(proposalStake.amount) > 0 && <StatArrow type="increase" />}
            MTK
          </StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Total de Propuestas</StatLabel>
          <StatNumber>{daoInfo.totalProposals}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            {daoInfo.activeProposals} activas
          </StatHelpText>
        </Stat>
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
        <Card>
          <CardHeader bg="gray.50" pb={2}>
            <Heading size="md">Parámetros del DAO</Heading>
          </CardHeader>
          <CardBody>
            <Text mb={2}><strong>Mínimo para votar:</strong> {daoInfo.stakingToVote} MTK</Text>
            <Text mb={2}><strong>Mínimo para proponer:</strong> {daoInfo.stakingToPropose} MTK</Text>
            <Text mb={2}><strong>Tiempo mínimo de staking:</strong> {formatTime(Number(daoInfo.minStakingTime))}</Text>
            <Text><strong>Duración de propuestas:</strong> {daoInfo.proposalDurationDays} días</Text>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader bg="gray.50" pb={2}>
            <Heading size="md">Estado de las Propuestas</Heading>
          </CardHeader>
          <CardBody>
            <Text mb={2}>Propuestas activas: {daoInfo.activeProposals} de {daoInfo.totalProposals}</Text>
            <Progress 
              colorScheme="blue" 
              height="24px" 
              value={activeProposalsPercentage} 
              mb={4}
              borderRadius="md"
            />
            
            <Text fontSize="sm" color="gray.600" textAlign="center">
              {activeProposalsPercentage.toFixed(1)}% de propuestas están activas
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      <Box mb={8}>
        <Heading size="md" mb={4}>Propuestas Recientes</Heading>
        
        {recentProposals.length === 0 ? (
          <Text>No hay propuestas recientes</Text>
        ) : (
          <SimpleGrid columns={1} spacing={4}>
            {recentProposals.map(proposal => {
              // Parsear título y descripción
              const [title] = proposal.description.split('\n\n');
              
              return (
                <Card key={proposal.id} variant="outline">
                  <CardBody>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading size="sm">{title}</Heading>
                      <Box 
                        px={2} 
                        py={1} 
                        borderRadius="md" 
                        bg={
                          proposal.status === 'ACTIVE' ? 'blue.100' :
                          proposal.status === 'APPROVED' ? 'green.100' :
                          proposal.status === 'EXECUTED' ? 'purple.100' :
                          'red.100'
                        }
                        color={
                          proposal.status === 'ACTIVE' ? 'blue.700' :
                          proposal.status === 'APPROVED' ? 'green.700' :
                          proposal.status === 'EXECUTED' ? 'purple.700' :
                          'red.700'
                        }
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {proposal.status}
                      </Box>
                    </Flex>
                    
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      Propuesta #{proposal.id} • Creada el {new Date(proposal.createdAt * 1000).toLocaleDateString()}
                    </Text>
                    
                    <HStack spacing={4}>
                      <Button 
                        as={RouterLink}
                        to={`/proposals/${proposal.id}`}
                        size="sm" 
                        colorScheme="blue" 
                        variant="outline"
                      >
                        Ver Detalles
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
        
        <Flex justify="center" mt={4}>
          <Button 
            as={RouterLink}
            to="/proposals"
            colorScheme="blue" 
            variant="link"
          >
            Ver todas las propuestas →
          </Button>
        </Flex>
      </Box>
      
      <Divider mb={8} />
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box textAlign="center" p={4} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="sm" mb={4}>Gestionar Staking</Heading>
          <Text fontSize="sm" mb={4}>
            Deposita tokens para obtener poder de voto o para crear propuestas
          </Text>
          <Button 
            as={RouterLink}
            to="/staking"
            colorScheme="blue"
            size="sm"
            width="full"
          >
            Ir a Staking
          </Button>
        </Box>
        
        <Box textAlign="center" p={4} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="sm" mb={4}>Crear Propuesta</Heading>
          <Text fontSize="sm" mb={4}>
            Crea una nueva propuesta para que la comunidad vote
          </Text>
          <Button 
            as={RouterLink}
            to="/proposals/create"
            colorScheme="green"
            size="sm"
            width="full"
          >
            Nueva Propuesta
          </Button>
        </Box>
        
        <Box textAlign="center" p={4} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="sm" mb={4}>Delegación de Votos</Heading>
          <Text fontSize="sm" mb={4}>
            Delega tus votos a alguien en quien confíes
          </Text>
          <Button 
            as={RouterLink}
            to="/delegation"
            colorScheme="purple"
            size="sm"
            width="full"
          >
            Gestionar Delegación
          </Button>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default DashboardPage;

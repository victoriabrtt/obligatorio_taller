import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Flex, Heading, Stack, Text, Input, Spacer,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Card, CardHeader, CardBody, CardFooter, 
  Alert, AlertIcon, Divider, VStack
} from '@chakra-ui/react';
import { useDAO } from '../context/DAOContext';

/**
 * StakingPage - Handles both staking functionality and buying tokens
 * Simplified for Conjunto A requirements
 */
const StakingPage: React.FC = () => {
  const { daoService, tokenBalance, voteStake, proposalStake, refreshData } = useDAO();
  
  // State for staking
  const [voteStakeAmount, setVoteStakeAmount] = useState('');
  const [proposalStakeAmount, setProposalStakeAmount] = useState('');
  
  // State for tokens
  const [approveAmount, setApproveAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [tokenPriceInWei, setTokenPriceInWei] = useState('0');
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el precio del token cuando la página se carga
  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        console.log("Obteniendo precio del token...");
        // Use a safer way to access the token price
        const price = await daoService.getTokenPrice();
        console.log("Precio del token obtenido:", price);
        setTokenPriceInWei(price);
      } catch (err) {
        console.error("Error al obtener precio del token:", err);
        // Usar valor de respaldo conocido (0.01 ETH)
        setTokenPriceInWei("10000000000000000");
        console.log("Usando precio predeterminado: 0.01 ETH");
      }
    };
    
    fetchTokenPrice();
  }, [daoService]);

  // Formatear timestamp a fecha legible
  const formatDate = (timestamp: number): string => {
    if (timestamp === 0) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Calculamos el costo estimado en ETH de la compra de tokens
  const calculateEthCost = (): string => {
    if (!buyAmount || isNaN(Number(buyAmount)) || !tokenPriceInWei) {
      return '0';
    }
    
    // Si el precio del token es 0 o undefined, asumimos 0.01 ETH como valor predeterminado
    const priceToUse = tokenPriceInWei === '0' ? '10000000000000000' : tokenPriceInWei;
    
    // Convertir a BigInt para cálculos precisos
    try {
      const amountWei = BigInt(Math.floor(Number(buyAmount) * 10**18));
      const price = BigInt(priceToUse);
      const cost = (amountWei * price) / BigInt(10**18);
      
      // Convertir a string y formatear para mostrar en ETH
      return (Number(cost) / 10**18).toFixed(6);
    } catch (e) {
      console.error("Error en cálculo:", e);
      return '0';
    }
  };

  // Aprobar tokens
  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await daoService.approveTokens(approveAmount);
      
      await refreshData();
      setApproveAmount('');
    } catch (err: any) {
      setError(`Error al aprobar tokens: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Comprar tokens con ETH
  const handleBuyTokens = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await daoService.buyTokens(buyAmount);
      
      await refreshData();
      setBuyAmount('');
    } catch (err: any) {
      setError(`Error al comprar tokens: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Stake para votar
  const handleStakeForVote = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await daoService.stakeForVote(voteStakeAmount);
      
      await refreshData();
      setVoteStakeAmount('');
    } catch (err: any) {
      setError(`Error al hacer stake para votar: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Stake para propuestas
  const handleStakeForProposal = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await daoService.stakeForProposal(proposalStakeAmount);
      
      await refreshData();
      setProposalStakeAmount('');
    } catch (err: any) {
      setError(`Error al hacer stake para propuestas: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Unstake de votos
  const handleUnstakeVote = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await daoService.unstakeVote();
      
      await refreshData();
    } catch (err: any) {
      setError(`Error al retirar stake de votos: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Unstake de propuestas
  const handleUnstakeProposal = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await daoService.unstakeProposal();
      
      await refreshData();
    } catch (err: any) {
      setError(`Error al retirar stake de propuestas: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Gestión de Tokens y Staking</Heading>
      
      {/* Current token balance display */}
      <Card mb={6}>
        <CardBody>
          <Flex justify="space-between" align="center">
            <Text>Tu balance actual de tokens:</Text>
            <Text fontSize="2xl" fontWeight="bold">{tokenBalance} MTK</Text>
          </Flex>
        </CardBody>
      </Card>
      
      {/* Error message display */}
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* Tabs for organized functionality */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Compra de Tokens</Tab>
          <Tab>Staking para Votar</Tab>
          <Tab>Staking para Propuestas</Tab>
        </TabList>
        
        <TabPanels>
          {/* Token Purchase Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">Comprar y Aprobar Tokens</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  {/* Buy tokens section */}
                  <Box>
                    <Heading size="sm" mb={3}>Comprar Tokens con ETH</Heading>
                    <Input 
                      placeholder="Cantidad de tokens a comprar" 
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      type="number"
                      mb={3}
                    />
                    <Text fontSize="sm" mb={3}>
                      Costo estimado: {calculateEthCost()} ETH
                    </Text>
                    <Button 
                      colorScheme="green" 
                      onClick={handleBuyTokens}
                      isDisabled={!buyAmount || isProcessing || Number(buyAmount) <= 0}
                      isLoading={isProcessing}
                      loadingText="Comprando..."
                      width="full"
                    >
                      Comprar Tokens
                    </Button>
                  </Box>
                  
                  <Divider />
                  
                  {/* Approve tokens section */}
                  <Box>
                    <Heading size="sm" mb={3}>Aprobar Tokens para la DAO</Heading>
                    <Text fontSize="sm" mb={3}>
                      Debes aprobar tokens antes de hacer staking
                    </Text>
                    <Input 
                      placeholder="Cantidad a aprobar" 
                      value={approveAmount}
                      onChange={(e) => setApproveAmount(e.target.value)}
                      type="number"
                      mb={3}
                    />
                    <Button 
                      colorScheme="blue" 
                      onClick={handleApprove}
                      isDisabled={!approveAmount || isProcessing}
                      isLoading={isProcessing}
                      loadingText="Aprobando..."
                      width="full"
                    >
                      Aprobar Tokens
                    </Button>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Voting Stake Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">Staking para Votar</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box p={3} bg="blue.50" borderRadius="md">
                    <Text fontWeight="medium">Cantidad actual en stake: {voteStake.amount} MTK</Text>
                    <Text fontSize="sm">Último stake: {formatDate(voteStake.timestamp)}</Text>
                  </Box>
                  
                  <Box>
                    <Input 
                      placeholder="Cantidad para stake" 
                      value={voteStakeAmount}
                      onChange={(e) => setVoteStakeAmount(e.target.value)}
                      type="number"
                      mb={3}
                    />
                    <Button 
                      colorScheme="green" 
                      onClick={handleStakeForVote}
                      isDisabled={!voteStakeAmount || isProcessing || Number(voteStake.amount) > 0}
                      isLoading={isProcessing}
                      loadingText="Depositando..."
                      width="full"
                      mb={3}
                    >
                      Depositar para Votar
                    </Button>
                    <Button 
                      colorScheme="red" 
                      onClick={handleUnstakeVote}
                      isDisabled={isProcessing || Number(voteStake.amount) <= 0}
                      isLoading={isProcessing}
                      loadingText="Retirando..."
                      width="full"
                    >
                      Retirar Stake de Votos
                    </Button>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* Proposal Stake Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">Staking para Propuestas</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box p={3} bg="purple.50" borderRadius="md">
                    <Text fontWeight="medium">Cantidad actual en stake: {proposalStake.amount} MTK</Text>
                    <Text fontSize="sm">Último stake: {formatDate(proposalStake.timestamp)}</Text>
                  </Box>
                  
                  <Box>
                    <Input 
                      placeholder="Cantidad para stake" 
                      value={proposalStakeAmount}
                      onChange={(e) => setProposalStakeAmount(e.target.value)}
                      type="number"
                      mb={3}
                    />
                    <Button 
                      colorScheme="green" 
                      onClick={handleStakeForProposal}
                      isDisabled={!proposalStakeAmount || isProcessing || Number(proposalStake.amount) > 0}
                      isLoading={isProcessing}
                      loadingText="Depositando..."
                      width="full"
                      mb={3}
                    >
                      Depositar para Propuestas
                    </Button>
                    <Button 
                      colorScheme="red" 
                      onClick={handleUnstakeProposal}
                      isDisabled={isProcessing || Number(proposalStake.amount) <= 0}
                      isLoading={isProcessing}
                      loadingText="Retirando..."
                      width="full"
                    >
                      Retirar Stake de Propuestas
                    </Button>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default StakingPage;

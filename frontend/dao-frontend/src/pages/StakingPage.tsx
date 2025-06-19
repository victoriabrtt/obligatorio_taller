import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Heading, Stack, Text, Input, Spacer } from '@chakra-ui/react';
import { useDAO } from '../context/DAOContext';

const StakingPage: React.FC = () => {
  const { daoService, tokenBalance, voteStake, proposalStake, refreshData } = useDAO();
  
  const [voteStakeAmount, setVoteStakeAmount] = useState('');
  const [proposalStakeAmount, setProposalStakeAmount] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [tokenPriceInWei, setTokenPriceInWei] = useState('0');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el precio del token cuando la página se carga
  useEffect(() => {
    const fetchTokenPrice = async () => {
      if (daoService.isConnected()) {
        try {
          // Use a safer way to access the token price
          const price = await daoService.getTokenPrice();
          setTokenPriceInWei(price);
        } catch (err) {
          console.error("Error al obtener precio del token:", err);
        }
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
    if (!buyAmount || isNaN(Number(buyAmount)) || !tokenPriceInWei || tokenPriceInWei === '0') {
      return '0';
    }
    
    // Convertir a BigInt para cálculos precisos
    try {
      const amountWei = BigInt(Math.floor(Number(buyAmount) * 10**18));
      const price = BigInt(tokenPriceInWei);
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
      
      <Stack gap={8} mb={8}>
        <Flex direction={["column", "row"]} gap={6}>
          <Box flex="1" p={5} borderWidth="1px" borderRadius="lg" shadow="md">
            <Heading size="md" mb={4}>Balance de Tokens</Heading>
            <Text fontSize="2xl" fontWeight="bold" mb={4}>{tokenBalance} MTK</Text>
            
            <Box borderBottomWidth="1px" mb={4} />
            
            <Heading size="sm" mb={2}>Comprar Tokens con ETH</Heading>
            <Stack gap={4}>
              <Input 
                placeholder="Cantidad de tokens a comprar" 
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                type="number"
              />
              <Text fontSize="sm">
                Costo estimado: {calculateEthCost()} ETH
              </Text>
              <Button 
                colorScheme="green" 
                onClick={handleBuyTokens}
                disabled={!buyAmount || isProcessing || Number(buyAmount) <= 0}
                width="full"
              >
                Comprar Tokens
              </Button>
            </Stack>
            
            <Box borderBottomWidth="1px" my={4} />
            
            <Heading size="sm" mb={2}>Aprobar Tokens para la DAO</Heading>
            <Stack gap={4}>
              <Input 
                placeholder="Cantidad a aprobar" 
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
                type="number"
              />
              <Button 
                colorScheme="blue" 
                onClick={handleApprove}
                disabled={!approveAmount || isProcessing}
                width="full"
              >
                Aprobar Tokens
              </Button>
            </Stack>
          </Box>
          
          <Box flex="1" p={5} borderWidth="1px" borderRadius="lg" shadow="md">
            <Heading size="md" mb={2}>Staking para Votar</Heading>
            <Text>Cantidad actual en stake: {voteStake.amount} MTK</Text>
            <Text mb={4}>Último stake: {formatDate(voteStake.timestamp)}</Text>
            
            <Stack gap={4}>
              <Input 
                placeholder="Cantidad para stake" 
                value={voteStakeAmount}
                onChange={(e) => setVoteStakeAmount(e.target.value)}
                type="number"
              />
              <Button 
                colorScheme="green" 
                onClick={handleStakeForVote}
                disabled={!voteStakeAmount || isProcessing || Number(voteStake.amount) > 0}
                width="full"
              >
                Depositar para Votar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleUnstakeVote}
                disabled={isProcessing || Number(voteStake.amount) <= 0}
                width="full"
              >
                Retirar Stake de Votos
              </Button>
            </Stack>
          </Box>
          
          <Box flex="1" p={5} borderWidth="1px" borderRadius="lg" shadow="md">
            <Heading size="md" mb={2}>Staking para Propuestas</Heading>
            <Text>Cantidad actual en stake: {proposalStake.amount} MTK</Text>
            <Text mb={4}>Último stake: {formatDate(proposalStake.timestamp)}</Text>
            
            <Stack gap={4}>
              <Input 
                placeholder="Cantidad para stake" 
                value={proposalStakeAmount}
                onChange={(e) => setProposalStakeAmount(e.target.value)}
                type="number"
              />
              <Button 
                colorScheme="green" 
                onClick={handleStakeForProposal}
                disabled={!proposalStakeAmount || isProcessing || Number(proposalStake.amount) > 0}
                width="full"
              >
                Depositar para Propuestas
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleUnstakeProposal}
                disabled={isProcessing || Number(proposalStake.amount) <= 0}
                width="full"
              >
                Retirar Stake de Propuestas
              </Button>
            </Stack>
          </Box>
        </Flex>
      </Stack>
      
      {error && (
        <Box bg="red.100" p={4} borderRadius="md" mb={4}>
          <Text color="red.800" fontWeight="medium">{error}</Text>
        </Box>
      )}
    </Box>
  );
};

export default StakingPage;

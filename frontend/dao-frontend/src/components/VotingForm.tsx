import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Box, 
  VStack, 
  HStack, 
  Button,
  Text,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  useColorModeValue,
  Tooltip,
  Icon,
  Flex,
  Badge
} from '@chakra-ui/react';
import { InfoIcon, CheckIcon, TimeIcon } from '@chakra-ui/icons';
import { useDAO } from '../context/DAOContext';
import TransactionFeedback, { TransactionStatus } from './TransactionFeedback';

interface VotingFormProps {
  proposalId: number;
  onSuccess?: () => void;
  proposal: any; // Tipado más específico según el modelo de propuesta
}

const VotingForm: React.FC<VotingFormProps> = ({ proposalId, proposal, onSuccess }) => {
  const { daoService, account, isPaused } = useDAO();
  const [votedStatus, setVotedStatus] = useState<boolean | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isDelegate, setIsDelegate] = useState<boolean>(false);
  const [loadingVote, setLoadingVote] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [votingPower, setVotingPower] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Comprobar si el usuario ha votado
    const checkVoteStatus = async () => {
      if (!account) return;
      
      try {
        const hasUserVoted = await daoService.hasVoted(proposalId, account);
        setHasVoted(hasUserVoted);
        
        // Comprobar si es delegado de alguien
        const delegators = await daoService.getDelegators(account);
        setIsDelegate(delegators.length > 0);
        
        // Calcular el poder de voto
        const power = await daoService.getVotingPower(account);
        setVotingPower(parseFloat(power.toString()) / 1e18);
      } catch (err) {
        console.error("Error al comprobar estado de voto:", err);
      }
    };
    
    checkVoteStatus();
    
    // Calcular tiempo restante de votación
    if (proposal && proposal.votingEnds) {
      const updateTimeRemaining = () => {
        const now = Math.floor(Date.now() / 1000);
        const endTime = proposal.votingEnds;
        const diff = endTime - now;
        
        if (diff <= 0) {
          setTimeRemaining('Votación finalizada');
          return;
        }
        
        const days = Math.floor(diff / (60 * 60 * 24));
        const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((diff % (60 * 60)) / 60);
        
        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${minutes}m`);
        }
      };
      
      updateTimeRemaining();
      const timer = setInterval(updateTimeRemaining, 60000);
      return () => clearInterval(timer);
    }
  }, [account, proposalId, daoService, proposal]);
  
  const handleVote = async (inFavor: boolean) => {
    try {
      setLoadingVote('pending');
      setVotedStatus(inFavor);
      
      const tx = await daoService.voteProposal(proposalId, inFavor);
      setTxHash(tx.hash);
      await tx.wait();
      
      setLoadingVote('success');
      setHasVoted(true);
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error al votar:", err);
      setLoadingVote('error');
      
      let errorMsg = err.message || 'Error al emitir el voto';
      
      if (err.message.includes("DAO is paused") || err.message.includes("circuit breaker")) {
        errorMsg = "No se puede votar porque la DAO está pausada (circuit breaker activado)";
      }
      
      setErrorMessage(errorMsg);
    }
  };
  
  const handleCloseModal = () => {
    setLoadingVote('idle');
  };
  
  // Calcular porcentajes de votos
  const totalVotes = proposal ? Number(proposal.votesFor) + Number(proposal.votesAgainst) : 0;
  const votesForPercentage = totalVotes > 0 ? (Number(proposal.votesFor) / totalVotes) * 100 : 0;
  const votesAgainstPercentage = totalVotes > 0 ? (Number(proposal.votesAgainst) / totalVotes) * 100 : 0;

  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg"
      bg={bgColor}
      borderColor={borderColor}
      boxShadow="sm"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Votación</Text>
          {timeRemaining && (
            <HStack>
              <Icon as={TimeIcon} color="blue.500" />
              <Text fontSize="sm" color="blue.500">{timeRemaining}</Text>
            </HStack>
          )}
        </HStack>
        
        <Divider />
        
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" fontWeight="medium">Estado actual</Text>
          <Progress 
            value={votesForPercentage} 
            colorScheme="green" 
            height="24px" 
            borderRadius="md"
            hasStripe
          >
            <Text 
              color="white" 
              position="absolute" 
              left="50%" 
              top="50%" 
              transform="translate(-50%, -50%)"
              fontSize="xs"
              fontWeight="bold"
              textShadow="0px 0px 2px rgba(0,0,0,0.5)"
            >
              A favor: {votesForPercentage.toFixed(2)}% - En contra: {votesAgainstPercentage.toFixed(2)}%
            </Text>
          </Progress>
          
          <HStack justify="space-between" mt={2}>
            <Stat size="sm">
              <StatLabel>Votos a favor</StatLabel>
              <StatNumber>{parseFloat(ethers.formatEther(proposal?.votesFor || 0)).toFixed(2)}</StatNumber>
              <StatHelpText>Votos cuadráticos</StatHelpText>
            </Stat>
            <Stat size="sm" textAlign="right">
              <StatLabel>Votos en contra</StatLabel>
              <StatNumber>{parseFloat(ethers.formatEther(proposal?.votesAgainst || 0)).toFixed(2)}</StatNumber>
              <StatHelpText>Votos cuadráticos</StatHelpText>
            </Stat>
          </HStack>
        </VStack>
        
        <Divider />
        
        <VStack spacing={3}>
          {isPaused ? (
            <Box p={3} borderRadius="md" bg="red.50" width="100%" textAlign="center">
              <HStack justify="center">
                <Icon as={InfoIcon} color="red.500" />
                <Text>Votación no disponible: la DAO está pausada</Text>
              </HStack>
            </Box>
          ) : hasVoted ? (
            <Box p={3} borderRadius="md" bg="gray.50" width="100%" textAlign="center">
              <HStack justify="center">
                <CheckIcon color="green.500" />
                <Text>Ya has votado en esta propuesta</Text>
              </HStack>
            </Box>
          ) : (
            proposal?.votingEnded ? (
              <Box p={3} borderRadius="md" bg="gray.100" width="100%" textAlign="center">
                <Text>El período de votación ha finalizado</Text>
              </Box>
            ) : (
              <>
                <Text fontSize="sm">
                  Tu poder de voto: <Badge colorScheme="blue">{votingPower.toFixed(2)} votos</Badge>
                  <Tooltip 
                    label="El poder de voto es la raíz cuadrada de tus tokens en stake. También incluye los votos delegados a ti." 
                    placement="top"
                  >
                    <InfoIcon ml={1} color="blue.500" />
                  </Tooltip>
                </Text>
                
                {isDelegate && (
                  <Tooltip 
                    label="Tienes votos delegados de otros usuarios. Tu voto tendrá mayor peso." 
                    placement="top"
                  >
                    <Box p={2} borderRadius="md" bg="blue.50" width="100%" textAlign="center">
                      <Text fontSize="sm">Estás votando como delegado</Text>
                    </Box>
                  </Tooltip>
                )}
                
                <HStack spacing={4} width="100%">
                  <Button 
                    colorScheme="green" 
                    variant="solid" 
                    onClick={() => handleVote(true)}
                    isDisabled={loadingVote === 'pending' || isPaused} 
                    width="50%"
                    title={isPaused ? "No puedes votar cuando la DAO está pausada" : ""}
                  >
                    Votar a Favor
                  </Button>
                  <Button 
                    colorScheme="red" 
                    variant="solid" 
                    onClick={() => handleVote(false)}
                    isDisabled={loadingVote === 'pending' || isPaused} 
                    width="50%"
                    title={isPaused ? "No puedes votar cuando la DAO está pausada" : ""}
                  >
                    Votar en Contra
                  </Button>
                </HStack>
                
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Tu voto no podrá ser cambiado una vez emitido
                </Text>
              </>
            )
          )}
        </VStack>
      </VStack>
      
      <TransactionFeedback 
        isOpen={loadingVote !== 'idle'} 
        onClose={handleCloseModal} 
        status={loadingVote} 
        txHash={txHash}
        errorMessage={errorMessage}
        action={`Votar ${votedStatus === true ? 'a favor' : 'en contra'}`}
      />
    </Box>
  );
};

export default VotingForm;

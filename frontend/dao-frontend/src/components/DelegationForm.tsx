import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Text,
  FormHelperText,
  Alert,
  AlertIcon,
  Divider,
  Switch,
  HStack,
  useColorModeValue,
  Tooltip,
  Icon,
  Link
} from '@chakra-ui/react';
import { QuestionOutlineIcon, InfoIcon } from '@chakra-ui/icons';
import { useDAO } from '../context/DAOContext';
import { ethers } from 'ethers';
import TransactionFeedback, { TransactionStatus } from './TransactionFeedback';

interface DelegationFormProps {
  proposalId?: number;
  onSuccess?: () => void;
}

const DelegationForm: React.FC<DelegationFormProps> = ({ proposalId, onSuccess }) => {
  const { daoService } = useDAO();
  const [delegateAddress, setDelegateAddress] = useState('');
  const [isProposalSpecific, setIsProposalSpecific] = useState(!!proposalId);
  const [loadingDelegate, setLoadingDelegate] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDelegateAddress(e.target.value);
    setError(null);
  };

  const validateAddress = (address: string): boolean => {
    try {
      if (address === '') {
        setError('La dirección no puede estar vacía');
        return false;
      }
      
      if (!ethers.isAddress(address)) {
        setError('Dirección Ethereum inválida');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Dirección inválida');
      return false;
    }
  };

  const handleDelegate = async () => {
    if (!validateAddress(delegateAddress)) return;
    
    try {
      setLoadingDelegate('pending');
      let tx;
      
      if (isProposalSpecific && proposalId !== undefined) {
        tx = await daoService.delegateForProposal(proposalId, delegateAddress);
      } else {
        tx = await daoService.delegate(delegateAddress);
      }
      
      setTxHash(tx.hash);
      await tx.wait();
      setLoadingDelegate('success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error en delegación:", err);
      setLoadingDelegate('error');
      setError(err.message || 'Error al delegar el voto');
    }
  };

  const handleCloseModal = () => {
    setLoadingDelegate('idle');
    if (loadingDelegate === 'success') {
      setDelegateAddress('');
    }
  };

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
        <Text fontSize="lg" fontWeight="bold">
          Delegar Votos
          <Tooltip 
            label="La delegación permite transferir tu poder de voto a otra dirección. La otra persona votará en tu nombre." 
            placement="top"
          >
            <Icon as={InfoIcon} ml={2} color="blue.500" />
          </Tooltip>
        </Text>
        <Divider />

        {!proposalId && (
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="proposal-specific" mb="0">
              Delegar solo para una propuesta específica
            </FormLabel>
            <Switch 
              id="proposal-specific" 
              isChecked={isProposalSpecific} 
              onChange={() => setIsProposalSpecific(!isProposalSpecific)} 
              isDisabled={!!proposalId}
            />
          </FormControl>
        )}

        {isProposalSpecific && !proposalId && (
          <FormControl isRequired>
            <FormLabel>ID de la propuesta</FormLabel>
            <Input placeholder="Ej. 42" />
            <FormHelperText>Ingresa el ID de la propuesta para la cual deseas delegar</FormHelperText>
          </FormControl>
        )}

        <FormControl isRequired isInvalid={!!error}>
          <FormLabel>Dirección del delegado</FormLabel>
          <Input 
            placeholder="0x..." 
            value={delegateAddress} 
            onChange={handleAddressChange} 
          />
          <FormHelperText>
            Ingresa la dirección Ethereum a la que quieres delegar tu poder de voto
          </FormHelperText>
          {error && (
            <Alert status="error" mt={2} size="sm" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
        </FormControl>

        {isProposalSpecific ? (
          <Text fontSize="sm" color="gray.500">
            Estás delegando tu voto únicamente para la propuesta #{proposalId}. Podrás votar directamente en otras propuestas.
          </Text>
        ) : (
          <Text fontSize="sm" color="gray.500">
            Estás delegando tu voto para todas las propuestas. No podrás votar directamente mientras tu delegación esté activa.
          </Text>
        )}

        <Button 
          colorScheme="blue" 
          onClick={handleDelegate} 
          isDisabled={!delegateAddress || loadingDelegate === 'pending'}
        >
          Delegar Poder de Voto
        </Button>

        <Text fontSize="xs" color="gray.500" mt={2}>
          Puedes cambiar tu delegación en cualquier momento antes de que finalice el período de votación.
        </Text>

        <TransactionFeedback 
          isOpen={loadingDelegate !== 'idle'} 
          onClose={handleCloseModal} 
          status={loadingDelegate} 
          txHash={txHash}
          errorMessage={error || undefined}
          action={`Delegar ${isProposalSpecific ? 'para la propuesta #' + proposalId : 'general'}`}
        />
      </VStack>
    </Box>
  );
};

export default DelegationForm;

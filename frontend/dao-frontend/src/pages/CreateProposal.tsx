import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Select,
  Divider,
  useToast
} from '@chakra-ui/react';
import { useDAO } from '../context/DAOContext';
import { useNavigate } from 'react-router-dom';

enum ProposalType {
  Simple = 0,
  Transaction = 1,
  ParameterChange = 2,
  TokenMint = 3
}

const CreateProposal: React.FC = () => {
  const { daoService, proposalStake, refreshData } = useDAO();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposalType, setProposalType] = useState<number>(ProposalType.Simple);
  
  // Campos adicionales según el tipo de propuesta
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [paramName, setParamName] = useState('');
  const [paramValue, setParamValue] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintRecipient, setMintRecipient] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si el usuario tiene tokens en staking suficientes para proponer
  const canPropose = proposalStake.amount !== '0';

  // Campos adicionales disponibles según el tipo de propuesta
  const showRecipientAndAmount = proposalType === ProposalType.Transaction;
  const showParamFields = proposalType === ProposalType.ParameterChange;
  const showMintFields = proposalType === ProposalType.TokenMint;
  
  // Opciones para los parámetros de la DAO
  const paramOptions = [
    { name: 'stakingToVote', label: 'Tokens para votar' },
    { name: 'stakingToPropose', label: 'Tokens para proponer' },
    { name: 'minStakingTime', label: 'Tiempo mínimo de staking (días)' },
    { name: 'votePowerDivider', label: 'Divisor de poder de voto' },
    { name: 'proposalDurationDays', label: 'Duración de propuestas (días)' },
    { name: 'tokenPriceInWei', label: 'Precio del token (wei)' }
  ];

  // Enviar propuesta
  const handleSubmit = async () => {
    if (!title || !description) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let tx;
      
      switch (parseInt(proposalType.toString())) {
        case ProposalType.Simple:
          tx = await daoService.createProposal(title, description);
          break;
        case ProposalType.Transaction:
          if (!recipient || !amount) {
            throw new Error('Destinatario y cantidad son obligatorios');
          }
          tx = await daoService.createTransactionProposal(
            title, description, recipient, amount
          );
          break;
        case ProposalType.ParameterChange:
          if (!paramName || !paramValue) {
            throw new Error('Parámetro y valor son obligatorios');
          }
          tx = await daoService.createParameterChangeProposal(
            title, description, paramName, paramValue
          );
          break;
        case ProposalType.TokenMint:
          if (!mintRecipient || !mintAmount) {
            throw new Error('Destinatario y cantidad son obligatorios');
          }
          tx = await daoService.createTokenMintProposal(
            title, description, mintRecipient, mintAmount
          );
          break;
      }

      if (tx) {
        await tx.wait();
      
        toast({
          title: 'Propuesta creada',
          description: 'Tu propuesta ha sido creada exitosamente',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      
        await refreshData();
        navigate('/proposals');
      }
    } catch (err: any) {
      console.error('Error al crear propuesta:', err);
      setError(`Error: ${err.message || 'Ocurrió un error al crear la propuesta'}`);
      
      toast({
        title: 'Error',
        description: err.message || 'Ocurrió un error al crear la propuesta',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <Heading size="lg" mb={6}>Crear nueva propuesta</Heading>
      
      {!canPropose ? (
        <Box bg="yellow.100" p={4} borderRadius="md" mb={6}>
          <Text color="yellow.800">
            Debes tener tokens en staking para propuestas antes de poder crear una.
            Dirígete a la sección de Staking para depositar tokens.
          </Text>
        </Box>
      ) : null}
      
      <FormControl mb={4}>
        <FormLabel>Tipo de propuesta</FormLabel>
        <Select 
          value={proposalType} 
          onChange={e => setProposalType(Number(e.target.value))}
        >
          <option value={ProposalType.Simple}>Simple</option>
          <option value={ProposalType.Transaction}>Transacción (ETH)</option>
          <option value={ProposalType.ParameterChange}>Cambio de parámetro</option>
          <option value={ProposalType.TokenMint}>Minteo de tokens</option>
        </Select>
      </FormControl>
      
      <FormControl mb={4}>
        <FormLabel>Título</FormLabel>
        <Input 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="Título de la propuesta"
        />
      </FormControl>
      
      <FormControl mb={4}>
        <FormLabel>Descripción</FormLabel>
        <Textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe tu propuesta..."
          rows={6}
        />
      </FormControl>
      
      {/* Campos adicionales para propuestas de transacción */}
      {showRecipientAndAmount && (
        <>
          <Divider my={4} />
          <Heading size="sm" mb={4}>Detalles de la transacción</Heading>
          
          <FormControl mb={4}>
            <FormLabel>Dirección destino</FormLabel>
            <Input 
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="0x..."
            />
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Cantidad (ETH)</FormLabel>
            <Input 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.01"
              type="number"
              step="0.000001"
            />
          </FormControl>
        </>
      )}
      
      {/* Campos para cambio de parámetros */}
      {showParamFields && (
        <>
          <Divider my={4} />
          <Heading size="sm" mb={4}>Detalles del cambio de parámetro</Heading>
          
          <FormControl mb={4}>
            <FormLabel>Parámetro</FormLabel>
            <Select
              value={paramName}
              onChange={e => setParamName(e.target.value)}
              placeholder="Selecciona un parámetro"
            >
              {paramOptions.map(option => (
                <option key={option.name} value={option.name}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Nuevo valor</FormLabel>
            <Input 
              value={paramValue}
              onChange={e => setParamValue(e.target.value)}
              placeholder="Nuevo valor del parámetro"
            />
          </FormControl>
        </>
      )}
      
      {/* Campos para minteo de tokens */}
      {showMintFields && (
        <>
          <Divider my={4} />
          <Heading size="sm" mb={4}>Detalles del minteo de tokens</Heading>
          
          <FormControl mb={4}>
            <FormLabel>Dirección beneficiaria</FormLabel>
            <Input 
              value={mintRecipient}
              onChange={e => setMintRecipient(e.target.value)}
              placeholder="0x..."
            />
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Cantidad de tokens</FormLabel>
            <Input 
              value={mintAmount}
              onChange={e => setMintAmount(e.target.value)}
              placeholder="1000"
              type="number"
            />
          </FormControl>
        </>
      )}
      
      {error && (
        <Box mt={4} p={3} bg="red.100" color="red.800" borderRadius="md">
          {error}
        </Box>
      )}
      
      <Flex mt={6} justifyContent="space-between">
        <Button 
          onClick={() => navigate('/proposals')} 
          variant="outline"
        >
          Cancelar
        </Button>
        
        <Button
          colorScheme="blue"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={!canPropose || isSubmitting}
        >
          Crear propuesta
        </Button>
      </Flex>
    </Box>
  );
};

export default CreateProposal;

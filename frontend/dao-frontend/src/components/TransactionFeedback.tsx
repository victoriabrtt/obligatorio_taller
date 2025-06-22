import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Text,
  Box,
  VStack,
  HStack,
  Icon,
  Link,
  Button
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, ExternalLinkIcon } from '@chakra-ui/icons';

export type TransactionStatus = 'pending' | 'success' | 'error' | 'idle';

interface TransactionFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  txHash?: string;
  errorMessage?: string;
  action: string;
  explorerUrl?: string;
}

const TransactionFeedback: React.FC<TransactionFeedbackProps> = ({
  isOpen,
  onClose,
  status,
  txHash,
  errorMessage,
  action,
  explorerUrl = 'https://etherscan.io/tx/'
}) => {
  const getTitle = () => {
    switch (status) {
      case 'pending': return `${action} en progreso`;
      case 'success': return `${action} completado`;
      case 'error': return `Error al ${action.toLowerCase()}`;
      default: return action;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={status !== 'pending' ? onClose : () => {}} isCentered>
      <ModalOverlay backdropFilter='blur(10px)' />
      <ModalContent>
        <ModalHeader>{getTitle()}</ModalHeader>
        {status !== 'pending' && <ModalCloseButton />}
        <ModalBody pb={6}>
          <VStack spacing={4} align="center">
            {status === 'pending' && (
              <Box textAlign="center">
                <Spinner size="xl" thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" mb={4} />
                <Text>Tu transacción está siendo procesada en la blockchain</Text>
                <Text fontSize="sm" color="gray.500" mt={2}>Por favor, no cierres esta ventana...</Text>
              </Box>
            )}

            {status === 'success' && (
              <Box textAlign="center">
                <Icon as={CheckCircleIcon} w={12} h={12} color="green.500" mb={4} />
                <Text fontWeight="bold">¡Transacción exitosa!</Text>
                {txHash && (
                  <HStack justify="center" mt={4}>
                    <Link href={`${explorerUrl}${txHash}`} isExternal color="blue.500">
                      Ver en el explorador <Icon as={ExternalLinkIcon} mx="2px" />
                    </Link>
                  </HStack>
                )}
                <Button onClick={onClose} colorScheme="blue" mt={6} size="md">
                  Cerrar
                </Button>
              </Box>
            )}

            {status === 'error' && (
              <Box textAlign="center">
                <Icon as={WarningIcon} w={12} h={12} color="red.500" mb={4} />
                <Text fontWeight="bold">La transacción ha fallado</Text>
                {errorMessage && (
                  <Box mt={3} p={3} bg="red.50" borderRadius="md" maxW="100%" overflowX="auto">
                    <Text fontSize="sm" color="red.500">{errorMessage}</Text>
                  </Box>
                )}
                <Button onClick={onClose} colorScheme="red" mt={6} size="md">
                  Cerrar
                </Button>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TransactionFeedback;

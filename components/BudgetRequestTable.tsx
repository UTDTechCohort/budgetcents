import { Table, Button, Text, Modal, Group, Badge } from '@mantine/core';
import { useState, useEffect } from 'react';

interface BudgetRequest {
  _id: string;
  department: string;
  amount: number;
  description: string;
  requester: string;
  status: 'pending' | 'accepted' | 'declined';
  dateProcessed?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

function BudgetRequestTable() {
  const [selectedRequest, setSelectedRequest] = useState<BudgetRequest | null>(null);
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const [pendingResponse, acceptedResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/requests`),
        fetch(`${API_BASE_URL}/requests/accepted`)
      ]);

      if (!pendingResponse.ok || !acceptedResponse.ok) {
        throw new Error('Failed to fetch requests');
      }

      const pendingData = await pendingResponse.json();
      const acceptedData = await acceptedResponse.json();

      setRequests(pendingData);
      setAcceptedRequests(acceptedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestAction = async (approved: boolean) => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`${API_BASE_URL}/requests/${selectedRequest._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approved ? 'accepted' : 'declined'
        })
      });
      if (!response.ok) {
        throw new Error('Failed to update request');
      }

      await fetch(`${API_BASE_URL}/requests/declined`)
      await fetchRequests();
      setSelectedRequest(null);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  const pendingRows = requests.map((request) => (
    <Table.Tr 
      key={request._id} 
      onClick={() => setSelectedRequest(request)}
      style={{ cursor: 'pointer' }}
    >
      <Table.Td>{request.department}</Table.Td>
      <Table.Td>${request.amount.toLocaleString()}</Table.Td>
      <Table.Td>{request.requester}</Table.Td>
      <Table.Td>
        <Badge color="yellow">Pending</Badge>
      </Table.Td>
    </Table.Tr>
  ));

  const acceptedRows = acceptedRequests.map((request) => (
    <Table.Tr key={request._id}>
      <Table.Td>{request.department}</Table.Td>
      <Table.Td>${request.amount.toLocaleString()}</Table.Td>
      <Table.Td>{request.requester}</Table.Td>
      <Table.Td>
        {new Date(request.dateProcessed!).toLocaleDateString()}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Group justify="apart" mb="md">
        <Text size="xl" fw={700}>Budget Requests</Text>
        <Button 
          onClick={() => setShowAcceptedModal(true)}
          variant="light"
          color="green"
        >
          View Accepted Requests
        </Button>
      </Group>

      <Table.ScrollContainer minWidth={500}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Department</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Requester</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{pendingRows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {/* Request Details Modal */}
      <Modal
        opened={selectedRequest !== null}
        onClose={() => setSelectedRequest(null)}
        title={`Budget Request - ${selectedRequest?.department}`}
      >
        {selectedRequest && (
          <>
            <Text size="sm" mb="xl">
              <Group mb="md">
                <div>
                  <Text fw={500} color="dimmed" size="xs">DEPARTMENT</Text>
                  <Text>{selectedRequest.department}</Text>
                </div>
                <div>
                  <Text fw={500} color="dimmed" size="xs">AMOUNT</Text>
                  <Text>${selectedRequest.amount.toLocaleString()}</Text>
                </div>
                <div>
                  <Text fw={500} color="dimmed" size="xs">REQUESTER</Text>
                  <Text>{selectedRequest.requester}</Text>
                </div>
              </Group>
              
              <Text fw={500} color="dimmed" size="xs" mb="xs">DESCRIPTION</Text>
              <Text mb="xl" style={{ lineHeight: 1.6 }}>
                {selectedRequest.description}
              </Text>
            </Text>
            
            <Button.Group mt="xl">
              <Button 
                color="green" 
                onClick={() => handleRequestAction(true)}
                mr="xs"
              >
                Accept
              </Button>
              <Button 
                color="red" 
                onClick={() => handleRequestAction(false)}
              >
                Decline
              </Button>
            </Button.Group>
          </>
        )}
      </Modal>

      {/* Accepted Requests Modal */}
      <Modal
        opened={showAcceptedModal}
        onClose={() => setShowAcceptedModal(false)}
        title="Accepted Budget Requests"
        size="lg"
      >
        {acceptedRequests.length === 0 ? (
          <Text color="dimmed" ta="center" py="xl">
            No accepted requests yet
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={500}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Department</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Requester</Table.Th>
                  <Table.Th>Date Accepted</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{acceptedRows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
        
        <Group justify="right" mt="md">
          <Button onClick={() => setShowAcceptedModal(false)}>Close</Button>
        </Group>
      </Modal>
    </>
  );
}

export default BudgetRequestTable;
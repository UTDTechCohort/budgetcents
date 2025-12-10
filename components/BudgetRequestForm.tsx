import { 
    Button, 
    Modal, 
    TextInput, 
    NumberInput, 
    Textarea, 
    Stack,
    Group,
    Select
  } from '@mantine/core';
  import { useForm } from '@mantine/form';
  import { useState } from 'react';
  
  interface BudgetRequest {
    department: string;
    amount: number;
    description: string;
    requester: string;
  }
  
  function BudgetRequestForm() {
    const [opened, setOpened] = useState(false);
  
    const form = useForm({
      initialValues: {
        department: '',
        amount: 0,
        description: '',
        requester: '',
      },
  
      validate: {
        department: (value) => (!value ? 'Department is required' : null),
        amount: (value) => (value <= 0 ? 'Amount must be greater than 0' : null),
        description: (value) => (!value ? 'Description is required' : null),
        requester: (value) => (!value ? 'Requester name is required' : null),
      },
    });
  
    const handleSubmit = async (values: BudgetRequest) => {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        const response = await fetch(`${API_BASE}/requests/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...values,
            status: 'pending',
            dateSubmitted: new Date(),
          }),
        });

        console.log(response)
  
        // Close modal and reset form
        setOpened(false);
        form.reset();
    }
    return (
      <>
        <Button 
          onClick={() => setOpened(true)}
          mb="xl"
        >
          New Budget Request
        </Button>
  
        <Modal
          opened={opened}
          onClose={() => {
            setOpened(false);
            form.reset();
          }}
          title="Create New Budget Request"
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
            <TextInput
                label="Department"
                placeholder="Committee/Event"
                required
                {...form.getInputProps('department')}
              />
  
              <NumberInput
                label="Amount"
                placeholder="Enter amount"
                required
                min={0}
                prefix="$"
                decimalScale={2}
                fixedDecimalScale
                thousandSeparator=","
                {...form.getInputProps('amount')}
              />
  
              <TextInput
                label="Requester"
                placeholder="Your name"
                required
                {...form.getInputProps('requester')}
              />
  
              <Textarea
                label="Description"
                placeholder="Provide detailed description of the budget request"
                required
                minRows={4}
                {...form.getInputProps('description')}
              />
  
              <Group justify="flex-end" mt="md">
                <Button 
                  variant="light" 
                  color="gray" 
                  onClick={() => {
                    setOpened(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" color="blue">
                  Submit Request
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </>
    );
  }
  
  export default BudgetRequestForm;
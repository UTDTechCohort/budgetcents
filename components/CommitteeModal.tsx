import { useEffect, useState, useRef } from 'react';
import { Modal, Button, TextInput, NumberInput, Group, Stack, Text, ActionIcon, Card, Tabs } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Carousel } from '@mantine/carousel';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary components
Chart.register(ArcElement, Tooltip, Legend);

interface Activity {
  name: string;
  cost: number;
}

interface Committee {
  name: string;
  budget: number;
  activities: Activity[];
}

export function CommitteeModal() {
  const [opened, setOpened] = useState(false);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view');
  const chartRef = useRef(null); // Reference for the pie chart
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

  const form = useForm<Committee>({
    initialValues: {
      name: '',
      activities: [],
      budget: 0,
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Committee name is required'),
      budget: (value) => (value > 0 ? null : 'Budget must be greater than 0'),
    },
  });

  const handleSubmit = async (values: Committee) => {
    await fetch(`${API_BASE}/add_committee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });
    
    form.reset();
    setActiveTab('view');
    fetchCommittees(); // Refresh committees after adding/updating
  };

  const fetchCommittees = async () => {
    const response = await fetch(`${API_BASE}/get_committees`);
    if (response.ok) {
      const data = await response.json();
      setCommittees(data);
    }
  };

  useEffect(() => {
    if (opened) {
      fetchCommittees(); // Fetch committees when modal opens
    }
  }, [opened]);

  // Prepare data for the pie chart
  const chartData = {
    labels: committees.map(committee => committee.name),
    datasets: [
      {
        label: 'Committee Budgets',
        data: committees.map(committee => committee.budget),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
            window.location.reload()
            setOpened(false)
        }}
        title="Committees"
        size="xl"
      >
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'view' | 'add')}>
          <Tabs.List>
            <Tabs.Tab value="view">View Committees/Major Events</Tabs.Tab>
            <Tabs.Tab value="add">Add Committee/Major Event</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="view" pt="xs">
            {committees.length > 0 ? (
              <Carousel slideSize="100%" slideGap="md" align="start" slidesToScroll={1}>
                {committees.map((committee, index) => (
                  <Carousel.Slide key={index}>
                    <Card shadow="sm" p="lg">
                      <Card.Section>
                        <Text tw={'500'} size="lg" mb="xs">{committee.name}</Text>
                        <Text size="sm" color="dimmed">Budget: ${committee.budget}</Text>
                      </Card.Section>
                      <Text mt="md" mb="xs" tw={'500'}>Activities:</Text>
                      {committee.activities.map((activity, actIndex) => (
                        <Text key={actIndex} size="sm">
                          {activity.name}: ${activity.cost}
                        </Text>
                      ))}
                    </Card>
                  </Carousel.Slide>
                ))}
              </Carousel>
            ) : (
              <Text ta="center" mt="md">No committees added yet.</Text>
            )}
            {/* Render Pie Chart */}
            <div style={{ width: '300px', height: '300px' }}>
              <Pie ref={chartRef} data={chartData} />
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="add" pt="xs">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Committee/Main Event Name"
                  placeholder="Enter committee/event name"
                  required
                  {...form.getInputProps('name')}
                />
                <NumberInput
                  label="Committee/Main Event Budget"
                  placeholder="Enter budget"
                  required
                  {...form.getInputProps('budget')}
                />
                {/* Activities input fields */}
                <Text tw={'500'}>Activities</Text>
                {form.values.activities.map((activity, index) => (
                  <Group key={index} grow>
                    <TextInput
                      placeholder="Activity name"
                      {...form.getInputProps(`activities.${index}.name`)}
                    />
                    <NumberInput
                      placeholder="Cost"
                      min={0}
                      {...form.getInputProps(`activities.${index}.cost`)}
                    />
                    <ActionIcon color="red" onClick={() => form.removeListItem('activities', index)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                ))}
                {/* Button to add more activities */}
                <Button leftSection={<IconPlus size={16} />} onClick={() => form.insertListItem('activities', { name: '', cost: 0 })} variant="outline">
                  Add Activity
                </Button>

                {/* Submit button */}
                <Group justify="right" mt="md">
                  <Button type="submit">Create Committee</Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Modal>

      <Button size={'xs'} onClick={() => setOpened(true)}>View Spending</Button>
    </>
  );
}
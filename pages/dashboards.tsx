'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { Card, Grid, Container, Title, Box, AppShell, Modal, Button, Group, Stack, TextInput, Text, ActionIcon, NumberInput, Tabs } from '@mantine/core';
import { HeaderComponent } from '@/components/HeaderComponent';
import { modals } from '@mantine/modals';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { Carousel } from '@mantine/carousel';
import { addCommittee } from './api/fetch';
import { CommitteeModal } from '@/components/CommitteeModal';
import CommitteeBudgetChart from '@/components/CommitteeBudgetChart';
import OutstandingDuesTable from '@/components/OutstandingDues';
import BudgetRequestsTable from '@/components/BudgetRequestTable';
import ServiceCarousel from '@/components/ServiceCarousel';
import BudgetOverview from '@/components/BudgetOverview';
import MembershipStructureOverview from '@/components/MembershipStructureOverview';
import { useUser } from '@auth0/nextjs-auth0/client';

// Modern dark color palette
const colors = {
  primary: '#2E3440',
  secondary: '#4C566A',
  accent1: '#5E81AC',
  accent2: '#81A1C1',
  accent3: '#88C0D0',
  accent4: '#8FBCBB',
  warning: '#EBCB8B',
  error: '#BF616A',
  success: '#A3BE8C'
};

interface Activity {
    name: string;
    cost: number;
  }
  
  interface Committee {
    name: string;
    budget: number | null; // Assuming budget can be null
    activities: Activity[];
  }

interface ChartData {
    membership: number[];
    dues: number[];
    events: number[];
    pledge: number[];
    status: number[];
  }

  interface Activity {
    name: string;
    cost: number;
  }
  
  interface CommitteeFormValues {
    name: string;
    activities: Activity[];
    budget: number;
  }
  
  function EditModal({ 
    opened, 
    onClose, 
    data, 
    labels, 
    title, 
    onSave 
  }: { 
    opened: boolean; 
    onClose: () => void; 
    data: number[]; 
    labels: string[];
    title: string;
    onSave: (newData: number[]) => void;
  }) {
    const [values, setValues] = useState<string[]>(data.map(String));

    const { user } = useUser();
    const handleSave = () => {
      const newData = values.map(Number);
      onSave(newData);
      onClose();
    };

    if(user?.role !== 'admin'){
        return <div>Wrong place!</div>
      }
  
    return (
      <Modal opened={opened} onClose={onClose} title={`Edit ${title}`}>
        <Stack>
          {values.map((value, index) => (
            <TextInput
              key={index}
              label={labels[index]}
              value={value}
              onChange={(e) => {
                const newValues = [...values];
                newValues[index] = e.target.value;
                setValues(newValues);
              }}
              type="number"
            />
          ))}
          <Group justify="flex-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </Group>
        </Stack>
      </Modal>
    );
  }

export default function DashboardPage() {
  const membershipChartRef = useRef<HTMLCanvasElement>(null);
  const duesChartRef = useRef<HTMLCanvasElement>(null);
  const eventAttendanceRef = useRef<HTMLCanvasElement>(null);
  const pledgeClassRef = useRef<HTMLCanvasElement>(null);
  const statusDistributionRef = useRef<HTMLCanvasElement>(null);
  const [mobileOpened, setOpened] = useState<boolean>(false);
  const [opened, { open, close }] = useDisclosure(false);
  
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view');

  const [modalData, setModalData] = useState<{
    type: keyof ChartData;
    data: number[];
    labels: string[];
    title: string;
  } | null>(null);

  const [modalStates, setModalStates] = useState({
    membership: false,
    eventAttendance: false,
    dues: false,
    pledgeClass: false,
    statusDistribution: false
  });

  const openModal = (modalName: keyof typeof modalStates) => {
    setModalStates(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modalStates) => {
    setModalStates(prev => ({ ...prev, [modalName]: false }));
  };

  const [chartData, setChartData] = useState<ChartData>({
    membership: [65, 70, 75, 72, 80, 85],
    dues: [12000, 19000, 15000, 17000, 20000, 18000],
    events: [30, 25, 20, 25],
    pledge: [15, 20],
    status: [75, 15, 10]
  });

  const handleEdit = (type: keyof ChartData, data: number[], labels: string[], title: string) => {
    setModalData({ type, data, labels, title });
    setOpened(true);
  };

  const handleSave = (newData: number[]) => {
    if (!modalData) return;
    
    setChartData(prev => ({
      ...prev,
      [modalData.type]: newData
    }));
  };

  useEffect(() => {
    if (!membershipChartRef.current || 
        !duesChartRef.current || 
        !eventAttendanceRef.current || 
        !pledgeClassRef.current || 
        !statusDistributionRef.current) return;

    const chartConfig = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.secondary
          }
        },
        title: {
          color: colors.primary,
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };

    // Membership Growth Line Chart
    const membershipChart = new Chart(membershipChartRef.current, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Active Members',
          data: [65, 70, 75, 72, 80, 85],
          borderColor: colors.accent1,
          backgroundColor: colors.accent1 + '40',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        ...chartConfig,
        plugins: {
          ...chartConfig.plugins,
          title: {
            display: true,
            text: 'Membership Growth 2024'
          }
        }
      }
    });

    // Dues Collection Bar Chart
    const duesChart = new Chart(duesChartRef.current, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Dues Collected ($)',
          data: [12000, 19000, 15000, 17000, 20000, 18000],
          backgroundColor: colors.accent2
        }]
      },
      options: {
        ...chartConfig,
        plugins: {
          ...chartConfig.plugins,
          title: {
            display: true,
            text: 'Monthly Dues Collection'
          }
        }
      }
    });

    // Event Attendance Pie Chart
    const eventAttendance = new Chart(eventAttendanceRef.current, {
      type: 'pie',
      data: {
        labels: ['Social', 'Philanthropy', 'Professional', 'Academic'],
        datasets: [{
          data: [30, 25, 20, 25],
          backgroundColor: [
            colors.accent1,
            colors.accent2,
            colors.accent3,
            colors.accent4
          ]
        }]
      },
      options: {
        ...chartConfig,
        plugins: {
          ...chartConfig.plugins,
          title: {
            display: true,
            text: 'Budget Distribution'
          }
        }
      }
    });

    // Pledge Class Bar Chart
    const pledgeClass = new Chart(pledgeClassRef.current, {
      type: 'bar',
      data: {
        labels: ['Fall 2023', 'Spring 2024'],
        datasets: [{
          label: 'Pledge Class Size',
          data: [15, 20],
          backgroundColor: colors.accent3
        }]
      },
      options: {
        ...chartConfig,
        plugins: {
          ...chartConfig.plugins,
          title: {
            display: true,
            text: 'Pledge Class Comparison'
          }
        }
      }
    });

    // Member Status Doughnut Chart
    const statusDistribution = new Chart(statusDistributionRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'LOA', 'Part-Time'],
        datasets: [{
          data: [75, 15, 10],
          backgroundColor: [
            colors.success,
            colors.warning,
            colors.error
          ]
        }]
      },
      options: {
        ...chartConfig,
        plugins: {
          ...chartConfig.plugins,
          title: {
            display: true,
            text: 'Member Status'
          }
        }
      }
    });

    return () => {
      membershipChart.destroy();
      duesChart.destroy();
      eventAttendance.destroy();
      pledgeClass.destroy();
      statusDistribution.destroy();
    };
  }, []);

  const form = useForm<CommitteeFormValues>({
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

  const addActivity = () => {
    form.insertListItem('activities', { name: '', cost: 0 });
  };

  const removeActivity = (index: number) => {
    form.removeListItem('activities', index);
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened }
      }}
    >
    <HeaderComponent opened={mobileOpened} toggle={() => setOpened(o => !o)} />
            
    <Box bg="#F8F9FA" style={{ minHeight: '100vh', padding: '5rem 0' }}>
        <Container size="lg">
            <Grid gutter="xl" pt="xl">
            {/* Budget Overview Section */}
            <Grid.Col span={12}>
              <BudgetOverview />
            </Grid.Col>
            {/* AKPsi Membership Structure Section */}
            <Grid.Col span={12}>
              <MembershipStructureOverview />
            </Grid.Col>

            {/* First Row - Larger Charts */}
            <Grid.Col span={6} >
                <Card shadow="sm" padding="lg" radius="md" h={350}>
                    {/* <Group justify="apart" mb="md">
                        <Text tw={'500'}>Membership Chart</Text>
                        <Button variant="light" size="xs" onClick={() => openModal('membership')}>Edit</Button>
                    </Group>
                    <Box h={280}>
                        <canvas ref={membershipChartRef}></canvas>
                    </Box> */}
                    <BudgetRequestsTable />
                </Card>
            </Grid.Col>
            <Grid.Col span={6} >
                <Card shadow="sm" padding="lg" radius="md" h={350}>
                    <Box h={280} pb={'sm'}>
                        <CommitteeBudgetChart/>
                    </Box>
                    <CommitteeModal/>
                </Card>
                
            </Grid.Col>

            {/* Second Row - Smaller Charts */}
            <Grid.Col span={4}>
                <Card shadow="sm" padding="lg" radius="md" h={280}>
                <OutstandingDuesTable />
                </Card>
            </Grid.Col>
            <Grid.Col span={8}>
                <Card shadow="sm" padding="lg" radius="lg" h={280}>
                <Group justify="apart" mb="md">
                    <ServiceCarousel/>
                </Group>
                <Box h={210}>
                    <canvas ref={pledgeClassRef}></canvas>
                </Box>
                </Card>
            </Grid.Col>
            </Grid>
        </Container>
    </Box>
    </AppShell>
  );
}

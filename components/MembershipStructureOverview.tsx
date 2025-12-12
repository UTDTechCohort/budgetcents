import { useEffect, useRef, useState } from 'react';
import { Card, Box, Text } from '@mantine/core';
import Chart from 'chart.js/auto';

export default function MembershipStructureOverview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/google-sheets/membershipStructure`);
        if (!res.ok) throw new Error('Failed to fetch membership structure');
        const data = await res.json();
        console.log('Membership API data:', data);

        if (!canvasRef.current) return;

        // destroy existing
        if (chartRef.current) chartRef.current.destroy();

        const palette = ['#5E81AC', '#81A1C1', '#88C0D0', '#8FBCBB', '#A3BE8C', '#EBCB8B', '#BF616A'];
        const colors = data.labels.map((_: any, i: number) => palette[i % palette.length]);

        chartRef.current = new Chart(canvasRef.current, {
          type: 'doughnut',
          data: {
            labels: data.labels,
            datasets: [{
              data: data.values,
              backgroundColor: colors,
              borderColor: '#fff',
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: 'AKPsi Membership Structure' },
              legend: { position: 'right' }
            }
          }
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  if (loading) return <Text>Loading membership data...</Text>;
  if (error) return <Text color="red">Error: {error}</Text>;

  return (
    <Card shadow="sm" padding="lg" radius="md" style={{ height: '420px' }}>
      <Box h={380}>
        <canvas ref={canvasRef}></canvas>
      </Box>
    </Card>
  );
}

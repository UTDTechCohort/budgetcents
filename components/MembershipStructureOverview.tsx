import { useEffect, useRef, useState } from 'react';
import { Card, Box, Text } from '@mantine/core';
import Chart from 'chart.js/auto';

export default function MembershipStructureOverview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ labels: string[]; values: number[] } | null>(null);

  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') return;

    const fetchData = async () => {
      try {
        const res = await fetch('/api/google-sheets/membershipStructure');
        if (!res.ok) throw new Error('Failed to fetch membership structure');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Only run chart code in the browser and if canvas + data exist
    if (typeof window === 'undefined' || !canvasRef.current || !data) return;

    // Destroy existing chart if any
    if (chartRef.current) chartRef.current.destroy();

    const palette = ['#5E81AC', '#81A1C1', '#88C0D0', '#8FBCBB', '#A3BE8C', '#EBCB8B', '#BF616A'];
    const colors = data.labels.map((_, i) => palette[i % palette.length]);

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: colors,
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'AKPsi Membership Structure' },
          legend: { position: 'right' },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);

  if (loading) return <Text>Loading membership data...</Text>;
  if (error) return <Text color="red">Error: {error}</Text>;
  if (!data) return <Text>No AKPsi membership data available</Text>;

  return (
    <Card shadow="sm" padding="lg" radius="md" style={{ height: '420px' }}>
      <Box h={380}>
        <canvas ref={canvasRef}></canvas>
      </Box>
    </Card>
  );
}

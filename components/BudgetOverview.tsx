import { useEffect, useRef, useState } from 'react';
import { Card, Box, Text } from '@mantine/core';
import Chart from 'chart.js/auto';

interface BudgetData {
  dueSummary: {
    brotherDues: number;
    pledgeDues: number;
    nationalFeesBrothers: number;
    nationalFeesPledges: number;
    difference: number;
    previousBudget: number;
    availableFunds: number;
    remainder: number;
  };
  expenses: { [key: string]: number };
  expenseLabels: string[];
  expenseValues: number[];
  totalExpenses: number;
  expensesWithoutNationals: number;
}

const colors = {
  accent1: '#5E81AC',
  accent2: '#81A1C1',
  accent3: '#88C0D0',
  accent4: '#8FBCBB',
  success: '#A3BE8C',
  warning: '#EBCB8B',
};

export default function BudgetOverview() {
  const expenseChartRef = useRef<HTMLCanvasElement>(null);
  const expenseChartInstance = useRef<Chart<any> | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const response = await fetch(`/api/google-sheets/budget`);
        if (!response.ok) throw new Error('Failed to fetch budget data');
        const data = await response.json();
        //console.log(data);
        setBudgetData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, []);

  useEffect(() => {
    if (!budgetData || !expenseChartRef.current) return;

    // Destroy existing charts if they exist
    if (expenseChartInstance.current) {
      expenseChartInstance.current.destroy();
    }

    // Expense Pie/Doughnut Chart
    const colorPalette = [
      '#5E81AC', '#81A1C1', '#88C0D0', '#8FBCBB', '#A3BE8C', '#EBCB8B', '#BF616A',
      '#D08770', '#AF3A03', '#B48EAD', '#6C7086', '#4C566A', '#2E3440', '#3B4252',
    ];
    const chartColors = budgetData.expenseLabels.map((_, i) => colorPalette[i % colorPalette.length]);

    expenseChartInstance.current = new Chart(expenseChartRef.current, {
      type: 'doughnut',
      data: {
        labels: budgetData.expenseLabels,
        datasets: [
          {
            data: budgetData.expenseValues,
            backgroundColor: chartColors,
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Expense Breakdown',
            font: { size: 14, weight: 'bold' },
          },
          legend: {
            position: 'right',
            labels: {
              font: { size: 11 },
              padding: 15,
            },
          },
        },
      },
    });

    return () => {
      if (expenseChartInstance.current) {
        expenseChartInstance.current.destroy();
      }
    };
  }, [budgetData]);

  if (loading) return <Text>Loading budget data...</Text>;
  if (error) return <Text color="red">Error: {error}</Text>;
  if (!budgetData) return <Text>No budget data available</Text>;

  return (
    <Card shadow="sm" padding="lg" radius="md" style={{ height: '500px' }}>
      <Box h={450}>
        <canvas ref={expenseChartRef}></canvas>
      </Box>
    </Card>
  );
}

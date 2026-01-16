import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { ArrowLeft, BarChart3, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Container {
  id: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'starting';
  uptime: string;
  cpu: number;
  memory: number;
  diskOps: number;
  lastChecked: string;
}

export function HealthCheck() {
  const [containers, setContainers] = useState<Container[]>([
    {
      id: '1',
      name: 'gnb-container',
      status: 'healthy',
      uptime: '5d 12h',
      cpu: 45,
      memory: 62,
      diskOps: 150,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: '2',
      name: 'core-network',
      status: 'healthy',
      uptime: '5d 12h',
      cpu: 28,
      memory: 48,
      diskOps: 100,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: '3',
      name: 'database-server',
      status: 'healthy',
      uptime: '5d 12h',
      cpu: 15,
      memory: 72,
      diskOps: 200,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: '4',
      name: 'monitoring-service',
      status: 'starting',
      uptime: '2m 35s',
      cpu: 8,
      memory: 22,
      diskOps: 50,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: '5',
      name: 'api-gateway',
      status: 'healthy',
      uptime: '3d 8h',
      cpu: 32,
      memory: 41,
      diskOps: 120,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: '6',
      name: 'load-balancer',
      status: 'unhealthy',
      uptime: '1d 4h',
      cpu: 85,
      memory: 91,
      diskOps: 300,
      lastChecked: new Date().toLocaleTimeString(),
    },
  ]);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);

  // Initialize with all containers selected
  useEffect(() => {
    setSelectedContainers(containers.map((c) => c.id));
  }, []);

  // Generate time series data for graphs
  const generateTimeSeriesData = (container: Container) => {
    const data = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      data.push({
        time: new Date(now - i * 2000).toLocaleTimeString(),
        cpu: Math.max(5, Math.min(100, container.cpu + (Math.random() - 0.5) * 15)),
        memory: Math.max(10, Math.min(100, container.memory + (Math.random() - 0.5) * 10)),
        diskOps: Math.max(50, Math.min(300, container.diskOps + (Math.random() - 0.5) * 50)),
      });
    }
    return data;
  };

  const toggleContainerSelection = (containerId: string) => {
    setSelectedContainers((prev) =>
      prev.includes(containerId)
        ? prev.filter((id) => id !== containerId)
        : [...prev, containerId]
    );
  };

  const containerColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setContainers((prev) =>
        prev.map((container) => ({
          ...container,
          cpu: Math.max(5, Math.min(100, container.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(10, Math.min(100, container.memory + (Math.random() - 0.5) * 5)),
          diskOps: Math.max(50, Math.min(300, container.diskOps + (Math.random() - 0.5) * 50)),
          lastChecked: new Date().toLocaleTimeString(),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setContainers((prev) =>
      prev.map((container) => ({
        ...container,
        lastChecked: new Date().toLocaleTimeString(),
      }))
    );
  };

  const getStatusVariant = (status: Container['status']): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'healthy':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      case 'starting':
        return 'default';
    }
  };

  const getStatusIcon = (status: Container['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'unhealthy':
        return <XCircle className="w-3 h-3" />;
      case 'starting':
        return <Loader2 className="w-3 h-3 animate-spin" />;
    }
  };

  const healthyCount = containers.filter((c) => c.status === 'healthy').length;
  const totalCount = containers.length;

  // Prepare chart data for Chart.js
  const prepareChartData = (metric: 'cpu' | 'memory' | 'diskOps') => {
    // Generate time labels
    const now = Date.now();
    const labels = [];
    for (let i = 29; i >= 0; i--) {
      labels.push(new Date(now - i * 2000).toLocaleTimeString());
    }

    // Generate datasets for selected containers
    const datasets = selectedContainers.map((containerId) => {
      const container = containers.find((c) => c.id === containerId);
      if (!container) return null;
      
      const containerIndex = containers.findIndex((c) => c.id === containerId);
      const data = generateTimeSeriesData(container);

      return {
        label: container.name,
        data: data.map((d) => d[metric]),
        borderColor: containerColors[containerIndex % containerColors.length],
        backgroundColor: containerColors[containerIndex % containerColors.length] + '20',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      };
    }).filter(Boolean);

    return {
      labels,
      datasets,
    };
  };

  // Chart options
  const createChartOptions = (title: string, maxValue: number): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxValue,
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 0,
          autoSkipPadding: 20,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  });

  // If showing stats view
  if (showStats) {
    return (
      <Card className="h-full flex flex-col">
        {/* Stats Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStats(false)}
                title="Back to containers"
              >
                <ArrowLeft />
              </Button>
              <div>
                <CardTitle>Container Resource Statistics</CardTitle>
                <CardDescription>
                  Real-time monitoring of {selectedContainers.length} container{selectedContainers.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Checkbox
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                Auto-refresh
              </label>
            </div>
          </div>

          {/* Selected Containers Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {containers.map((container, idx) => {
              const isSelected = selectedContainers.includes(container.id);
              return (
                <label
                  key={container.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600' 
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 opacity-60'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleContainerSelection(container.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: containerColors[idx % containerColors.length] }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{container.name}</span>
                </label>
              );
            })}
          </div>
        </CardHeader>

        {/* Stats Graphs - Full Height */}
        <CardContent className="flex-1 p-6 overflow-auto min-h-0">
          <div className="grid grid-cols-3 gap-6 h-full min-h-[400px]">
            {/* CPU Graph */}
            <Card className="flex flex-col min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">CPU Usage (%)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-4 pt-0" style={{ minHeight: '350px' }}>
                <Line
                  data={prepareChartData('cpu')}
                  options={createChartOptions('CPU Usage (%)', 100)}
                />
              </CardContent>
            </Card>

            {/* Memory Graph */}
            <Card className="flex flex-col min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Memory Usage (%)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-4 pt-0" style={{ minHeight: '350px' }}>
                <Line
                  data={prepareChartData('memory')}
                  options={createChartOptions('Memory Usage (%)', 100)}
                />
              </CardContent>
            </Card>

            {/* Disk Operations Graph */}
            <Card className="flex flex-col min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Disk Operations/s</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-4 pt-0" style={{ minHeight: '350px' }}>
                <Line
                  data={prepareChartData('diskOps')}
                  options={createChartOptions('Disk Operations/s', 300)}
                />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main table view
  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Container Health Check</CardTitle>
            <CardDescription>
              Monitor the health and performance of all system containers
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Checkbox
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              Auto-refresh
            </label>
            {selectedContainers.length > 0 && (
              <Button onClick={() => setShowStats(true)} className="bg-purple-600 hover:bg-purple-700">
                <BarChart3 />
                Stats ({selectedContainers.length})
              </Button>
            )}
            <Button onClick={handleRefresh}>
              <RefreshCw />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-2xl text-green-600 mb-1">{healthyCount}</div>
              <div className="text-sm text-green-700">Healthy Containers</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-2xl text-blue-600 mb-1">{totalCount}</div>
              <div className="text-sm text-blue-700">Total Containers</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-2xl text-gray-600 mb-1">
                {Math.round((healthyCount / totalCount) * 100)}%
              </div>
              <div className="text-sm text-gray-700">Health Score</div>
            </CardContent>
          </Card>
        </div>
      </CardHeader>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedContainers.length === containers.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedContainers(containers.map((c) => c.id));
                      } else {
                        setSelectedContainers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>CPU Usage</TableHead>
                <TableHead>Memory Usage</TableHead>
                <TableHead>Disk Ops/s</TableHead>
                <TableHead>Last Checked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.map((container, index) => (
                <TableRow 
                  key={container.id}
                  data-state={selectedContainers.includes(container.id) ? 'selected' : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedContainers.includes(container.id)}
                      onCheckedChange={() => toggleContainerSelection(container.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: containerColors[index % containerColors.length] }}
                      />
                      <span className="text-sm">{container.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusVariant(container.status)}
                      className="capitalize"
                    >
                      {getStatusIcon(container.status)}
                      {container.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {container.uptime}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={container.cpu} 
                        className={`flex-1 max-w-[100px] ${container.cpu > 80 ? '[&>*]:bg-red-500' : '[&>*]:bg-blue-500'}`}
                      />
                      <span className="text-sm w-10">
                        {Math.round(container.cpu)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={container.memory} 
                        className={`flex-1 max-w-[100px] ${container.memory > 80 ? '[&>*]:bg-red-500' : '[&>*]:bg-green-500'}`}
                      />
                      <span className="text-sm w-10">
                        {Math.round(container.memory)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(container.diskOps / 300) * 100} 
                        className="flex-1 max-w-[100px] [&>*]:bg-purple-500"
                      />
                      <span className="text-sm w-10">
                        {Math.round(container.diskOps)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {container.lastChecked}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
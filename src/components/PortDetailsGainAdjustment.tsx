import { useState, useEffect } from 'react';
import { X, Pin, PinOff, BarChart3, Save } from 'lucide-react';
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
import { Line as LineChart } from 'react-chartjs-2';
import { Checkbox } from './ui/checkbox';

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

export interface PortGain {
  port: number;
  gain: number;
}

export interface PortDetails {
  port: number;
  gain: number;
  rms: number;
  max: number;
  sat: number;
}

export interface RFCardData {
  id: string;
  cardType: '50MHz' | '100MHz';
  serialNumber: string;
  txPorts: PortGain[];
  rxPorts: PortGain[];
}

export type PortMetricType = 'rms' | 'max' | 'sat' | 'gain';

interface PortDetailsGainAdjustmentProps {
  cardData: RFCardData;
  onClose: () => void;
  onSave?: (updatedGains: { tx: PortGain[]; rx: PortGain[] }) => void;
  showGraphOption?: boolean;
  className?: string;
}

const portColors = {
  tx0: '#3b82f6', // blue
  tx1: '#10b981', // green
  tx2: '#f59e0b', // amber
  tx3: '#ef4444', // red
  rx0: '#8b5cf6', // purple
  rx1: '#ec4899', // pink
  rx2: '#14b8a6', // teal
  rx3: '#f97316', // orange
};

export function PortDetailsGainAdjustment({
  cardData,
  onClose,
  onSave,
  showGraphOption = true,
  className = '',
}: PortDetailsGainAdjustmentProps) {
  const [editedGains, setEditedGains] = useState<{ tx: PortGain[]; rx: PortGain[] }>({
    tx: [...cardData.txPorts],
    rx: [...cardData.rxPorts],
  });
  const [originalGains, setOriginalGains] = useState<{ tx: PortGain[]; rx: PortGain[] }>({
    tx: [...cardData.txPorts],
    rx: [...cardData.rxPorts],
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [portDetails, setPortDetails] = useState<{ tx: PortDetails[]; rx: PortDetails[] }>(
    generatePortDetails(cardData)
  );
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>(generateTimeSeriesData(cardData));
  const [selectedPorts, setSelectedPorts] = useState<{ tx: number[]; rx: number[] }>({
    tx: Array.from({ length: cardData.txPorts.length }, (_, i) => i),
    rx: Array.from({ length: cardData.rxPorts.length }, (_, i) => i),
  });
  const [selectedMetrics, setSelectedMetrics] = useState<PortMetricType[]>(['rms', 'max', 'sat', 'gain']);

  // Generate port details with mock data
  function generatePortDetails(card: RFCardData): { tx: PortDetails[]; rx: PortDetails[] } {
    return {
      tx: card.txPorts.map((port) => ({
        ...port,
        rms: Math.random() * 10 + 5,
        max: Math.random() * 10 + 5,
        sat: Math.random() * 10 + 5,
      })),
      rx: card.rxPorts.map((port) => ({
        ...port,
        rms: Math.random() * 10 + 5,
        max: Math.random() * 10 + 5,
        sat: Math.random() * 10 + 5,
      })),
    };
  }

  // Generate time series data for graphs
  function generateTimeSeriesData(card: RFCardData) {
    const data = [];
    const numPoints = 30;
    for (let i = 0; i < numPoints; i++) {
      const timeData: any = {
        time: `${i * 2}s`,
      };
      
      // Generate data for each TX port
      for (let tx = 0; tx < card.txPorts.length; tx++) {
        timeData[`tx${tx}_rms`] = Math.random() * 5 + 8;
        timeData[`tx${tx}_max`] = Math.random() * 5 + 10;
        timeData[`tx${tx}_sat`] = Math.random() * 5 + 5;
        timeData[`tx${tx}_gain`] = Math.random() * 20 + 40;
      }
      
      // Generate data for each RX port
      for (let rx = 0; rx < card.rxPorts.length; rx++) {
        timeData[`rx${rx}_rms`] = Math.random() * 5 + 6;
        timeData[`rx${rx}_max`] = Math.random() * 5 + 8;
        timeData[`rx${rx}_sat`] = Math.random() * 5 + 4;
        timeData[`rx${rx}_gain`] = Math.random() * 30 + 20;
      }
      
      data.push(timeData);
    }
    return data;
  }

  const handleGainChange = (type: 'tx' | 'rx', portIdx: number, newGain: number) => {
    const updated = { ...editedGains };
    updated[type][portIdx].gain = newGain;
    setEditedGains(updated);
    setHasChanges(true);
  };

  const handleSaveGains = () => {
    if (onSave) {
      onSave(editedGains);
    }
    setOriginalGains({
      tx: [...editedGains.tx],
      rx: [...editedGains.rx],
    });
    setHasChanges(false);
    
    // Regenerate port details with updated gains
    setPortDetails(generatePortDetails({ ...cardData, txPorts: editedGains.tx, rxPorts: editedGains.rx }));
    setTimeSeriesData(generateTimeSeriesData({ ...cardData, txPorts: editedGains.tx, rxPorts: editedGains.rx }));
  };

  const togglePortSelection = (type: 'tx' | 'rx', portIdx: number) => {
    setSelectedPorts((prev) => {
      const updated = { ...prev };
      const idx = updated[type].indexOf(portIdx);
      if (idx > -1) {
        updated[type] = updated[type].filter((p) => p !== portIdx);
      } else {
        updated[type] = [...updated[type], portIdx].sort((a, b) => a - b);
      }
      return updated;
    });
  };

  const toggleMetric = (metric: PortMetricType) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(metric)) {
        return prev.filter((m) => m !== metric);
      } else {
        return [...prev, metric];
      }
    });
  };

  const handleCloseSidebar = () => {
    if (!isPinned) {
      onClose();
    }
  };

  return (
    <div className={`bg-white flex flex-col h-full shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-gray-900 text-xl">
            Port Details & Gain Adjustment
          </h3>
          <p className="text-sm text-gray-500 mt-1">{cardData.id}</p>
        </div>
        <div className="flex items-center gap-3">
          {showGraphOption && !showGraph && (
            <button
              onClick={() => setShowGraph(true)}
              className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg transition-colors"
              title="View Metrics Charts"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {isPinned ? <PinOff className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <Pin className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
          </button>
          <button
            onClick={handleCloseSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!showGraph ? (
          <div className="space-y-6">
            {/* TX Ports - Metrics with Gain Adjustment */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3">TX Port</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">Port</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">RMS</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">MAX</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">SAT</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">Gain</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600 w-48">Adjust Gain</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portDetails.tx.map((port, idx) => (
                      <tr key={`tx-${port.port}`}>
                        <td className="px-3 py-2 text-gray-700">Tx{port.port - 1}</td>
                        <td className="px-3 py-2 text-gray-900">{port.rms.toFixed(2)}</td>
                        <td className="px-3 py-2 text-gray-900">{port.max.toFixed(2)}</td>
                        <td className="px-3 py-2 text-gray-900">{port.sat.toFixed(2)}</td>
                        <td className="px-3 py-2 text-gray-900">{port.gain} dB</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="16"
                              max="90"
                              value={editedGains.tx[idx].gain}
                              onChange={(e) => handleGainChange('tx', idx, parseInt(e.target.value))}
                              className="flex-1"
                              style={{ height: '4px' }}
                            />
                            <input
                              type="number"
                              min="16"
                              max="90"
                              value={editedGains.tx[idx].gain}
                              onChange={(e) => handleGainChange('tx', idx, parseInt(e.target.value))}
                              className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-center"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RX Ports - Metrics with Gain Adjustment */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3">RX Port</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">Port</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">RMS</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">MAX</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">SAT</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600">Gain</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-600 w-48">Adjust Gain</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portDetails.rx.map((port, idx) => (
                      <tr key={`rx-${port.port}`}>
                        <td className="px-3 py-2 text-gray-700">Rx{port.port - 1}</td>
                        <td className="px-3 py-2 text-gray-900">{port.rms.toFixed(2)}</td>
                        <td className="px-3 py-2 text-gray-900">{port.max.toFixed(2)}</td>
                        <td className="px-3 py-2 text-gray-900">{port.sat.toFixed(2)}</td>
                        <td className="px-3 py-2 text-gray-900">{port.gain} dB</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="9"
                              max="60"
                              value={editedGains.rx[idx].gain}
                              onChange={(e) => handleGainChange('rx', idx, parseInt(e.target.value))}
                              className="flex-1"
                              style={{ height: '4px' }}
                            />
                            <input
                              type="number"
                              min="9"
                              max="60"
                              value={editedGains.rx[idx].gain}
                              onChange={(e) => handleGainChange('rx', idx, parseInt(e.target.value))}
                              className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-center"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Apply Changes Button */}
            <button
              onClick={handleSaveGains}
              disabled={!hasChanges}
              className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                hasChanges
                  ? 'bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              <Save className="w-4 h-4" />
              Apply Changes
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Back Button */}
            <button
              onClick={() => setShowGraph(false)}
              className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-500 flex items-center gap-1 mb-4 flex-shrink-0 transition-colors"
            >
              ← Back to Details
            </button>

            {/* Main Content with Port Selector and Graphs */}
            <div className="flex-1 min-h-0 mb-4 flex gap-3">
              {/* Port Selector - Vertical Sidebar */}
              <div className="flex-shrink-0 w-14 border border-gray-200 rounded-lg bg-gray-50 p-2 overflow-y-auto">
                <div className="space-y-4">
                  {/* TX Ports - Vertical */}
                  <div>
                    <div className="text-xs text-gray-600 font-medium mb-2 text-center">TX</div>
                    <div className="space-y-2">
                      {cardData.txPorts.map((_, idx) => {
                        const isSelected = selectedPorts.tx.includes(idx);
                        const color = portColors[`tx${idx}` as keyof typeof portColors];
                        
                        return (
                          <label
                            key={`tx-${idx}`}
                            className={`flex flex-col items-center gap-1 px-1 py-2 border rounded-md cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-gray-400 bg-white shadow-sm' 
                                : 'border-gray-300 bg-gray-50 hover:bg-white'
                            }`}
                            title={`Tx${idx}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePortSelection('tx', idx)}
                              className="w-3 h-3 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
                            />
                            <span 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-gray-700">{idx}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* RX Ports - Vertical */}
                  <div className="pt-2 border-t border-gray-300">
                    <div className="text-xs text-gray-600 font-medium mb-2 text-center">RX</div>
                    <div className="space-y-2">
                      {cardData.rxPorts.map((_, idx) => {
                        const isSelected = selectedPorts.rx.includes(idx);
                        const color = portColors[`rx${idx}` as keyof typeof portColors];
                        
                        return (
                          <label
                            key={`rx-${idx}`}
                            className={`flex flex-col items-center gap-1 px-1 py-2 border rounded-md cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-gray-400 bg-white shadow-sm' 
                                : 'border-gray-300 bg-gray-50 hover:bg-white'
                            }`}
                            title={`Rx${idx}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePortSelection('rx', idx)}
                              className="w-3 h-3 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
                            />
                            <span 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-gray-700">{idx}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphs Container - 2x2 Grid */}
              <div className="flex-1 min-h-0">
                <div className={`grid gap-4 h-full ${selectedMetrics.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {selectedMetrics.map((metric) => {
                    const datasets: any[] = [];
                    
                    // Add TX port datasets (only selected ports)
                    for (let tx = 0; tx < cardData.txPorts.length; tx++) {
                      if (selectedPorts.tx.includes(tx)) {
                        datasets.push({
                          label: `Tx${tx}`,
                          data: timeSeriesData.map(d => d[`tx${tx}_${metric}`]),
                          borderColor: portColors[`tx${tx}` as keyof typeof portColors],
                          backgroundColor: portColors[`tx${tx}` as keyof typeof portColors],
                          tension: 0.3,
                          borderWidth: 2,
                          pointRadius: 0,
                          pointHoverRadius: 4,
                        });
                      }
                    }
                    
                    // Add RX port datasets (only selected ports)
                    for (let rx = 0; rx < cardData.rxPorts.length; rx++) {
                      if (selectedPorts.rx.includes(rx)) {
                        datasets.push({
                          label: `Rx${rx}`,
                          data: timeSeriesData.map(d => d[`rx${rx}_${metric}`]),
                          borderColor: portColors[`rx${rx}` as keyof typeof portColors],
                          backgroundColor: portColors[`rx${rx}` as keyof typeof portColors],
                          tension: 0.3,
                          borderWidth: 2,
                          pointRadius: 0,
                          pointHoverRadius: 4,
                        });
                      }
                    }

                    const chartData = {
                      labels: timeSeriesData.map(d => d.time),
                      datasets,
                    };

                    const options: ChartOptions<'line'> = {
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
                        x: {
                          display: true,
                          title: {
                            display: true,
                            text: 'Time',
                          },
                        },
                        y: {
                          display: true,
                          title: {
                            display: true,
                            text: metric.toUpperCase(),
                          },
                        },
                      },
                      interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false,
                      },
                    };

                    return (
                      <div key={metric} className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
                        <h4 className="text-sm text-gray-700 mb-3">{metric.toUpperCase()}</h4>
                        <div className="flex-1 min-h-0">
                          <LineChart data={chartData} options={options} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metric Selector */}
            <div className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Select Metrics:</span>
                <div className="flex gap-4">
                  {(['rms', 'max', 'sat', 'gain'] as PortMetricType[]).map((metric) => (
                    <label key={metric} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedMetrics.includes(metric)}
                        onCheckedChange={() => toggleMetric(metric)}
                      />
                      <span className="text-sm text-gray-700">{metric.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
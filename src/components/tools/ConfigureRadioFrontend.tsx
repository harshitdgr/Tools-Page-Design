import { useState, useEffect } from 'react';
import { Settings, Eye, Upload, Save, X, MoreVertical, TrendingUp, Pin, PinOff, BarChart3, Activity, Satellite, Clock, Wrench, CheckCircle2, XCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line as LineChart } from 'react-chartjs-2';
import { Bar as BarChart } from 'react-chartjs-2';
import { PortDetailsGainAdjustment, type RFCardData, type PortGain } from '../PortDetailsGainAdjustment';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PortDetails {
  port: number;
  gain: number;
  rms: number;
  max: number;
  sat: number;
}

interface RFCard {
  id: string;
  cardType: '50MHz' | '100MHz';
  serialNumber: string;
  fpgaTemp: number;
  rfTemp: number;
  clockSource: string;
  syncStatus: 'OK' | 'ERROR' | 'DEGRADED';
  power: number;
  fpgaVersion: string;
  swVersion: string;
  txPorts: PortGain[];
  rxPorts: PortGain[];
}

interface SimulatorData {
  simulatorId: string;
  rfCards: RFCard[];
}

type ActionMode = 'adjustGain' | 'viewDetails' | 'firmwareUpgrade' | 'diagnoseSpeed' | 'gpsState' | null;

type PortMetricType = 'rms' | 'max' | 'sat' | 'gain';

interface SpeedTestResult {
  index: number;
  sdr: string;
  speed: string;
  hfn: string;
  txUnderflows: number;
  loadW: string;
  loadR: string;
  loadWR: string;
  loadT: string;
  passed: boolean;
}

interface GPSLog {
  index: number;
  message: string;
  locked: boolean;
}

export function ConfigureRadioFrontend() {
  const [simulatorId, setSimulatorId] = useState('SIM-001');
  const [inputSimulatorId, setInputSimulatorId] = useState('SIM-001');
  const [isLoading, setIsLoading] = useState(true);
  const [simulatorData, setSimulatorData] = useState<SimulatorData | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [editedGains, setEditedGains] = useState<{ tx: PortGain[]; rx: PortGain[] } | null>(null);
  const [showFirmwareConfirm, setShowFirmwareConfirm] = useState(false);
  const [showVersionInput, setShowVersionInput] = useState(false);
  const [firmwareVersion, setFirmwareVersion] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<PortMetricType[]>(['rms', 'max', 'sat', 'gain']);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalGains, setOriginalGains] = useState<{ tx: PortGain[]; rx: PortGain[] } | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [portDetails, setPortDetails] = useState<{ tx: PortDetails[]; rx: PortDetails[] } | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<{ time: string; rms: number; max: number; sat: number; gain: number }[]>([]);
  const [selectedPorts, setSelectedPorts] = useState<{ tx: number[]; rx: number[] }>({ tx: [], rx: [] });
  const [visibleGraphs, setVisibleGraphs] = useState<PortMetricType[]>(['rms', 'max', 'sat', 'gain']);
  
  // Speed Test States
  const [showSpeedTestConfirm, setShowSpeedTestConfirm] = useState(false);
  const [speedTestStatus, setSpeedTestStatus] = useState<'running' | 'passed' | 'failed' | null>(null);
  const [speedTestResults, setSpeedTestResults] = useState<SpeedTestResult[]>([]);
  const [showSpeedTestLogs, setShowSpeedTestLogs] = useState(true);
  const [speedTestIteration, setSpeedTestIteration] = useState(0);

  // GPS States
  const [showGPSConfirm, setShowGPSConfirm] = useState(false);
  const [gpsState, setGpsState] = useState<'unknown' | 'locked' | 'notLocked' | null>('unknown');
  const [gpsSyncStatus, setGpsSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'failure' | null>(null);
  const [gpsLogs, setGpsLogs] = useState<GPSLog[]>([]);
  const [gpsSyncIteration, setGpsSyncIteration] = useState(0);
  const [showGPSLogs, setShowGPSLogs] = useState(true);

  // Mock data generator
  const generateSimulatorData = (simId: string): SimulatorData => {
    const numCards = Math.floor(Math.random() * 3) + 2; // 2-4 cards
    const cards: RFCard[] = [];

    for (let i = 0; i < numCards; i++) {
      const cardType = Math.random() > 0.5 ? '100MHz' : '50MHz';
      const numTxPorts = cardType === '100MHz' ? 4 : 2;
      const numRxPorts = cardType === '100MHz' ? 4 : 2;

      cards.push({
        id: `CARD-${i + 1}`,
        cardType,
        serialNumber: `SN-${Math.floor(Math.random() * 100000)}`,
        fpgaTemp: Math.random() * 20 + 50,
        rfTemp: Math.random() * 20 + 50,
        clockSource: Math.random() > 0.5 ? 'Internal' : 'External',
        syncStatus: Math.random() > 0.7 ? 'OK' : (Math.random() > 0.5 ? 'ERROR' : 'DEGRADED'),
        power: Math.random() * 70 + 40, // Range from 40-110 to show both green and red
        fpgaVersion: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        swVersion: `v${Math.floor(Math.random() * 2) + 2}.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
        txPorts: Array.from({ length: numTxPorts }, (_, idx) => ({
          port: idx + 1,
          gain: Math.floor(Math.random() * 30) + 10,
        })),
        rxPorts: Array.from({ length: numRxPorts }, (_, idx) => ({
          port: idx + 1,
          gain: Math.floor(Math.random() * 40) + 20,
        })),
      });
    }

    return {
      simulatorId: simId,
      rfCards: cards,
    };
  };

  // Generate port details for viewing
  const generatePortDetails = (card: RFCard): { tx: PortDetails[]; rx: PortDetails[] } => {
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
  };

  // Generate time series data for graphs
  const generateTimeSeriesData = () => {
    const data = [];
    const numPoints = 30;
    for (let i = 0; i < numPoints; i++) {
      const timeData: any = {
        time: `${i * 2}s`,
      };
      
      // Generate data for each TX port
      for (let tx = 0; tx < 4; tx++) {
        timeData[`tx${tx}_rms`] = Math.random() * 5 + 8;
        timeData[`tx${tx}_max`] = Math.random() * 5 + 10;
        timeData[`tx${tx}_sat`] = Math.random() * 5 + 5;
        timeData[`tx${tx}_gain`] = Math.random() * 20 + 40;
      }
      
      // Generate data for each RX port
      for (let rx = 0; rx < 4; rx++) {
        timeData[`rx${rx}_rms`] = Math.random() * 5 + 6;
        timeData[`rx${rx}_max`] = Math.random() * 5 + 8;
        timeData[`rx${rx}_sat`] = Math.random() * 5 + 4;
        timeData[`rx${rx}_gain`] = Math.random() * 30 + 20;
      }
      
      data.push(timeData);
    }
    return data;
  };

  // Load initial data
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setSimulatorData(generateSimulatorData(simulatorId));
      setIsLoading(false);
    }, 800);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSelectedCard(null);
    setActionMode(null);
    setOpenDropdown(null);
    setTimeout(() => {
      setSimulatorId(inputSimulatorId);
      setSimulatorData(generateSimulatorData(inputSimulatorId));
      setIsLoading(false);
    }, 600);
  };

  const handleActionClick = (cardId: string, mode: ActionMode) => {
    setSelectedCard(cardId);
    setActionMode(mode);
    setOpenDropdown(null);

    if (mode === 'adjustGain' || mode === 'viewDetails') {
      const card = simulatorData?.rfCards.find((c) => c.id === cardId);
      if (card) {
        setEditedGains({
          tx: [...card.txPorts],
          rx: [...card.rxPorts],
        });
        setOriginalGains({
          tx: [...card.txPorts],
          rx: [...card.rxPorts],
        });
        // Generate and store initial port details
        setPortDetails(generatePortDetails(card));
      }
      setTimeSeriesData(generateTimeSeriesData());
      setShowGraph(false);
      // Initialize all graphs as visible
      setVisibleGraphs(['rms', 'max', 'sat', 'gain']);
      // Initialize visible graphs based on selected metrics
      setVisibleGraphs([...selectedMetrics]);
      // Initialize all ports as selected
      if (card) {
        setSelectedPorts({
          tx: Array.from({ length: card.txPorts.length }, (_, i) => i),
          rx: Array.from({ length: card.rxPorts.length }, (_, i) => i),
        });
      }
    } else if (mode === 'firmwareUpgrade') {
      setShowFirmwareConfirm(true);
    } else if (mode === 'diagnoseSpeed') {
      setShowSpeedTestConfirm(true);
    } else if (mode === 'gpsState') {
      // Randomly set GPS state (80% unknown, 10% locked, 10% not locked)
      const random = Math.random();
      if (random < 0.8) {
        setGpsState('unknown');
      } else if (random < 0.9) {
        setGpsState('locked');
      } else {
        setGpsState('notLocked');
      }
    }
  };

  const handleGainChange = (type: 'tx' | 'rx', portIdx: number, newGain: number) => {
    if (editedGains) {
      const updated = { ...editedGains };
      updated[type][portIdx].gain = newGain;
      setEditedGains(updated);
      setHasChanges(true);
    }
  };

  const handleSaveGains = () => {
    if (simulatorData && selectedCard && editedGains) {
      // Update the card data with new gains
      const updatedCards = simulatorData.rfCards.map((card) => {
        if (card.id === selectedCard) {
          return {
            ...card,
            txPorts: editedGains.tx,
            rxPorts: editedGains.rx,
          };
        }
        return card;
      });
      setSimulatorData({ ...simulatorData, rfCards: updatedCards });
      setOriginalGains({
        tx: [...editedGains.tx],
        rx: [...editedGains.rx],
      });
      setHasChanges(false);
      
      // Simulate receiving updated port details from backend
      const card = updatedCards.find((c) => c.id === selectedCard);
      if (card) {
        setPortDetails(generatePortDetails(card));
      }
      
      // Regenerate time series data
      setTimeSeriesData(generateTimeSeriesData());
    }
  };

  const handleFirmwareUpgrade = () => {
    setShowFirmwareConfirm(false);
    setShowVersionInput(true);
  };

  const handleConfirmFirmwareUpgrade = () => {
    const version = firmwareVersion || 'latest';
    setShowVersionInput(false);
    setActionMode(null);
    setSelectedCard(null);
    setFirmwareVersion('');
    
    alert(`Starting firmware upgrade to version ${version}...\n\n1. Stopping current test\n2. Reflashing RF card ${selectedCard}\n3. Restarting server\n\nThis process will take approximately 2-3 minutes.`);
  };

  const closeSidebar = () => {
    setActionMode(null);
    setSelectedCard(null);
    setEditedGains(null);
    setShowGraph(false);
    setSpeedTestStatus(null);
    setSpeedTestResults([]);
    setSpeedTestIteration(0);
    setGpsState('unknown');
    setGpsSyncStatus(null);
    setGpsLogs([]);
    setGpsSyncIteration(0);
  };

  const getSelectedCardData = () => {
    return simulatorData?.rfCards.find((c) => c.id === selectedCard);
  };

  const toggleGraphVisibility = (metric: PortMetricType) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const togglePortSelection = (type: 'tx' | 'rx', portIdx: number) => {
    setSelectedPorts(prev => {
      const updated = { ...prev };
      if (updated[type].includes(portIdx)) {
        updated[type] = updated[type].filter(p => p !== portIdx);
      } else {
        updated[type] = [...updated[type], portIdx].sort((a, b) => a - b);
      }
      return updated;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 400 && newWidth <= 1200) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Speed Test Simulation
  useEffect(() => {
    if (speedTestStatus === 'running') {
      const interval = setInterval(() => {
        setSpeedTestIteration(prev => {
          const newIteration = prev + 1;
          
          // Generate new result
          const hasUnderflow = Math.random() < 0.1; // 10% chance of underflow
          const newResult: SpeedTestResult = {
            index: newIteration,
            sdr: `sdr${newIteration % 2}`,
            speed: (14 + Math.random() * 2).toFixed(1),
            hfn: (27000 + Math.random() * 1000).toFixed(1),
            txUnderflows: hasUnderflow ? 1 : 0,
            loadW: (40 + Math.random() * 15).toFixed(1) + '%',
            loadR: (Math.random() * 5).toFixed(1) + '%',
            loadWR: (40 + Math.random() * 15).toFixed(1) + '%',
            loadT: (40 + Math.random() * 10).toFixed(1),
            passed: !hasUnderflow,
          };
          
          setSpeedTestResults(prev => [...prev, newResult]);
          
          // Stop after 10 iterations
          if (newIteration >= 10) {
            clearInterval(interval);
            // Determine if test passed or failed
            const allPassed = speedTestResults.every(r => r.passed) && newResult.passed;
            setSpeedTestStatus(allPassed ? 'passed' : 'failed');
          }
          
          return newIteration;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [speedTestStatus]);

  // GPS Sync Simulation
  useEffect(() => {
    if (gpsSyncStatus === 'syncing') {
      const interval = setInterval(() => {
        setGpsSyncIteration(prev => {
          const newIteration = prev + 1;
          
          // Generate new log
          const newLog: GPSLog = {
            index: newIteration - 1,
            message: 'GPS pulse OK, waiting for PLL',
            locked: false,
          };
          
          setGpsLogs(prev => [...prev, newLog]);
          
          // Stop after 10 iterations and lock (or fail at 15% chance)
          if (newIteration >= 10) {
            clearInterval(interval);
            const success = Math.random() > 0.15; // 85% success rate
            
            if (success) {
              const finalLog: GPSLog = {
                index: newIteration,
                message: 'GPS pulse OK, PLL locked',
                locked: true,
              };
              setGpsLogs(prev => [...prev, finalLog]);
              setGpsSyncStatus('success');
              setGpsState('locked');
            } else {
              setGpsSyncStatus('failure');
            }
          }
          
          return newIteration;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [gpsSyncStatus]);

  const metricConfig = {
    rms: { label: 'RMS', color: '#3b82f6' },
    max: { label: 'MAX', color: '#10b981' },
    sat: { label: 'SAT', color: '#f59e0b' },
    gain: { label: 'Gain (dB)', color: '#ef4444' },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Simulator ID Input - Narrower */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 md:p-6 mb-4">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch md:items-end gap-4 justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 w-full md:w-auto">
            <div className="w-full sm:w-80">
              <input
                type="text"
                value={inputSimulatorId}
                onChange={(e) => setInputSimulatorId(e.target.value)}
                placeholder="Simulator ID *"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!inputSimulatorId.trim()}
              className={`px-6 py-2 rounded-lg transition-colors whitespace-nowrap ${
                inputSimulatorId.trim()
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit
            </button>
          </div>
          
          {/* Action Buttons - Right Aligned */}
          {!isLoading && simulatorData && (
            <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => selectedCardId && handleActionClick(selectedCardId, 'viewDetails')}
                disabled={!selectedCardId}
                className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial whitespace-nowrap ${
                  selectedCardId
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Tune Gain</span>
                <span className="sm:hidden">Tune</span>
              </button>
              <button
                type="button"
                onClick={() => selectedCardId && handleActionClick(selectedCardId, 'diagnoseSpeed')}
                disabled={!selectedCardId}
                className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial whitespace-nowrap ${
                  selectedCardId
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Diagnose Speed</span>
                <span className="sm:hidden">Speed</span>
              </button>
              <button
                type="button"
                onClick={() => selectedCardId && handleActionClick(selectedCardId, 'firmwareUpgrade')}
                disabled={!selectedCardId}
                className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial whitespace-nowrap ${
                  selectedCardId
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Firmware Upgrade</span>
                <span className="sm:hidden">Firmware</span>
              </button>
              <button
                type="button"
                onClick={() => selectedCardId && handleActionClick(selectedCardId, 'gpsState')}
                disabled={!selectedCardId}
                className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial whitespace-nowrap ${
                  selectedCardId
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <Satellite className="w-4 h-4" />
                <span className="hidden sm:inline">GPS State</span>
                <span className="sm:hidden">GPS</span>
              </button>
              <button
                type="button"
                disabled={!selectedCardId}
                className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial whitespace-nowrap ${
                  selectedCardId
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Clock State</span>
                <span className="sm:hidden">Clock</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading simulator data...</p>
          </div>
        </div>
      )}

      {/* RF Cards Table */}
      {!isLoading && simulatorData && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-center text-white text-xs md:text-sm w-12">Select</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-white text-xs md:text-sm">Card ID</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-white text-xs md:text-sm">Card Type</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-white text-xs md:text-sm">Serial Number</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-white text-xs md:text-sm">FPGA Temp</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-white text-xs md:text-sm">RF Temp</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-white text-xs md:text-sm">Clock Source</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-white text-xs md:text-sm">Sync Status</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-white text-xs md:text-sm">Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {simulatorData.rfCards.map((card) => (
                  <tr 
                    key={card.id} 
                    className={`hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                      selectedCardId === card.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                    }`}
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                      <input
                        type="radio"
                        name="selectedCard"
                        checked={selectedCardId === card.id}
                        onChange={() => setSelectedCardId(card.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="text-xs md:text-sm text-gray-900 dark:text-gray-100">{card.id}</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className="inline-flex items-center px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                        {card.cardType}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="text-xs md:text-sm text-gray-900 dark:text-gray-100">{card.serialNumber}</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className={`text-xs md:text-sm ${card.fpgaTemp > 70 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>{card.fpgaTemp.toFixed(1)}°C</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className={`text-xs md:text-sm ${card.rfTemp > 70 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>{card.rfTemp.toFixed(1)}°C</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="text-xs md:text-sm text-gray-900 dark:text-gray-100">{card.clockSource}</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className={`text-xs md:text-sm ${card.syncStatus === 'OK' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {card.syncStatus}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className={`text-xs md:text-sm ${card.power > 56 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {card.power.toFixed(1)} W
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar for Actions */}
      {actionMode && selectedCard && actionMode !== 'firmwareUpgrade' && (
        <>
          {/* Overlay - only show when NOT pinned */}
          {!isPinned && (
            <div
              className="fixed inset-0 z-40 backdrop-blur-[2px]"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
              onClick={() => closeSidebar()}
            />
          )}

          {/* Sidebar */}
          <div className={`fixed right-0 top-0 bottom-0 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col w-full md:w-auto ${isPinned ? 'border-l-4 border-blue-500' : ''}`} style={{ width: window.innerWidth < 768 ? '100%' : `${sidebarWidth}px` }}>
            {/* Resize Handle */}
            <div
              className="hidden md:block absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors"
              onMouseDown={handleMouseDown}
              style={{ touchAction: 'none' }}
            />
            
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-gray-900 dark:text-gray-100 text-lg md:text-xl truncate">
                  {actionMode === 'diagnoseSpeed' ? 'Speed Diagnostics' : actionMode === 'gpsState' ? 'GPS State' : 'Port Details & Gain Adjustment'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{selectedCard}</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                {!showGraph && actionMode !== 'diagnoseSpeed' && actionMode !== 'gpsState' && (
                  <button
                    onClick={() => setShowGraph(true)}
                    className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
                    title="View Metrics Charts"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                >
                  {isPinned ? <PinOff className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <Pin className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                </button>
                <button
                  onClick={closeSidebar}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Close sidebar"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
              {actionMode === 'diagnoseSpeed' && speedTestStatus && (
                <div className="h-full flex flex-col">
                  {/* Summary Status */}
                  {speedTestStatus !== 'running' && (
                    <div className={`border-l-4 ${speedTestStatus === 'passed' ? 'border-green-500' : 'border-red-500'} bg-${speedTestStatus === 'passed' ? 'green' : 'red'}-50 dark:bg-${speedTestStatus === 'passed' ? 'green' : 'red'}-900/20 p-4 rounded-lg mb-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        {speedTestStatus === 'passed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                        <h4 className={`font-bold ${speedTestStatus === 'passed' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          SYSTEM {speedTestStatus === 'passed' ? 'PASSED' : 'FAILED'}
                        </h4>
                      </div>
                      <p className={`text-sm ${speedTestStatus === 'passed' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        <strong>Summary:</strong> {speedTestStatus === 'passed' ? 'SUCCESS: Verified 2 SDRs over 1 iterations. All metrics within limits.' : 'FAILED: Hardware underflows detected'}
                      </p>
                      <button
                        onClick={() => setShowSpeedTestLogs(!showSpeedTestLogs)}
                        className={`mt-3 px-4 py-1.5 text-sm border ${speedTestStatus === 'passed' ? 'border-green-600 text-green-700 dark:text-green-300' : 'border-red-600 text-red-700 dark:text-red-300'} rounded hover:bg-${speedTestStatus === 'passed' ? 'green' : 'red'}-100 dark:hover:bg-${speedTestStatus === 'passed' ? 'green' : 'red'}-800 transition-colors`}
                      >
                        {showSpeedTestLogs ? 'HIDE LOGS' : 'SHOW LOGS'}
                      </button>
                    </div>
                  )}

                  {/* Running Status */}
                  {speedTestStatus === 'running' && (
                    <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                        <h4 className="font-bold text-blue-700 dark:text-blue-300">
                          Speed test is ongoing...
                        </h4>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Please wait while we test the speed of the selected RF card.
                      </p>
                    </div>
                  )}

                  {/* Logs Section */}
                  {showSpeedTestLogs && speedTestResults.length > 0 && (
                    <div className={`flex-1 ${speedTestStatus !== 'running' ? 'border-l-4' : ''} ${speedTestStatus === 'passed' ? 'border-green-500' : speedTestStatus === 'failed' ? 'border-red-500' : ''} bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-auto font-mono text-sm`}>
                      {speedTestResults.map((result) => (
                        <div key={result.index} className="flex items-start gap-2 py-1">
                          {speedTestStatus !== 'running' && (
                            result.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            )
                          )}
                          <span className={`${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                            #{result.index} {result.sdr} {result.speed} Gb/sec {result.hfn} HFN/sec tx_underflows={result.txUnderflows} load: W={result.loadW} R={result.loadR} W+R={result.loadWR} T={result.loadT}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {actionMode === 'gpsState' && (
                <div className="h-full flex flex-col">
                  {/* GPS State Display */}
                  {gpsState === 'unknown' && gpsSyncStatus === null && (
                    <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
                      <Satellite className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">GPS state is unknown</p>
                      <button
                        onClick={() => setShowGPSConfirm(true)}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Check Status
                      </button>
                    </div>
                  )}

                  {/* GPS Locked */}
                  {gpsState === 'locked' && (
                    <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-bold text-green-700 dark:text-green-300">GPS LOCKED</h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        The GPS is successfully locked and synchronized.
                      </p>
                    </div>
                  )}

                  {/* GPS Not Locked */}
                  {gpsState === 'notLocked' && gpsSyncStatus === null && (
                    <div>
                      <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <h4 className="font-bold text-red-700 dark:text-red-300">GPS NOT LOCKED</h4>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                          The GPS is not locked. Would you like to sync with GPS?
                        </p>
                        <button
                          onClick={() => {
                            setGpsSyncStatus('syncing');
                            setGpsLogs([]);
                            setGpsSyncIteration(0);
                          }}
                          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Sync with GPS
                        </button>
                      </div>
                    </div>
                  )}

                  {/* GPS Sync Success */}
                  {gpsSyncStatus === 'success' && (
                    <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-bold text-green-700 dark:text-green-300">SUCCESS</h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>GPS locked, Clock acquisition time: {gpsSyncIteration} seconds</strong>
                      </p>
                      <button
                        onClick={() => setShowGPSLogs(!showGPSLogs)}
                        className="mt-3 px-4 py-1.5 text-sm border border-green-600 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
                      >
                        {showGPSLogs ? 'HIDE LOGS' : 'SHOW LOGS'}
                      </button>
                    </div>
                  )}

                  {/* GPS Sync Failure */}
                  {gpsSyncStatus === 'failure' && (
                    <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <h4 className="font-bold text-red-700 dark:text-red-300">FAILURE</h4>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>GPS sync failed. PLL not locked after {gpsSyncIteration} seconds.</strong>
                      </p>
                      <button
                        onClick={() => setShowGPSLogs(!showGPSLogs)}
                        className="mt-3 px-4 py-1.5 text-sm border border-red-600 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                      >
                        {showGPSLogs ? 'HIDE LOGS' : 'SHOW LOGS'}
                      </button>
                    </div>
                  )}

                  {/* GPS Syncing Status */}
                  {gpsSyncStatus === 'syncing' && (
                    <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                        <h4 className="font-bold text-blue-700 dark:text-blue-300">Syncing with GPS...</h4>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Please wait while we synchronize with the GPS signal.
                      </p>
                    </div>
                  )}

                  {/* GPS Logs */}
                  {showGPSLogs && gpsLogs.length > 0 && (
                    <div className={`flex-1 ${gpsSyncStatus !== 'syncing' ? 'border-l-4' : ''} ${gpsSyncStatus === 'success' ? 'border-green-500' : gpsSyncStatus === 'failure' ? 'border-red-500' : ''} bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-auto font-mono text-sm`}>
                      {gpsLogs.map((log) => (
                        <div key={log.index} className="flex items-start gap-2 py-1">
                          {gpsSyncStatus !== 'syncing' && (
                            log.locked ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            )
                          )}
                          <span className={`${log.locked ? 'text-green-400' : 'text-yellow-400'}`}>
                            [{log.index}] {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!showGraph && actionMode !== 'diagnoseSpeed' && actionMode !== 'gpsState' && (() => {
                const card = getSelectedCardData();
                if (!card || !editedGains || !portDetails) return null;

                return (
                  <div className="space-y-6">
                    {/* TX Ports - Metrics with Gain Adjustment */}
                    <div>
                      <h4 className="text-sm text-gray-700 dark:text-gray-300 mb-3">TX Port</h4>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">Port</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">RMS</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">MAX</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">SAT</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">Gain</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 w-48">Adjust Gain</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {portDetails.tx.map((port, idx) => (
                              <tr key={`tx-${port.port}`}>
                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">Tx{port.port - 1}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{port.rms.toFixed(2)}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{port.max.toFixed(2)}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{port.sat.toFixed(2)}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{port.gain} dB</td>
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
                                      className="w-14 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                      <h4 className="text-sm text-gray-700 dark:text-gray-300 mb-3">RX Port</h4>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">Port</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">RMS</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">MAX</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">SAT</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">Gain</th>
                              <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 w-48">Adjust Gain</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {portDetails.rx.map((port, idx) => (
                              <tr key={`rx-${port.port}`}>
                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">Rx{port.port - 1}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{port.rms.toFixed(2)}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{port.max.toFixed(2)}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{port.sat.toFixed(2)}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{port.gain} dB</td>
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
                                      className="w-14 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                        hasChanges
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      Apply Changes
                    </button>
                  </div>
                );
              })()}

              {showGraph && (() => {
                const card = getSelectedCardData();
                if (!card || !portDetails) return null;

                // Define color palette for ports
                const portColors = {
                  tx0: '#ef4444', // red
                  tx1: '#f97316', // orange
                  tx2: '#f59e0b', // amber
                  tx3: '#eab308', // yellow
                  rx0: '#3b82f6', // blue
                  rx1: '#06b6d4', // cyan
                  rx2: '#10b981', // green
                  rx3: '#14b8a6', // teal
                };

                return (
                  <div className="h-full flex flex-col">
                    {/* Back Button */}
                    <button
                      onClick={() => setShowGraph(false)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 mb-4 flex-shrink-0"
                    >
                      ← Back to Details
                    </button>

                    {/* Main Content with Port Selector and Graphs */}
                    <div className="flex-1 min-h-0 mb-4 flex gap-3">
                      {/* Port Selector - Vertical Sidebar */}
                      <div className="flex-shrink-0 w-14 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 p-2 overflow-y-auto">
                        <div className="space-y-4">
                          {/* TX Ports - Vertical */}
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2 text-center">TX</div>
                            <div className="space-y-2">
                              {card.txPorts.map((_, idx) => {
                                const isSelected = selectedPorts.tx.includes(idx);
                                const color = portColors[`tx${idx}` as keyof typeof portColors];
                                
                                return (
                                  <label
                                    key={`tx-${idx}`}
                                    className={`flex flex-col items-center gap-1 px-1 py-2 border rounded-md cursor-pointer transition-colors ${
                                      isSelected 
                                        ? 'border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-600 shadow-sm' 
                                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600'
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
                                    <span className="text-xs text-gray-700 dark:text-gray-300">{idx}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* RX Ports - Vertical */}
                          <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2 text-center">RX</div>
                            <div className="space-y-2">
                              {card.rxPorts.map((_, idx) => {
                                const isSelected = selectedPorts.rx.includes(idx);
                                const color = portColors[`rx${idx}` as keyof typeof portColors];
                                
                                return (
                                  <label
                                    key={`rx-${idx}`}
                                    className={`flex flex-col items-center gap-1 px-1 py-2 border rounded-md cursor-pointer transition-colors ${
                                      isSelected 
                                        ? 'border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-600 shadow-sm' 
                                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600'
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
                                    <span className="text-xs text-gray-700 dark:text-gray-300">{idx}</span>
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
                            const config = metricConfig[metric];
                            
                            // Create datasets for each port
                            const datasets = [];
                            
                            // Add TX port datasets (only selected ports)
                            for (let tx = 0; tx < card.txPorts.length; tx++) {
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
                            for (let rx = 0; rx < card.rxPorts.length; rx++) {
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
                            
                            return (
                              <div key={metric} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: config.color }}
                                    />
                                    <span className="text-sm text-gray-900 dark:text-gray-100">{config.label}</span>
                                  </div>
                                </div>
                                <div className="flex-1 p-4 min-h-0">
                                  <LineChart
                                    data={{
                                      labels: timeSeriesData.map(d => d.time),
                                      datasets: datasets,
                                    }}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      interaction: {
                                        mode: 'index',
                                        intersect: false,
                                      },
                                      scales: {
                                        y: {
                                          beginAtZero: true,
                                          ticks: {
                                            font: {
                                              size: 10,
                                            },
                                          },
                                        },
                                        x: {
                                          ticks: {
                                            maxRotation: 0,
                                            autoSkipPadding: 15,
                                            font: {
                                              size: 10,
                                            },
                                          },
                                        },
                                      },
                                      plugins: {
                                        legend: {
                                          display: false,
                                        },
                                        tooltip: {
                                          mode: 'index',
                                          intersect: false,
                                          callbacks: {
                                            label: (context: any) => {
                                              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
                                            },
                                          },
                                        },
                                      },
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          
                          {selectedMetrics.length === 0 && (
                            <div className="col-span-2 flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <div className="text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                <p>All graphs hidden</p>
                                <p className="text-sm mt-1">Select metrics below to view graphs</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metric Checkboxes */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-4 flex-shrink-0">
                      <div className="space-y-3">
                        {/* Metrics Selection - Compact Row */}
                        <div>
                          <h5 className="text-xs text-gray-600 dark:text-gray-400 mb-2">Metrics</h5>
                          <div className="flex gap-2">
                            {(Object.keys(metricConfig) as PortMetricType[]).map((metric) => {
                              const config = metricConfig[metric];
                              const isVisible = visibleGraphs.includes(metric);
                              
                              return (
                                <label
                                  key={metric}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md cursor-pointer transition-colors text-xs ${
                                    isVisible 
                                      ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-600' 
                                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isVisible}
                                    onChange={() => toggleGraphVisibility(metric)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: config.color }}
                                  />
                                  <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Firmware Upgrade Confirmation Modal */}
      {showFirmwareConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-4">
                  <div className="p-2 md:p-3 bg-orange-100 dark:bg-orange-900 rounded-full flex-shrink-0">
                    <Upload className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-base md:text-lg text-gray-900 dark:text-gray-100">Firmware Upgrade Warning</h3>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-900 dark:text-orange-200">
                    <strong>⚠️ Use with caution!</strong>
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-300 mt-2">
                    This action will:
                  </p>
                  <ul className="text-sm text-orange-800 dark:text-orange-300 mt-2 ml-4 list-disc space-y-1">
                    <li>Stop the current test</li>
                    <li>Reflash the RF card</li>
                    <li>Restart the server</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Do you want to proceed with the firmware upgrade for {selectedCard}?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFirmwareConfirm(false);
                      setActionMode(null);
                      setSelectedCard(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFirmwareUpgrade}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Firmware Version Input Modal */}
      {showVersionInput && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 md:p-6">
                <h3 className="text-base md:text-lg text-gray-900 dark:text-gray-100 mb-4">Select Firmware Version</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Enter a specific firmware version or leave blank to use the latest version.
                </p>
                <input
                  type="text"
                  value={firmwareVersion}
                  onChange={(e) => setFirmwareVersion(e.target.value)}
                  placeholder="e.g., v3.2.1 (or leave blank for latest)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowVersionInput(false);
                      setFirmwareVersion('');
                      setActionMode(null);
                      setSelectedCard(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmFirmwareUpgrade}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Upgrade
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Speed Test Confirmation Modal */}
      {showSpeedTestConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-4">
                  <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                    <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base md:text-lg text-gray-900 dark:text-gray-100">Speed Test Confirmation</h3>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-900 dark:text-orange-200">
                    <strong>⚠️ Warning!</strong>
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-300 mt-2">
                    This will stop the ongoing test.
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Do you want to start a speed test for {selectedCard}?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSpeedTestConfirm(false);
                      setActionMode(null);
                      setSelectedCard(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSpeedTestConfirm(false);
                      setSpeedTestStatus('running');
                      setSpeedTestResults([]);
                      setSpeedTestIteration(0);
                    }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Start Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* GPS Check Status Confirmation Modal */}
      {showGPSConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-4">
                  <div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full flex-shrink-0">
                    <Satellite className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-base md:text-lg text-gray-900 dark:text-gray-100">GPS Status Check</h3>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-900 dark:text-orange-200">
                    <strong>⚠️ Warning!</strong>
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-300 mt-2">
                    This will stop the current test.
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Do you want to check the GPS status for {selectedCard}?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowGPSConfirm(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowGPSConfirm(false);
                      // Randomly set GPS state (50% locked, 50% not locked)
                      const isLocked = Math.random() > 0.5;
                      setGpsState(isLocked ? 'locked' : 'notLocked');
                    }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Check Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
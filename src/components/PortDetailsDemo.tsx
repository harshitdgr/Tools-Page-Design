import { useState } from 'react';
import { PortDetailsGainAdjustment, type RFCardData, type PortGain } from './PortDetailsGainAdjustment';

/**
 * Demo component showing how to use PortDetailsGainAdjustment
 * from anywhere in your application
 */
export function PortDetailsDemo() {
  const [showPortDetails, setShowPortDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<RFCardData | null>(null);

  // Sample RF card data - this could come from any source
  const sampleCards: RFCardData[] = [
    {
      id: 'CARD-1',
      cardType: '100MHz',
      serialNumber: 'SN-12345',
      txPorts: [
        { port: 1, gain: 35 },
        { port: 2, gain: 40 },
        { port: 3, gain: 38 },
        { port: 4, gain: 42 },
      ],
      rxPorts: [
        { port: 1, gain: 25 },
        { port: 2, gain: 28 },
        { port: 3, gain: 30 },
        { port: 4, gain: 27 },
      ],
    },
    {
      id: 'CARD-2',
      cardType: '50MHz',
      serialNumber: 'SN-67890',
      txPorts: [
        { port: 1, gain: 32 },
        { port: 2, gain: 36 },
      ],
      rxPorts: [
        { port: 1, gain: 22 },
        { port: 2, gain: 26 },
      ],
    },
  ];

  const handleCardSelect = (card: RFCardData) => {
    setSelectedCard(card);
    setShowPortDetails(true);
  };

  const handleClose = () => {
    setShowPortDetails(false);
    setSelectedCard(null);
  };

  const handleSave = (updatedGains: { tx: PortGain[]; rx: PortGain[] }) => {
    console.log('Saved gains:', updatedGains);
    // Here you would typically send this data to your backend
    // or update your application state
    alert(`Gains saved successfully!\nTX Ports: ${updatedGains.tx.map(p => `${p.gain}dB`).join(', ')}\nRX Ports: ${updatedGains.rx.map(p => `${p.gain}dB`).join(', ')}`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mb-6 text-white">
        <h1 className="text-2xl mb-2">Port Details & Gain Adjustment Demo</h1>
        <p className="text-blue-100">Click on any RF card to open the Port Details & Gain Adjustment interface</p>
      </div>

      {/* Card Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        {sampleCards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCardSelect(card)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">{card.id}</h3>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
                {card.cardType}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Serial Number:</span>
                <span className="text-gray-900">{card.serialNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TX Ports:</span>
                <span className="text-gray-900">{card.txPorts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">RX Ports:</span>
                <span className="text-gray-900">{card.rxPorts.length}</span>
              </div>
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 transition-colors text-sm">
              Configure Ports
            </button>
          </div>
        ))}

        {/* Add more cards demo */}
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Add more cards...</p>
          </div>
        </div>
      </div>

      {/* Port Details Sidebar */}
      {showPortDetails && selectedCard && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 backdrop-blur-[2px]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            onClick={handleClose}
          />

          {/* Sidebar */}
          <div className="fixed right-0 top-0 bottom-0 z-50" style={{ width: '600px' }}>
            <PortDetailsGainAdjustment
              cardData={selectedCard}
              onClose={handleClose}
              onSave={handleSave}
              showGraphOption={true}
            />
          </div>
        </>
      )}

      {/* Usage Instructions */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg text-gray-900 mb-3">How to Use</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>1. Import the component:</strong>
          </p>
          <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
            {`import { PortDetailsGainAdjustment, type RFCardData, type PortGain } from './components/PortDetailsGainAdjustment';`}
          </pre>
          
          <p className="mt-4">
            <strong>2. Prepare your RF card data:</strong>
          </p>
          <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
{`const cardData: RFCardData = {
  id: 'CARD-1',
  cardType: '100MHz',
  serialNumber: 'SN-12345',
  txPorts: [
    { port: 1, gain: 35 },
    { port: 2, gain: 40 },
    // ...
  ],
  rxPorts: [
    { port: 1, gain: 25 },
    { port: 2, gain: 28 },
    // ...
  ],
};`}
          </pre>
          
          <p className="mt-4">
            <strong>3. Use the component:</strong>
          </p>
          <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
{`<PortDetailsGainAdjustment
  cardData={cardData}
  onClose={() => setShowDetails(false)}
  onSave={(updatedGains) => {
    // Handle the saved gains
    console.log('Updated gains:', updatedGains);
  }}
  showGraphOption={true}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
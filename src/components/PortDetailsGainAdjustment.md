# Port Details & Gain Adjustment Component

A fully reusable React component for viewing and adjusting RF port details and gains. This component can be used anywhere in your application to provide a comprehensive interface for managing TX/RX port configurations.

## Features

- ✅ **Fully Reusable**: Can be called from anywhere in your application
- ✅ **Port Details View**: Display RMS, MAX, SAT, and Gain metrics for all TX/RX ports
- ✅ **Gain Adjustment**: Interactive sliders and number inputs for precise gain control
- ✅ **Metrics Charts**: Real-time visualization of port metrics over time
- ✅ **Port Selection**: Filter charts by selecting specific TX/RX ports
- ✅ **Metric Selection**: Choose which metrics to display in charts
- ✅ **Pin/Unpin**: Keep the sidebar open while interacting with other elements
- ✅ **Resizable**: Adjust the width of the sidebar for optimal viewing
- ✅ **Change Detection**: Only enable save button when changes are made

## Installation

The component is already available in your project at:
```
/components/PortDetailsGainAdjustment.tsx
```

## Basic Usage

### 1. Import the Component

```tsx
import { 
  PortDetailsGainAdjustment, 
  type RFCardData, 
  type PortGain 
} from './components/PortDetailsGainAdjustment';
```

### 2. Prepare Your Data

The component expects data in the `RFCardData` format:

```tsx
const cardData: RFCardData = {
  id: 'CARD-1',                    // Unique identifier for the RF card
  cardType: '100MHz',              // '50MHz' or '100MHz'
  serialNumber: 'SN-12345',        // Serial number of the card
  txPorts: [                       // TX port configurations
    { port: 1, gain: 35 },
    { port: 2, gain: 40 },
    { port: 3, gain: 38 },
    { port: 4, gain: 42 },
  ],
  rxPorts: [                       // RX port configurations
    { port: 1, gain: 25 },
    { port: 2, gain: 28 },
    { port: 3, gain: 30 },
    { port: 4, gain: 27 },
  ],
};
```

### 3. Use the Component

```tsx
function MyComponent() {
  const [showPortDetails, setShowPortDetails] = useState(false);

  const handleSave = (updatedGains: { tx: PortGain[]; rx: PortGain[] }) => {
    // Handle the saved gains
    console.log('TX Gains:', updatedGains.tx);
    console.log('RX Gains:', updatedGains.rx);
    
    // Send to backend or update state
    // updateBackend(cardData.id, updatedGains);
  };

  return (
    <>
      <button onClick={() => setShowPortDetails(true)}>
        Configure Ports
      </button>

      {showPortDetails && (
        <div className="fixed right-0 top-0 bottom-0 z-50" style={{ width: '600px' }}>
          <PortDetailsGainAdjustment
            cardData={cardData}
            onClose={() => setShowPortDetails(false)}
            onSave={handleSave}
            showGraphOption={true}
          />
        </div>
      )}
    </>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `cardData` | `RFCardData` | ✅ Yes | - | RF card data including ports and gains |
| `onClose` | `() => void` | ✅ Yes | - | Callback when sidebar is closed |
| `onSave` | `(gains) => void` | ❌ No | - | Callback when gains are saved |
| `showGraphOption` | `boolean` | ❌ No | `true` | Show/hide the chart view button |
| `className` | `string` | ❌ No | `''` | Additional CSS classes |

## TypeScript Interfaces

### RFCardData
```tsx
interface RFCardData {
  id: string;                      // Unique card identifier
  cardType: '50MHz' | '100MHz';    // Card type
  serialNumber: string;            // Serial number
  txPorts: PortGain[];             // TX port configurations
  rxPorts: PortGain[];             // RX port configurations
}
```

### PortGain
```tsx
interface PortGain {
  port: number;                    // Port number (1-indexed)
  gain: number;                    // Gain value in dB
}
```

### PortDetails
```tsx
interface PortDetails {
  port: number;                    // Port number
  gain: number;                    // Current gain in dB
  rms: number;                     // RMS value
  max: number;                     // MAX value
  sat: number;                     // SAT value
}
```

## Advanced Usage

### With Overlay

For a modal-like experience with an overlay:

```tsx
{showPortDetails && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 z-40 backdrop-blur-[2px]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
      onClick={() => setShowPortDetails(false)}
    />

    {/* Sidebar */}
    <div className="fixed right-0 top-0 bottom-0 z-50" style={{ width: '600px' }}>
      <PortDetailsGainAdjustment
        cardData={cardData}
        onClose={() => setShowPortDetails(false)}
        onSave={handleSave}
        showGraphOption={true}
      />
    </div>
  </>
)}
```

### With Resizable Sidebar

Add resize functionality:

```tsx
const [sidebarWidth, setSidebarWidth] = useState(600);
const [isResizing, setIsResizing] = useState(false);

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

// Then render:
<div className="fixed right-0 top-0 bottom-0 z-50" style={{ width: `${sidebarWidth}px` }}>
  <div
    className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500"
    onMouseDown={handleMouseDown}
  />
  <PortDetailsGainAdjustment {...props} />
</div>
```

### With State Management

Integrate with your state management solution:

```tsx
// Using Redux
const dispatch = useDispatch();

const handleSave = (updatedGains: { tx: PortGain[]; rx: PortGain[] }) => {
  dispatch(updateCardGains({
    cardId: cardData.id,
    gains: updatedGains
  }));
};

// Using Context
const { updateCardConfig } = useCardContext();

const handleSave = (updatedGains: { tx: PortGain[]; rx: PortGain[] }) => {
  updateCardConfig(cardData.id, updatedGains);
};
```

## Features Breakdown

### Port Details Table
- Displays RMS, MAX, SAT, and current Gain for each port
- Separate tables for TX and RX ports
- Real-time value updates as you adjust gains

### Gain Adjustment
- **Range Slider**: Visual adjustment with immediate feedback
- **Number Input**: Precise numerical entry
- **TX Ports**: Gain range 16-90 dB
- **RX Ports**: Gain range 9-60 dB
- **Change Detection**: Save button only enabled when changes exist

### Charts View
- **Metrics Selection**: Choose from RMS, MAX, SAT, Gain
- **Port Selection**: Vertical sidebar to toggle individual TX/RX ports
- **Multi-Chart Display**: View multiple metrics simultaneously
- **Responsive Grid**: Automatically adjusts from 1x1 to 2x2 layout
- **Color Coding**: Unique colors for each port
- **Interactive**: Hover for detailed tooltips

### Pin Feature
- **Unpinned** (default): Clicking outside closes the sidebar
- **Pinned**: Sidebar stays open, allowing interaction with other elements
- Toggle via pin icon in header

## Demo Page

A complete demo showing all features is available at:
```
/components/PortDetailsDemo.tsx
```

To use it in your app, simply import and render:

```tsx
import { PortDetailsDemo } from './components/PortDetailsDemo';

function App() {
  return <PortDetailsDemo />;
}
```

## Examples

### Example 1: Simple Button Trigger

```tsx
function RFCardList() {
  const [selectedCard, setSelectedCard] = useState<RFCardData | null>(null);

  return (
    <div>
      {cards.map(card => (
        <button onClick={() => setSelectedCard(card)}>
          Configure {card.id}
        </button>
      ))}

      {selectedCard && (
        <div className="fixed right-0 top-0 bottom-0 z-50 w-[600px]">
          <PortDetailsGainAdjustment
            cardData={selectedCard}
            onClose={() => setSelectedCard(null)}
            onSave={(gains) => console.log('Saved:', gains)}
          />
        </div>
      )}
    </div>
  );
}
```

### Example 2: From Table Row

```tsx
function RFCardsTable() {
  const [showConfig, setShowConfig] = useState(false);
  const [selectedCard, setSelectedCard] = useState<RFCardData | null>(null);

  const handleConfigClick = (card: RFCardData) => {
    setSelectedCard(card);
    setShowConfig(true);
  };

  return (
    <>
      <table>
        <tbody>
          {cards.map(card => (
            <tr key={card.id}>
              <td>{card.id}</td>
              <td>{card.serialNumber}</td>
              <td>
                <button onClick={() => handleConfigClick(card)}>
                  Configure
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showConfig && selectedCard && (
        <div className="fixed right-0 top-0 bottom-0 z-50 w-[600px]">
          <PortDetailsGainAdjustment
            cardData={selectedCard}
            onClose={() => {
              setShowConfig(false);
              setSelectedCard(null);
            }}
            onSave={(gains) => updateCardInBackend(selectedCard.id, gains)}
          />
        </div>
      )}
    </>
  );
}
```

### Example 3: From Dashboard Card

```tsx
function Dashboard() {
  const [activeCard, setActiveCard] = useState<RFCardData | null>(null);

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map(card => (
        <div 
          key={card.id}
          className="card"
          onClick={() => setActiveCard(card)}
        >
          <h3>{card.id}</h3>
          <p>{card.cardType}</p>
        </div>
      ))}

      {activeCard && (
        <div className="fixed right-0 top-0 bottom-0 z-50 w-[600px]">
          <PortDetailsGainAdjustment
            cardData={activeCard}
            onClose={() => setActiveCard(null)}
            onSave={(gains) => {
              // Update your state/backend
              updateCard(activeCard.id, gains);
              setActiveCard(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
```

## Styling

The component uses Tailwind CSS classes and is fully styled. You can override styles using the `className` prop or by wrapping it in a container with custom styles.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- React 18+
- Chart.js 4+
- react-chartjs-2
- Lucide React (for icons)
- Tailwind CSS

## Notes

- The component generates mock RMS, MAX, and SAT values for demonstration. In production, you should fetch real values from your backend.
- Time series data is also mocked. Replace `generateTimeSeriesData()` with your actual data fetching logic.
- Port colors are predefined but can be customized by modifying the `portColors` object in the component.
- The component is designed to work in a fixed sidebar layout but can be adapted for modal or other layouts.

## Support

For issues or questions, refer to the demo page at `/components/PortDetailsDemo.tsx` or check the existing implementation in `/components/tools/ConfigureRadioFrontend.tsx`.

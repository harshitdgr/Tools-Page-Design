import { useState, useRef, useEffect } from 'react';
import '../../../css/BandInfo.css';

interface BandData {
  band: string;
  bandName: string;
  mode: 'FDD' | 'TDD';
  dlFreqRange: { low: number; centre: number; high: number };
  ulFreqRange: { low: number; centre: number; high: number };
  geoArea: string;
  release: string;
  scs: number[];
  scsBandwidthCombination: { scs: number; bandwidths: number[] }[];
}

const API_BASE_URL = 'http://localhost:8080/api';

export function BandInfo() {
  const [rat, setRat] = useState<'LTE' | 'NR'>('NR');
  const [selectedBand, setSelectedBand] = useState<string>('');
  const [advancedQuery, setAdvancedQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BandData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [bandSearchTerm, setBandSearchTerm] = useState('');
  const [showBandDropdown, setShowBandDropdown] = useState(false);
  const [showAdvancedQuery, setShowAdvancedQuery] = useState(false);
  const [selectedBandDetails, setSelectedBandDetails] = useState<BandData | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const [allBands, setAllBands] = useState<BandData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<'FDD' | 'TDD' | null>(null);

  // Fetch band data from API when RAT changes
  useEffect(() => {
    const fetchBands = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/bands/${rat}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${rat} bands`);
        }
        const data = await response.json();
        setAllBands(data || []);
        setSelectedBand('');
        setBandSearchTerm('');
        setSearchResults(data || []);
        setHasSearched(true);
        setModeFilter(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch band data';
        setError(errorMessage);
        setAllBands([]);
        console.error('Error fetching bands:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBands();
  }, [rat]);

  const filteredBandOptions = allBands.filter(
    (b) =>
      b.band.toLowerCase().includes(bandSearchTerm.toLowerCase()) ||
      b.bandName.toLowerCase().includes(bandSearchTerm.toLowerCase())
  );

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 320 && newWidth <= 800) {
          setSidebarWidth(newWidth);
        }
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

  // Handle band selection and display details
  useEffect(() => {
    if (selectedBand) {
      const band = allBands.find((b) => b.band === selectedBand);
      if (band) {
        setHasSearched(true);
        setSearchResults([band]);
        // Don't clear modeFilter when displaying single band
      }
    }
  }, [selectedBand, allBands]);

  // Handle advanced query filtering
  const handleApplyAdvancedQuery = () => {
    if (!advancedQuery.trim()) {
      setSearchResults([...allBands]);
      setHasSearched(true);
      return;
    }

    try {
      const results = allBands.filter((band) => {
        let query = advancedQuery;
        
        query = query.replace(/Mode/g, `"${band.mode}"`);
        query = query.replace(/GeoArea/g, `"${band.geoArea}"`);
        query = query.replace(/Release/g, `"${band.release}"`);
        
        const bandwidthMatch = query.match(/Bandwidth\s*==\s*(\d+)/);
        if (bandwidthMatch) {
          const bw = parseInt(bandwidthMatch[1]);
          const hasBandwidth = band.scsBandwidthCombination.some((combo) =>
            combo.bandwidths.includes(bw)
          );
          query = query.replace(/Bandwidth\s*==\s*\d+/, hasBandwidth.toString());
        }
        
        try {
          return eval(query);
        } catch {
          return true;
        }
      });
      setSearchResults(results);
      setHasSearched(true);
      setModeFilter(null);
    } catch (error) {
      console.error('Error parsing advanced query:', error);
    }
  };

  // Handle quick mode filter
  const handleQuickFilter = (mode: 'FDD' | 'TDD' | null) => {
    setModeFilter(mode);
    let results = [...allBands];
    if (mode) {
      results = results.filter((band) => band.mode === mode);
    }
    setSearchResults(results);
    setHasSearched(true);
    setSelectedBand('');
    setBandSearchTerm('');
  };

  const handleClear = () => {
    setSelectedBand('');
    setBandSearchTerm('');
    setAdvancedQuery('');
    // Reset search results to show all bands (Show All view)
    setSearchResults([...allBands]);
    setHasSearched(true);
    setShowAdvancedQuery(false);
    setSelectedBandDetails(null);
    setModeFilter(null);
  };

  const formatScsBandwidthCombination = (combinations: { scs: number; bandwidths: number[] }[]) => {
    return combinations
      .map((combo) => `[${combo.scs}: ${combo.bandwidths.join(', ')}]`)
      .join(' ');
  };

  const handleRowClick = (band: BandData) => {
    setSelectedBandDetails(band);
  };

  const closeSidebar = () => {
    setSelectedBandDetails(null);
  };

  return (
    <div className="band-info-container">
      {/* Search Form */}
      <div className="search-form">
        <div className="search-form-inner">
          <div className="search-grid">
            {/* RAT Dropdown */}
            <div className="rat-dropdown-wrapper">
              <label className="form-label">
                RAT <span className="label-required">*</span>
              </label>
              <select
                value={rat}
                onChange={(e) => {
                  setRat(e.target.value as 'LTE' | 'NR');
                  setSelectedBand('');
                  setBandSearchTerm('');
                }}
                className="form-select"
                required
              >
                <option value="NR">NR</option>
                <option value="LTE">LTE</option>
              </select>
            </div>

            {/* Band Searchable Dropdown */}
            <div className="band-dropdown-wrapper">
              <label className="form-label">Band</label>
              <div className="band-search-relative">
                <input
                  type="text"
                  value={selectedBand ? allBands.find((b: BandData) => b.band === selectedBand)?.band + ' - ' + allBands.find((b: BandData) => b.band === selectedBand)?.bandName : bandSearchTerm}
                  onChange={(e) => {
                    setBandSearchTerm(e.target.value);
                    setSelectedBand('');
                    setShowBandDropdown(true);
                  }}
                  onFocus={() => setShowBandDropdown(true)}
                  placeholder="Search band..."
                  className="band-search-input"
                />
                {selectedBand && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBand('');
                      setBandSearchTerm('');
                    }}
                    className="band-clear-button"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {showBandDropdown && !selectedBand && (
                <>
                  <div
                    className="band-dropdown-overlay"
                    onClick={() => setShowBandDropdown(false)}
                  />
                  <div className="band-dropdown-menu">
                    {filteredBandOptions.length > 0 ? (
                      filteredBandOptions.map((band) => (
                        <button
                          key={band.band}
                          type="button"
                          onClick={() => {
                            setSelectedBand(band.band);
                            setBandSearchTerm('');
                            setShowBandDropdown(false);
                          }}
                          className="band-option-button"
                        >
                          <span className="band-option-label">{band.band}</span>
                          <span className="band-option-subtext">- {band.bandName}</span>
                        </button>
                      ))
                    ) : (
                      <div className="band-no-results">No bands found</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons-wrapper">
              <button
                type="button"
                onClick={() => setShowAdvancedQuery(!showAdvancedQuery)}
                className={`btn-advanced-query ${showAdvancedQuery ? 'active' : ''}`}
              >
                Advanced Query
              </button>
              
              {showAdvancedQuery && (
                <button
                  type="button"
                  onClick={handleApplyAdvancedQuery}
                  className="btn-apply"
                >
                  Apply
                </button>
              )}

              <button
                type="button"
                onClick={handleClear}
                className="btn-clear"
              >
                <svg className="btn-clear-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
          </div>

          {/* Advanced Query Input */}
          {showAdvancedQuery && (
            <div className="advanced-query-section">
              <input
                type="text"
                value={advancedQuery}
                onChange={(e) => setAdvancedQuery(e.target.value)}
                placeholder="e.g., Mode == 'TDD' && Bandwidth == 100"
                className="advanced-query-input"
              />
              <p className="advanced-query-help">
                Supported filters: Mode, Bandwidth, GeoArea, Release
              </p>
            </div>
          )}

          {/* Quick Filters */}
          <div className="quick-filters-section">
            <span className="quick-filters-label">Quick Filters:</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickFilter('FDD');
              }}
              className={`filter-button ${modeFilter === 'FDD' ? 'filter-button-fdd-active' : 'filter-button-fdd-inactive'}`}
            >
              FDD Only
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickFilter('TDD');
              }}
              className={`filter-button ${modeFilter === 'TDD' ? 'filter-button-tdd-active' : 'filter-button-tdd-inactive'}`}
            >
              TDD Only
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickFilter(null);
              }}
              className={`filter-button ${modeFilter === null ? 'filter-button-all-active' : 'filter-button-all-inactive'}`}
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="results-section">
        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner">
              <svg className="loading-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="loading-text">Loading band data...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p className="error-title">Error loading band data</p>
            <p className="error-message">{error}</p>
            <p className="error-hint">Make sure the Go backend server is running on http://localhost:8080</p>
          </div>
        )}

        {!isLoading && !error && hasSearched && (
          <>
            {searchResults.length === 0 ? (
              <div className="empty-state">
                No results found matching your search criteria.
              </div>
            ) : (
              <div className="results-table-container">
                <div className="results-table-wrapper">
                  <table className="results-table">
                    <thead className="results-table-head">
                      <tr>
                        <th className="results-table-header-cell">Band</th>
                        <th className="results-table-header-cell">Band Name</th>
                        <th className="results-table-header-cell">Mode</th>
                        <th className="results-table-header-cell">Geo Area</th>
                        <th className="results-table-header-cell">3GPP Release</th>
                      </tr>
                    </thead>
                    <tbody className="results-table-body">
                      {searchResults.map((band) => (
                        <tr 
                          key={band.band} 
                          onClick={() => handleRowClick(band)}
                          className="results-table-row"
                        >
                          <td className="results-table-cell">
                            <span className="results-table-band-badge">
                              {band.band}
                            </span>
                          </td>
                          <td className="results-table-cell results-table-text">
                            {band.bandName}
                          </td>
                          <td className="results-table-cell">
                            <span className={`results-table-mode-badge ${band.mode === 'FDD' ? 'results-table-mode-fdd' : 'results-table-mode-tdd'}`}>
                              {band.mode}
                            </span>
                          </td>
                          <td className="results-table-cell results-table-muted-text">
                            {band.geoArea}
                          </td>
                          <td className="results-table-cell results-table-muted-text">
                            {band.release}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && !hasSearched && (
          <div className="initial-search-container">
            <div className="initial-search-content">
              <svg
                className="search-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="search-prompt">Enter search criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* Details Sidebar */}
      {selectedBandDetails && (
        <>
          {/* Overlay with backdrop blur */}
          <div 
            className="sidebar-overlay"
            onClick={closeSidebar}
          />
          
          {/* Sidebar */}
          <div 
            className="sidebar-panel"
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className="sidebar-resize-handle group"
              onMouseDown={() => setIsResizing(true)}
            >
              <div className="sidebar-resize-line" />
            </div>

            {/* Header */}
            <div className="sidebar-header">
              <div>
                <div className="sidebar-badges">
                  <span className="sidebar-badge">
                    {selectedBandDetails!.band}
                  </span>
                  <span className={`sidebar-badge ${selectedBandDetails!.mode === 'FDD' ? 'sidebar-badge-fdd' : 'sidebar-badge-tdd'}`}>
                    {selectedBandDetails!.mode}
                  </span>
                </div>
                <h3 className="sidebar-title">{selectedBandDetails!.bandName}</h3>
              </div>
              <button
                onClick={closeSidebar}
                className="sidebar-close-button"
              >
                <svg className="sidebar-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Details */}
            <div className="sidebar-content">
              {/* Frequency Ranges Table */}
              <div className="sidebar-section">
                <label className="sidebar-section-label">Frequency Ranges (MHz)</label>
                <table className="freq-table">
                  <thead className="freq-table-head">
                    <tr>
                      <th className="freq-table-header-cell"></th>
                      <th className="freq-table-header-cell">Low</th>
                      <th className="freq-table-header-cell">Centre</th>
                      <th className="freq-table-header-cell">High</th>
                    </tr>
                  </thead>
                  <tbody className="freq-table-body">
                    <tr className="freq-table-row">
                      <td className="freq-table-cell freq-table-label">DL</td>
                      <td className="freq-table-cell">{selectedBandDetails!.dlFreqRange.low}</td>
                      <td className="freq-table-cell">{selectedBandDetails!.dlFreqRange.centre}</td>
                      <td className="freq-table-cell">{selectedBandDetails!.dlFreqRange.high}</td>
                    </tr>
                    <tr className="freq-table-row">
                      <td className="freq-table-cell freq-table-label">UL</td>
                      <td className="freq-table-cell">{selectedBandDetails!.ulFreqRange.low}</td>
                      <td className="freq-table-cell">{selectedBandDetails!.ulFreqRange.centre}</td>
                      <td className="freq-table-cell">{selectedBandDetails!.ulFreqRange.high}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Metadata Grid */}
              <div className="metadata-grid">
                <div className="metadata-card">
                  <div className="metadata-card-label">Geographic Area</div>
                  <div className="metadata-card-value">{selectedBandDetails!.geoArea}</div>
                </div>
                
                <div className="metadata-card">
                  <div className="metadata-card-label">3GPP Release</div>
                  <div className="metadata-card-value">Release {selectedBandDetails!.release}</div>
                </div>
              </div>

              {/* SCS */}
              <div className="sidebar-section">
                <label className="sidebar-section-label">Subcarrier Spacing (kHz)</label>
                <div className="scs-badges">
                  {selectedBandDetails!.scs.map((scs) => (
                    <span key={scs} className="scs-badge">
                      {scs} kHz
                    </span>
                  ))}
                </div>
              </div>

              {/* SCS-Bandwidth Combination */}
              <div className="sidebar-section">
                <label className="sidebar-section-label">Supported Bandwidths per SCS</label>
                <div className="bandwidth-combos">
                  {selectedBandDetails!.scsBandwidthCombination.map((combo, idx) => (
                    <div key={idx} className="bandwidth-combo">
                      <div className="bandwidth-combo-label">{combo.scs} kHz SCS:</div>
                      <div className="bandwidth-list">
                        {combo.bandwidths.map((bw) => (
                          <span key={bw} className="bandwidth-badge">
                            {bw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
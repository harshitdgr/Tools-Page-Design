import { useState, useRef, useEffect } from 'react';

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
    <div className="h-full flex flex-col relative">
      {/* Search Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            {/* RAT Dropdown */}
            <div className="col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                RAT <span className="text-red-500">*</span>
              </label>
              <select
                value={rat}
                onChange={(e) => {
                  setRat(e.target.value as 'LTE' | 'NR');
                  setSelectedBand('');
                  setBandSearchTerm('');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="NR">NR</option>
                <option value="LTE">LTE</option>
              </select>
            </div>

            {/* Band Searchable Dropdown */}
            <div className="col-span-4 relative">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Band</label>
              <div className="relative">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                {selectedBand && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBand('');
                      setBandSearchTerm('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {showBandDropdown && !selectedBand && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowBandDropdown(false)}
                  />
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
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
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-gray-600 text-sm"
                        >
                          <span className="text-gray-900 dark:text-gray-100">{band.band}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">- {band.bandName}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No bands found</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="col-span-6 flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedQuery(!showAdvancedQuery)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showAdvancedQuery
                    ? 'bg-purple-600 dark:bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Advanced Query
              </button>
              
              {showAdvancedQuery && (
                <button
                  type="button"
                  onClick={handleApplyAdvancedQuery}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Apply
                </button>
              )}

              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
          </div>

          {/* Advanced Query Input */}
          {showAdvancedQuery && (
            <div className="pt-2">
              <input
                type="text"
                value={advancedQuery}
                onChange={(e) => setAdvancedQuery(e.target.value)}
                placeholder="e.g., Mode == 'TDD' && Bandwidth == 100"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supported filters: Mode, Bandwidth, GeoArea, Release
              </p>
            </div>
          )}

          {/* Quick Filters */}
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Quick Filters:</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickFilter('FDD');
              }}
              style={modeFilter === 'FDD' ? {
                backgroundColor: '#059669',
                color: 'white',
                borderColor: '#047857',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              } : {
                backgroundColor: '#d1fae5',
                color: '#059669',
                borderColor: '#a7f3d0'
              }}
              className="px-4 py-2 rounded-lg transition-all font-medium border-2 cursor-pointer hover:opacity-90"
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
              style={modeFilter === 'TDD' ? {
                backgroundColor: '#7c3aed',
                color: 'white',
                borderColor: '#6d28d9',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              } : {
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                borderColor: '#e9d5ff'
              }}
              className="px-4 py-2 rounded-lg transition-all font-medium border-2 cursor-pointer hover:opacity-90"
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
              style={modeFilter === null ? {
                backgroundColor: '#4b5563',
                color: 'white',
                borderColor: '#374151',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              } : {
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                borderColor: '#d1d5db'
              }}
              className="px-4 py-2 rounded-lg transition-all font-medium border-2 cursor-pointer hover:opacity-90"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="inline-block animate-spin">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="mt-2">Loading band data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-300">
            <p className="font-semibold">Error loading band data</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-sm mt-2">Make sure the Go backend server is running on http://localhost:8080</p>
          </div>
        )}

        {!isLoading && !error && hasSearched && (
          <>
            {searchResults.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                No results found matching your search criteria.
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Band
                        </th>
                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Band Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Geo Area
                        </th>
                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          3GPP Release
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {searchResults.map((band) => (
                        <tr 
                          key={band.band} 
                          onClick={() => handleRowClick(band)}
                          className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {band.band}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {band.bandName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                                band.mode === 'FDD'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                              }`}
                            >
                              {band.mode}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {band.geoArea}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center p-12">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
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
              <p>Enter search criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* Details Sidebar */}
      {selectedBandDetails && (
        <>
          {/* Overlay with backdrop blur */}
          <div 
            className="fixed inset-0 z-40 backdrop-blur-[2px]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            onClick={closeSidebar}
          />
          
          {/* Sidebar */}
          <div 
            className="fixed right-0 top-0 bottom-0 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-auto"
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 active:bg-blue-600 transition-colors group"
              onMouseDown={() => setIsResizing(true)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400" />
            </div>

            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {selectedBandDetails!.band}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      selectedBandDetails!.mode === 'FDD'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                    }`}
                  >
                    {selectedBandDetails!.mode}
                  </span>
                </div>
                <h3 className="text-gray-900 dark:text-gray-100 text-xl">{selectedBandDetails!.bandName}</h3>
              </div>
              <button
                onClick={closeSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Frequency Ranges Table */}
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Frequency Ranges (MHz)</label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400"></th>
                        <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">Low</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">Centre</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400">High</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">DL</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{selectedBandDetails!.dlFreqRange.low}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{selectedBandDetails!.dlFreqRange.centre}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{selectedBandDetails!.dlFreqRange.high}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">UL</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{selectedBandDetails!.ulFreqRange.low}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{selectedBandDetails!.ulFreqRange.centre}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{selectedBandDetails!.ulFreqRange.high}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Geographic Area</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{selectedBandDetails!.geoArea}</div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">3GPP Release</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">Release {selectedBandDetails!.release}</div>
                </div>
              </div>

              {/* SCS */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Subcarrier Spacing (kHz)</div>
                <div className="flex gap-2 flex-wrap">
                  {selectedBandDetails!.scs.map((scs) => (
                    <span key={scs} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                      {scs} kHz
                    </span>
                  ))}
                </div>
              </div>

              {/* SCS-Bandwidth Combination */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Supported Bandwidths per SCS</div>
                <div className="space-y-2">
                  {selectedBandDetails!.scsBandwidthCombination.map((combo, idx) => (
                    <div key={idx} className="pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                      <div className="text-xs text-gray-700 dark:text-gray-300 mb-1.5">{combo.scs} kHz SCS:</div>
                      <div className="flex flex-wrap gap-1">
                        {combo.bandwidths.map((bw) => (
                          <span key={bw} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
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
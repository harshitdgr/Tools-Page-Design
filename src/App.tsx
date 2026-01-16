import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ToolsList } from './components/ToolsList';
import { Breadcrumb } from './components/Breadcrumb';
import { BandInfo } from './components/tools/BandInfo';
import { ConfigureRadioFrontend } from './components/tools/ConfigureRadioFrontend';
import { HealthCheck } from './components/tools/HealthCheck';
import { Support } from './components/Support';

export type ToolType = '3gpp-band-info' | 'radio-frontend' | 'health-check' | null;
export type PageType = 'tools' | 'support' | 'dashboard' | 'sample-tests' | 'my-tests' | 'statistics' | 'logs';

export default function App() {
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('tools');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleToolSelect = (tool: ToolType) => {
    setSelectedTool(tool);
  };

  const handleBackToTools = () => {
    setSelectedTool(null);
  };

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    setSelectedTool(null);
  };

  const handleSidebarItemClick = (itemId: string) => {
    const pageMap: { [key: string]: PageType } = {
      'Dashboard': 'dashboard',
      'Sample Tests': 'sample-tests',
      'My Tests': 'my-tests',
      'Statistics': 'statistics',
      'Logs': 'logs',
      'Tools': 'tools',
      'Support': 'support',
    };
    
    const page = pageMap[itemId];
    if (page) {
      handlePageChange(page);
    }
  };

  const getActiveItemForSidebar = () => {
    const itemMap: { [key in PageType]: string } = {
      'dashboard': 'Dashboard',
      'sample-tests': 'Sample Tests',
      'my-tests': 'My Tests',
      'statistics': 'Statistics',
      'logs': 'Logs',
      'tools': 'Tools',
      'support': 'Support',
    };
    
    return itemMap[currentPage];
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'tools':
        return 'Tools';
      case 'support':
        return 'Support';
      case 'dashboard':
        return 'Dashboard';
      case 'sample-tests':
        return 'Sample Tests';
      case 'my-tests':
        return 'My Tests';
      case 'statistics':
        return 'Statistics';
      case 'logs':
        return 'Logs';
      default:
        return '';
    }
  };

  const getToolTitle = (tool: ToolType) => {
    switch (tool) {
      case '3gpp-band-info':
        return '3GPP NR and LTE Band Info';
      case 'radio-frontend':
        return 'Configure Radio Frontend';
      case 'health-check':
        return 'Health Check Containers';
      default:
        return '';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        activeItem={getActiveItemForSidebar()} 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
        onPageChange={handleSidebarItemClick}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between dark:bg-gray-800 dark:border-gray-700">
          <div>
            {selectedTool ? (
              <Breadcrumb 
                items={[
                  { label: 'Tools', onClick: handleBackToTools },
                  { label: getToolTitle(selectedTool) }
                ]} 
              />
            ) : (
              <h1 className="text-gray-900 dark:text-gray-100">{getPageTitle()}</h1>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button 
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700 transition-colors"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white text-sm">U</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          {currentPage === 'tools' && !selectedTool && (
            <ToolsList onToolSelect={handleToolSelect} />
          )}
          
          {currentPage === 'tools' && selectedTool && (
            <div className="h-full">
              {selectedTool === '3gpp-band-info' && <BandInfo />}
              {selectedTool === 'radio-frontend' && <ConfigureRadioFrontend />}
              {selectedTool === 'health-check' && <HealthCheck />}
            </div>
          )}
          
          {currentPage === 'support' && <Support />}
          
          {currentPage !== 'tools' && currentPage !== 'support' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl text-gray-900 mb-2 dark:text-gray-100">{getPageTitle()}</h2>
                <p className="text-gray-600 dark:text-gray-400">This page is under construction</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
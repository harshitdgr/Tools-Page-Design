interface SidebarProps {
  activeItem: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onPageChange?: (page: string) => void;
}

export function Sidebar({ activeItem, collapsed, onToggleCollapse, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'Dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'Sample Tests', icon: '🧪', label: 'Sample Tests' },
    { id: 'My Tests', icon: '📝', label: 'My Tests' },
    { id: 'Statistics', icon: '📈', label: 'Statistics' },
    { id: 'Logs', icon: '📋', label: 'Logs' },
    { id: 'Tools', icon: '🔧', label: 'Tools' },
    { id: 'Support', icon: '💬', label: 'Support' },
  ];

  const handleMenuItemClick = (itemId: string) => {
    if (onPageChange) {
      onPageChange(itemId);
    }
  };

  return (
    <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="8" cy="8" r="2" />
                  <circle cx="16" cy="8" r="2" />
                  <circle cx="8" cy="16" r="2" />
                  <circle cx="16" cy="16" r="2" />
                </svg>
              </div>
              <span className="text-gray-900 dark:text-gray-100">SIMNOVUS</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">2.0</span>
            <button className="ml-auto px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-200 rounded text-xs">
              Tester View
            </button>
          </>
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="8" r="2" />
              <circle cx="16" cy="8" r="2" />
              <circle cx="8" cy="16" r="2" />
              <circle cx="16" cy="16" r="2" />
            </svg>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeItem === item.id
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={() => handleMenuItemClick(item.id)}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Toggle Button */}
      <button 
        onClick={onToggleCollapse}
        className="p-4 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
      >
        <svg 
          className={`w-6 h-6 transition-transform ${collapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
}
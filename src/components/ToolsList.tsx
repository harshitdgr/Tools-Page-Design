import { ToolType } from '../App';

interface ToolsListProps {
  onToolSelect: (tool: ToolType) => void;
}

export function ToolsList({ onToolSelect }: ToolsListProps) {
  const tools = [
    {
      id: '3gpp-band-info' as const,
      title: '3GPP NR and LTE Band Info',
      description: 'View comprehensive information about 3GPP NR and LTE frequency bands',
      icon: '📡',
      color: 'bg-blue-500',
    },
    {
      id: 'radio-frontend' as const,
      title: 'Configure Radio Frontend',
      description: 'Configure and manage radio frontend parameters and settings',
      icon: '⚙️',
      color: 'bg-purple-500',
    },
    {
      id: 'health-check' as const,
      title: 'Health Check Containers',
      description: 'Monitor and check the health status of all system containers',
      icon: '🏥',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Select a tool to get started. These tools help you manage and configure your system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all group"
          >
            <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform`}>
              {tool.icon}
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {tool.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tool.description}
            </p>
            <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open tool</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
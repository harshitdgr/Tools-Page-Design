import { Mail, Phone, MessageCircle, FileText, Search, HelpCircle } from 'lucide-react';

export function Support() {
  return (
    <div className="h-full overflow-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-lg p-8 mb-6 text-white">
        <h1 className="text-3xl mb-2">Support Center</h1>
        <p className="text-blue-100 dark:text-blue-200">Get help and support for SIMNOVUS platform</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search for help articles, FAQs, or topics..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-gray-900 dark:text-gray-100 mb-2">Documentation</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Browse our comprehensive guides and API documentation</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
            <HelpCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-gray-900 dark:text-gray-100 mb-2">FAQs</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Find answers to frequently asked questions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-gray-900 dark:text-gray-100 mb-2">Live Chat</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Chat with our support team in real-time</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-gray-900 dark:text-gray-100 mb-2">Email Support</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Send us an email and we'll respond within 24 hours</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Contact Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone Support</p>
              <p className="text-gray-900 dark:text-gray-100">+1 (555) 123-4567</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Monday - Friday, 9:00 AM - 5:00 PM EST</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email Support</p>
              <p className="text-gray-900 dark:text-gray-100">support@simnovus.com</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Response time: Within 24 hours</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Support</p>
              <p className="text-gray-900 dark:text-gray-100">emergency@simnovus.com</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Available 24/7 for critical issues</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-gray-900 dark:text-gray-100 mb-4">Submit a Ticket</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Brief description of your issue"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option>Technical Issue</option>
                <option>Feature Request</option>
                <option>Bug Report</option>
                <option>General Question</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                rows={4}
                placeholder="Provide detailed information about your issue"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Ticket
            </button>
          </form>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-gray-900 dark:text-gray-100 mb-4">Popular Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <h3 className="text-sm text-gray-900 dark:text-gray-100 mb-1">Getting Started with SIMNOVUS</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Learn the basics of setting up and using the platform</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <h3 className="text-sm text-gray-900 dark:text-gray-100 mb-1">Configuring RF Cards</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Step-by-step guide for RF card configuration</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <h3 className="text-sm text-gray-900 dark:text-gray-100 mb-1">Troubleshooting Common Issues</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Solutions to frequently encountered problems</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <h3 className="text-sm text-gray-900 dark:text-gray-100 mb-1">Understanding Test Results</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">How to interpret and analyze your test data</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <h3 className="text-sm text-gray-900 dark:text-gray-100 mb-1">API Integration Guide</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Connect SIMNOVUS with your existing systems</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <h3 className="text-sm text-gray-900 dark:text-gray-100 mb-1">Health Check Best Practices</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Optimize your system monitoring and health checks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
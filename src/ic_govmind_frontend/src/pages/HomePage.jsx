import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏛️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">GovMind AI</h1>
                <p className="text-sm text-slate-600">DAO Proposal Analysis Platform</p>
              </div>
            </Link>
            <nav className="flex space-x-4">
              <Link 
                to="/proposals" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                View Proposals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-4xl">🏛️</span>
          </div>
          
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">GovMind AI</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            An intelligent DAO governance platform powered by AI. Submit proposals, get detailed analysis, 
            and make informed decisions for your decentralized organization.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              to="/proposals" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <a 
              href="#features" 
              className="bg-white text-slate-800 px-8 py-4 rounded-xl border border-slate-300 hover:border-slate-400 transition-colors font-semibold text-lg"
            >
              Learn More
            </a>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-blue-600 text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">AI-Powered Analysis</h3>
              <p className="text-slate-600">
                Advanced AI analyzes proposals for risks, complexity, and impact to help you make informed decisions.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-green-600 text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Real-time Updates</h3>
              <p className="text-slate-600">
                Get instant notifications and real-time updates on proposal status and analysis results.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-purple-600 text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Secure & Decentralized</h3>
              <p className="text-slate-600">
                Built on Internet Computer blockchain for maximum security and decentralization.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; 2024 GovMind AI. Powered by Internet Computer.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage; 
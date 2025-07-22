import { Link } from 'react-router-dom';
import { 
  Brain, 
  Network, 
  Zap, 
  BarChart3, 
  TrendingDown, 
  Shield, 
  FileText, 
  Clock, 
  Globe, 
  Activity,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Rocket,
  BookOpen,
  Globe2,
  BrainCircuit
} from 'lucide-react';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="GovMind Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">GovMind</h1>
                <p className="text-sm text-slate-600">AI Mind for DAO</p>
              </div>
            </Link>
            <nav className="flex space-x-4">
              <a href="#features" className="text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors font-medium">
                Features
              </a>
              <a href="#solutions" className="text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors font-medium">
                Solutions
              </a>
              <Link 
                to="/sns-governance" 
                className="bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm"
              >
                Launch App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full animate-pulse"></span>
              <span className="text-blue-700 text-sm font-medium">Built on Internet Computer • AI-Powered • Multi-Chain</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-600">AI Mind</span><br />
              for Web3 Governance
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              GovMind transforms traditional DAOs into <strong className="text-slate-800">Intelligent DAOs (I-DAOs)</strong> with 
              AI-powered governance tools and seamless multi-chain infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                to="/sns-governance" 
                className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white px-8 py-4 rounded-xl hover:from-blue-800 hover:to-cyan-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <Rocket className="w-5 h-5" />
                <span>Try GovMind Beta</span>
              </Link>
              <a 
                href="#solutions" 
                className="bg-white text-slate-800 px-8 py-4 rounded-xl border-2 border-slate-300 hover:border-cyan-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 font-semibold text-lg flex items-center space-x-2"
              >
                <BookOpen className="w-5 h-5" />
                <span>Learn More</span>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
                <div className="text-sm text-slate-600">Blockchain Networks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-600 mb-2">AI</div>
                <div className="text-sm text-slate-600">Powered Analysis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">24/7</div>
                <div className="text-sm text-slate-600">Autonomous Governance</div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">
                Traditional DAOs Are <span className="text-red-400">Broken</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Most DAOs struggle with fundamental governance challenges that prevent them from reaching their full potential.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/50">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                  <TrendingDown className="text-red-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Low Participation</h3>
                <p className="text-slate-400">Less than 10% voting rates in most DAOs. Critical decisions made by a tiny minority.</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/50">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="text-orange-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">High Barriers</h3>
                <p className="text-slate-400">Complex governance rules and processes that alienate non-technical members.</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/50">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="text-red-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Poor Proposals</h3>
                <p className="text-slate-400">Unstructured, low-quality proposals that lack proper analysis and context.</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/50">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="text-blue-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Slow Processes</h3>
                <p className="text-slate-400">Weeks-long governance cycles that can't adapt to fast-moving Web3 environment.</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/50">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="text-cyan-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Chain Silos</h3>
                <p className="text-slate-400">Isolated governance across different blockchains with no coordination.</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/50">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="text-green-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Insights</h3>
                <p className="text-slate-400">Zero feedback loops or analytics to learn from governance decisions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section id="solutions" className="py-20 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                  Introducing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600">Intelligent DAOs</span>
                </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                GovMind provides a comprehensive dual-engine solution to transform any DAO into an intelligent, autonomous organization.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Engine 1 */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
                    <Network className="text-white text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Cross-Chain DAO Engine</h3>
                    <p className="text-slate-600">Build & manage DAOs across multiple blockchains</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="text-blue-600 text-sm" />
                    </span>
                    <div>
                      <strong>One-Click DAO Creation</strong> - Deploy on Ethereum, Bitcoin, Solana, ICP & more
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="text-blue-600 text-sm" />
                    </span>
                    <div>
                      <strong>Multi-Chain Treasury</strong> - Unified management of ckBTC, ckETH, USDC assets
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="text-blue-600 text-sm" />
                    </span>
                    <div>
                      <strong>Flexible Governance</strong> - Customizable voting rules, roles, and processes
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="text-blue-600 text-sm" />
                    </span>
                    <div>
                      <strong>Lifecycle Management</strong> - Member onboarding, permissions, and transitions
                    </div>
                  </li>
                </ul>
              </div>

              {/* Engine 2 */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Brain className="text-white text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">AI Governance Engine</h3>
                    <p className="text-slate-600">Intelligent tools for smarter governance</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="text-purple-600 text-sm" />
                    </span>
                    <div>
                      <strong>AI Proposal Builder</strong> - Generate structured proposals from natural language
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="text-purple-600 text-sm" />
                    </span>
                    <div>
                      <strong>Smart Analysis</strong> - Risk assessment, complexity scoring, and impact prediction
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="text-purple-600 text-sm" />
                    </span>
                    <div>
                      <strong>Debate Simulation</strong> - Preview community reactions before proposal submission
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="text-purple-600 text-sm" />
                    </span>
                    <div>
                      <strong>AI Delegate Voting</strong> - Autonomous voting based on your preferences
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Powerful Features for Modern DAOs
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                From AI-powered analysis to cross-chain automation, GovMind provides everything needed for intelligent governance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Brain className="text-white text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Analysis</h3>
                <p className="text-slate-600 text-sm">Deep proposal analysis with risk assessment and success prediction</p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Network className="text-white text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Multi-Chain</h3>
                <p className="text-slate-600 text-sm">Deploy and manage across 10+ blockchain networks seamlessly</p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-700 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Zap className="text-white text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Automation</h3>
                <p className="text-slate-600 text-sm">Automated execution and autonomous governance processes</p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="text-white text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Analytics</h3>
                <p className="text-slate-600 text-sm">Comprehensive governance insights and reputation scoring</p>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Teaser */}
        <section className="py-20 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">The Future of DAO Governance</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              We're building towards a future where DAOs are truly autonomous, intelligent, and efficient. 
              Join us in creating the next generation of decentralized organizations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex justify-center mb-4">
                  <Rocket className="text-white text-4xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Phase 1: Foundation</h3>
                <p className="text-slate-300 text-sm">Core AI governance tools and DAO creation engine</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex justify-center mb-4">
                  <Globe2 className="text-white text-4xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Phase 2: Expansion</h3>
                <p className="text-slate-300 text-sm">Multi-chain support and advanced AI features</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex justify-center mb-4">
                  <BrainCircuit className="text-white text-4xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Phase 3: Evolution</h3>
                <p className="text-slate-300 text-sm">Full autonomy and ecosystem decentralization</p>
              </div>
            </div>

            <Link 
              to="/sns-governance" 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-colors font-semibold text-lg inline-flex items-center space-x-2"
            >
              <span>Start Building the Future</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-t border-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="GovMind Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">GovMind</h3>
                  <p className="text-slate-400">AI Mind for DAO</p>
                </div>
              </div>
              <p className="text-slate-400 max-w-md">
                Transforming traditional DAOs into Intelligent DAOs with AI-powered governance tools 
                and seamless multi-chain infrastructure.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
                <li><Link to="/sns-governance" className="hover:text-white transition-colors">Try Beta</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white transition-colors">Internet Computer</span></li>
                <li><span className="hover:text-white transition-colors">AI & Machine Learning</span></li>
                <li><span className="hover:text-white transition-colors">Cross-Chain</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 GovMind. Built on Internet Computer. Powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage; 
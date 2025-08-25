# GovMind Architecture Diagram

This document contains the comprehensive architecture diagram for the GovMind decentralized DAO operating system.

## System Architecture

```mermaid
graph TB
    %% External Users and Systems
    subgraph "External Layer"
        U[Users/DAO Members]
        AI[AI Services<br/>DeepSeek/OpenAI]
        BC["Blockchain Networks<br/>Ethereum, Solana, Bitcoin, TON"]
        SNS["SNS Governance<br/>Canisters"]
        II[Internet Identity]
    end

    %% Frontend Layer
    subgraph "Frontend Layer"
        WEB["React Frontend<br/>Vite + TypeScript<br/>TailwindCSS"]
        AUTH["Authentication<br/>Internet Identity"]
        QUERY["React Query<br/>State Management"]
    end

    %% API Proxy Layer
    subgraph "API Proxy Layer"
        PROXY["Node.js API Proxy<br/>Express Server<br/>Rate Limiting & Security"]
    end

    %% Internet Computer Protocol Layer
    subgraph "Internet Computer Protocol"
        %% Core Canisters
        subgraph "Core Canisters"
            FACTORY["Factory Canister<br/>DAO Creation & Management<br/>Cross-chain Asset Support"]
            BACKEND["Backend Canister<br/>Core DAO Logic<br/>Member Management<br/>Treasury Operations"]
            ANALYZER["Proposal Analyzer<br/>AI-Powered Analysis<br/>Risk Assessment<br/>Complexity Scoring"]
            SNS_INT["SNS Integration<br/>Governance Sync<br/>Proposal Aggregation"]
        end

        %% Shared Components
        subgraph "Shared Components"
            TYPES["Shared Types<br/>Common Data Structures"]
            LEDGER["ICRC-1 Ledger<br/>Token Management"]
            EVM_RPC["EVM RPC<br/>Cross-chain Communication"]
        end
    end

    %% Data Flow Connections
    U --> WEB
    WEB --> AUTH
    WEB --> QUERY
    AUTH --> II
    
    WEB --> FACTORY
    WEB --> BACKEND
    WEB --> ANALYZER
    WEB --> SNS_INT
    
    ANALYZER --> PROXY
    PROXY --> AI
    
    FACTORY --> BACKEND
    BACKEND --> ANALYZER
    BACKEND --> SNS_INT
    BACKEND --> LEDGER
    
    SNS_INT --> SNS
    BACKEND --> BC
    EVM_RPC --> BC
    
    %% Shared dependencies
    FACTORY -.-> TYPES
    BACKEND -.-> TYPES
    ANALYZER -.-> TYPES
    SNS_INT -.-> TYPES
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef canister fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef proxy fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef shared fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class WEB,AUTH,QUERY frontend
    class FACTORY,BACKEND,ANALYZER,SNS_INT canister
    class U,AI,BC,SNS,II external
    class PROXY proxy
    class TYPES,LEDGER,EVM_RPC shared
```

## Component Details

### Frontend Layer
- **React Frontend**: Modern web application built with React 18, TypeScript, and TailwindCSS
- **Authentication**: Internet Identity integration for secure user authentication
- **State Management**: React Query for efficient data fetching and caching

### API Proxy Layer
- **Node.js Proxy**: Express.js server handling AI API calls with security and rate limiting
- **Security Features**: CORS, Helmet, compression, and rate limiting
- **AI Integration**: Supports DeepSeek and OpenAI APIs for proposal analysis

### Core Canisters
- **Factory Canister**: Handles DAO creation, management, and cross-chain asset support
- **Backend Canister**: Core DAO logic, member management, and treasury operations
- **Proposal Analyzer**: AI-powered proposal analysis with complexity scoring and risk assessment
- **SNS Integration**: Synchronizes with SNS governance canisters and aggregates proposals

### Shared Components
- **Shared Types**: Common data structures and type definitions
- **ICRC-1 Ledger**: Token management following ICRC-1 standards
- **EVM RPC**: Cross-chain communication with Ethereum and other EVM-compatible networks

## Data Flow

1. **User Interaction**: Users interact with the React frontend through Internet Identity authentication
2. **DAO Operations**: Frontend communicates with core canisters for DAO management and operations
3. **AI Analysis**: Proposal analyzer uses the API proxy to communicate with external AI services
4. **Cross-chain Integration**: Backend canister and EVM RPC handle multi-blockchain operations
5. **Governance Sync**: SNS integration canister synchronizes with external governance systems

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite build tool
- TailwindCSS for styling
- React Query for state management
- Chart.js for data visualization
- Lucide React for icons

### Backend (Canisters)
- Rust programming language
- Internet Computer SDK (ic-cdk)
- Candid for interface definitions
- Stable structures for data persistence
- ICRC-1 standards for token operations

### API Proxy
- Node.js with Express.js
- Security middleware (Helmet, CORS)
- Rate limiting and compression
- Environment-based configuration

### External Integrations
- Internet Identity for authentication
- AI services (DeepSeek, OpenAI) for proposal analysis
- Multiple blockchain networks (Ethereum, Solana, Bitcoin, TON)
- SNS governance canisters for proposal aggregation

## Deployment Architecture

```mermaid
graph LR
    subgraph "Development"
        DEV["Local dfx replica<br/>localhost:4943"]
        PROXY_DEV["API Proxy<br/>localhost:3001"]
        FRONTEND_DEV["Frontend Dev Server<br/>localhost:3000"]
    end
    
    subgraph "Production"
        IC["Internet Computer<br/>Mainnet"]
        PROXY_PROD["API Proxy<br/>Production Server"]
        CDN["Frontend<br/>IC Asset Canister"]
    end
    
    DEV --> IC
    PROXY_DEV --> PROXY_PROD
    FRONTEND_DEV --> CDN
    
    classDef dev fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef prod fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    
    class DEV,PROXY_DEV,FRONTEND_DEV dev
    class IC,PROXY_PROD,CDN prod
```

This architecture provides a scalable, secure, and decentralized platform for DAO governance with AI-powered analysis and cross-chain capabilities.
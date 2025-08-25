# `GovMind` — Autonomous Intelligence Layer for DAO Governance

**GovMind** is an advanced multi-chain governance infrastructure built on the **Internet Computer (ICP)**. It combines two powerful engines:

- 🔧 **Cross-Chain DAO Management Engine**  
- 🤖 **AI-Powered Governance Toolkit**

Together, they enable Web3 communities to create and operate **Intelligent DAOs (I-DAOs)** — organizations that can **govern autonomously, collaborate across chains, and scale with AI augmentation**.

Visit us at [GovMind](https://app.govmind.info)

---

## 🌐 Project Overview

In today’s DAO ecosystems, governance often suffers from low participation, poor proposal quality, complex rules, and disconnected multi-chain environments. **GovMind** introduces a dual-engine architecture to solve these structural issues:

### 🔧 Cross-Chain DAO Engine

- **Deploy DAOs on Ethereum, Bitcoin, Solana, ICP, TON, and more**
- Modular templates: foundation-style, committee-style, operations-style
- On-chain asset treasury (supporting ckBTC, ckETH, USDC, etc.)
- Customizable governance rules (e.g., voting thresholds, token-weighted voting)
- Full DAO lifecycle support: member onboarding, permissions, role transitions

### 🤖 AI Governance Toolkit

- **Proposal summarization, quality analysis, and structure generation via LLMs**
- **Debate simulation**: simulate support/opposition viewpoints before submission
- **AI delegate voting**: agents vote on behalf of users based on governance strategy
- **Cross-chain governance data analysis**: monitor DAO sentiment & vote patterns
- **Governance Reputation Score (GRS)**: on-chain user behavior scoring system
- **On-chain automation**: automatically execute passed proposals via canister agents

GovMind is not just a tool—it is a **decentralized operating system for DAOs**, ushering in a new era of **scalable, intelligent, and composable Web3 governance**.

### 🗺️ Product Roadmap: From Hackathon to Ecosystem (Two-Year Plan)

Our roadmap is an ambitious, phased strategy aimed at evolving GovMind from an innovative hackathon concept into a mature, self-sustaining, and network-effect-driven ecosystem.

#### Phase 1: Hackathon MVP & Core Validation (Months 1-4)

* **Overall Narrative: The "I-DAO" Genesis**

* **Core Goal:** Rapidly validate the core closed-loop of "One-Click DAO Creation + AI Analysis," demonstrating GovMind's "magic moment" and proving the feasibility of the project's core potential. This phase focuses on building the foundational elements and showcasing key innovations across four development rounds:

    * **The Spark of Creation:** Demonstrating the ability to create a DAO from scratch, including DAO Factory Canister deployment, basic dashboard, and initial AI proposal analysis (MVP).

    * **The AI Co-Pilot:** Enhancing intelligence by introducing a Generative Proposal Builder, AI-Powered Debate Simulator, and a comprehensive Proposal Template Library.

    * **The Bridge to Web3:** Establishing multi-chain capabilities through external DAO monitoring (e.g., Snapshot integration) and a Unified Governance Analysis Layer for cross-chain insights.

    * **The Autonomous Agent:** Fulfilling the promise of intelligent autonomy with AI Delegate Voting, an On-Chain Action Module, and robust Governance History & Traceability.

* **Key Deliverables:** A fully demonstrable, end-to-end MVP showcasing DAO creation, AI-assisted decision-making, initial cross-chain awareness, and the foundation for automated execution.

#### Phase 2: Productization & Market Validation (Months 5-9)

* **Theme:** From Prototype to Product

* **Core Goal:** Refine hackathon-validated prototypes into stable, reliable, and usable products, acquire the first batch of seed users, and validate the business model.

* **Key Deliverables:**

    * Deepen AI Governance Suite with richer analysis dimensions (sentiment, controversy, success prediction) and official launch of Generative Proposal Builder and AI Delegate Voting.

    * Launch the MVP of the "Cross-Chain DAO Creation & Management Engine," initially focusing on the ICP ecosystem with modular governance templates, member role management, and robust multi-sig treasury using ckBTC/ckETH.

    * Acquire 5-10 pilot users (prominent DAOs or emerging projects) for rapid iteration based on feedback.

* **Success Criteria:** Platform successfully creates and operates over 10 DAOs, manages over $100,000 in Total Assets Under Management (AUM), with over 100 real governance participants using the AI delegate feature.

#### Phase 3: Scaling & Network Effects (Months 10-18)

* **Theme:** Scaling & Network Effects

* **Core Goal:** Achieve exponential growth in user and managed asset scale, and build network effects through unique platform features to solidify our moat.

* **Key Deliverables:**

    * Implement full multi-chain support for the Creation Engine, expanding one-click DAO creation to mainstream public chains like Ethereum and Solana using Chain-Key and Threshold ECDSA.

    * Launch Governance Reputation Score (GRS) based on on-chain/cross-chain governance activities, serving as a foundation for advanced governance models.

    * Open GovMind API, allowing third-party applications (wallets, aggregators, data analysis platforms) to integrate GovMind's AI analysis and GRS capabilities, transforming GovMind into a platform.

* **Success Criteria:** Platform manages over $5 million in total assets, boasts over 10,000 monthly active governance users, and has at least one mainstream wallet or governance aggregator integrated with the GovMind API.

#### Phase 4: Decentralization & Ecosystem Building (Months 19-24)

* **Theme:** Decentralization & Ecosystem

* **Core Goal:** Transform GovMind itself into a community-driven, self-sustaining decentralized protocol, completing the ultimate value loop.

* **Key Deliverables:**

    * Issue the $GOV governance token for the platform's own decentralized governance (e.g., deciding on AI models, new chain integrations, fee parameters).

    * Establish a value capture mechanism for the $GOV token (e.g., staking for service fee sharing, API payment/discount).

    * Launch GovMind Ecosystem Fund, injecting protocol revenue into a community

---

## 🛠️ Key Technologies

| Technology | Purpose |
|------------|---------|
| **Internet Computer (ICP)** | Fully on-chain infrastructure with native HTTPS API support (HTTP Outcalls) |
| **Canister Architecture** | Modular components for AI analysis, data orchestration, DAO logic |
| **Chain-Key Technology** | Native control of Bitcoin, Ethereum assets without bridges |
| **Internet Identity** | Web3 login without wallets or seed phrases |
| **OpenAI API (via HTTP Outcall)** | On-chain proposal analysis and summarization |
| **ICP Timers** | Scheduled AI delegate voting and proposal scanning |
| **Stable Memory** | Persistent proposal data, user settings, and AI outputs |

---

## Project Architecture

See [Architecture Diagram](architecture-diagram.md)

### 🚀 Getting Started

To experience GovMind's magic, follow these steps:

1. Clone the repository:

```
git clone https://github.com/gov-mind/ic_govmind.git
cd ic_govmind
```

2. Start your local Internet Computer replica:

```
dfx start --clean --background
```

3. Deploy the canisters

```
scripts/deploy.sh
```

4. Start the frontend:
```
cp src/ic_govmind_frontend/.env.example src/ic_govmind_frontend/.env
vim src/ic_govmind_frontend/.env 
# Add your DeepSeek API key to the file

npm start
```

5. Access the frontend: Your frontend will be served at http://localhost:3000/ (or a similar address). Open this in your browser.

6. Create your first I-DAO: Use the provided form to define your DAO's name, token, and governance rules.

7. Witness AI in action: Submit a proposal and observe the AI analysis results appearing dynamically.

### OnLine Demo

#### Frontend canister via browser:

ic_govmind_frontend: https://2dp5b-iiaaa-aaaaj-qnrua-cai.icp0.io/

#### Backend canister via Candid interface:

ic_govmind_factory: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=3ja73-kyaaa-aaaaj-qnrta-cai

ic_govmind_proposal_analyzer: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=3obzp-haaaa-aaaaj-qnrtq-cai

ic_govmind_sns: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=7dq5v-uaaaa-aaaaj-qnrjq-cai

### 🤝 Contributing
We welcome contributions from the community! Feel free to open issues, submit pull requests, or join our discussions.

### 📄 License
This project is licensed under the GNU License.

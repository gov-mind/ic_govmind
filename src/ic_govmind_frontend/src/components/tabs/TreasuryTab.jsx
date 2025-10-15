import React, { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  AlertTriangle,
  Send,
  Download,
  Copy,
  Check,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import { useAuthClient } from "../../hooks/useAuthClient";
import { createActor as createBackendActor } from "declarations/ic_govmind_backend";
import { useTokenPrices } from "../../hooks/useTokenPrices";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// Small reusable badge to indicate mock data
function MockBadge({ className = "", label = "Mock Data" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 shadow-sm ${className}`}
    >
      {label}
    </span>
  );
}

function TreasuryPerformanceChart({ data, showMock = false }) {
  const chartData = {
    labels: (data?.performanceHistory || []).map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }),
    datasets: [
      {
        label: "Treasury Value",
        data: (data?.performanceHistory || []).map((item) => item.value),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#3b82f6",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            return `$${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { color: "#f1f5f9" },
        ticks: { color: "#64748b", maxTicksLimit: 8 },
      },
      y: {
        display: true,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#64748b",
          callback: function (value) {
            return "$" + (value / 1000).toFixed(0) + "K";
          },
        },
      },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  };

  return (
    <div className="relative" style={{ width: "100%", height: "250px" }}>
      {showMock && <MockBadge className="absolute top-2 right-2" />}
      <Line data={chartData} options={options} />
    </div>
  );
}

function TreasuryAllocationChart({ data, showMock = false }) {
  const assets = data?.assets || [];
  const chartData = {
    labels: assets.map((asset) => asset.chain),
    datasets: [
      {
        data: assets.map((asset) => asset.percentage),
        backgroundColor: assets.map((asset) => asset.color || "#64748b"),
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#64748b",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const asset = assets[context.dataIndex];
            return `${asset.chain}: ${asset.percentage}% ($${(
              asset.usdValue || 0
            ).toLocaleString()})`;
          },
        },
      },
    },
  };

  return (
    <div className="relative" style={{ width: "100%", height: "200px" }}>
      {showMock && <MockBadge className="absolute top-2 right-2" />}
      <Pie data={chartData} options={options} />
    </div>
  );
}

function AITreasuryAnalysis({ data }) {
  const assets = data?.assets || [];
  const totalBalance = data?.totalBalance || {
    usd: 0,
    change: { percentage: 0 },
  };

  const calculateHealthScore = () => {
    let score = 10;
    const maxAllocation = assets.length
      ? Math.max(...assets.map((a) => a.percentage || 0))
      : 0;
    if (maxAllocation > 70) score -= 2;
    else if (maxAllocation > 50) score -= 1;
    if ((totalBalance.change?.percentage || 0) > 10) score += 0.5;
    else if ((totalBalance.change?.percentage || 0) < 0) score -= 1;
    return Math.max(1, Math.min(10, score)).toFixed(1);
  };

  const healthScore = calculateHealthScore();
  const maxAsset = assets.reduce(
    (max, a) => ((a.percentage || 0) > (max.percentage || 0) ? a : max),
    assets[0] || { chain: "N/A", percentage: 0 }
  );
  const growthPercentage = totalBalance.change?.percentage || 0;

  const getHealthColor = (score) => {
    const s = Number(score);
    if (s >= 8)
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        badge: "bg-emerald-100 text-emerald-700",
      };
    if (s >= 6)
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        badge: "bg-amber-100 text-amber-700",
      };
    return {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    };
  };

  const healthColors = getHealthColor(healthScore);

  return (
    <div
      className={`${healthColors.bg} ${healthColors.border} border rounded-xl overflow-hidden relative`}
    >
      <MockBadge className="absolute top-2 right-2" />
      <div className="bg-white/60 backdrop-blur-sm px-6 py-4 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900">
                AI Treasury Analysis
              </h4>
              <p className="text-sm text-slate-500">
                Real-time insights powered by AI
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm text-slate-600 font-medium">
                Health Score
              </span>
              <span className={`text-2xl font-bold ${healthColors.text}`}>
                {healthScore}
              </span>
              <span className="text-lg text-slate-400 font-medium">/10</span>
            </div>
            <span
              className={`text-xs px-3 py-1 ${healthColors.badge} rounded-full font-medium`}
            >
              {Number(healthScore) >= 8
                ? "Excellent"
                : Number(healthScore) >= 6
                ? "Good"
                : "Needs Attention"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm">📈</span>
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-slate-900 mb-1">
                  Key Insight
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Treasury grew by{" "}
                  <span className="font-medium text-green-600">
                    +{growthPercentage}%
                  </span>{" "}
                  this period, driven by strong {maxAsset.chain} performance.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-600 text-sm">⚠️</span>
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-slate-900 mb-1">
                  Risk Alert
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-medium text-amber-600">
                    {maxAsset.percentage}%
                  </span>{" "}
                  concentrated in {maxAsset.chain}. Consider diversification.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-sm">💡</span>
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-slate-900 mb-1">
                  Opportunity
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Staking idle assets could yield{" "}
                  <span className="font-medium text-purple-600">
                    ~${((totalBalance.usd || 0) * 0.06).toLocaleString()}
                  </span>{" "}
                  annually.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TreasuryTab({
  dao,
  treasuryData,
  transactions = [],
  transactionsLoading,
  transactionsError,
  formatDate,
  scaleByDecimals,
  daoWalletAddresses,
  tokenBalances,
  daoTreasuryBalancesLoading,
  balancesError,
  addressesLoading,
  addressesError,
}) {
  const { agent } = useAuthClient();

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");

  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receiveAsset, setReceiveAsset] = useState(null);
  const [copied, setCopied] = useState(false);

  const data = treasuryData || {};
  const assets = data.assets || [];
  const stats = data.stats || {};
  const totalBalanceUsd = data?.totalBalance?.usd ?? 0;
  const changePct = data?.totalBalance?.change?.percentage ?? 0;
  const changeDir = data?.totalBalance?.change?.direction ?? "up";
  const txs =
    transactions && transactions.length
      ? transactions
      : data.transactions || [];
  const showMockTag = true;

  // Previous-layout metrics (if provided)
  const tvl = data?.tvl;
  const inflow24h = data?.inflow24h;
  const outflow24h = data?.outflow24h;
  const tokenPrice = data?.tokenPrice;
  const symbol = dao?.base_token?.symbol || "TOK";

  // Token balances (live) for ICP, DAO token, BTC, ETH, USDT
  const decimalsMap = {
    ICP: 8,
    DAO: Number(dao?.base_token?.decimals ?? 8),
    BTC: 8,
    ETH: 18,
    USDT: 6,
  };

  const tokenDefs = [
    {
      key: "icp",
      symbol: "ICP",
      tokenName: "ICP",
      chain: "Internet Computer",
      decimals: decimalsMap.ICP,
    },
    {
      key: "dao",
      symbol: dao?.base_token?.symbol || "DAO",
      tokenName: dao?.base_token?.name || "DAO",
      chain: "Internet Computer",
      decimals: decimalsMap.DAO,
    },
    {
      key: "btc",
      symbol: "BTC",
      tokenName: "BTC",
      chain: "Bitcoin",
      decimals: decimalsMap.BTC,
    },
    {
      key: "eth",
      symbol: "ETH",
      tokenName: "ETH",
      chain: "Ethereum",
      decimals: decimalsMap.ETH,
    },
    {
      key: "usdt",
      symbol: "USDT",
      tokenName: "USDT",
      chain: "Ethereum",
      decimals: decimalsMap.USDT,
    },
  ];

  const liveBalanceItems = tokenDefs.map((td) => {
    const nat = tokenBalances?.[td.key] ?? 0n;
    const amount =
      typeof nat === "bigint"
        ? scaleByDecimals(nat, td.decimals)
        : Number(nat || 0);
    return { ...td, amount, baseUnits: nat };
  });

  // Group balances by chain to avoid repeating chain labels
  const groupedByChain = liveBalanceItems.reduce((acc, item) => {
    (acc[item.chain] = acc[item.chain] || []).push(item);
    return acc;
  }, {});
  const preferredChainOrder = ["Internet Computer", "Bitcoin", "Ethereum"];
  const orderedChains = [
    ...preferredChainOrder.filter(
      (c) => groupedByChain[c] && groupedByChain[c].length > 0
    ),
    ...Object.keys(groupedByChain)
      .filter((c) => !preferredChainOrder.includes(c))
      .sort(),
  ];

  const isBalancesLoading = !!(daoTreasuryBalancesLoading || addressesLoading);
  const hasBalancesError = !!(balancesError || addressesError);

  // Frontend USD prices for common tokens and DAO base token
  const { data: prices = {} } = useTokenPrices(["ICP", "BTC", "ETH", "USDT"]);
  const daoSymbol = dao?.base_token?.symbol || "DAO";

  // Build assets table items from live balances and prices
  const itemsForTable = liveBalanceItems.map((item) => {
    const symbolPrice =
      item.symbol === daoSymbol
        ? typeof tokenPrice === "number" ? tokenPrice : null
        : prices[item.symbol];
    const usdValue =
      typeof symbolPrice === "number"
        ? Number(item.amount) * symbolPrice
        : null;
    return { ...item, usdValue };
  });

  const totalUsd = itemsForTable.reduce(
    (acc, it) => acc + (typeof it.usdValue === "number" ? it.usdValue : 0),
    0
  );

  const itemsWithAllocation = itemsForTable.map((it) => ({
    ...it,
    percentage:
      typeof it.usdValue === "number" && totalUsd > 0
        ? (it.usdValue / totalUsd) * 100
        : 0,
  }));

  // Address display fallbacks
  const icpOwnerText = (() => {
    try {
      const owner = daoWalletAddresses?.icrc1?.owner;
      if (owner && typeof owner.toText === "function") {
        return owner.toText();
      }
    } catch (_) {}
    return null;
  })();

  // Handlers for transfer flow
  const openTransfer = (asset) => {
    setSelectedAsset(asset);
    setRecipient("");
    setTransferAmount("");
    setTransferError("");
    setTransferSuccess("");
    setIsTransferOpen(true);
  };

  const closeTransfer = () => {
    setIsTransferOpen(false);
    setSelectedAsset(null);
    setRecipient("");
    setTransferAmount("");
    setTransferError("");
    setTransferSuccess("");
    setTransferLoading(false);
  };

  const getReceiveAddressForAsset = (asset) => {
    if (!asset) return "";
    if (asset.chain === "Internet Computer") {
      try {
        const owner = daoWalletAddresses?.icrc1?.owner;
        if (owner && typeof owner.toText === "function") {
          return owner.toText();
        }
      } catch (_) {}
      return icpOwnerText || "";
    } else if (asset.chain === "Bitcoin") {
      return daoWalletAddresses?.bitcoin || "";
    } else if (asset.chain === "Ethereum") {
      return daoWalletAddresses?.ethereum || "";
    }
    return "";
  };

  const openReceive = (asset) => {
    setReceiveAsset(asset);
    setIsReceiveOpen(true);
  };

  const closeReceive = () => {
    setIsReceiveOpen(false);
    setReceiveAsset(null);
  };

  const handleCopyReceiveAddress = async () => {
    try {
      const addr = getReceiveAddressForAsset(receiveAsset);
      if (!addr) return;
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // no-op: clipboard may be unavailable
    }
  };

  // Convert a decimal string to base units (BigInt) with the given decimals
  const toUnits = (value, decimals) => {
    const s = String(value).trim();
    if (!s) throw new Error("Amount is required");
    const parts = s.split(".");
    if (parts.length > 2) throw new Error("Invalid amount");
    const whole = parts[0] === "" ? "0" : parts[0];
    const frac = (parts[1] || "").replace(/[^0-9]/g, "");
    if (!/^\d+$/.test(whole) || !/^\d*$/.test(frac))
      throw new Error("Invalid amount");
    if (frac.length > decimals)
      throw new Error(`Too many decimal places (max ${decimals})`);
    const base = BigInt(10) ** BigInt(decimals);
    const wholeBI = BigInt(whole || "0");
    const fracBI = BigInt((frac || "").padEnd(decimals, "0") || "0");
    return wholeBI * base + fracBI;
  };

  const submitTransfer = async () => {
    if (!selectedAsset) return;
    try {
      setTransferError("");
      setTransferSuccess("");

      if (!agent) throw new Error("Not authenticated. Please log in.");
      if (!dao?.id) throw new Error("DAO canister ID missing.");
      if (!recipient || recipient.trim().length === 0)
        throw new Error("Recipient address is required");

      // Parse amount and validate balance
      const amountUnits = toUnits(transferAmount, selectedAsset.decimals);
      if (amountUnits <= 0n) throw new Error("Amount must be greater than 0");
      if (
        typeof selectedAsset.baseUnits === "bigint" &&
        amountUnits > selectedAsset.baseUnits
      ) {
        throw new Error("Amount exceeds available balance");
      }

      // Determine chain variant and wallet address/subaccount
      let chain_type;
      let wallet_address = "";
      let wallet_subaccount = [];
      if (selectedAsset.chain === "Internet Computer") {
        chain_type = { InternetComputer: null };
        // Prefer principal text for ICRC1 owner
        wallet_address =
          daoWalletAddresses?.icrc1?.owner &&
          typeof daoWalletAddresses.icrc1.owner.toText === "function"
            ? daoWalletAddresses.icrc1.owner.toText()
            : icpOwnerText || "";
        wallet_subaccount = daoWalletAddresses?.icrc1?.subaccount || [];
      } else if (selectedAsset.chain === "Bitcoin") {
        chain_type = { Bitcoin: null };
        wallet_address = daoWalletAddresses?.bitcoin || "";
        wallet_subaccount = [];
      } else if (selectedAsset.chain === "Ethereum") {
        chain_type = { Ethereum: null };
        wallet_address = daoWalletAddresses?.ethereum || "";
        wallet_subaccount = [];
      } else {
        throw new Error(`Unsupported chain: ${selectedAsset.chain}`);
      }

      if (!wallet_address)
        throw new Error("DAO wallet address not available for this chain");

      const daoActor = createBackendActor(dao.id, { agent });
      const arg = {
        chain_type,
        token_name: selectedAsset.tokenName,
        wallet_address,
        wallet_subaccount,
        recipient_address: recipient.trim(),
        recipient_subaccount: [],
        amount: amountUnits,
      };
      console.log(arg);

      setTransferLoading(true);
      const res = await daoActor.wallet_token_transfer(arg);
      setTransferLoading(false);

      if (res && "Ok" in res) {
        setTransferSuccess(`Transfer submitted: ${res.Ok}`);
      } else if (res && "Err" in res) {
        setTransferError(res.Err || "Transfer failed");
      } else {
        setTransferError("Unknown response from backend");
      }
    } catch (e) {
      setTransferLoading(false);
      setTransferError(e?.message || String(e));
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative">
          <MockBadge className="absolute top-2 right-2" />
          {tvl !== undefined ? (
            <>
              <div className="text-slate-500 text-sm">TVL</div>
              <div className="text-2xl font-bold text-slate-900">
                ${Number(tvl || 0).toLocaleString()}
              </div>
            </>
          ) : (
            <>
              <div className="text-slate-500 text-sm">Total Treasury</div>
              <div className="text-2xl font-bold text-slate-900">
                ${Number(totalBalanceUsd).toLocaleString()}
              </div>
              <div
                className={`mt-2 inline-flex items-center text-sm font-medium ${
                  changeDir === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {changeDir === "up" ? (
                  <ArrowDownRight className="w-4 h-4 mr-1 rotate-180" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                )}
                {changeDir === "up" ? "+" : ""}
                {changePct}%
              </div>
            </>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative">
          <MockBadge className="absolute top-2 right-2" />
          {inflow24h !== undefined ? (
            <>
              <div className="text-slate-500 text-sm">24h Inflow</div>
              <div className="flex items-center space-x-2">
                <ArrowDownRight className="w-4 h-4 text-green-500 rotate-180" />
                <div className="text-2xl font-bold text-slate-900">
                  {Number(inflow24h || 0).toLocaleString()} {symbol}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-slate-500 text-sm">Assets</div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.totalAssets ?? assets.length}
              </div>
            </>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative">
          <MockBadge className="absolute top-2 right-2" />
          {outflow24h !== undefined ? (
            <>
              <div className="text-slate-500 text-sm">24h Outflow</div>
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4 text-red-500" />
                <div className="text-2xl font-bold text-slate-900">
                  {Number(outflow24h || 0).toLocaleString()} {symbol}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-slate-500 text-sm">Active Chains</div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.activeChains ?? new Set(assets.map((a) => a.chain)).size}
              </div>
            </>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative">
          <MockBadge className="absolute top-2 right-2" />
          {tokenPrice !== undefined ? (
            <>
              <div className="text-slate-500 text-sm">Token Price</div>
              <div className="text-2xl font-bold text-slate-900">
                ${Number(tokenPrice || 0).toFixed(2)}
              </div>
            </>
          ) : (
            <>
              <div className="text-slate-500 text-sm">Monthly Growth</div>
              <div className="flex items-center space-x-2">
                <ArrowDownRight className="w-4 h-4 text-green-500 rotate-180" />
                <div className="text-2xl font-bold text-slate-900">
                  {(stats.monthlyGrowth ?? changePct).toLocaleString()}%
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      <AITreasuryAnalysis data={data} />

      {/* 3-Column Layout: Balances + Performance + Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Live Balances and DAO Wallet Addresses */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Treasury Balances
              </h3>
            </div>
            {isBalancesLoading ? (
              <div className="text-center py-10">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-600 text-sm">Loading balances...</p>
              </div>
            ) : hasBalancesError ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-slate-700 text-sm">
                  Failed to load balances.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderedChains.map((chain) => (
                  <div key={chain}>
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs mb-2">
                      {chain}
                    </div>
                    <div className="space-y-2">
                      {groupedByChain[chain].map((item) => (
                        <div
                          key={`${chain}-${item.symbol}`}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-slate-900">
                              {item.symbol}
                            </span>
                          </div>
                          <div className="flex items-center flex-1">
                            <span className="text-slate-900 font-semibold text-right w-full pr-2">
                              {item.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => openReceive(item)}
                              className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border border-transparent hover:border-emerald-200"
                              title={`Receive ${item.symbol}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openTransfer(item)}
                              className="p-1.5 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                              title={`Send ${item.symbol}`}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Performance Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Treasury Balance Over Time</span>
            </h3>
          </div>
          <TreasuryPerformanceChart data={data} showMock={showMockTag} />
        </div>

        {/* Column 3: Allocation */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Asset Allocation
          </h3>
          <TreasuryAllocationChart data={data} showMock={showMockTag} />
          <div className="mt-4 space-y-2">
            {assets.map((asset, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: asset.color || "#64748b" }}
                  />
                  <span className="text-slate-700">
                    {asset.chain} ({asset.symbol})
                  </span>
                </div>
                <div className="text-slate-600">{asset.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Assets</h3>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-slate-500 text-sm">
                <th className="py-2">Chain</th>
                <th className="py-2">Symbol</th>
                <th className="py-2">Amount</th>
                <th className="py-2">USD Value</th>
                <th className="py-2">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itemsWithAllocation.map((a) => (
                <tr key={`${a.chain}-${a.symbol}`} className="text-sm text-slate-700">
                  <td className="py-2">{a.chain}</td>
                  <td className="py-2">{a.symbol}</td>
                  <td className="py-2">{Number(a.amount || 0).toLocaleString()}</td>
                  <td className="py-2">
                    {typeof a.usdValue === "number" ? `$${a.usdValue.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-2">
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(100, Math.max(0, a.percentage || 0))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          <MockBadge />
        </div>
        <div className="p-6">
          {transactionsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading transactions...</p>
            </div>
          ) : transactionsError ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Error Loading Transactions
              </h3>
              <p className="text-slate-600">
                Failed to fetch treasury transactions.
              </p>
            </div>
          ) : txs && txs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-sm">
                    <th className="py-2">Type</th>
                    <th className="py-2">Asset</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">USD</th>
                    <th className="py-2">Time</th>
                    <th className="py-2">Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {txs.map((tx, idx) => (
                    <tr key={idx} className="text-sm text-slate-700">
                      <td className="py-2">{tx.type || "Transfer"}</td>
                      <td className="py-2">{tx.asset || "-"}</td>
                      <td className="py-2">
                        {(tx.amount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2">
                        ${(tx.usdValue ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2">
                        {tx.time ||
                          (tx.timestamp ? formatDate(tx.timestamp) : "-")}
                      </td>
                      <td className="py-2 font-mono">
                        {tx.hash
                          ? `${tx.hash.slice(0, 8)}...${tx.hash.slice(-8)}`
                          : tx.other_party
                          ? `${tx.other_party.slice(
                              0,
                              8
                            )}...${tx.other_party.slice(-8)}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-slate-600">No transactions found.</div>
          )}
        </div>
      </div>
      {/* Receive Modal */}
      {isReceiveOpen && receiveAsset && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">
                Receive {receiveAsset.symbol}
              </h4>
              <button
                onClick={() => {
                  setIsReceiveOpen(false);
                  setReceiveAsset(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Chain</div>
                <div className="text-slate-900 font-medium">
                  {receiveAsset.chain}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">
                  Receiving Address
                </div>
                {getReceiveAddressForAsset(receiveAsset) ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={getReceiveAddressForAsset(receiveAsset)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={handleCopyReceiveAddress}
                      className="p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                      title={copied ? "Copied" : "Copy to clipboard"}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    Address not available for this chain.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => {
                    setIsReceiveOpen(false);
                    setReceiveAsset(null);
                  }}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferOpen && selectedAsset && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl sm:max-w-3xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">
                Send {selectedAsset.symbol}
              </h4>
              <button
                onClick={closeTransfer}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter recipient address"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Amount ({selectedAsset.symbol})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder={`0.0`}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Decimals: {selectedAsset.decimals}
                </p>
              </div>

              {transferError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {transferError}
                </div>
              )}
              {transferSuccess && (
                <div className="text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 break-all">
                  {transferSuccess}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={closeTransfer}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={submitTransfer}
                  disabled={transferLoading}
                  className={`${
                    transferLoading
                      ? "bg-blue-300"
                      : "bg-blue-600 hover:bg-blue-700"
                  } px-4 py-2 rounded-lg text-white`}
                >
                  {transferLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

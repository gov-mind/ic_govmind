import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Users,
    Coins,
    Globe,
    Settings,
    Plus,
    X,
    CheckCircle,
    AlertCircle,
    Zap,
    Shuffle
} from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { useAuthClient } from '../hooks/useAuthClient';
import { createActor as createBackendActor } from 'declarations/ic_govmind_backend';

function CreateDaoPage() {
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        iconUrl: '',
        baseToken: {
                name: '',
                symbol: '',
                decimals: 8,
                totalSupply: '',
                canisterId: '',
                contractAddress: '',
                emissionRate: ''
            },
        chains: ['InternetComputer'],
        governance: {
            voteWeightType: 'TokenWeighted',
            approvalThreshold: 60,
            votingPeriodSecs: 604800, // 7 days
            quorum: 10
        },
        members: [
            {
                userId: '',
                role: 'Founder',
                reputation: 100,
                ethAddress: '',
                solAddress: '',
                icpPrincipal: '',
                joinedAt: Date.now(),
                metadata: [],
                distributionAmount: '',
                unlockSchedule: []
            }
        ]
    });

    const [errors, setErrors] = useState({});

    const { isAuthenticated, principal, login, factoryActor } = useAuthClient();

    const chainOptions = [
        { value: 'InternetComputer', label: 'Internet Computer', icon: '🌐' },
        { value: 'Ethereum', label: 'Ethereum', icon: '🔷' },
        { value: 'Solana', label: 'Solana', icon: '☀️' },
        { value: 'Bitcoin', label: 'Bitcoin', icon: '₿' },
        { value: 'BNBChain', label: 'BNB Chain', icon: '🟡' },
        { value: 'TON', label: 'TON', icon: '📱' }
    ];

    const roleOptions = [
        { value: 'Founder', label: 'Founder', description: 'Full control and ownership' },
        { value: 'Council', label: 'Council', description: 'Executive decision making' },
        { value: 'Contributor', label: 'Contributor', description: 'Active participation' },
        { value: 'Voter', label: 'Voter', description: 'Voting rights only' },
        { value: 'Observer', label: 'Observer', description: 'Read-only access' }
    ];

    const voteWeightTypes = [
        { value: 'OnePersonOneVote', label: 'One Person, One Vote', description: 'Democratic voting' },
        { value: 'TokenWeighted', label: 'Token Weighted', description: 'Voting power based on token holdings' },
        { value: 'ReputationWeighted', label: 'Reputation Weighted', description: 'Voting power based on reputation' }
    ];

    function isValidPrincipal(str) {
        try {
            const p = Principal.fromText(str);
            
            // Reject the anonymous principal
            if (p.isAnonymous && p.isAnonymous()) return false;
            return true;
        } catch {
            return false;
        }
    }

    function randomPrincipal() {
        const bytes = new Uint8Array(29);
        window.crypto.getRandomValues(bytes);
        return Principal.fromUint8Array(bytes).toText();
    }

    const validateStep = (step) => {
        const newErrors = {};

        switch (step) {
            case 1:
                if (!formData.name.trim()) newErrors.name = 'DAO name is required';
                if (!formData.baseToken.name.trim()) newErrors.tokenName = 'Token name is required';
                if (!formData.baseToken.symbol.trim()) newErrors.tokenSymbol = 'Token symbol is required';
                if (!formData.baseToken.totalSupply) newErrors.totalSupply = 'Total supply is required';
                if (parseInt(formData.baseToken.totalSupply) <= 0) newErrors.totalSupply = 'Total supply must be positive';
                break;
            case 2:
                if (formData.members.length === 0) newErrors.members = 'At least one member is required';
                if (!formData.members[0].userId.trim()) newErrors.founderId = 'Founder ID is required';
                break;
            case 3:
                if (formData.chains.length === 0) newErrors.chains = 'At least one chain is required';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleBaseTokenChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            baseToken: {
                ...prev.baseToken,
                [field]: value
            }
        }));
    };

    const handleGovernanceChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            governance: {
                ...prev.governance,
                [field]: value
            }
        }));
    };

    const handleChainToggle = (chain) => {
        setFormData(prev => ({
            ...prev,
            chains: prev.chains.includes(chain)
                ? prev.chains.filter(c => c !== chain)
                : [...prev.chains, chain]
        }));
    };

    const addMember = () => {
        setFormData(prev => ({
            ...prev,
            members: [...prev.members, {
                userId: '',
                role: 'Voter',
                reputation: 10,
                ethAddress: '',
                solAddress: '',
                icpPrincipal: '',
                joinedAt: Date.now(),
                metadata: [],
                distributionAmount: '',
                unlockSchedule: []
            }]
        }));
    };

    const removeMember = (index) => {
        if (formData.members.length > 1) {
            setFormData(prev => ({
                ...prev,
                members: prev.members.filter((_, i) => i !== index)
            }));
        }
    };

    const updateMember = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.map((member, i) =>
                i === index ? { ...member, [field]: value } : member
            )
        }));
    };

    const addUnlockScheduleItem = (memberIndex) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.map((member, i) =>
                i === memberIndex ? {
                    ...member,
                    unlockSchedule: [...member.unlockSchedule, {
                        timestamp: '',
                        amount: '',
                        executed: false
                    }]
                } : member
            )
        }));
    };

    const removeUnlockScheduleItem = (memberIndex, scheduleIndex) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.map((member, i) =>
                i === memberIndex ? {
                    ...member,
                    unlockSchedule: member.unlockSchedule.filter((_, si) => si !== scheduleIndex)
                } : member
            )
        }));
    };

    const updateUnlockScheduleItem = (memberIndex, scheduleIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.map((member, i) =>
                i === memberIndex ? {
                    ...member,
                    unlockSchedule: member.unlockSchedule.map((item, si) =>
                        si === scheduleIndex ? { ...item, [field]: value } : item
                    )
                } : member
            )
        }));
    };

    const handleCreateDao = async () => {
        if (!validateStep(currentStep)) return;

        setIsCreating(true);
        setErrors({});
        try {
            console.log('Starting DAO creation with factoryActor:', factoryActor);
            console.log('Form data:', formData);

            const unlockItems = 
              formData
                .members
                .flatMap(m => m.unlockSchedule
                    .filter(s => s.timestamp && s.amount && m.icpPrincipal)
                    .map(s => ({
                        addr: m.icpPrincipal,
                        timestamp: BigInt(new Date(s.timestamp).getTime() * 1000000),
                        amount: BigInt(s.amount),
                        executed: false
                    }))
                );
            
            // Map formData to backend Dao type
            const dao = {
                id: '', // Will be set by backend
                name: formData.name,
                description: formData.description ? [formData.description] : [],
                icon_url: formData.iconUrl ? [formData.iconUrl] : [],
                chains: formData.chains.map(chain => ({ [chain]: null })), // e.g. [{ InternetComputer: null }]
                base_token: {
                    name: formData.baseToken.name,
                    symbol: formData.baseToken.symbol,
                    decimals: Number(formData.baseToken.decimals),
                    total_supply: BigInt(formData.baseToken.totalSupply),
                    distribution_model: formData.members.some(m => m.distributionAmount || m.unlockSchedule.length > 0) ? [{
                        initial_distribution: formData.members
                            .filter(m => m.distributionAmount && m.icpPrincipal)
                            .map(m => [m.icpPrincipal, BigInt(m.distributionAmount)]),
                        unlock_schedule: unlockItems.length > 0 ? [unlockItems] : [],
                        emission_rate: formData.baseToken.emissionRate ? [parseFloat(formData.baseToken.emissionRate)] : [],
                        last_emission_time: [],
                        initial_executed_at: []
                    }] : [],
                    token_location: {
                        chain: { InternetComputer: null }, // Default to InternetComputer
                        canister_id: formData.baseToken.canisterId && isValidPrincipal(formData.baseToken.canisterId) ? [Principal.fromText(formData.baseToken.canisterId)] : [],
                        contract_address: formData.baseToken.contractAddress ? [formData.baseToken.contractAddress] : [],
                    },
                },
                members: formData.members.map(m => ({
                    user_id: m.userId,
                    icp_principal: (m.icpPrincipal && isValidPrincipal(m.icpPrincipal)) ? [Principal.fromText(m.icpPrincipal)] : [],
                    eth_address: m.ethAddress ? [m.ethAddress] : [],
                    sol_address: m.solAddress ? [m.solAddress] : [],
                    role: { [m.role]: null },
                    reputation: BigInt(m.reputation),
                    joined_at: BigInt(m.joinedAt),
                    metadata: [],
                })),
                governance: {
                    vote_weight_type: { [formData.governance.voteWeightType]: null },
                    approval_threshold: BigInt(formData.governance.approvalThreshold),
                    voting_period_secs: BigInt(formData.governance.votingPeriodSecs),
                    quorum: BigInt(formData.governance.quorum),
                },
                proposals: [],
                treasury: [],
                created_at: BigInt(Date.now()),
            };

            // Call backend
            console.log('Calling factoryActor.create_gov_dao...');
            const result = await factoryActor.create_gov_dao(dao);
            console.log('Backend response:', result);
            if (result && result.Ok) {
                const daoId = result.Ok;
                
                // Create base token after successful DAO creation
                try {
                    // Create backend actor for the newly created DAO
                    const daoActor = createBackendActor(daoId);
                    
                    const tokenArg = {
                        name: formData.baseToken.name,
                        symbol: formData.baseToken.symbol,
                        decimals: Number(formData.baseToken.decimals),
                        total_supply: BigInt(formData.baseToken.totalSupply),
                        distribution_model: formData.members.some(m => m.distributionAmount || m.unlockSchedule.length > 0) ? [{
                            initial_distribution: formData.members
                                .filter(m => m.distributionAmount && m.icpPrincipal)
                                .map(m => [m.icpPrincipal, BigInt(m.distributionAmount)]),
                            unlock_schedule: unlockItems.length > 0 ? [unlockItems] : [],
                            emission_rate: formData.baseToken.emissionRate ? [parseFloat(formData.baseToken.emissionRate)] : [],
                            last_emission_time: [], // Use null
                            initial_executed_at: [] // Use null
                        }] : []
                    };
                    
                    const tokenResult = await daoActor.create_dao_base_token(tokenArg, {Text: 'Token Logo'});
                    if (tokenResult && tokenResult.Err) {
                        console.warn('Token creation failed:', tokenResult.Err);
                        // Continue to navigate even if token creation fails
                    }
                    else {
                        console.log('Token creation successful:', tokenResult);
                    }
                } catch (tokenErr) {
                    console.warn('Error creating token:', tokenErr);
                    // Continue to navigate even if token creation fails
                }
                
                // Show success message with token distribution info
                setShowSuccessMessage(true);
                
                // Navigate to the created DAO page after showing the message
                setTimeout(() => {
                    navigate(`/dao/${daoId}`);
                }, 3000); // Show message for 3 seconds
            } else {
                setErrors({ submit: result && result.Err ? result.Err : 'Failed to create DAO. Please try again.' });
            }
        } catch (err) {
            setErrors({ submit: 'Error creating DAO: ' + err });
        } finally {
            setIsCreating(false);
        }
    };

    const steps = [
        { number: 1, title: 'Basic Info', description: 'DAO name and token details' },
        { number: 2, title: 'Members', description: 'Add founding members' },
        { number: 3, title: 'Governance', description: 'Configure voting rules' },
        { number: 4, title: 'Review', description: 'Review and create DAO' }
    ];

    // Before the form, show login if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
                <p className="mb-4 text-lg">Please log in with Internet Identity to create a DAO.</p>
                <button onClick={login} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Login with Internet Identity</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
            {/* Progress Steps */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= step.number
                                          ? 'bg-blue-600 border-blue-600 text-white'
                                          : 'border-slate-300 text-slate-500'}`}>
                                    {currentStep > step.number ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-medium">{step.number}</span>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-slate-900' : 'text-slate-500'
                                        }`}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-slate-400">{step.description}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-16 h-0.5 mx-4 ${currentStep > step.number ? 'bg-blue-600' : 'bg-slate-300'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="mb-4 text-right text-xs text-slate-500">Your Principal: {principal}</div>
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Basic Information</h2>
                                <p className="text-slate-600">Set up your DAO's identity and native token</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        DAO Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-slate-300'
                                            }`}
                                        placeholder="Enter DAO name"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Icon URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.iconUrl}
                                        onChange={(e) => handleInputChange('iconUrl', e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="https://example.com/icon.png"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Describe your DAO's purpose and goals"
                                />
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                    <Coins className="w-5 h-5 mr-2" />
                                    Native Token Configuration
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Token Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.baseToken.name}
                                            onChange={(e) => handleBaseTokenChange('name', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.tokenName ? 'border-red-300' : 'border-slate-300'
                                                }`}
                                            placeholder="e.g., Governance Token"
                                        />
                                        {errors.tokenName && <p className="mt-1 text-sm text-red-600">{errors.tokenName}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Symbol *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.baseToken.symbol}
                                            onChange={(e) => handleBaseTokenChange('symbol', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.tokenSymbol ? 'border-red-300' : 'border-slate-300'
                                                }`}
                                            placeholder="e.g., GOV"
                                        />
                                        {errors.tokenSymbol && <p className="mt-1 text-sm text-red-600">{errors.tokenSymbol}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Decimals
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.baseToken.decimals}
                                            onChange={(e) => handleBaseTokenChange('decimals', parseInt(e.target.value))}
                                            min="0"
                                            max="18"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Total Supply *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.baseToken.totalSupply}
                                            onChange={(e) => handleBaseTokenChange('totalSupply', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.totalSupply ? 'border-red-300' : 'border-slate-300'
                                                }`}
                                            placeholder="e.g., 1000000000"
                                        />
                                        {errors.totalSupply && <p className="mt-1 text-sm text-red-600">{errors.totalSupply}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Emission Rate
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.baseToken.emissionRate || ''}
                                            onChange={(e) => handleBaseTokenChange('emissionRate', e.target.value)}
                                            min="0"
                                            step="1"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., 10000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Members */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Founding Members</h2>
                                <p className="text-slate-600">Add the initial members of your DAO</p>
                            </div>

                            {formData.members.map((member, index) => (
                                <div key={index} className="border border-slate-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {index === 0 ? 'Founder' : `Member ${index + 1}`}
                                        </h3>
                                        {index > 0 && (
                                            <button
                                                onClick={() => removeMember(index)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                User ID *
                                            </label>
                                            <input
                                                type="text"
                                                value={member.userId}
                                                onChange={(e) => updateMember(index, 'userId', e.target.value)}
                                                className={`w-full px-4 py-2.5 h-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${index === 0 && errors.founderId ? 'border-red-300' : 'border-slate-300'
                                                    }`}
                                                placeholder="Enter user ID"
                                            />
                                            {index === 0 && errors.founderId && (
                                                <p className="mt-1 text-sm text-red-600">{errors.founderId}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                ICP Principal
                                            </label>
                                            <div className="grid grid-cols-[1fr_auto]">
                                                <input
                                                    type="text"
                                                    value={member.icpPrincipal || ''}
                                                    onChange={(e) => updateMember(index, 'icpPrincipal', e.target.value)}
                                                    className="w-full px-4 py-2.5 h-12 border border-slate-300 rounded-l-lg rounded-r-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Principal..."
                                                />
                                                <button
                                                    type="button"
                                                    className="h-12 w-12 border border-slate-300 border-l-0 rounded-r-lg rounded-l-none bg-white hover:bg-slate-100 flex items-center justify-center"
                                                    onClick={() => updateMember(index, 'icpPrincipal', randomPrincipal())}
                                                    title="Generate random principal"
                                                    tabIndex={-1}
                                                    style={{ fontSize: '1rem' }}
                                                >
                                                    <Shuffle className="w-5 h-5 text-slate-500" />
                                                </button>
                                            </div>

                                        </div>
                                        {member.icpPrincipal && member.icpPrincipal.length > 0 && !isValidPrincipal(member.icpPrincipal) && (
                                            <p className="mt-1 text-sm text-red-600">Invalid ICP Principal</p>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Ethereum Address
                                            </label>
                                            <input
                                                type="text"
                                                value={member.ethAddress}
                                                onChange={(e) => updateMember(index, 'ethAddress', e.target.value)}
                                                className="w-full px-4 py-2.5 h-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0x..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Solana Address
                                            </label>
                                            <input
                                                type="text"
                                                value={member.solAddress}
                                                onChange={(e) => updateMember(index, 'solAddress', e.target.value)}
                                                className="w-full px-4 py-2.5 h-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Solana..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Role
                                            </label>
                                            <select
                                                value={member.role}
                                                onChange={(e) => updateMember(index, 'role', e.target.value)}
                                                className="w-full px-4 py-2.5 h-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {roleOptions.map(role => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Reputation
                                            </label>
                                            <input
                                                type="number"
                                                value={member.reputation}
                                                onChange={(e) => updateMember(index, 'reputation', parseInt(e.target.value))}
                                                min="0"
                                                className="w-full px-4 py-2.5 h-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Initial Distribution Amount
                                            </label>
                                            <input
                                                type="number"
                                                value={member.distributionAmount}
                                                onChange={(e) => updateMember(index, 'distributionAmount', e.target.value)}
                                                min="0"
                                                className="w-full px-4 py-2.5 h-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Token amount"
                                            />
                                        </div>
                                    </div>

                                    {/* Unlock Schedule Section */}
                                    <div className="mt-6 border-t border-slate-200 pt-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-md font-medium text-slate-900">Unlock Schedule</h4>
                                            <button
                                                type="button"
                                                onClick={() => addUnlockScheduleItem(index)}
                                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Add Schedule</span>
                                            </button>
                                        </div>
                                        
                                        {member.unlockSchedule.map((schedule, scheduleIndex) => (
                                            <div key={scheduleIndex} className="flex items-center space-x-3 mb-3 p-3 bg-slate-50 rounded-lg">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                                        Unlock Date
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={schedule.timestamp}
                                                        onChange={(e) => updateUnlockScheduleItem(index, scheduleIndex, 'timestamp', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                                        Amount
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={schedule.amount}
                                                        onChange={(e) => updateUnlockScheduleItem(index, scheduleIndex, 'amount', e.target.value)}
                                                        min="0"
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Token amount"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeUnlockScheduleItem(index, scheduleIndex)}
                                                    className="text-red-600 hover:text-red-800 transition-colors mt-5"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {member.unlockSchedule.length === 0 && (
                                            <p className="text-sm text-slate-500 italic">No unlock schedule configured</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addMember}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Member</span>
                            </button>
                        </div>
                    )}

                    {/* Step 3: Governance */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Governance Configuration</h2>
                                <p className="text-slate-600">Configure voting rules and supported chains</p>
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                    <Globe className="w-5 h-5 mr-2" />
                                    Supported Chains
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {chainOptions.map(chain => (
                                        <button
                                            key={chain.value}
                                            onClick={() => handleChainToggle(chain.value)}
                                            className={`p-4 border-2 rounded-lg text-left transition-all ${formData.chains.includes(chain.value)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <span className="text-lg">{chain.icon}</span>
                                                <span className="font-medium">{chain.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {errors.chains && <p className="mt-2 text-sm text-red-600">{errors.chains}</p>}
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                    <Settings className="w-5 h-5 mr-2" />
                                    Voting Configuration
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Vote Weight Type
                                        </label>
                                        <select
                                            value={formData.governance.voteWeightType}
                                            onChange={(e) => handleGovernanceChange('voteWeightType', e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {voteWeightTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Approval Threshold (%)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.governance.approvalThreshold}
                                                onChange={(e) => handleGovernanceChange('approvalThreshold', parseInt(e.target.value))}
                                                min="1"
                                                max="100"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Voting Period (days)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.governance.votingPeriodSecs / 86400}
                                                onChange={(e) => handleGovernanceChange('votingPeriodSecs', parseInt(e.target.value) * 86400)}
                                                min="1"
                                                max="30"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Quorum (%)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.governance.quorum}
                                                onChange={(e) => handleGovernanceChange('quorum', parseInt(e.target.value))}
                                                min="1"
                                                max="100"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Review & Create</h2>
                                <p className="text-slate-600">Review your DAO configuration before creation</p>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="border border-slate-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Building2 className="w-5 h-5 mr-2" />
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-600">DAO Name</p>
                                            <p className="font-medium">{formData.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Token Symbol</p>
                                            <p className="font-medium">{formData.baseToken.symbol}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-slate-600">Description</p>
                                            <p className="font-medium">{formData.description || 'No description provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Token Configuration */}
                                <div className="border border-slate-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Coins className="w-5 h-5 mr-2" />
                                        Token Configuration
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-600">Token Name</p>
                                            <p className="font-medium">{formData.baseToken.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Token Symbol</p>
                                            <p className="font-medium">{formData.baseToken.symbol}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Total Supply</p>
                                            <p className="font-medium">{formData.baseToken.totalSupply ? Number(formData.baseToken.totalSupply).toLocaleString() : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Emission Rate</p>
                                            <p className="font-medium">{formData.baseToken.emissionRate || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Decimals</p>
                                            <p className="font-medium">{formData.baseToken.decimals}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Members */}
                                <div className="border border-slate-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Users className="w-5 h-5 mr-2" />
                                        Founding Members ({formData.members.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {formData.members.map((member, index) => (
                                            <div key={index} className="p-4 bg-slate-50 rounded-lg">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{member.userId}</p>
                                                        <p className="text-sm text-slate-600">Role: {member.role}</p>
                                                        <p className="text-sm text-slate-600">Reputation: {member.reputation}</p>
                                                        <p className="text-sm text-slate-600">ICP Principal: {member.icpPrincipal || '-'}</p>
                                                        <p className="text-sm text-slate-600">Ethereum Address: {member.ethAddress || '-'}</p>
                                                        <p className="text-sm text-slate-600">Solana Address: {member.solAddress || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700 mb-2">Token Distribution</p>
                                                        <p className="text-sm text-slate-600">Initial Amount: {member.distributionAmount || '-'}</p>
                                                        {member.unlockSchedule && member.unlockSchedule.length > 0 ? (
                                                            <div className="mt-2">
                                                                <p className="text-sm text-slate-600 mb-1">Unlock Schedule:</p>
                                                                <div className="space-y-1">
                                                                    {member.unlockSchedule.map((schedule, scheduleIndex) => (
                                                                        <p key={scheduleIndex} className="text-xs text-slate-500">
                                                                            {schedule.amount} tokens at {new Date(schedule.timestamp).toLocaleDateString()}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-slate-600">Unlock Schedule: No vesting</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Governance */}
                                <div className="border border-slate-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Settings className="w-5 h-5 mr-2" />
                                        Governance Configuration
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-600">Vote Weight Type</p>
                                            <p className="font-medium">
                                                {voteWeightTypes.find(t => t.value === formData.governance.voteWeightType)?.label}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Approval Threshold</p>
                                            <p className="font-medium">{formData.governance.approvalThreshold}%</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Voting Period</p>
                                            <p className="font-medium">{formData.governance.votingPeriodSecs / 86400} days</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Quorum</p>
                                            <p className="font-medium">{formData.governance.quorum}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Chains */}
                                <div className="border border-slate-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Globe className="w-5 h-5 mr-2" />
                                        Supported Chains ({formData.chains.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.chains.map(chain => (
                                            <span key={chain} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                {chainOptions.find(c => c.value === chain)?.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {errors.submit && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <p className="text-red-800">{errors.submit}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-8 border-t border-slate-200">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Back
                        </button>

                        <div className="flex items-center space-x-3">
                            {currentStep < 4 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleCreateDao}
                                    disabled={isCreating}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center space-x-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Creating DAO...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4" />
                                            <span>Create DAO</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Success Toast */}
            {showSuccessMessage && (
                <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-lg z-50 max-w-md">
                    <div className="flex items-start space-x-3">
                        <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-medium mb-1">DAO Created Successfully!</div>
                            <div className="text-sm text-green-600">
                                Token distribution will begin in 1-2 minutes. You'll be redirected to your DAO page shortly.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateDaoPage;
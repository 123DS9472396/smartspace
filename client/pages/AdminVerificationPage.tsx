import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import {
    getPendingVerifications,
    reviewProfile,
    getAdminNotifications,
    getGeminiAnalysis,
    calculateMLScore,
    calculateAdvancedMLScore
} from '../services/verificationService';
import { analyzeAllDocuments, type FullAnalysisResult, type DocumentAnalysisResult } from '../services/documentAnalysisService';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import {
    ShieldCheck,
    ShieldX,
    Clock,
    CheckCircle,
    XCircle,
    FileText,
    User,
    Building2,
    Bell,
    Eye,
    RefreshCw,
    AlertTriangle,
    Download,
    Sparkles,
    Brain,
    FileSearch,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Scan,
    X,
    ZoomIn,
    FileWarning
} from 'lucide-react';

interface VerificationItem {
    id: string;
    profile_type: string;
    profile_id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    company_name: string;
    gst_number: string;
    pan_number: string;
    phone: string;
    document_count: number;
    documents: any[];
    ml_score: number;
    ml_analysis: any;
    gst_valid: boolean;
    pan_valid: boolean;
    phone_valid: boolean;
    status: string;
    created_at: string;
}

// Document Scanner Modal Component
function DocumentScannerModal({
    isOpen,
    onClose,
    documents,
    profileData,
    onAnalysisComplete
}: {
    isOpen: boolean;
    onClose: () => void;
    documents: any[];
    profileData: any;
    onAnalysisComplete: (analysis: FullAnalysisResult, advancedScore: any) => void;
}) {
    const [currentDocIndex, setCurrentDocIndex] = useState(0);
    const [scanPhase, setScanPhase] = useState<'idle' | 'loading' | 'scanning' | 'analyzing' | 'complete'>('idle');
    const [scanProgress, setScanProgress] = useState(0);
    const [currentStatus, setCurrentStatus] = useState('Initializing scanner...');
    const [documentResults, setDocumentResults] = useState<DocumentAnalysisResult[]>([]);
    const [fullAnalysis, setFullAnalysis] = useState<FullAnalysisResult | null>(null);
    const scanLineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && documents.length > 0) {
            startScanning();
        }
    }, [isOpen]);

    const startScanning = async () => {
        setScanPhase('loading');
        setCurrentStatus('Loading documents...');
        setScanProgress(0);
        setDocumentResults([]);
        setFullAnalysis(null);
        setCurrentDocIndex(0);

        // Simulate initial load
        await new Promise(r => setTimeout(r, 500));

        setScanPhase('scanning');

        // Analyze each document
        const results: DocumentAnalysisResult[] = [];

        for (let i = 0; i < documents.length; i++) {
            setCurrentDocIndex(i);
            setScanProgress(((i) / documents.length) * 80);
            setCurrentStatus(`Scanning document ${i + 1} of ${documents.length}: ${documents[i].name}`);

            try {
                // Import the analyzeDocument function
                const { analyzeDocument } = await import('../services/documentAnalysisService');

                const result = await analyzeDocument(
                    documents[i],
                    {
                        fullName: profileData.user_name,
                        companyName: profileData.company_name,
                        gstNumber: profileData.gst_number,
                        panNumber: profileData.pan_number,
                        phone: profileData.phone
                    },
                    (status) => {
                        setCurrentStatus(`Doc ${i + 1}: ${status}`);
                    }
                );
                results.push(result);
                setDocumentResults([...results]);
            } catch (error) {
                console.error('Scan error:', error);
                results.push({
                    documentName: documents[i].name,
                    documentType: 'Error',
                    extractedText: '',
                    extractedData: {
                        gstNumbers: [],
                        panNumbers: [],
                        phoneNumbers: [],
                        names: [],
                        companies: []
                    },
                    isBusinessDocument: false,
                    documentClassification: {
                        type: 'Unknown',
                        confidence: 0
                    },
                    foundMatches: {
                        gstFound: false,
                        gstMatch: false,
                        gstSimilarity: 0,
                        panFound: false,
                        panMatch: false,
                        panSimilarity: 0,
                        nameFound: false,
                        nameSimilarity: 0,
                        companyFound: false,
                        companySimilarity: 0,
                        phoneFound: false,
                        phoneSimilarity: 0
                    },
                    relevanceScore: 0,
                    warnings: ['Failed to scan document'],
                    scanStatus: 'error'
                });
            }
        }

        // Final analysis
        setScanPhase('analyzing');
        setScanProgress(90);
        setCurrentStatus('Running ML analysis on extracted data...');

        await new Promise(r => setTimeout(r, 1000));

        // Calculate advanced score
        const advScore = await calculateAdvancedMLScore({
            gstNumber: profileData.gst_number,
            panNumber: profileData.pan_number,
            phone: profileData.phone,
            documents: documents,
            fullName: profileData.user_name,
            companyName: profileData.company_name
        });

        setScanProgress(100);
        setScanPhase('complete');
        setCurrentStatus('Analysis complete!');
        setFullAnalysis(advScore.documentAnalysis || null);

        // Notify parent
        if (advScore.documentAnalysis) {
            onAnalysisComplete(advScore.documentAnalysis, advScore);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-500/20 p-2 rounded-lg">
                            <Scan className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">ML Document Scanner</h2>
                            <p className="text-sm text-slate-400">AI-powered document verification</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 max-h-[calc(90vh-140px)] overflow-y-auto">
                    {/* Document Preview Panel */}
                    <div className="bg-slate-800 rounded-xl p-4">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            Document Preview
                        </h3>

                        {/* Document Display */}
                        <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-[3/4] mb-4">
                            {documents[currentDocIndex] && (
                                <>
                                    {/* Document Info */}
                                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900 to-transparent p-3 z-10">
                                        <p className="text-white font-medium text-sm truncate">
                                            {documents[currentDocIndex].name}
                                        </p>
                                        <p className="text-slate-400 text-xs">
                                            Document {currentDocIndex + 1} of {documents.length}
                                        </p>
                                    </div>

                                    {/* Document Viewer */}
                                    {documents[currentDocIndex].url && (
                                        <iframe
                                            src={documents[currentDocIndex].url}
                                            className="w-full h-full"
                                            title={documents[currentDocIndex].name}
                                        />
                                    )}

                                    {/* Scanning Overlay */}
                                    {(scanPhase === 'scanning' || scanPhase === 'loading') && (
                                        <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center">
                                            {/* Scan line animation */}
                                            <div className="absolute inset-0 overflow-hidden">
                                                <div
                                                    ref={scanLineRef}
                                                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_cyan] animate-scan"
                                                    style={{
                                                        animation: 'scanLine 2s ease-in-out infinite'
                                                    }}
                                                />
                                            </div>

                                            {/* Scanning indicator */}
                                            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 text-center z-10">
                                                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                                                <p className="text-cyan-400 font-medium">Scanning...</p>
                                                <p className="text-slate-400 text-xs mt-1">{currentStatus}</p>
                                            </div>

                                            {/* Corner indicators */}
                                            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-400" />
                                            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-400" />
                                            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-400" />
                                            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-400" />
                                        </div>
                                    )}

                                    {/* Complete overlay */}
                                    {scanPhase === 'complete' && documentResults[currentDocIndex] && (
                                        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                                            <div className={`p-4 rounded-xl text-center ${documentResults[currentDocIndex].isBusinessDocument
                                                    ? 'bg-green-900/80 border border-green-500'
                                                    : 'bg-red-900/80 border border-red-500'
                                                }`}>
                                                {documentResults[currentDocIndex].isBusinessDocument ? (
                                                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                                ) : (
                                                    <FileWarning className="w-12 h-12 text-red-400 mx-auto mb-2" />
                                                )}
                                                <p className={documentResults[currentDocIndex].isBusinessDocument ? 'text-green-400' : 'text-red-400'}>
                                                    {documentResults[currentDocIndex].isBusinessDocument
                                                        ? 'Valid Business Document'
                                                        : 'Non-Business Document'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Document Thumbnails */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {documents.map((doc, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentDocIndex(i)}
                                    className={`flex-shrink-0 p-2 rounded-lg border transition-all ${currentDocIndex === i
                                            ? 'border-blue-500 bg-blue-500/20'
                                            : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    <FileText className={`w-6 h-6 ${documentResults[i]?.isBusinessDocument
                                            ? 'text-green-400'
                                            : documentResults[i]
                                                ? 'text-red-400'
                                                : 'text-slate-400'
                                        }`} />
                                    <p className="text-xs text-slate-300 mt-1 max-w-[60px] truncate">{doc.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Analysis Panel */}
                    <div className="bg-slate-800 rounded-xl p-4">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            ML Analysis Results
                        </h3>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Analysis Progress</span>
                                <span className="text-white">{Math.round(scanProgress)}%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                                    style={{ width: `${scanProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{currentStatus}</p>
                        </div>

                        {/* Extracted Text Preview */}
                        {documentResults[currentDocIndex]?.extractedText && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <FileSearch className="w-4 h-4 text-cyan-400" />
                                    Extracted Text
                                </h4>
                                <div className="bg-slate-900 rounded-lg p-3 max-h-32 overflow-y-auto text-xs text-slate-300 font-mono">
                                    {documentResults[currentDocIndex].extractedText.substring(0, 500)}
                                    {documentResults[currentDocIndex].extractedText.length > 500 && '...'}
                                </div>
                            </div>
                        )}

                        {/* Match Results */}
                        {documentResults[currentDocIndex] && (
                            <div className="mb-4 grid grid-cols-2 gap-2">
                                <div className={`p-2 rounded-lg text-center ${documentResults[currentDocIndex].foundMatches.gstMatch
                                        ? 'bg-green-900/30 border border-green-500/50'
                                        : documentResults[currentDocIndex].foundMatches.gstFound
                                            ? 'bg-yellow-900/30 border border-yellow-500/50'
                                            : 'bg-red-900/30 border border-red-500/50'
                                    }`}>
                                    <p className="text-xs text-slate-400">GST</p>
                                    <p className={`font-medium ${documentResults[currentDocIndex].foundMatches.gstMatch
                                            ? 'text-green-400'
                                            : documentResults[currentDocIndex].foundMatches.gstFound
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                        }`}>
                                        {documentResults[currentDocIndex].foundMatches.gstMatch ? '✓ MATCH' :
                                            documentResults[currentDocIndex].foundMatches.gstFound ? '⚠ FOUND' : '✗ NOT FOUND'}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-lg text-center ${documentResults[currentDocIndex].foundMatches.panMatch
                                        ? 'bg-green-900/30 border border-green-500/50'
                                        : documentResults[currentDocIndex].foundMatches.panFound
                                            ? 'bg-yellow-900/30 border border-yellow-500/50'
                                            : 'bg-red-900/30 border border-red-500/50'
                                    }`}>
                                    <p className="text-xs text-slate-400">PAN</p>
                                    <p className={`font-medium ${documentResults[currentDocIndex].foundMatches.panMatch
                                            ? 'text-green-400'
                                            : documentResults[currentDocIndex].foundMatches.panFound
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                        }`}>
                                        {documentResults[currentDocIndex].foundMatches.panMatch ? '✓ MATCH' :
                                            documentResults[currentDocIndex].foundMatches.panFound ? '⚠ FOUND' : '✗ NOT FOUND'}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-lg text-center ${documentResults[currentDocIndex].foundMatches.nameFound
                                        ? 'bg-green-900/30 border border-green-500/50'
                                        : 'bg-red-900/30 border border-red-500/50'
                                    }`}>
                                    <p className="text-xs text-slate-400">Name</p>
                                    <p className={`font-medium ${documentResults[currentDocIndex].foundMatches.nameFound
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                        }`}>
                                        {documentResults[currentDocIndex].foundMatches.nameFound ? '✓ FOUND' : '✗ NOT FOUND'}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-lg text-center ${documentResults[currentDocIndex].foundMatches.companyFound
                                        ? 'bg-green-900/30 border border-green-500/50'
                                        : 'bg-red-900/30 border border-red-500/50'
                                    }`}>
                                    <p className="text-xs text-slate-400">Company</p>
                                    <p className={`font-medium ${documentResults[currentDocIndex].foundMatches.companyFound
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                        }`}>
                                        {documentResults[currentDocIndex].foundMatches.companyFound ? '✓ FOUND' : '✗ NOT FOUND'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Warnings */}
                        {documentResults[currentDocIndex]?.warnings && documentResults[currentDocIndex].warnings.length > 0 && (
                            <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    Issues Detected
                                </h4>
                                <ul className="text-xs text-red-300 space-y-1">
                                    {documentResults[currentDocIndex].warnings.slice(0, 4).map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Final Result */}
                        {scanPhase === 'complete' && fullAnalysis && (
                            <div className={`p-4 rounded-xl ${fullAnalysis.overallScore >= 70
                                    ? 'bg-green-900/30 border border-green-500'
                                    : fullAnalysis.overallScore >= 40
                                        ? 'bg-yellow-900/30 border border-yellow-500'
                                        : 'bg-red-900/30 border border-red-500'
                                }`}>
                                <div className="text-center mb-3">
                                    <p className="text-4xl font-bold text-white mb-1">
                                        {fullAnalysis.overallScore}/100
                                    </p>
                                    <p className={`text-sm font-medium ${fullAnalysis.overallScore >= 70 ? 'text-green-400' :
                                            fullAnalysis.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {fullAnalysis.recommendation}
                                    </p>
                                </div>
                                <Button
                                    onClick={onClose}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                                >
                                    Close Scanner
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* CSS for scan animation */}
                <style>{`
                    @keyframes scanLine {
                        0% { top: 0; opacity: 1; }
                        50% { top: 100%; opacity: 0.5; }
                        100% { top: 0; opacity: 1; }
                    }
                `}</style>
            </div>
        </div>
    );
}

export default function AdminVerificationPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [pendingItems, setPendingItems] = useState<VerificationItem[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    // ML Analysis state
    const [mlAnalysis, setMlAnalysis] = useState<string>('');
    const [loadingMlAnalysis, setLoadingMlAnalysis] = useState(false);
    const [documentAnalysis, setDocumentAnalysis] = useState<FullAnalysisResult | null>(null);
    const [advancedScore, setAdvancedScore] = useState<any>(null);

    // Scanner modal
    const [showScanner, setShowScanner] = useState(false);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [seekerProfiles, ownerProfiles, notifs] = await Promise.all([
                supabase
                    .from('seeker_profiles')
                    .select('*')
                    .in('verification_status', ['pending', 'submitted'])
                    .order('submitted_at', { ascending: false }),
                supabase
                    .from('owner_profiles')
                    .select('*')
                    .in('verification_status', ['pending', 'submitted'])
                    .order('submitted_at', { ascending: false }),
                getAdminNotifications()
            ]);

            const seekerItems: VerificationItem[] = (seekerProfiles.data || []).map((profile: any) => {
                const mlScore = calculateMLScore({
                    gstNumber: profile.gst_number,
                    panNumber: profile.pan_number,
                    phone: profile.phone,
                    documents: profile.documents,
                    fullName: profile.full_name,
                    companyName: profile.company_name
                });

                return {
                    id: profile.id,
                    profile_type: 'seeker',
                    profile_id: profile.id,
                    user_id: profile.user_id,
                    user_email: profile.email,
                    user_name: profile.full_name,
                    company_name: profile.company_name,
                    gst_number: profile.gst_number,
                    pan_number: profile.pan_number,
                    phone: profile.phone,
                    document_count: profile.documents?.length || 0,
                    documents: profile.documents || [],
                    ml_score: mlScore.totalScore,
                    ml_analysis: mlScore,
                    gst_valid: mlScore.gstValid,
                    pan_valid: mlScore.panValid,
                    phone_valid: mlScore.phoneValid,
                    status: profile.verification_status,
                    created_at: profile.created_at
                };
            });

            const ownerItems: VerificationItem[] = (ownerProfiles.data || []).map((profile: any) => {
                const mlScore = calculateMLScore({
                    gstNumber: profile.gst_number,
                    panNumber: profile.pan_number,
                    phone: profile.phone,
                    documents: profile.documents,
                    fullName: profile.full_name,
                    companyName: profile.company_name,
                    address: profile.business_address
                });

                return {
                    id: profile.id,
                    profile_type: 'owner',
                    profile_id: profile.id,
                    user_id: profile.user_id,
                    user_email: profile.email,
                    user_name: profile.full_name,
                    company_name: profile.company_name,
                    gst_number: profile.gst_number,
                    pan_number: profile.pan_number,
                    phone: profile.phone,
                    document_count: profile.documents?.length || 0,
                    documents: profile.documents || [],
                    ml_score: mlScore.totalScore,
                    ml_analysis: mlScore,
                    gst_valid: mlScore.gstValid,
                    pan_valid: mlScore.panValid,
                    phone_valid: mlScore.phoneValid,
                    status: profile.verification_status,
                    created_at: profile.created_at
                };
            });

            const allItems = [...seekerItems, ...ownerItems].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setPendingItems(allItems);
            setNotifications(notifs);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Open scanner modal
    const openScanner = () => {
        if (!selectedItem || selectedItem.document_count === 0) return;
        setShowScanner(true);
    };

    // Handle scanner complete
    const handleScanComplete = async (analysis: FullAnalysisResult, advScore: any) => {
        setDocumentAnalysis(analysis);
        setAdvancedScore(advScore);

        // Get LLM analysis
        setLoadingMlAnalysis(true);
        try {
            const llmAnalysis = await getGeminiAnalysis({
                fullName: selectedItem?.user_name,
                companyName: selectedItem?.company_name,
                gstNumber: selectedItem?.gst_number,
                panNumber: selectedItem?.pan_number,
                phone: selectedItem?.phone,
                documents: selectedItem?.documents,
                ml_score: advScore.totalScore
            });
            setMlAnalysis(llmAnalysis);
        } catch (error) {
            console.error('LLM analysis error:', error);
        } finally {
            setLoadingMlAnalysis(false);
        }
    };

    // Handle approve/reject
    const handleReview = async (decision: 'approved' | 'rejected') => {
        if (!selectedItem || !user?.id) return;

        setProcessing(true);
        try {
            const result = await reviewProfile(
                selectedItem.id,
                decision,
                adminNotes,
                user.id
            );

            if (result.success) {
                alert(`Profile ${decision} successfully!`);
                setSelectedItem(null);
                setAdminNotes('');
                setMlAnalysis('');
                setDocumentAnalysis(null);
                setAdvancedScore(null);
                fetchData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error('Error reviewing profile:', error);
            alert(error.message || 'Failed to update status');
        } finally {
            setProcessing(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-400';
        if (score >= 50) return 'text-yellow-400';
        if (score >= 30) return 'text-orange-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        if (score >= 30) return 'bg-orange-500';
        return 'bg-red-500';
    };

    // Check if user is admin
    if (profile?.user_type !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Navbar />
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="text-center">
                        <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                        <p className="text-slate-400">Only administrators can access this page.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Navbar />
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navbar />

            {/* Scanner Modal */}
            {selectedItem && (
                <DocumentScannerModal
                    isOpen={showScanner}
                    onClose={() => setShowScanner(false)}
                    documents={selectedItem.documents || []}
                    profileData={selectedItem}
                    onAnalysisComplete={handleScanComplete}
                />
            )}

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-blue-400" />
                            Profile Verification Dashboard
                        </h1>
                        <p className="text-slate-400 mt-1">Review and approve user profiles with ML document analysis</p>
                    </div>
                    <Button onClick={fetchData} variant="outline" className="border-slate-600 text-slate-300">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-dark rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-500/20 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{pendingItems.length}</p>
                                <p className="text-slate-400 text-sm">Pending Review</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-dark rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-3 rounded-lg">
                                <Bell className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{notifications.length}</p>
                                <p className="text-slate-400 text-sm">New Notifications</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-dark rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500/20 p-3 rounded-lg">
                                <User className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {pendingItems.filter(i => i.profile_type === 'seeker').length}
                                </p>
                                <p className="text-slate-400 text-sm">Seeker Profiles</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-dark rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 p-3 rounded-lg">
                                <Building2 className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {pendingItems.filter(i => i.profile_type === 'owner').length}
                                </p>
                                <p className="text-slate-400 text-sm">Owner Profiles</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending List */}
                    <div className="glass-dark rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Pending Verifications</h2>

                        {pendingItems.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                <p className="text-slate-300">All caught up! No pending verifications.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {pendingItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setAdminNotes('');
                                            setMlAnalysis('');
                                            setDocumentAnalysis(null);
                                            setAdvancedScore(null);
                                        }}
                                        className={`p-4 rounded-lg cursor-pointer transition-all ${selectedItem?.id === item.id
                                            ? 'bg-blue-600/30 border border-blue-500'
                                            : 'bg-slate-800 hover:bg-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${item.profile_type === 'owner'
                                                    ? 'bg-purple-500/20'
                                                    : 'bg-green-500/20'
                                                    }`}>
                                                    {item.profile_type === 'owner'
                                                        ? <Building2 className="w-5 h-5 text-purple-400" />
                                                        : <User className="w-5 h-5 text-green-400" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{item.user_name || 'No name'}</p>
                                                    <p className="text-slate-400 text-sm">{item.company_name || 'No company'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl font-bold ${getScoreColor(item.ml_score)}`}>
                                                    {item.ml_score || 0}
                                                </div>
                                                <p className="text-slate-500 text-xs">Basic Score</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                                            <span className={item.gst_valid ? 'text-green-400' : 'text-red-400'}>
                                                GST: {item.gst_valid ? '✓' : '✗'}
                                            </span>
                                            <span className={item.pan_valid ? 'text-green-400' : 'text-red-400'}>
                                                PAN: {item.pan_valid ? '✓' : '✗'}
                                            </span>
                                            <span className={item.phone_valid ? 'text-green-400' : 'text-red-400'}>
                                                Phone: {item.phone_valid ? '✓' : '✗'}
                                            </span>
                                            <span className="text-blue-400">
                                                {item.document_count} docs
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail View */}
                    <div className="glass-dark rounded-xl p-6 max-h-[800px] overflow-y-auto">
                        <h2 className="text-xl font-semibold text-white mb-4">Profile Details</h2>

                        {!selectedItem ? (
                            <div className="text-center py-12">
                                <Eye className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-400">Select a profile to review</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Profile Info */}
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-medium text-white">
                                            {selectedItem.user_name}
                                        </h3>
                                        <span className={`px-2 py-1 rounded text-xs uppercase ${selectedItem.profile_type === 'owner'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {selectedItem.profile_type}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-400">Company</p>
                                            <p className="text-white">{selectedItem.company_name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Email</p>
                                            <p className="text-white">{selectedItem.user_email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">GST Number</p>
                                            <p className={selectedItem.gst_valid ? 'text-green-400' : 'text-red-400'}>
                                                {selectedItem.gst_number || '-'} {selectedItem.gst_valid ? '✓' : '✗'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">PAN Number</p>
                                            <p className={selectedItem.pan_valid ? 'text-green-400' : 'text-red-400'}>
                                                {selectedItem.pan_number || '-'} {selectedItem.pan_valid ? '✓' : '✗'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Phone</p>
                                            <p className={selectedItem.phone_valid ? 'text-green-400' : 'text-red-400'}>
                                                {selectedItem.phone || '-'} {selectedItem.phone_valid ? '✓' : '✗'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Submitted</p>
                                            <p className="text-white">
                                                {new Date(selectedItem.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                        Documents ({selectedItem.document_count})
                                    </h3>
                                    {selectedItem.documents && selectedItem.documents.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedItem.documents.map((doc: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                                                    <span className="text-slate-300 text-sm">{doc.name}</span>
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm">No documents uploaded</p>
                                    )}
                                </div>

                                {/* ML Scanner Button */}
                                <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg p-4 border border-purple-500/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-medium flex items-center gap-2">
                                            <Scan className="w-5 h-5 text-cyan-400" />
                                            ML Document Scanner
                                        </h3>
                                        <Button
                                            onClick={openScanner}
                                            disabled={selectedItem.document_count === 0}
                                            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                                        >
                                            <Scan className="w-4 h-4 mr-2" />
                                            Open Scanner
                                        </Button>
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        {selectedItem.document_count === 0
                                            ? 'No documents to scan'
                                            : 'Click to open document scanner with AI-powered text extraction and verification'}
                                    </p>
                                </div>

                                {/* Advanced ML Score (after analysis) */}
                                {advancedScore && (
                                    <div className="bg-slate-800 rounded-lg p-4">
                                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                                            ML Verification Score (Document Verified)
                                        </h3>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`text-4xl font-bold ${getScoreColor(advancedScore.totalScore)}`}>
                                                {advancedScore.totalScore}/100
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${getScoreBg(advancedScore.totalScore)}`}
                                                        style={{ width: `${advancedScore.totalScore}%` }}
                                                    />
                                                </div>
                                                <p className="text-slate-400 text-sm mt-1">
                                                    {advancedScore.analysis?.recommendation || 'Analysis complete'}
                                                </p>
                                            </div>
                                        </div>

                                        {advancedScore.breakdown && (
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="bg-slate-700 p-2 rounded">
                                                    <span className="text-slate-400">GST Format:</span>
                                                    <span className={`ml-2 ${advancedScore.breakdown.gstFormatScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {advancedScore.breakdown.gstFormatScore}/10
                                                    </span>
                                                </div>
                                                <div className="bg-slate-700 p-2 rounded">
                                                    <span className="text-slate-400">GST in Docs:</span>
                                                    <span className={`ml-2 ${advancedScore.breakdown.gstDocumentScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {advancedScore.breakdown.gstDocumentScore}/15
                                                    </span>
                                                </div>
                                                <div className="bg-slate-700 p-2 rounded">
                                                    <span className="text-slate-400">PAN Format:</span>
                                                    <span className={`ml-2 ${advancedScore.breakdown.panFormatScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {advancedScore.breakdown.panFormatScore}/10
                                                    </span>
                                                </div>
                                                <div className="bg-slate-700 p-2 rounded">
                                                    <span className="text-slate-400">PAN in Docs:</span>
                                                    <span className={`ml-2 ${advancedScore.breakdown.panDocumentScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {advancedScore.breakdown.panDocumentScore}/15
                                                    </span>
                                                </div>
                                                <div className="bg-slate-700 p-2 rounded">
                                                    <span className="text-slate-400">Name/Company:</span>
                                                    <span className={`ml-2 ${advancedScore.breakdown.nameCompanyScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {advancedScore.breakdown.nameCompanyScore}/15
                                                    </span>
                                                </div>
                                                <div className="bg-slate-700 p-2 rounded">
                                                    <span className="text-slate-400">Doc Relevance:</span>
                                                    <span className={`ml-2 ${advancedScore.breakdown.documentRelevanceScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {advancedScore.breakdown.documentRelevanceScore}/15
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Document Analysis Results */}
                                {documentAnalysis && (
                                    <div className="bg-slate-800 rounded-lg p-4">
                                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                                            <FileSearch className="w-5 h-5 text-cyan-400" />
                                            Document Content Analysis
                                        </h3>

                                        {documentAnalysis.concerns.length > 0 && (
                                            <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                                <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Concerns Detected
                                                </h4>
                                                <ul className="text-sm text-red-300 space-y-1">
                                                    {documentAnalysis.concerns.slice(0, 5).map((c, i) => (
                                                        <li key={i}>{c}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {documentAnalysis.strengths.length > 0 && (
                                            <div className="mb-4 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                                                <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Verified
                                                </h4>
                                                <ul className="text-sm text-green-300 space-y-1">
                                                    {documentAnalysis.strengths.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* LLM Analysis */}
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-medium flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                            AI Assessment
                                        </h3>
                                    </div>
                                    {loadingMlAnalysis ? (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Generating AI assessment...
                                        </div>
                                    ) : mlAnalysis ? (
                                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{mlAnalysis}</p>
                                    ) : (
                                        <p className="text-slate-400 text-sm">
                                            Open the ML Scanner above to analyze documents and get AI assessment
                                        </p>
                                    )}
                                </div>

                                {/* Admin Notes */}
                                <div>
                                    <label className="text-white font-medium mb-2 block">Admin Notes</label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                                        placeholder="Add notes about your decision..."
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleReview('rejected')}
                                        disabled={processing}
                                        variant="outline"
                                        className="flex-1 border-red-500 text-red-400 hover:bg-red-500/20"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleReview('approved')}
                                        disabled={processing}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

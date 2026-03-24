import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { submitProfileForVerification, calculateMLScore } from '../services/verificationService';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
    User,
    Building2,
    Upload,
    CheckCircle,
    Clock,
    XCircle,
    FileText,
    Save,
    Trash2,
    ShieldCheck,
    AlertTriangle,
    MapPin,
    DollarSign,
    Ruler
} from 'lucide-react';

interface SeekerProfileData {
    id?: string;
    user_id?: string;
    full_name: string;
    phone: string;
    email: string;
    profile_image_url: string;
    company_name: string;
    business_type: string;
    gst_number: string;
    pan_number: string;
    preferred_districts: string[];
    preferred_warehouse_types: string[];
    budget_min: number | null;
    budget_max: number | null;
    required_area_min: number | null;
    required_area_max: number | null;
    preferred_amenities: string[];
    documents: { name: string; url: string; type: string; uploaded_at: string }[];
    verification_status: 'pending' | 'submitted' | 'verified' | 'rejected';
    verification_score: number;
    verification_notes?: string;
}

const BUSINESS_TYPES = [
    'E-commerce', 'Manufacturing', 'Logistics', 'Retail',
    'FMCG', 'Pharma', 'Textile', 'Automobile', 'Other'
];

const WAREHOUSE_TYPES = [
    'General Storage', 'Cold Storage', 'Food Storage',
    'Pharma Cold Chain', 'Industrial Logistics Park',
    'Textile Warehouse', 'Automobile Spare Storage', 'Zepto Dark Store'
];

const DISTRICTS = [
    'Mumbai', 'Thane', 'Pune', 'Nashik', 'Nagpur',
    'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli', 'Satara', 'Raigad'
];

const AMENITIES = [
    '24/7 Security', 'Loading Dock', 'Temperature Control',
    'CCTV Surveillance', 'Fire Safety', 'Power Backup', 'Parking', 'Office Space'
];

export default function SeekerProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [mlScore, setMlScore] = useState<any>(null);

    const [profile, setProfile] = useState<SeekerProfileData>({
        full_name: '',
        phone: '',
        email: user?.email || '',
        profile_image_url: '',
        company_name: '',
        business_type: '',
        gst_number: '',
        pan_number: '',
        preferred_districts: [],
        preferred_warehouse_types: [],
        budget_min: null,
        budget_max: null,
        required_area_min: null,
        required_area_max: null,
        preferred_amenities: [],
        documents: [],
        verification_status: 'pending',
        verification_score: 0
    });

    const completionChecks = [
        profile.full_name.trim().length > 0,
        profile.phone.trim().length > 0,
        profile.company_name.trim().length > 0 || profile.business_type.trim().length > 0,
        profile.preferred_districts.length > 0,
        profile.preferred_warehouse_types.length > 0,
        profile.budget_min !== null,
        profile.budget_max !== null,
        profile.required_area_min !== null,
        profile.required_area_max !== null,
        profile.documents.length >= 1,
    ];
    const completedFields = completionChecks.filter(Boolean).length;
    const profileCompletionPct = Math.round((completedFields / completionChecks.length) * 100);

    // Fetch existing profile
    useEffect(() => {
        async function fetchProfile() {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('seeker_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                const { data: baseProfile, error: baseError } = await supabase
                    .from('profiles')
                    .select('name, email, phone, company_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (data) {
                    setProfile(prev => ({
                        ...prev,
                        ...data,
                        full_name: data.full_name || baseProfile?.name || prev.full_name || '',
                        email: data.email || baseProfile?.email || user.email || prev.email || '',
                        phone: data.phone || baseProfile?.phone || prev.phone || '',
                        company_name: data.company_name || baseProfile?.company_name || prev.company_name || ''
                    }));
                    const score = calculateMLScore({
                        gstNumber: data.gst_number,
                        panNumber: data.pan_number,
                        phone: data.phone || baseProfile?.phone,
                        documents: data.documents,
                        fullName: data.full_name || baseProfile?.name,
                        companyName: data.company_name || baseProfile?.company_name
                    });
                    setMlScore(score);
                } else if (!baseError && baseProfile) {
                    setProfile(prev => ({
                        ...prev,
                        full_name: prev.full_name || baseProfile.name || '',
                        email: prev.email || baseProfile.email || user.email || '',
                        phone: prev.phone || baseProfile.phone || '',
                        company_name: prev.company_name || baseProfile.company_name || ''
                    }));
                }
            } catch (err) {
                console.log('No existing profile found');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [user]);

    // Update ML score when profile changes
    useEffect(() => {
        const score = calculateMLScore({
            gstNumber: profile.gst_number,
            panNumber: profile.pan_number,
            phone: profile.phone,
            documents: profile.documents,
            fullName: profile.full_name,
            companyName: profile.company_name
        });
        setMlScore(score);
    }, [profile.gst_number, profile.pan_number, profile.phone, profile.documents, profile.full_name, profile.company_name]);

    // Save profile to Supabase
    const saveProfile = async () => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const profileData = {
                user_id: user.id,
                email: user.email,
                full_name: profile.full_name,
                phone: profile.phone,
                profile_image_url: profile.profile_image_url,
                company_name: profile.company_name,
                business_type: profile.business_type,
                gst_number: profile.gst_number,
                pan_number: profile.pan_number,
                preferred_districts: profile.preferred_districts,
                preferred_warehouse_types: profile.preferred_warehouse_types,
                budget_min: profile.budget_min,
                budget_max: profile.budget_max,
                required_area_min: profile.required_area_min,
                required_area_max: profile.required_area_max,
                preferred_amenities: profile.preferred_amenities,
                documents: profile.documents,
                verification_score: mlScore?.totalScore || 0,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('seeker_profiles')
                .upsert(profileData, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setProfile(prev => ({ ...prev, ...data }));
            }

            toast({
                title: 'Profile saved',
                description: 'Your seeker profile draft has been saved.'
            });
        } catch (err) {
            console.error('Error saving profile:', err);
            toast({
                title: 'Save failed',
                description: 'Failed to save profile. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const validateBeforeVerificationSubmit = () => {
        if (!profile.full_name.trim() || !profile.phone.trim()) {
            toast({
                title: 'Missing required details',
                description: 'Please fill full name and phone number before submitting.',
                variant: 'destructive'
            });
            return false;
        }

        if (!profile.business_type && !profile.company_name.trim()) {
            toast({
                title: 'Business details needed',
                description: 'Please provide company name or business type.',
                variant: 'destructive'
            });
            return false;
        }

        if ((profile.documents || []).length < 1) {
            toast({
                title: 'Document required',
                description: 'Upload at least 1 business/verification document.',
                variant: 'destructive'
            });
            return false;
        }

        return true;
    };

    // Submit for verification
    const submitForVerification = async () => {
        if (!user?.id) return;

        // First save the profile
        await saveProfile();

        if (!validateBeforeVerificationSubmit()) {
            return;
        }

        setSubmitting(true);
        try {
            const { data: savedProfile } = await supabase
                .from('seeker_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!savedProfile?.id) {
                throw new Error('Please save profile first');
            }

            const result = await submitProfileForVerification({
                profileType: 'seeker',
                profileId: savedProfile.id,
                userId: user.id,
                userEmail: user.email || '',
                userName: profile.full_name,
                companyName: profile.company_name,
                gstNumber: profile.gst_number,
                panNumber: profile.pan_number,
                phone: profile.phone,
                documents: profile.documents
            });

            if (result.success) {
                setProfile(prev => ({ ...prev, verification_status: 'submitted' }));
                toast({
                    title: 'Submitted for verification',
                    description: 'Admin will review your profile and documents.'
                });
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            console.error('Error submitting for verification:', err);
            toast({
                title: 'Submission failed',
                description: err.message || 'Failed to submit for verification',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const uploadDocumentToServer = async (file: File): Promise<string> => {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || '');
                const content = result.includes(',') ? result.split(',')[1] : '';
                if (!content) {
                    reject(new Error('Failed to process file for upload'));
                    return;
                }
                resolve(content);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });

        const response = await fetch('/api/warehouse-submissions/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                fileBase64: base64,
                contentType: file.type || 'application/octet-stream',
                bucket: 'user-documents',
                folder: `seeker-profiles/${user?.id || 'unknown'}`,
            }),
        });

        const body = await response.json();
        if (!response.ok || !body.success || !body.url) {
            throw new Error(body.error || 'Document upload failed');
        }

        return body.url as string;
    };

    // Upload document
    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: 'Unsupported file type',
                description: 'Please upload PDF, JPG, or PNG files only.',
                variant: 'destructive'
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Maximum allowed file size is 5MB.',
                variant: 'destructive'
            });
            return;
        }

        setUploadingDoc(true);
        try {
            const docUrl = await uploadDocumentToServer(file);

            const newDoc = {
                name: file.name,
                url: docUrl,
                type: file.type,
                uploaded_at: new Date().toISOString()
            };

            setProfile(prev => ({
                ...prev,
                documents: [...prev.documents, newDoc]
            }));

            toast({
                title: 'Document uploaded',
                description: `${file.name} uploaded successfully.`
            });
        } catch (err) {
            console.error('Error uploading document:', err);
            toast({
                title: 'Upload failed',
                description: 'Failed to upload document. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setUploadingDoc(false);
            e.target.value = '';
        }
    };

    const removeDocument = (index: number) => {
        setProfile(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    const toggleArrayItem = (field: 'preferred_districts' | 'preferred_warehouse_types' | 'preferred_amenities', item: string) => {
        setProfile(prev => {
            const arr = prev[field];
            if (arr.includes(item)) {
                return { ...prev, [field]: arr.filter(i => i !== item) };
            } else {
                return { ...prev, [field]: [...arr, item] };
            }
        });
    };

    const getVerificationBadge = () => {
        switch (profile.verification_status) {
            case 'verified':
                return (
                    <span className="flex items-center gap-1 text-green-400 bg-green-500/20 px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" /> Verified
                    </span>
                );
            case 'submitted':
                return (
                    <span className="flex items-center gap-1 text-yellow-400 bg-yellow-500/20 px-3 py-1 rounded-full text-sm">
                        <Clock className="w-4 h-4" /> Under Review
                    </span>
                );
            case 'rejected':
                return (
                    <span className="flex items-center gap-1 text-red-400 bg-red-500/20 px-3 py-1 rounded-full text-sm">
                        <XCircle className="w-4 h-4" /> Rejected
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1 text-slate-400 bg-slate-500/20 px-3 py-1 rounded-full text-sm">
                        <Clock className="w-4 h-4" /> Pending
                    </span>
                );
        }
    };

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

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Seeker Profile</h1>
                        <p className="text-slate-400 mt-1">Complete your profile to book warehouses</p>
                    </div>
                    {getVerificationBadge()}
                </div>

                <div className="glass-dark rounded-xl p-5 mb-6 border border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-200">Profile Completeness</p>
                        <p className="text-sm text-slate-300">{profileCompletionPct}%</p>
                    </div>
                    <Progress value={profileCompletionPct} className="h-2 bg-slate-800" />
                    <p className="text-xs text-slate-400 mt-2">
                        Add business preferences and at least one document to improve matching and verification speed.
                    </p>
                </div>

                {/* Rejection Warning */}
                {profile.verification_status === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-red-400 font-semibold text-lg">Profile Verification Rejected</h3>
                                <p className="text-slate-300 text-sm mt-1">
                                    {profile.verification_notes?.replace('REJECTED: ', '') || 
                                     'Your profile verification was not approved. Please update your profile with valid business documents and resubmit for verification.'}
                                </p>
                                <p className="text-red-300 text-sm mt-2 font-medium">
                                    ⚠️ You cannot book any warehouses until your profile is verified.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Warning for pending/submitted */}
                {(profile.verification_status === 'pending' || profile.verification_status === 'submitted') && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-yellow-400 font-semibold">Verification Required</h3>
                            <p className="text-slate-300 text-sm">
                                You must verify your profile before booking warehouses. Complete all fields and upload verification documents.
                            </p>
                        </div>
                    </div>
                )}

                {/* ML Score Card */}
                {mlScore && (
                    <div className="glass-dark rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" /> Profile Verification Score
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${mlScore.totalScore >= 60 ? 'text-green-400' : mlScore.totalScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {mlScore.totalScore}
                                </div>
                                <div className="text-slate-400 text-sm">Total Score</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xl font-bold ${mlScore.gstValid ? 'text-green-400' : 'text-red-400'}`}>
                                    {mlScore.gstValid ? '✓' : '✗'}
                                </div>
                                <div className="text-slate-400 text-sm">GST Valid</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xl font-bold ${mlScore.panValid ? 'text-green-400' : 'text-red-400'}`}>
                                    {mlScore.panValid ? '✓' : '✗'}
                                </div>
                                <div className="text-slate-400 text-sm">PAN Valid</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xl font-bold ${mlScore.phoneValid ? 'text-green-400' : 'text-red-400'}`}>
                                    {mlScore.phoneValid ? '✓' : '✗'}
                                </div>
                                <div className="text-slate-400 text-sm">Phone Valid</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-blue-400">
                                    {profile.documents.length}
                                </div>
                                <div className="text-slate-400 text-sm">Documents</div>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-300">
                            {mlScore.analysis.recommendation}
                        </p>
                    </div>
                )}

                {/* Personal Information */}
                <div className="glass-dark rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-slate-300">Full Name *</Label>
                            <Input
                                value={profile.full_name}
                                onChange={e => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Phone Number *</Label>
                            <Input
                                value={profile.phone}
                                onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="+91 XXXXX XXXXX"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Information */}
                <div className="glass-dark rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5" /> Business Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-slate-300">Company Name</Label>
                            <Input
                                value={profile.company_name}
                                onChange={e => setProfile(prev => ({ ...prev, company_name: e.target.value }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Your company name"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Business Type</Label>
                            <select
                                title="Business type"
                                value={profile.business_type}
                                onChange={e => setProfile(prev => ({ ...prev, business_type: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                            >
                                <option value="">Select business type</option>
                                {BUSINESS_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className="text-slate-300">GST Number</Label>
                            <Input
                                value={profile.gst_number}
                                onChange={e => setProfile(prev => ({ ...prev, gst_number: e.target.value }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="22AAAAA0000A1Z5"
                            />
                            {profile.gst_number && (
                                <p className={`text-xs mt-1 ${mlScore?.gstValid ? 'text-green-400' : 'text-red-400'}`}>
                                    {mlScore?.gstValid ? '✓ Valid format' : '✗ Invalid format'}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label className="text-slate-300">PAN Number</Label>
                            <Input
                                value={profile.pan_number}
                                onChange={e => setProfile(prev => ({ ...prev, pan_number: e.target.value }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="ABCDE1234F"
                            />
                            {profile.pan_number && (
                                <p className={`text-xs mt-1 ${mlScore?.panValid ? 'text-green-400' : 'text-red-400'}`}>
                                    {mlScore?.panValid ? '✓ Valid format' : '✗ Invalid format'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="glass-dark rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Warehouse Preferences</h3>

                    {/* Preferred Districts */}
                    <div className="mb-6">
                        <Label className="text-slate-300 mb-2 block">Preferred Districts</Label>
                        <div className="flex flex-wrap gap-2">
                            {DISTRICTS.map(district => (
                                <button
                                    key={district}
                                    onClick={() => toggleArrayItem('preferred_districts', district)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${profile.preferred_districts.includes(district)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {district}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preferred Warehouse Types */}
                    <div className="mb-6">
                        <Label className="text-slate-300 mb-2 block">Preferred Warehouse Types</Label>
                        <div className="flex flex-wrap gap-2">
                            {WAREHOUSE_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleArrayItem('preferred_warehouse_types', type)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${profile.preferred_warehouse_types.includes(type)
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <Label className="text-slate-300">Min Budget (₹/sqft/month)</Label>
                            <Input
                                type="number"
                                value={profile.budget_min || ''}
                                onChange={e => setProfile(prev => ({ ...prev, budget_min: e.target.value ? Number(e.target.value) : null }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="10"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Max Budget (₹/sqft/month)</Label>
                            <Input
                                type="number"
                                value={profile.budget_max || ''}
                                onChange={e => setProfile(prev => ({ ...prev, budget_max: e.target.value ? Number(e.target.value) : null }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="100"
                            />
                        </div>
                    </div>

                    {/* Area Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-slate-300">Min Area Required (sqft)</Label>
                            <Input
                                type="number"
                                value={profile.required_area_min || ''}
                                onChange={e => setProfile(prev => ({ ...prev, required_area_min: e.target.value ? Number(e.target.value) : null }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="1000"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Max Area Required (sqft)</Label>
                            <Input
                                type="number"
                                value={profile.required_area_max || ''}
                                onChange={e => setProfile(prev => ({ ...prev, required_area_max: e.target.value ? Number(e.target.value) : null }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="100000"
                            />
                        </div>
                    </div>
                </div>

                {/* Document Upload */}
                <div className="glass-dark rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Verification Documents
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Upload business registration, GST certificate, or ID proof to get verified.
                    </p>

                    {profile.documents.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {profile.documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <p className="text-white text-sm">{doc.name}</p>
                                            <p className="text-slate-500 text-xs">
                                                {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        title="Remove document"
                                        onClick={() => removeDocument(index)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-400">
                            {uploadingDoc ? 'Uploading...' : 'Click to upload document'}
                        </span>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={handleDocumentUpload}
                            disabled={uploadingDoc}
                        />
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button
                        onClick={saveProfile}
                        disabled={saving}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button
                        onClick={submitForVerification}
                        disabled={submitting || profile.verification_status === 'submitted' || profile.verification_status === 'verified'}
                        className={`${profile.verification_status === 'rejected' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                    >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        {submitting ? 'Submitting...' :
                            profile.verification_status === 'verified' ? 'Already Verified' :
                                profile.verification_status === 'submitted' ? 'Under Review' :
                                    profile.verification_status === 'rejected' ? 'Resubmit for Verification' :
                                        'Submit for Verification'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

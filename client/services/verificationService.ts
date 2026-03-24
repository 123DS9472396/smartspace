/**
 * Profile Verification Service
 * Handles ML scoring, validation, document analysis, and LLM analysis
 * Updated to use real document content verification
 */

import { supabase } from './supabaseClient';
import {
    analyzeAllDocuments,
    calculateDocumentMLScore,
    type ProfileData,
    type FullAnalysisResult
} from './documentAnalysisService';

// GST Number format: 22AAAAA0000A1Z5
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// PAN format: AAAAA1234A
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Indian phone number format
const PHONE_REGEX = /^(\+91)?[6-9][0-9]{9}$/;

export interface MLScoreResult {
    totalScore: number;
    gstScore: number;
    panScore: number;
    phoneScore: number;
    documentScore: number;
    completenessScore: number;
    gstValid: boolean;
    panValid: boolean;
    phoneValid: boolean;
    documentAnalysis?: FullAnalysisResult;
    breakdown?: {
        gstFormatScore: number;
        gstDocumentScore: number;
        panFormatScore: number;
        panDocumentScore: number;
        phoneFormatScore: number;
        phoneDocumentScore: number;
        nameCompanyScore: number;
        documentRelevanceScore: number;
        completenessScore: number;
    };
    analysis: {
        strengths: string[];
        concerns: string[];
        recommendation: string;
    };
}

export interface VerificationRequest {
    profileType: 'seeker' | 'owner';
    profileId: string;
    userId: string;
    userEmail: string;
    userName: string;
    companyName: string;
    gstNumber: string;
    panNumber: string;
    phone: string;
    documents: any[];
}

/**
 * Validate GST number format
 */
export function validateGST(gst: string): boolean {
    if (!gst) return false;
    return GST_REGEX.test(gst.toUpperCase().replace(/\s/g, ''));
}

/**
 * Validate PAN number format
 */
export function validatePAN(pan: string): boolean {
    if (!pan) return false;
    return PAN_REGEX.test(pan.toUpperCase().replace(/\s/g, ''));
}

/**
 * Validate phone number format
 */
export function validatePhone(phone: string): boolean {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return PHONE_REGEX.test(cleaned);
}

/**
 * Calculate ML Score for a profile (basic - format only)
 * Use calculateAdvancedMLScore for document content analysis
 */
export function calculateMLScore(data: {
    gstNumber?: string;
    panNumber?: string;
    phone?: string;
    documents?: any[];
    fullName?: string;
    companyName?: string;
    address?: string;
}): MLScoreResult {
    const strengths: string[] = [];
    const concerns: string[] = [];

    // GST Validation (25 points max)
    const gstValid = validateGST(data.gstNumber || '');
    let gstScore = 0;
    if (data.gstNumber) {
        if (gstValid) {
            gstScore = 25;
            strengths.push('Valid GST number format');
        } else {
            gstScore = 5;
            concerns.push('GST number format is invalid');
        }
    } else {
        concerns.push('GST number not provided');
    }

    // PAN Validation (25 points max)
    const panValid = validatePAN(data.panNumber || '');
    let panScore = 0;
    if (data.panNumber) {
        if (panValid) {
            panScore = 25;
            strengths.push('Valid PAN number format');
        } else {
            panScore = 5;
            concerns.push('PAN number format is invalid');
        }
    } else {
        concerns.push('PAN number not provided');
    }

    // Phone Validation (15 points max)
    const phoneValid = validatePhone(data.phone || '');
    let phoneScore = 0;
    if (data.phone) {
        if (phoneValid) {
            phoneScore = 15;
            strengths.push('Valid phone number');
        } else {
            phoneScore = 5;
            concerns.push('Phone number format is invalid');
        }
    } else {
        concerns.push('Phone number not provided');
    }

    // Document Score (20 points max)
    let documentScore = 0;
    const docCount = data.documents?.length || 0;
    if (docCount >= 2) {
        documentScore = 20;
        strengths.push(`${docCount} verification documents uploaded`);
    } else if (docCount === 1) {
        documentScore = 10;
        concerns.push('Only 1 document uploaded, recommend at least 2');
    } else {
        concerns.push('No verification documents uploaded');
    }

    // Completeness Score (15 points max)
    let completenessScore = 0;
    const fields = [data.fullName, data.companyName, data.address, data.phone];
    const filledFields = fields.filter(f => f && f.trim()).length;
    completenessScore = Math.round((filledFields / fields.length) * 15);

    if (filledFields === fields.length) {
        strengths.push('Profile is complete');
    } else {
        concerns.push(`Profile is ${Math.round((filledFields / fields.length) * 100)}% complete`);
    }

    // Total Score
    const totalScore = gstScore + panScore + phoneScore + documentScore + completenessScore;

    // Recommendation
    let recommendation = '';
    if (totalScore >= 80) {
        recommendation = 'APPROVE - High confidence profile with valid credentials';
    } else if (totalScore >= 60) {
        recommendation = 'REVIEW - Profile needs additional verification';
    } else if (totalScore >= 40) {
        recommendation = 'CAUTION - Multiple issues detected, manual review required';
    } else {
        recommendation = 'REJECT - Profile appears incomplete or invalid';
    }

    return {
        totalScore,
        gstScore,
        panScore,
        phoneScore,
        documentScore,
        completenessScore,
        gstValid,
        panValid,
        phoneValid,
        analysis: {
            strengths,
            concerns,
            recommendation
        }
    };
}

/**
 * Calculate Advanced ML Score with Document Content Analysis
 * This is the proper ML verification that reads document contents
 */
export async function calculateAdvancedMLScore(data: {
    gstNumber?: string;
    panNumber?: string;
    phone?: string;
    documents?: Array<{ name: string; url: string; type?: string }>;
    fullName?: string;
    companyName?: string;
    email?: string;
}): Promise<MLScoreResult> {
    const profileData: ProfileData = {
        fullName: data.fullName || '',
        companyName: data.companyName || '',
        gstNumber: data.gstNumber || '',
        panNumber: data.panNumber || '',
        phone: data.phone || '',
        email: data.email
    };

    // Run document analysis
    const documents = data.documents || [];
    const { score, breakdown, analysis } = await calculateDocumentMLScore(documents, profileData);

    // Format validation
    const gstValid = validateGST(data.gstNumber || '');
    const panValid = validatePAN(data.panNumber || '');
    const phoneValid = validatePhone(data.phone || '');

    return {
        totalScore: score,
        gstScore: breakdown.gstFormatScore + breakdown.gstDocumentScore,
        panScore: breakdown.panFormatScore + breakdown.panDocumentScore,
        phoneScore: breakdown.phoneFormatScore + breakdown.phoneDocumentScore,
        documentScore: breakdown.nameCompanyScore + breakdown.documentRelevanceScore,
        completenessScore: breakdown.completenessScore,
        gstValid,
        panValid,
        phoneValid,
        documentAnalysis: analysis,
        breakdown,
        analysis: {
            strengths: analysis.strengths,
            concerns: analysis.concerns,
            recommendation: analysis.recommendation
        }
    };
}

/**
 * Get ML Document Analysis using Free LLM Service
 * Tries: Groq (free, fast) → HuggingFace → Local fallback
 */
export async function getGeminiAnalysis(profileData: any): Promise<string> {
    try {
        // Check if we have documents to analyze
        const documents = profileData.documents || [];
        if (documents.length === 0) {
            return 'No documents uploaded. Please upload business documents (GST certificate, PAN card, business registration) for verification.';
        }

        // Analyze documents first
        const { analyzeAllDocuments } = await import('./documentAnalysisService');
        const analysis = await analyzeAllDocuments(documents, {
            fullName: profileData.fullName || profileData.user_name || '',
            companyName: profileData.companyName || profileData.company_name || '',
            gstNumber: profileData.gstNumber || profileData.gst_number || '',
            panNumber: profileData.panNumber || profileData.pan_number || '',
            phone: profileData.phone || ''
        });

        // Use free LLM service with fallback chain
        const { getLLMAnalysis } = await import('./freeLLMService');
        const llmAnalysis = await getLLMAnalysis(analysis, {
            fullName: profileData.fullName || profileData.user_name || '',
            companyName: profileData.companyName || profileData.company_name || '',
            gstNumber: profileData.gstNumber || profileData.gst_number || '',
            panNumber: profileData.panNumber || profileData.pan_number || ''
        });

        return llmAnalysis;
    } catch (error) {
        console.error('LLM analysis error:', error);

        // Final fallback - local analysis
        const score = profileData.ml_score || 0;
        return `AUTOMATED ANALYSIS (Score: ${score}/100):\n\n` +
            `${score >= 70 ? '✅ RECOMMENDATION: APPROVE' : score >= 40 ? '⚠️ RECOMMENDATION: REVIEW' : '❌ RECOMMENDATION: REJECT'}\n\n` +
            `Verification ${score >= 70 ? 'successful' : 'incomplete'}. ` +
            `${score < 70 ? 'Manual review recommended due to insufficient verification.' : 'All critical credentials verified.'}`;
    }
}


/**
 * Generate fallback analysis when LLM is unavailable
 */
function generateFallbackAnalysis(analysis: any): string {
    const parts: string[] = [];

    // Overall assessment
    if (analysis.overallScore >= 70) {
        parts.push('Documents appear legitimate with matching credentials.');
    } else if (analysis.overallScore >= 40) {
        parts.push('Documents require additional review - some mismatches detected.');
    } else {
        parts.push('ALERT: Documents appear suspicious or irrelevant to business verification.');
    }

    // Specific findings
    if (analysis.documents?.some((d: any) => d.foundMatches?.gstMatch)) {
        parts.push('GST number verified in uploaded documents.');
    }
    if (analysis.documents?.some((d: any) => d.foundMatches?.panMatch)) {
        parts.push('PAN number verified in uploaded documents.');
    }

    // Concerns
    if (analysis.concerns && analysis.concerns.length > 0) {
        const topConcerns = analysis.concerns.slice(0, 3);
        parts.push(`Concerns: ${topConcerns.join('; ')}.`);
    }

    // Recommendation
    parts.push(`Recommendation: ${analysis.recommendation || 'Manual review required'}`);

    return parts.join(' ');
}


/**
 * Submit profile for verification
 */
export async function submitProfileForVerification(request: VerificationRequest): Promise<{ success: boolean; error?: string }> {
    try {
        // Calculate ML Score
        const mlScore = calculateMLScore({
            gstNumber: request.gstNumber,
            panNumber: request.panNumber,
            phone: request.phone,
            documents: request.documents,
            fullName: request.userName,
            companyName: request.companyName
        });

        // Create verification queue entry
        const { error: queueError } = await supabase
            .from('verification_queue')
            .upsert({
                profile_type: request.profileType,
                profile_id: request.profileId,
                user_id: request.userId,
                user_email: request.userEmail,
                user_name: request.userName,
                company_name: request.companyName,
                gst_number: request.gstNumber,
                pan_number: request.panNumber,
                phone: request.phone,
                document_count: request.documents?.length || 0,
                documents: request.documents,
                ml_score: mlScore.totalScore,
                ml_analysis: mlScore,
                gst_valid: mlScore.gstValid,
                pan_valid: mlScore.panValid,
                phone_valid: mlScore.phoneValid,
                status: 'pending',
                updated_at: new Date().toISOString()
            }, { onConflict: 'profile_id,profile_type' });

        if (queueError) {
            console.error('Error creating verification queue entry:', queueError);
            // Don't fail the whole operation, just log
        }

        // Update profile verification status
        const tableName = request.profileType === 'seeker' ? 'seeker_profiles' : 'owner_profiles';
        const { error: profileError } = await supabase
            .from(tableName)
            .update({
                verification_status: 'submitted',
                verification_score: mlScore.totalScore,
                submitted_at: new Date().toISOString()
            })
            .eq('id', request.profileId);

        if (profileError) {
            console.error('Error updating profile status:', profileError);
        }

        // Create admin notification
        const { error: notifError } = await supabase
            .from('admin_notifications')
            .insert({
                notification_type: 'new_profile',
                title: `New ${request.profileType} profile for verification`,
                message: `${request.userName} (${request.companyName}) has submitted their profile. ML Score: ${mlScore.totalScore}/100`,
                related_table: tableName,
                related_id: request.profileId
            });

        if (notifError) {
            console.error('Error creating notification:', notifError);
        }

        return { success: true };
    } catch (error) {
        console.error('Error submitting for verification:', error);
        return { success: false, error: 'Failed to submit for verification' };
    }
}

/**
 * Get pending verifications for admin
 */
export async function getPendingVerifications(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('verification_queue')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching pending verifications:', error);
        return [];
    }
}

/**
 * Approve or reject a profile
 * Handles both queue items and direct profile updates
 * Supports profile_id directly since we fetch from seeker_profiles/owner_profiles
 */
export async function reviewProfile(
    profileId: string,
    decision: 'approved' | 'rejected',
    adminNotes: string,
    adminId: string,
    profileType?: 'seeker' | 'owner'
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('🔍 Reviewing profile:', { profileId, decision, profileType });

        // First try to update directly in the appropriate profiles table
        // This is the primary method since profiles are fetched directly from seeker_profiles/owner_profiles
        
        // Try seeker_profiles first
        let { data: seekerProfile, error: seekerError } = await supabase
            .from('seeker_profiles')
            .select('id, full_name, email, user_id')
            .eq('id', profileId)
            .maybeSingle();

        if (seekerProfile) {
            console.log('📝 Found seeker profile, updating status...');
            
            const verificationNotes = decision === 'rejected' 
                ? `REJECTED: ${adminNotes || 'Please update your profile with valid business documents and resubmit for verification. You will not be able to book warehouses until your profile is verified.'}`
                : adminNotes || 'Profile verified successfully';
            
            const { error: updateError } = await supabase
                .from('seeker_profiles')
                .update({
                    verification_status: decision === 'approved' ? 'verified' : 'rejected',
                    verification_notes: verificationNotes,
                    verified_by: adminId,
                    verified_at: new Date().toISOString()
                })
                .eq('id', profileId);

            if (updateError) {
                console.error('❌ Error updating seeker profile:', updateError);
                throw updateError;
            }
            
            console.log(`✅ Seeker profile ${decision} successfully`);
            
            // Try to update verification_queue if it exists (optional, don't fail if table doesn't exist)
            try {
                await supabase
                    .from('verification_queue')
                    .update({
                        status: decision,
                        admin_notes: adminNotes,
                        reviewed_by: adminId,
                        reviewed_at: new Date().toISOString()
                    })
                    .eq('profile_id', profileId);
            } catch (e) {
                console.log('ℹ️ verification_queue table may not exist, skipping');
            }
            
            return { success: true };
        }

        // Try owner_profiles if not found in seeker_profiles
        let { data: ownerProfile, error: ownerError } = await supabase
            .from('owner_profiles')
            .select('id, full_name, email, user_id')
            .eq('id', profileId)
            .maybeSingle();

        if (ownerProfile) {
            console.log('📝 Found owner profile, updating status...');
            
            const verificationNotes = decision === 'rejected' 
                ? `REJECTED: ${adminNotes || 'Please update your profile with valid business documents and resubmit for verification. You will not be able to list warehouses until your profile is verified.'}`
                : adminNotes || 'Profile verified successfully';
            
            const { error: updateError } = await supabase
                .from('owner_profiles')
                .update({
                    verification_status: decision === 'approved' ? 'verified' : 'rejected',
                    verification_notes: verificationNotes,
                    verified_by: adminId,
                    verified_at: new Date().toISOString()
                })
                .eq('id', profileId);

            if (updateError) {
                console.error('❌ Error updating owner profile:', updateError);
                throw updateError;
            }
            
            console.log(`✅ Owner profile ${decision} successfully`);
            
            // Try to update verification_queue if it exists (optional)
            try {
                await supabase
                    .from('verification_queue')
                    .update({
                        status: decision,
                        admin_notes: adminNotes,
                        reviewed_by: adminId,
                        reviewed_at: new Date().toISOString()
                    })
                    .eq('profile_id', profileId);
            } catch (e) {
                console.log('ℹ️ verification_queue table may not exist, skipping');
            }
            
            return { success: true };
        }

        // If we reach here, profile was not found
        console.error('❌ Profile not found in either seeker_profiles or owner_profiles');
        return { success: false, error: 'Profile not found. The profile may have been deleted.' };
        
    } catch (error: any) {
        console.error('❌ Error reviewing profile:', error);
        return { 
            success: false, 
            error: error?.message || 'Failed to update verification status. Please try again.' 
        };
    }
}

/**
 * Get admin notifications
 */
export async function getAdminNotifications(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('admin_notifications')
            .select('*')
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Check if user is verified
 */
export async function checkVerificationStatus(
    userId: string,
    userType: 'seeker' | 'owner'
): Promise<{ isVerified: boolean; status: string }> {
    try {
        const tableName = userType === 'seeker' ? 'seeker_profiles' : 'owner_profiles';
        const { data, error } = await supabase
            .from(tableName)
            .select('verification_status')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return { isVerified: false, status: 'no_profile' };
        }

        return {
            isVerified: data.verification_status === 'verified',
            status: data.verification_status
        };
    } catch (error) {
        console.error('Error checking verification:', error);
        return { isVerified: false, status: 'error' };
    }
}

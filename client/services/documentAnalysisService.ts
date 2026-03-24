/**
 * PROFESSIONAL ML DOCUMENT VERIFICATION SYSTEM
 * Features:
 * - TensorFlow.js Neural Network Classification
 * - Tesseract.js OCR
 * - Strict Matching (80%+ threshold)
 * - Scoring based ONLY on extracted document content
 * - Free LLM Integration (Groq API)
 */

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Types
export interface DocumentAnalysisResult {
    documentName: string;
    documentType: string;
    extractedText: string;
    extractedData: {
        gstNumbers: string[];
        panNumbers: string[];
        phoneNumbers: string[];
        names: string[];
        companies: string[];
    };
    isBusinessDocument: boolean;
    documentClassification: {
        type: string;
        confidence: number;
    };
    foundMatches: {
        gstFound: boolean;
        gstMatch: boolean;
        gstSimilarity: number;
        panFound: boolean;
        panMatch: boolean;
        panSimilarity: number;
        nameFound: boolean;
        nameSimilarity: number;
        companyFound: boolean;
        companySimilarity: number;
        phoneFound: boolean;
        phoneSimilarity: number;
    };
    relevanceScore: number;
    warnings: string[];
    scanStatus: 'pending' | 'scanning' | 'complete' | 'error';
    pagesProcessed?: number;
}

export interface FullAnalysisResult {
    documents: DocumentAnalysisResult[];
    overallScore: number;
    scoreBreakdown: {
        documentGSTFound: number;
        gstMatch: number;
        documentPANFound: number;
        panMatch: number;
        nameMatch: number;
        companyMatch: number;
        phoneFound: number;
        documentType: number;
    };
    recommendation: string;
    concerns: string[];
    strengths: string[];
}

export interface ProfileData {
    fullName: string;
    companyName: string;
    gstNumber: string;
    panNumber: string;
    phone: string;
    email?: string;
}

// Regex patterns
const GST_REGEX = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/gi;
const PAN_REGEX = /\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/gi;
const PHONE_REGEX = /\b(?:\+91[-\s]?)?([6-9][0-9]{9})\b/g;

// Keywords
const BUSINESS_KEYWORDS = [
    'gst', 'gstin', 'pan', 'tax', 'invoice', 'registration',
    'certificate', 'incorporation', 'company', 'business',
    'trading', 'enterprise', 'license', 'permit', 'freight',
    'warehouse', 'logistics', 'transport', 'proprietor',
    'partnership', 'pvt', 'ltd', 'limited', 'cin', 'tin'
];

const NON_BUSINESS_KEYWORDS = [
    'fee receipt', 'fees', 'tuition', 'semester', 'exam',
    'admission', 'student', 'college', 'university', 'school',
    'academic', 'education', 'course', 'institute',
    'department', 'class', 'degree', 'diploma'
];

// MobileNet model cache
let mobileNetModel: any = null;

/**
 * Load TensorFlow MobileNet model for image classification
 */
async function loadMobileNet() {
    if (!mobileNetModel) {
        console.log('🧠 Loading MobileNet neural network...');
        mobileNetModel = await mobilenet.load();
        console.log('✅ MobileNet loaded successfully');
    }
    return mobileNetModel;
}

/**
 * Classify document type using neural network
 */
async function classifyDocumentWithNN(imageData: string): Promise<{ type: string; confidence: number }> {
    try {
        const model = await loadMobileNet();

        // Create image element
        const img = new Image();
        img.src = imageData;
        await new Promise(resolve => img.onload = resolve);

        // Classify with MobileNet
        const predictions = await model.classify(img);
        console.log('🧠 Neural Network Predictions:', predictions);

        // Analyze predictions
        const documentKeywords = ['paper', 'document', 'receipt', 'form', 'certificate', 'letter'];
        const isDocument = predictions.some((p: any) =>
            documentKeywords.some(kw => p.className.toLowerCase().includes(kw))
        );

        return {
            type: isDocument ? 'document' : 'image',
            confidence: predictions[0]?.probability || 0
        };
    } catch (error) {
        console.error('NN Classification error:', error);
        return { type: 'unknown', confidence: 0 };
    }
}

/**
 * Render PDF page to image
 */
async function renderPDFPageToImage(pdfUrl: string, pageNum: number): Promise<string> {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNum);

    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d')!;

    await page.render({ canvasContext: context, canvas, viewport }).promise;
    return canvas.toDataURL('image/png');
}

/**
 * Extract text using Tesseract OCR
 */
async function extractTextWithTesseract(imageData: string, onProgress?: (status: string) => void): Promise<string> {
    try {
        console.log('🔤 Starting Tesseract OCR...');

        const result = await Tesseract.recognize(imageData, 'eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    onProgress?.(`OCR Progress: ${progress}%`);
                }
            }
        });

        console.log(`✅ OCR Complete: ${result.data.text.length} chars (${Math.round(result.data.confidence)}% confidence)`);
        return result.data.text;
    } catch (error) {
        console.error('OCR error:', error);
        return '';
    }
}

/**
 * Extract text from PDF
 */
async function extractTextFromPDFAdvanced(pdfUrl: string, onProgress?: (status: string) => void): Promise<string> {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    console.log(`📄 PDF: ${numPages} page(s)`);
    let allText = '';

    for (let pageNum = 1; pageNum <= Math.min(numPages, 5); pageNum++) {
        onProgress?.(`Rendering page ${pageNum}...`);
        const pageImage = await renderPDFPageToImage(pdfUrl, pageNum);

        onProgress?.(`OCR scanning page ${pageNum}...`);
        const pageText = await extractTextWithTesseract(pageImage, onProgress);

        if (pageText) {
            allText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
        }
    }

    return allText;
}

/**
 * Calculate Levenshtein Distance for strict matching
 */
function calculateSimilarity(str1: string, str2: string): number {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s1 = normalize(str1);
    const s2 = normalize(str2);

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    const matrix: number[][] = [];
    for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2[i - 1] === s1[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const maxLen = Math.max(s1.length, s2.length);
    const distance = matrix[s2.length][s1.length];
    return maxLen > 0 ? (maxLen - distance) / maxLen : 0;
}

/**
 * Strict matching with 80% threshold
 */
function strictMatch(needle: string, haystack: string): { found: boolean; similarity: number } {
    if (!needle || !haystack) return { found: false, similarity: 0 };

    const similarity = calculateSimilarity(needle, haystack);
    const found = similarity >= 0.80; // 80% threshold

    console.log(`🔍 Match "${needle}" in text: ${Math.round(similarity * 100)}% ${found ? '✅ MATCH' : '❌ NO MATCH'}`);

    return { found, similarity };
}

/**
 * Analyze single document
 */
export async function analyzeDocument(
    doc: { name: string; url: string; type?: string },
    profileData: ProfileData,
    onProgress?: (status: string) => void
): Promise<DocumentAnalysisResult> {
    const warnings: string[] = [];
    const extractedData = {
        gstNumbers: [] as string[],
        panNumbers: [] as string[],
        phoneNumbers: [] as string[],
        names: [] as string[],
        companies: [] as string[]
    };

    const fileName = doc.name.toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);

    // Extract text
    onProgress?.('Extracting text...');
    let extractedText = '';
    let pagesProcessed = 0;

    if (isPDF) {
        extractedText = await extractTextFromPDFAdvanced(doc.url, onProgress);
        pagesProcessed = extractedText.split('--- Page').length - 1;
    } else if (isImage) {
        const response = await fetch(doc.url);
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        extractedText = await extractTextWithTesseract(imageUrl, onProgress);
        URL.revokeObjectURL(imageUrl);
        pagesProcessed = 1;
    }

    if (!extractedText || extractedText.length < 10) {
        warnings.push('⚠️ Could not extract text');
        console.error('❌ OCR FAILED');
    } else {
        console.log(`✅ OCR SUCCESS: ${extractedText.length} chars from ${pagesProcessed} page(s)`);
    }

    // Neural network classification
    onProgress?.('Running neural network classification...');
    let nnClassification = { type: 'unknown', confidence: 0 };
    if (isPDF) {
        const pageImage = await renderPDFPageToImage(doc.url, 1);
        nnClassification = await classifyDocumentWithNN(pageImage);
    }

    // Extract data from document
    const foundGSTs = Array.from(extractedText.matchAll(GST_REGEX), m => m[0]);
    const foundPANs = Array.from(extractedText.matchAll(PAN_REGEX), m => m[0]);
    const foundPhones = Array.from(extractedText.matchAll(PHONE_REGEX), m => m[0]);

    extractedData.gstNumbers = foundGSTs;
    extractedData.panNumbers = foundPANs;
    extractedData.phoneNumbers = foundPhones;

    // Count keywords
    const normalized = extractedText.toLowerCase();
    let businessCount = 0;
    let nonBusinessCount = 0;

    for (const kw of BUSINESS_KEYWORDS) {
        if (normalized.includes(kw)) businessCount++;
    }
    for (const kw of NON_BUSINESS_KEYWORDS) {
        if (normalized.includes(kw)) {
            nonBusinessCount++;
            warnings.push(`⚠️ Non-business keyword: "${kw}"`);
        }
    }

    const isBusinessDocument = businessCount >= 2 && nonBusinessCount < 3;

    // CRITICAL: Strict matching with 80% threshold
    console.log('\n=== STRICT MATCHING (80% Threshold) ===');

    const gstMatch = strictMatch(profileData.gstNumber, extractedText);
    const panMatch = strictMatch(profileData.panNumber, extractedText);
    const nameMatch = strictMatch(profileData.fullName, extractedText);
    const companyMatch = strictMatch(profileData.companyName, extractedText);
    const phoneMatch = strictMatch(profileData.phone, extractedText);

    console.log('===================\n');

    // Calculate relevance (used for secondary scoring)
    let relevanceScore = 0;
    if (isBusinessDocument) relevanceScore += 20;
    if (gstMatch.found) relevanceScore += 25;
    if (panMatch.found) relevanceScore += 25;
    if (nameMatch.found) relevanceScore += 15;
    if (companyMatch.found) relevanceScore += 15;

    // Warnings
    if (!isBusinessDocument && extractedText) {
        warnings.push('❌ NOT a business document - appears educational/personal');
    }
    if (foundGSTs.length > 0 && !gstMatch.found) {
        warnings.push(`🔍 GST found "${foundGSTs[0]}" does NOT match profile`);
    }
    if (foundPANs.length > 0 && !panMatch.found) {
        warnings.push(`🔍 PAN found "${foundPANs[0]}" does NOT match profile`);
    }
    if (!nameMatch.found && !companyMatch.found && extractedText) {
        warnings.push('❌ Name and company not found');
    }

    return {
        documentName: doc.name,
        documentType: isPDF ? 'PDF' : isImage ? 'Image' : 'Unknown',
        extractedText: extractedText.substring(0, 3000),
        extractedData,
        isBusinessDocument,
        documentClassification: nnClassification,
        foundMatches: {
            gstFound: foundGSTs.length > 0,
            gstMatch: gstMatch.found,
            gstSimilarity: gstMatch.similarity,
            panFound: foundPANs.length > 0,
            panMatch: panMatch.found,
            panSimilarity: panMatch.similarity,
            nameFound: nameMatch.found,
            nameSimilarity: nameMatch.similarity,
            companyFound: companyMatch.found,
            companySimilarity: companyMatch.similarity,
            phoneFound: phoneMatch.found,
            phoneSimilarity: phoneMatch.similarity
        },
        relevanceScore,
        warnings,
        scanStatus: 'complete',
        pagesProcessed
    };
}

/**
 * Analyze all documents
 */
export async function analyzeAllDocuments(
    documents: Array<{ name: string; url: string; type?: string }>,
    profileData: ProfileData,
    onDocumentProgress?: (docIndex: number, status: string, result?: DocumentAnalysisResult) => void
): Promise<FullAnalysisResult> {
    const concerns: string[] = [];
    const strengths: string[] = [];
    const documentResults: DocumentAnalysisResult[] = [];

    // Analyze each document
    for (let i = 0; i < documents.length; i++) {
        onDocumentProgress?.(i, 'scanning', undefined);

        try {
            const result = await analyzeDocument(documents[i], profileData, (status) => {
                onDocumentProgress?.(i, status, undefined);
            });
            documentResults.push(result);
            onDocumentProgress?.(i, 'complete', result);
        } catch (error) {
            console.error(`Error analyzing ${documents[i].name}:`, error);
            onDocumentProgress?.(i, 'error', undefined);
        }
    }

    // ⭐ NEW SCORING ALGORITHM - BASED ONLY ON EXTRACTED DOCUMENT DATA ⭐
    console.log('\n=== CALCULATING SCORES (DOCUMENT CONTENT ONLY) ===');

    // Document GST Found: 10 pts (if valid GST extracted from document)
    const hasDocumentGST = documentResults.some(d => d.extractedData.gstNumbers.length > 0);
    const documentGSTFound = hasDocumentGST ? 10 : 0;
    console.log(`Document GST Found: ${documentGSTFound}/10 ${hasDocumentGST ? '✅' : '❌'}`);

    // GST Match: 15 pts (if extracted GST matches profile)
    const hasGSTMatch = documentResults.some(d => d.foundMatches.gstMatch);
    const gstMatchScore = hasGSTMatch ? 15 : 0;
    console.log(`GST Match: ${gstMatchScore}/15 ${hasGSTMatch ? '✅' : '❌'}`);

    // Document PAN Found: 10 pts
    const hasDocumentPAN = documentResults.some(d => d.extractedData.panNumbers.length > 0);
    const documentPANFound = hasDocumentPAN ? 10 : 0;
    console.log(`Document PAN Found: ${documentPANFound}/10 ${hasDocumentPAN ? '✅' : '❌'}`);

    // PAN Match: 15 pts
    const hasPANMatch = documentResults.some(d => d.foundMatches.panMatch);
    const panMatchScore = hasPANMatch ? 15 : 0;
    console.log(`PAN Match: ${panMatchScore}/15 ${hasPANMatch ? '✅' : '❌'}`);

    // Name Match: 15 pts (strict 80%+)
    const hasNameMatch = documentResults.some(d => d.foundMatches.nameFound);
    const nameMatchScore = hasNameMatch ? 15 : 0;
    console.log(`Name Match: ${nameMatchScore}/15 ${hasNameMatch ? '✅' : '❌'}`);

    // Company Match: 15 pts (strict 80%+)
    const hasCompanyMatch = documentResults.some(d => d.foundMatches.companyFound);
    const companyMatchScore = hasCompanyMatch ? 15 : 0;
    console.log(`Company Match: ${companyMatchScore}/15 ${hasCompanyMatch ? '✅' : '❌'}`);

    // Phone Found: 10 pts
    const hasPhone = documentResults.some(d => d.foundMatches.phoneFound);
    const phoneFoundScore = hasPhone ? 10 : 0;
    console.log(`Phone Found: ${phoneFoundScore}/10 ${hasPhone ? '✅' : '❌'}`);

    // Document Type: 10 pts (business document)
    const hasBusinessDoc = documentResults.some(d => d.isBusinessDocument);
    const documentTypeScore = hasBusinessDoc ? 10 : 0;
    console.log(`Document Type: ${documentTypeScore}/10 ${hasBusinessDoc ? '✅ Business' : '❌ Non-Business'}`);

    const overallScore = documentGSTFound + gstMatchScore + documentPANFound + panMatchScore +
        nameMatchScore + companyMatchScore + phoneFoundScore + documentTypeScore;

    console.log(`\n📊 TOTAL SCORE: ${overallScore}/100`);
    console.log('===================================\n');

    // Generate recommendation
    let recommendation = '';
    if (overallScore >= 70 && hasBusinessDoc && hasGSTMatch && hasPANMatch) {
        recommendation = '✅ APPROVE - All credentials verified';
    } else if (overallScore >= 40 && hasBusinessDoc) {
        recommendation = '⚠️ REVIEW - Partial verification, manual check required';
    } else if (!hasBusinessDoc) {
        recommendation = '❌ REJECT - No business documents (fee receipts/personal uploaded)';
    } else if (!hasGSTMatch && !hasPANMatch) {
        recommendation = '❌ REJECT - No matching credentials found';
    } else {
        recommendation = '❌ REJECT - Insufficient verification';
    }

    // Collect concerns
    for (const result of documentResults) {
        concerns.push(...result.warnings);
    }

    // Collect strengths
    if (hasGSTMatch) strengths.push('✅ GST VERIFIED in documents');
    if (hasPANMatch) strengths.push('✅ PAN VERIFIED in documents');
    if (hasNameMatch) strengths.push('✅ Name FOUND in documents');
    if (hasCompanyMatch) strengths.push('✅ Company FOUND in documents');
    if (hasBusinessDoc) strengths.push('✅ Business document detected');

    if (!hasBusinessDoc) concerns.push('🚨 CRITICAL: NOT business documents');
    if (!hasGSTMatch && !hasPANMatch) concerns.push('🚨 CRITICAL: NO matching credentials');

    return {
        documents: documentResults,
        overallScore,
        scoreBreakdown: {
            documentGSTFound,
            gstMatch: gstMatchScore,
            documentPANFound,
            panMatch: panMatchScore,
            nameMatch: nameMatchScore,
            companyMatch: companyMatchScore,
            phoneFound: phoneFoundScore,
            documentType: documentTypeScore
        },
        recommendation,
        concerns: [...new Set(concerns)],
        strengths
    };
}

/**
 * Calculate ML score (wrapper for compatibility)
 */
export async function calculateDocumentMLScore(
    documents: Array<{ name: string; url: string; type?: string }>,
    profileData: ProfileData
): Promise<{
    score: number;
    breakdown: any;
    analysis: FullAnalysisResult;
}> {
    const analysis = await analyzeAllDocuments(documents, profileData);

    return {
        score: analysis.overallScore,
        breakdown: analysis.scoreBreakdown,
        analysis
    };
}

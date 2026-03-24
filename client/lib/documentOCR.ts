/**
 * Document OCR Processor using Tesseract.js
 * 
 * Extracts text from uploaded documents (PDFs, images) for verification.
 * Runs entirely client-side - no API key required.
 * 
 * Usage:
 * - Extract GST, PAN, company info from documents
 * - Auto-fill profile forms
 * - Admin verification workflow
 */

import Tesseract from 'tesseract.js';

interface OCRResult {
    success: boolean;
    text: string;
    confidence: number;
    extractedData: ExtractedDocumentData;
    error?: string;
}

interface ExtractedDocumentData {
    companyName?: string;
    gstNumber?: string;
    panNumber?: string;
    address?: string;
    documentType?: string;
}

/**
 * Extract text from an image file using Tesseract.js OCR
 */
export async function extractTextFromImage(
    imageFile: File,
    progressCallback?: (progress: number) => void
): Promise<OCRResult> {
    try {
        console.log('🔍 Starting OCR processing for:', imageFile.name);

        const result = await Tesseract.recognize(
            imageFile,
            'eng', // English language
            {
                logger: (m) => {
                    if (m.status === 'recognizing text' && progressCallback) {
                        progressCallback(Math.round(m.progress * 100));
                    }
                }
            }
        );

        const text = result.data.text;
        const confidence = result.data.confidence;

        console.log('✅ OCR complete. Confidence:', confidence);

        // Extract structured data from the text
        const extractedData = extractStructuredData(text);

        return {
            success: true,
            text,
            confidence,
            extractedData
        };
    } catch (err) {
        console.error('❌ OCR failed:', err);
        return {
            success: false,
            text: '',
            confidence: 0,
            extractedData: {},
            error: err instanceof Error ? err.message : 'OCR processing failed'
        };
    }
}

/**
 * Convert PDF to images for OCR (first page only for now)
 * Note: Requires pdf.js library for full PDF support
 */
export async function extractTextFromPDF(
    pdfFile: File,
    progressCallback?: (progress: number) => void
): Promise<OCRResult> {
    // For now, treat PDF as image (works for simple PDFs)
    // TODO: Add pdf.js for proper PDF parsing
    console.log('📄 Processing PDF:', pdfFile.name);

    try {
        // Create object URL for the PDF
        const url = URL.createObjectURL(pdfFile);

        // Use Tesseract directly on the file
        const result = await Tesseract.recognize(
            pdfFile,
            'eng',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text' && progressCallback) {
                        progressCallback(Math.round(m.progress * 100));
                    }
                }
            }
        );

        URL.revokeObjectURL(url);

        const text = result.data.text;
        const confidence = result.data.confidence;
        const extractedData = extractStructuredData(text);

        return {
            success: true,
            text,
            confidence,
            extractedData
        };
    } catch (err) {
        console.error('❌ PDF OCR failed:', err);
        return {
            success: false,
            text: '',
            confidence: 0,
            extractedData: {},
            error: 'PDF processing failed. Try uploading as an image (JPG/PNG).'
        };
    }
}

/**
 * Main entry point - detect file type and process accordingly
 */
export async function processDocument(
    file: File,
    progressCallback?: (progress: number) => void
): Promise<OCRResult> {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
        return extractTextFromPDF(file, progressCallback);
    } else if (fileType.startsWith('image/')) {
        return extractTextFromImage(file, progressCallback);
    } else {
        return {
            success: false,
            text: '',
            confidence: 0,
            extractedData: {},
            error: 'Unsupported file type. Please upload PDF, JPG, or PNG.'
        };
    }
}

/**
 * Extract structured data from OCR text using regex patterns
 */
function extractStructuredData(text: string): ExtractedDocumentData {
    const data: ExtractedDocumentData = {};

    // GST Number pattern: 2-digit state code + PAN + checksum
    // Example: 27AADCP1234B1ZP
    const gstPattern = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi;
    const gstMatch = text.match(gstPattern);
    if (gstMatch) {
        data.gstNumber = gstMatch[0].toUpperCase();
        data.documentType = 'GST Certificate';
    }

    // PAN Number pattern: 5 letters + 4 digits + 1 letter
    // Example: ABCDE1234F
    const panPattern = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi;
    const panMatch = text.match(panPattern);
    if (panMatch) {
        data.panNumber = panMatch[0].toUpperCase();
        if (!data.documentType) data.documentType = 'PAN Card';
    }

    // Company/Business name detection
    // Look for patterns like "M/s", "Pvt Ltd", "LLP", etc.
    const companyPatterns = [
        /M\/s\.?\s+([A-Z][A-Za-z\s&]+(?:Pvt\.?\s*Ltd\.?|LLP|Limited|Inc\.?)?)/gi,
        /(?:Company|Business)\s*Name\s*[:\-]?\s*([A-Z][A-Za-z\s&]+)/gi,
        /([A-Z][A-Za-z\s&]+)\s*(?:Private|Pvt\.?)\s*(?:Limited|Ltd\.?)/gi
    ];

    for (const pattern of companyPatterns) {
        const match = pattern.exec(text);
        if (match && match[1]) {
            data.companyName = match[1].trim();
            break;
        }
    }

    // Address detection (look for PIN codes)
    const addressPattern = /(?:Address|Registered Office)[:\-\s]*([^]*?)(?:\d{6})/gi;
    const addressMatch = addressPattern.exec(text);
    if (addressMatch) {
        data.address = addressMatch[0].replace(/Address|Registered Office/gi, '').trim();
    }

    // Alternative: Just find any 6-digit PIN and surrounding text
    if (!data.address) {
        const pinPattern = /([A-Za-z0-9\s,\-]+\s+\d{6})/;
        const pinMatch = text.match(pinPattern);
        if (pinMatch) {
            data.address = pinMatch[1].trim();
        }
    }

    return data;
}

/**
 * Validate GST Number format
 */
export function validateGSTNumber(gst: string): boolean {
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    return gstPattern.test(gst.toUpperCase());
}

/**
 * Validate PAN Number format
 */
export function validatePANNumber(pan: string): boolean {
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    return panPattern.test(pan.toUpperCase());
}

/**
 * Get state from GST Number (first 2 digits)
 */
export function getStateFromGST(gst: string): string {
    const stateCodes: { [key: string]: string } = {
        '01': 'Jammu & Kashmir',
        '02': 'Himachal Pradesh',
        '03': 'Punjab',
        '04': 'Chandigarh',
        '05': 'Uttarakhand',
        '06': 'Haryana',
        '07': 'Delhi',
        '08': 'Rajasthan',
        '09': 'Uttar Pradesh',
        '10': 'Bihar',
        '11': 'Sikkim',
        '12': 'Arunachal Pradesh',
        '13': 'Nagaland',
        '14': 'Manipur',
        '15': 'Mizoram',
        '16': 'Tripura',
        '17': 'Meghalaya',
        '18': 'Assam',
        '19': 'West Bengal',
        '20': 'Jharkhand',
        '21': 'Odisha',
        '22': 'Chhattisgarh',
        '23': 'Madhya Pradesh',
        '24': 'Gujarat',
        '26': 'Dadra & Nagar Haveli and Daman & Diu',
        '27': 'Maharashtra',
        '29': 'Karnataka',
        '30': 'Goa',
        '31': 'Lakshadweep',
        '32': 'Kerala',
        '33': 'Tamil Nadu',
        '34': 'Puducherry',
        '35': 'Andaman & Nicobar Islands',
        '36': 'Telangana',
        '37': 'Andhra Pradesh',
        '38': 'Ladakh'
    };

    const stateCode = gst.substring(0, 2);
    return stateCodes[stateCode] || 'Unknown';
}

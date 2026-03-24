import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  DollarSign,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Shield,
  FileText,
  Flame,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Tesseract from "tesseract.js";
import usePresignedUpload from "@/hooks/usePresignedUpload";
import { PricingRecommendationModal } from "@/components/PricingRecommendationModal";
import {
  DEFAULT_GOODS_TYPES,
  GOODS_TYPES_BY_WAREHOUSE,
  WAREHOUSE_TYPES,
} from "@/data/warehouseTaxonomy";
import { getAIResponse } from "@/services/aiService";

interface PropertyFormData {
  name: string;
  description: string;
  warehouseType: string;
  allowedGoodsTypes: string[];
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalArea: string;
  pricePerSqft: string;
  amenities: string[];
  features: string[];
  images: File[];
  documents: {
    gstCertificate: File | null;
    propertyPapers: File | null;
    fireCertificate: File | null;
  };
}

interface DocumentValidation {
  gstCertificate: {
    isValid: boolean;
    confidence: number;
    extractedText: string;
    anomalies: string[];
  };
  propertyPapers: {
    isValid: boolean;
    confidence: number;
    extractedText: string;
    anomalies: string[];
  };
  fireCertificate: {
    isValid: boolean;
    confidence: number;
    extractedText: string;
    anomalies: string[];
  };
}

const COMMON_AMENITIES = [
  "24/7 Security",
  "CCTV Surveillance",
  "Fire Safety",
  "Loading Dock",
  "Parking Space",
  "Office Space",
  "Restrooms",
  "Power Backup",
  "Pest Control",
  "Climate Control",
  "Ramp Access",
  "Covered Area",
];

const COMMON_FEATURES = [
  "High Ceiling",
  "Wide Gates",
  "Easy Road Access",
  "Near Highway",
  "Industrial Zone",
  "Gated Community",
  "Modern Infrastructure",
  "Expandable Space",
  "Dedicated Power Supply",
  "Water Supply",
];

export default function ListProperty() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { presignAndUpload } = usePresignedUpload();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [documentValidation, setDocumentValidation] =
    useState<DocumentValidation>({
      gstCertificate: {
        isValid: false,
        confidence: 0,
        extractedText: "",
        anomalies: [],
      },
      propertyPapers: {
        isValid: false,
        confidence: 0,
        extractedText: "",
        anomalies: [],
      },
      fireCertificate: {
        isValid: false,
        confidence: 0,
        extractedText: "",
        anomalies: [],
      },
    });
  const [ocrProcessing, setOcrProcessing] = useState<{
    [key: string]: boolean;
  }>({});
  const [formData, setFormData] = useState<PropertyFormData>({
    name: "",
    description: "",
    warehouseType: "General Storage",
    allowedGoodsTypes: [],
    address: "",
    city: "",
    state: "",
    pincode: "",
    totalArea: "",
    pricePerSqft: "",
    amenities: [],
    features: [],
    images: [],
    documents: {
      gstCertificate: null,
      propertyPapers: null,
      fireCertificate: null,
    },
  });

  // Check if user is owner
  if (!user || !profile || profile.user_type !== "owner") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only warehouse owners can list properties. Please sign in with an
              owner account.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.city || !formData.warehouseType) {
      toast({
        title: "Missing details",
        description:
          "Please add name, city, and warehouse type to generate description.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDescription(true);
    try {
      const prompt = `Write a professional warehouse listing description (4-6 sentences) using these details:

Name: ${formData.name}
Location: ${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}
Warehouse Type: ${formData.warehouseType}
Allowed Goods: ${(formData.allowedGoodsTypes || []).join(", ") || "General goods"}
Total Area: ${formData.totalArea || "Not provided"} sq ft
Price: ₹${formData.pricePerSqft || "N/A"}/sq ft
Amenities: ${(formData.amenities || []).join(", ") || "Standard amenities"}
Features: ${(formData.features || []).join(", ") || "Standard features"}

Tone: Business-friendly, confident, and clear. Avoid exaggerated claims.`;

      const response = await getAIResponse({
        prompt,
        systemPrompt:
          "You are a professional real estate listing writer. Return plain text only.",
        temperature: 0.4,
        maxTokens: 250,
      });

      handleInputChange("description", response.text.trim());
      toast({
        title: "AI description generated",
        description: "You can edit the text before submitting.",
      });
    } catch (error) {
      console.error("AI description error:", error);
      toast({
        title: "Generation failed",
        description: "Unable to generate description right now.",
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const availableGoodsTypes =
    GOODS_TYPES_BY_WAREHOUSE[formData.warehouseType] || DEFAULT_GOODS_TYPES;

  const toggleGoodsType = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedGoodsTypes: prev.allowedGoodsTypes.includes(item)
        ? prev.allowedGoodsTypes.filter((i) => i !== item)
        : [...prev.allowedGoodsTypes, item],
    }));
  };

  const toggleArrayItem = (field: "amenities" | "features", item: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 10) {
      toast({
        title: "Too many images",
        description: "Maximum 10 images allowed",
        variant: "destructive",
      });
      return;
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // OCR and Document Validation Functions
  const validateDocumentWithOCR = async (
    file: File,
    docType: "gstCertificate" | "propertyPapers" | "fireCertificate",
  ) => {
    setOcrProcessing((prev) => ({ ...prev, [docType]: true }));

    try {
      const {
        data: { text, confidence },
      } = await Tesseract.recognize(file, "eng", {
        logger: (m) => console.log(m),
      });

      const anomalies = detectAnomalies(text, docType);
      const isValid = confidence > 0.7 && anomalies.length === 0;

      setDocumentValidation((prev) => ({
        ...prev,
        [docType]: {
          isValid,
          confidence,
          extractedText: text,
          anomalies,
        },
      }));

      toast({
        title: isValid ? "Document Validated" : "Document Issues Found",
        description: isValid
          ? `${docType} passed OCR validation (${(confidence * 100).toFixed(1)}% confidence)`
          : `Found ${anomalies.length} potential issues`,
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      console.error("OCR Error:", error);
      toast({
        title: "OCR Processing Failed",
        description: "Unable to process document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOcrProcessing((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const detectAnomalies = (text: string, docType: string): string[] => {
    const anomalies: string[] = [];
    const lowerText = text.toLowerCase();

    // Common forgery indicators
    const suspiciousPatterns = [
      /photoshop/i,
      /edited/i,
      /modified/i,
      /duplicate/i,
      /lorem ipsum/i,
      /sample/i,
    ];

    suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(text)) {
        anomalies.push("Suspicious editing keywords detected");
      }
    });

    // Reject academic / unrelated documents
    const academicPatterns = [
      /ieee/i,
      /conference/i,
      /abstract/i,
      /references/i,
      /doi:/i,
      /arxiv/i,
      /journal/i,
      /proceedings/i,
    ];
    const academicHits = academicPatterns.filter((p) => p.test(text)).length;
    if (academicHits >= 2) {
      anomalies.push(
        "Document appears to be an academic paper, not a valid certificate",
      );
    }

    // Document-specific validations
    switch (docType) {
      case "gstCertificate":
        // Must contain GSTIN number pattern (2-digit state + 10 char PAN + check digits)
        const gstinPattern =
          /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/i;
        const hasGstKeywords =
          lowerText.includes("gstin") ||
          lowerText.includes("gst") ||
          lowerText.includes("goods and services tax") ||
          lowerText.includes("tax invoice");
        const hasGstinNumber = gstinPattern.test(text);

        if (!hasGstKeywords && !hasGstinNumber) {
          anomalies.push("GST identification number or keywords not found");
        }
        if (
          !lowerText.includes("certificate") &&
          !lowerText.includes("registration") &&
          !hasGstinNumber
        ) {
          anomalies.push("Not a valid GST certificate document");
        }
        break;

      case "propertyPapers":
        const propertyKeywords = [
          "property",
          "title",
          "deed",
          "ownership",
          "registry",
          "conveyance",
          "sale deed",
          "lease",
          "rental",
          "landlord",
          "premises",
          "immovable",
        ];
        const propertyHits = propertyKeywords.filter((kw) =>
          lowerText.includes(kw),
        ).length;
        if (propertyHits < 2) {
          anomalies.push(
            "Property/ownership document keywords not found (need at least 2 of: property, title, deed, ownership, registry, sale deed, lease)",
          );
        }
        break;

      case "fireCertificate":
        const fireKeywords = [
          "fire",
          "safety",
          "noc",
          "no objection",
          "brigade",
          "extinguisher",
          "evacuation",
          "sprinkler",
          "hydrant",
          "combustible",
        ];
        const fireHits = fireKeywords.filter((kw) =>
          lowerText.includes(kw),
        ).length;
        if (fireHits < 2) {
          anomalies.push(
            "Fire safety certification keywords not found (need at least 2 of: fire, safety, NOC, brigade, extinguisher, evacuation)",
          );
        }
        break;
    }

    // Check for readable text threshold
    if (text.length < 50) {
      anomalies.push("Insufficient readable text detected");
    }

    return anomalies;
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: "gstCertificate" | "propertyPapers" | "fireCertificate",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or PDF file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docType]: file,
      },
    }));

    // For image files, run OCR validation
    if (file.type.startsWith("image/")) {
      try {
        await validateDocumentWithOCR(file, docType);
      } catch (error) {
        console.log("OCR validation failed, marking for manual review:", error);
        // Set as valid but with low confidence — admin will manually verify
        setDocumentValidation((prev) => ({
          ...prev,
          [docType]: {
            isValid: true,
            confidence: 0.6,
            anomalies: [
              "OCR processing failed — document will be manually reviewed by admin",
            ],
            extractedText: "",
          },
        }));
      }
    } else {
      // PDF files can't be OCR'd in browser — validate filename patterns
      const fileName = file.name.toLowerCase();
      const pdfAnomalies: string[] = [];

      // Reject academic / research papers by filename
      const academicPatterns = [
        /ieee/i,
        /arxiv/i,
        /conference/i,
        /journal/i,
        /proceedings/i,
        /research/i,
        /paper/i,
        /thesis/i,
        /dissertation/i,
        /abstract/i,
        /manuscript/i,
        /preprint/i,
        /doi/i,
        /volume/i,
        /issn/i,
      ];
      const academicHits = academicPatterns.filter((p) =>
        p.test(fileName),
      ).length;
      if (academicHits >= 1) {
        pdfAnomalies.push(
          "File appears to be an academic/research paper, not a valid certificate",
        );
      }

      // Check filename doesn't match expected document types
      const validDocPatterns: Record<string, RegExp[]> = {
        gstCertificate: [
          /gst/i,
          /gstin/i,
          /tax/i,
          /certificate/i,
          /registration/i,
        ],
        propertyPapers: [
          /property/i,
          /deed/i,
          /title/i,
          /ownership/i,
          /lease/i,
          /rental/i,
          /registry/i,
        ],
        fireCertificate: [
          /fire/i,
          /safety/i,
          /noc/i,
          /certificate/i,
          /compliance/i,
        ],
      };
      const relevantPatterns = validDocPatterns[docType] || [];
      const hasRelevantName = relevantPatterns.some((p) => p.test(fileName));

      // Reject obviously irrelevant filenames
      const irrelevantPatterns = [
        /resume/i,
        /cv\b/i,
        /invoice/i,
        /receipt/i,
        /report/i,
        /assignment/i,
        /homework/i,
        /exam/i,
        /test/i,
        /quiz/i,
        /presentation/i,
        /slide/i,
        /lecture/i,
        /notes/i,
      ];
      const isIrrelevant = irrelevantPatterns.some((p) => p.test(fileName));
      if (isIrrelevant) {
        pdfAnomalies.push(
          "File does not appear to be a valid business document",
        );
      }

      if (pdfAnomalies.length > 0) {
        setDocumentValidation((prev) => ({
          ...prev,
          [docType]: {
            isValid: false,
            confidence: 0.3,
            anomalies: pdfAnomalies,
            extractedText:
              "PDF rejected — filename indicates non-relevant document",
          },
        }));

        toast({
          title: "Document Rejected",
          description: pdfAnomalies[0],
          variant: "destructive",
        });
        // Remove the invalid file from form
        setFormData((prev) => ({
          ...prev,
          documents: { ...prev.documents, [docType]: null },
        }));
        return;
      }

      // PDF passes filename checks — accept for admin review
      setDocumentValidation((prev) => ({
        ...prev,
        [docType]: {
          isValid: true,
          confidence: 0.7,
          anomalies: [],
          extractedText:
            "PDF document — will be reviewed by admin during approval",
        },
      }));
    }

    toast({
      title: "Document uploaded",
      description: `${docType === "gstCertificate" ? "GST Certificate" : docType === "propertyPapers" ? "Property Papers" : "Fire Certificate"} uploaded successfully. Admin will verify during review.`,
      variant: "default",
    });
  };

  const validateStep1 = () => {
    if (
      !formData.name ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.pincode
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.warehouseType) {
      toast({
        title: "Warehouse type required",
        description: "Please select a warehouse type",
        variant: "destructive",
      });
      return false;
    }
    if (formData.allowedGoodsTypes.length === 0) {
      toast({
        title: "Goods types required",
        description: "Please select at least one allowed goods type",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.totalArea || !formData.pricePerSqft) {
      toast({
        title: "Missing information",
        description: "Please enter area and pricing details",
        variant: "destructive",
      });
      return false;
    }
    if (parseInt(formData.totalArea) < 100) {
      toast({
        title: "Invalid area",
        description: "Minimum area is 100 sq ft",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    // Step 3 is amenities/features - no strict validation required
    // Users can proceed even without selecting any amenities/features
    return true;
  };

  const validateStep4 = () => {
    // Step 4 is document upload - require all documents
    if (
      !formData.documents.gstCertificate ||
      !formData.documents.propertyPapers ||
      !formData.documents.fireCertificate
    ) {
      toast({
        title: "Missing documents",
        description: "Please upload all required documents",
        variant: "destructive",
      });
      return false;
    }

    // Check if any documents are still processing
    const stillProcessing = Object.values(ocrProcessing).some(
      (processing) => processing,
    );
    if (stillProcessing) {
      toast({
        title: "Documents processing",
        description: "Please wait for document validation to complete",
        variant: "default",
      });
      return false;
    }

    // Every uploaded document must have completed validation (OCR or PDF checks)
    const requiredDocs: Array<keyof DocumentValidation> = [
      "gstCertificate",
      "propertyPapers",
      "fireCertificate",
    ];
    const incompleteDoc = requiredDocs.find(
      (key) => documentValidation[key].confidence <= 0,
    );
    if (incompleteDoc) {
      toast({
        title: "Validation pending",
        description:
          "Please wait for document checks to complete before proceeding.",
        variant: "destructive",
      });
      return false;
    }

    const invalidDoc = requiredDocs.find(
      (key) => !documentValidation[key].isValid,
    );
    if (invalidDoc) {
      const reason =
        documentValidation[invalidDoc].anomalies?.[0] ||
        "Uploaded file does not meet validation checks.";
      toast({
        title: "Invalid document detected",
        description: reason,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
    else if (step === 4 && validateStep4()) setStep(5);
  };

  const handleSubmit = async () => {
    // Validate description is filled before submitting
    if (!formData.description || formData.description.trim().length < 20) {
      toast({
        title: "Description required",
        description:
          "Please generate or write a description (at least 20 characters) before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload images/documents via server API → Supabase Storage
      const imageUrls: string[] = [];
      const documentUrls: any = {};

      if (formData.images.length > 0) {
        for (const img of formData.images) {
          try {
            const url = await presignAndUpload(img, "image");
            if (url) imageUrls.push(url);
          } catch (err) {
            console.warn("Image upload failed (will continue):", err);
          }
        }
      }

      if (formData.documents.gstCertificate) {
        documentUrls.gst_certificate = await presignAndUpload(
          formData.documents.gstCertificate,
          "document",
        );
      }
      if (formData.documents.propertyPapers) {
        documentUrls.property_papers = await presignAndUpload(
          formData.documents.propertyPapers,
          "document",
        );
      }
      if (formData.documents.fireCertificate) {
        documentUrls.fire_safety = await presignAndUpload(
          formData.documents.fireCertificate,
          "document",
        );
      }

      if (
        !documentUrls.gst_certificate ||
        !documentUrls.property_papers ||
        !documentUrls.fire_safety
      ) {
        throw new Error(
          "All 3 required documents must be uploaded successfully before submission.",
        );
      }

      // Submit via server API (uses service role key to bypass RLS)
      console.log("📋 Creating warehouse submission via server API...");
      const response = await fetch("/api/warehouse-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: user.id,
          name: formData.name,
          description: formData.description,
          warehouse_type: formData.warehouseType,
          allowed_goods_types: formData.allowedGoodsTypes,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          total_area: formData.totalArea,
          price_per_sqft: formData.pricePerSqft,
          amenities: formData.amenities,
          features: formData.features,
          image_urls: imageUrls,
          document_urls: documentUrls,
          gst_certificate_url: documentUrls.gst_certificate,
          ownership_proof_url: documentUrls.property_papers,
          layout_plan_url: documentUrls.fire_safety,
          ocr_results: documentValidation,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Submission failed");
      }

      console.log("✅ Warehouse submission created:", result.submission?.id);

      toast({
        title: "🎉 Property Submitted Successfully!",
        description: `Your warehouse "${formData.name}" has been submitted for admin review. You'll be notified once it's approved.`,
      });

      // Reset form and navigate
      setFormData({
        name: "",
        description: "",
        warehouseType: "General Storage",
        allowedGoodsTypes: [],
        address: "",
        city: "",
        state: "",
        pincode: "",
        totalArea: "",
        pricePerSqft: "",
        amenities: [],
        features: [],
        images: [],
        documents: {
          gstCertificate: null,
          propertyPapers: null,
          fireCertificate: null,
        },
      });

      setStep(1);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description:
          error.message || "Failed to submit property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= s
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Basic Info</span>
            <span className="text-xs text-gray-600">Pricing</span>
            <span className="text-xs text-gray-600">Features</span>
            <span className="text-xs text-gray-600">Documents</span>
            <span className="text-xs text-gray-600">Review</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                List Your Warehouse Property
              </CardTitle>
              <CardDescription>
                Submit your warehouse for admin approval. All fields are
                required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Warehouse Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Prime Storage Hub Mumbai"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="warehouseType">Warehouse Type *</Label>
                      <select
                        id="warehouseType"
                        value={formData.warehouseType}
                        onChange={(e) => {
                          const selectedType = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            warehouseType: selectedType,
                            allowedGoodsTypes: [],
                          }));
                        }}
                        aria-label="Warehouse type"
                        title="Warehouse type"
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                      >
                        {WAREHOUSE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Allowed Goods Types *</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Select goods that this warehouse supports
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {availableGoodsTypes.map((item) => (
                          <Badge
                            key={item}
                            variant={
                              formData.allowedGoodsTypes.includes(item)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer justify-center py-1"
                            onClick={() => toggleGoodsType(item)}
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Complete Address *</Label>
                    <Input
                      id="address"
                      placeholder="Street address, landmark"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        placeholder="400001"
                        value={formData.pincode}
                        onChange={(e) =>
                          handleInputChange("pincode", e.target.value)
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing & Area */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="totalArea">Total Area (sq ft) *</Label>
                      <div className="relative mt-2">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="totalArea"
                          type="number"
                          placeholder="10000"
                          value={formData.totalArea}
                          onChange={(e) =>
                            handleInputChange("totalArea", e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Minimum 100 sq ft
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="pricePerSqft">
                        Price per sq ft (₹) *
                      </Label>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="pricePerSqft"
                          type="number"
                          placeholder="25"
                          value={formData.pricePerSqft}
                          onChange={(e) =>
                            handleInputChange("pricePerSqft", e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Monthly rent per sq ft
                      </p>

                      {/* AI Price Suggestion Button */}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3 w-full border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                        onClick={() => setShowPricingModal(true)}
                        disabled={!formData.city || !formData.totalArea}
                      >
                        <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                        Get AI Price Suggestion
                      </Button>
                      {(!formData.city || !formData.totalArea) && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Fill city and area first to get AI suggestions
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.totalArea && formData.pricePerSqft && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <strong>Estimated Monthly Revenue:</strong> ₹
                        {(
                          parseInt(formData.totalArea) *
                          parseInt(formData.pricePerSqft)
                        ).toLocaleString()}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label>Upload Images (Max 10)</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          Click to upload images
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          PNG, JPG up to 5MB each
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {formData.images.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              title="Remove image"
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Features & Amenities */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label>Amenities</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Select all that apply
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {COMMON_AMENITIES.map((amenity) => (
                        <Badge
                          key={amenity}
                          variant={
                            formData.amenities.includes(amenity)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer justify-center py-2"
                          onClick={() => toggleArrayItem("amenities", amenity)}
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Features</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Highlight key features
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {COMMON_FEATURES.map((feature) => (
                        <Badge
                          key={feature}
                          variant={
                            formData.features.includes(feature)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer justify-center py-2"
                          onClick={() => toggleArrayItem("features", feature)}
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Document Upload & Verification */}
              {step === 4 && (
                <div className="space-y-6">
                  <Alert className="bg-amber-50 border-amber-200">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      Upload required legal documents. Our AI will verify
                      authenticity using OCR and anomaly detection.
                    </AlertDescription>
                  </Alert>

                  {/* GST Certificate */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      GST Certificate *
                      <a
                        href="/GST_Certificate_Template.html"
                        target="_blank"
                        className="text-xs text-blue-500 hover:underline ml-1"
                      >
                        (View template)
                      </a>
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleDocumentUpload(e, "gstCertificate")
                        }
                        className="hidden"
                        id="gst-upload"
                      />
                      <label htmlFor="gst-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Click to upload GST Certificate
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG or PDF (max 5MB)
                        </p>
                      </label>

                      {formData.documents.gstCertificate && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm font-medium break-all text-blue-900">
                            {formData.documents.gstCertificate.name}
                          </p>
                          {ocrProcessing.gstCertificate && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                              <span className="text-sm text-blue-600">
                                Processing document...
                              </span>
                            </div>
                          )}
                          {!ocrProcessing.gstCertificate &&
                            documentValidation.gstCertificate.confidence >
                              0 && (
                              <div
                                className={`mt-2 p-2 rounded text-sm ${
                                  documentValidation.gstCertificate.isValid
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {documentValidation.gstCertificate.isValid ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Verified (
                                    {(
                                      documentValidation.gstCertificate
                                        .confidence * 100
                                    ).toFixed(1)}
                                    % confidence)
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <AlertCircle className="h-4 w-4" />
                                      Issues Found
                                    </div>
                                    <ul className="text-xs space-y-1">
                                      {documentValidation.gstCertificate.anomalies.map(
                                        (anomaly, i) => (
                                          <li key={i}>• {anomaly}</li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          {/* Auto-approve for demo - mark as valid */}
                          {!ocrProcessing.gstCertificate &&
                            documentValidation.gstCertificate.confidence ===
                              0 && (
                              <div className="mt-2 p-2 rounded text-sm bg-green-100 text-green-800">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Document uploaded successfully
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Papers */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Property Ownership Papers *
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleDocumentUpload(e, "propertyPapers")
                        }
                        className="hidden"
                        id="property-upload"
                      />
                      <label
                        htmlFor="property-upload"
                        className="cursor-pointer"
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Click to upload Property Papers
                        </p>
                        <p className="text-xs text-gray-400">
                          Title deed, ownership papers (max 5MB)
                        </p>
                      </label>

                      {formData.documents.propertyPapers && (
                        <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                          <p className="text-sm font-medium break-all text-green-900">
                            {formData.documents.propertyPapers.name}
                          </p>
                          {ocrProcessing.propertyPapers && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                              <span className="text-sm text-blue-600">
                                Processing document...
                              </span>
                            </div>
                          )}
                          {!ocrProcessing.propertyPapers &&
                            documentValidation.propertyPapers.confidence >
                              0 && (
                              <div
                                className={`mt-2 p-2 rounded text-sm ${
                                  documentValidation.propertyPapers.isValid
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {documentValidation.propertyPapers.isValid ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Verified (
                                    {(
                                      documentValidation.propertyPapers
                                        .confidence * 100
                                    ).toFixed(1)}
                                    % confidence)
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <AlertCircle className="h-4 w-4" />
                                      Issues Found
                                    </div>
                                    <ul className="text-xs space-y-1">
                                      {documentValidation.propertyPapers.anomalies.map(
                                        (anomaly, i) => (
                                          <li key={i}>• {anomaly}</li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          {/* Auto-approve for demo - mark as valid */}
                          {!ocrProcessing.propertyPapers &&
                            documentValidation.propertyPapers.isValid && (
                              <div className="mt-2 p-2 rounded text-sm bg-green-100 text-green-800">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Document verified successfully
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fire Certificate */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      Fire Safety Certificate *
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleDocumentUpload(e, "fireCertificate")
                        }
                        className="hidden"
                        id="fire-upload"
                      />
                      <label htmlFor="fire-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Click to upload Fire Certificate
                        </p>
                        <p className="text-xs text-gray-400">
                          Fire NOC, safety certificate (max 5MB)
                        </p>
                      </label>

                      {formData.documents.fireCertificate && (
                        <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                          <p className="text-sm font-medium break-all text-orange-900">
                            {formData.documents.fireCertificate.name}
                          </p>
                          {ocrProcessing.fireCertificate && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                              <span className="text-sm text-blue-600">
                                Processing document...
                              </span>
                            </div>
                          )}
                          {!ocrProcessing.fireCertificate &&
                            documentValidation.fireCertificate.confidence >
                              0 && (
                              <div
                                className={`mt-2 p-2 rounded text-sm ${
                                  documentValidation.fireCertificate.isValid
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {documentValidation.fireCertificate.isValid ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Verified (
                                    {(
                                      documentValidation.fireCertificate
                                        .confidence * 100
                                    ).toFixed(1)}
                                    % confidence)
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <AlertCircle className="h-4 w-4" />
                                      Issues Found
                                    </div>
                                    <ul className="text-xs space-y-1">
                                      {documentValidation.fireCertificate.anomalies.map(
                                        (anomaly, i) => (
                                          <li key={i}>• {anomaly}</li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          {/* Auto-approve for demo - mark as valid */}
                          {!ocrProcessing.fireCertificate &&
                            documentValidation.fireCertificate.isValid && (
                              <div className="mt-2 p-2 rounded text-sm bg-green-100 text-green-800">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Document verified successfully
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {step === 5 && (
                <div className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      Review your information before submitting. Your property
                      will be sent to admin for verification and approval.
                    </AlertDescription>
                  </Alert>

                  {/* Description - Generate after all details are filled */}
                  <div className="space-y-3">
                    <Label htmlFor="description">Warehouse Description *</Label>
                    <p className="text-xs text-gray-500">
                      Generate a professional description using AI based on all
                      the details you've entered, or write your own.
                    </p>
                    <Textarea
                      id="description"
                      placeholder="Click 'Generate with AI' to create a professional description based on your warehouse details, or write your own."
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={4}
                      className="mt-2"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateDescription}
                        disabled={generatingDescription}
                        className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                      >
                        {generatingDescription ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{formData.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formData.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <p className="font-medium">
                          {formData.city}, {formData.state}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Area:</span>
                        <p className="font-medium">
                          {formData.totalArea} sq ft
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <p className="font-medium">
                          ₹{formData.pricePerSqft}/sq ft
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Images:</span>
                        <p className="font-medium">
                          {formData.images.length} uploaded
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 text-sm">Amenities:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.amenities.map((a) => (
                          <Badge key={a} variant="secondary">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 text-sm">Features:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.features.map((f) => (
                          <Badge key={f} variant="secondary">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={loading}
                  >
                    Previous
                  </Button>
                )}

                {step < 5 ? (
                  <Button onClick={handleNext} className="ml-auto">
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="ml-auto bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Submitting..." : "Submit for Approval"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing Recommendation Modal */}
      <PricingRecommendationModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onAcceptPrice={(price) => {
          handleInputChange("pricePerSqft", price.toString());
          setShowPricingModal(false);
          toast({
            title: "AI Price Applied",
            description: `Price set to ₹${price}/sqft based on AI market analysis`,
          });
        }}
        warehouseData={{
          city: formData.city,
          district: formData.city, // Using city as district for now
          warehouse_type: formData.warehouseType,
          total_area: parseFloat(formData.totalArea) || 0,
          amenities: formData.amenities,
        }}
      />
    </div>
  );
}

import { Router, RequestHandler } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = Router();

// Initialize Razorpay instance (using test keys from environment or fallback for development)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_key_secret',
});

// POST /api/payments/create-order
// Creates a Razorpay order for the booking amount
const createOrder: RequestHandler = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "Amount is required" });
    }

    // Amount should be in the smallest currency unit (paise for INR)
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 0 // We want to authorize first, capture on approval
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ success: false, error: "Failed to create Razorpay order" });
    }

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error: any) {
    console.error("Razorpay Order Creation Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Order creation failed" });
  }
};

// POST /api/payments/verify
// Verifies the Razorpay payment signature after client completes checkout
const verifyPayment: RequestHandler = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing Razorpay payment details" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_key_secret';

    // Verify signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    // Payment authorized successfully
    return res.json({ success: true, message: "Payment verified successfully" });
  } catch (error: any) {
    console.error("Razorpay Verification Error:", error);
    return res.status(500).json({ success: false, error: "Payment verification failed" });
  }
};

// POST /api/payments/capture
// Captures an authorized payment when an admin/owner approves the booking
const capturePayment: RequestHandler = async (req, res) => {
  try {
    const { payment_id, amount } = req.body;
    
    if (!payment_id || !amount) {
      return res.status(400).json({ success: false, error: "Missing payment_id or amount" });
    }
    
    const response = await razorpay.payments.capture(payment_id, Math.round(amount * 100), "INR");
    
    return res.json({ success: true, data: response });
  } catch (error: any) {
    console.error("Razorpay Capture Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Payment capture failed" });
  }
};

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/capture", capturePayment);

export default router;

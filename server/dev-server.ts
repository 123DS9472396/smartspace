import "dotenv/config";
import { createServer } from "./index";

const app = createServer();
const port = process.env.PORT || 3000;

console.log(`
╔════════════════════════════════════════════════════════╗
║   SmartSpace Warehouse - Backend API Server           ║
║   Development Mode (API Only)                          ║
╚════════════════════════════════════════════════════════╝
`);

console.log(`📦 Environment Configuration:`);
console.log(`   - Supabase URL: ${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'Not configured'}`);
console.log(`   - Gemini API Key: ${process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
console.log(`   - ML Service URL: ${process.env.ML_SERVICE_URL || 'Not configured'}`);

app.listen(port, () => {
  console.log(`
🚀 Backend API Server Started Successfully!

📍 Access Points:
   - API Base:        http://localhost:${port}/api
   - Health Check:    http://localhost:${port}/api/health
   - Recommendations: http://localhost:${port}/api/recommend (POST)
   - Demo Endpoint:   http://localhost:${port}/api/demo

📝 Test the API:
   curl http://localhost:${port}/api/health

🔧 Services Status:
   - Express Server: ✓ Running
   - Supabase: ${process.env.SUPABASE_URL ? '✓ Configured' : '⚠ Using mock data'}
   - Gemini AI: ${process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY ? '✓ Configured' : '⚠ Using simulated responses'}
   - ML Algorithms: ✓ Hybrid mode active

Press Ctrl+C to stop the server
`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

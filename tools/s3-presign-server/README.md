Production S3 presign server

How to run
1. Set environment variables:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - AWS_BUCKET_IMAGES
   - AWS_BUCKET_DOCS
2. Install and run:

```bash
cd tools/s3-presign-server
npm install
node index.js
```

Endpoint
- POST /presign
  Body: { "filename": "photo.jpg", "contentType": "image/jpeg", "kind": "image" }
  Returns: { uploadUrl, publicUrl, bucket, key }

Security
- Run this server only on trusted infrastructure. Keep AWS credentials on the server (do not expose to browsers). Use IAM roles where possible.

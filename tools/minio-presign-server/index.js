/* Minimal presign server for MinIO (S3-compatible)
   - Exposes two endpoints: /presign-upload (returns presigned PUT URL) and /health
   - Uses @aws-sdk/s3-request-presigner to create a presigned PUT URL
   - Expects environment variables: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_IMAGES, MINIO_BUCKET_DOCS
*/

const express = require('express');
const bodyParser = require('body-parser');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
// Public endpoint used for browser-facing object URLs (may differ inside Docker network)
const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || endpoint;
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin123';
const bucketImages = process.env.MINIO_BUCKET_IMAGES || 'warehouse-images';
const bucketDocs = process.env.MINIO_BUCKET_DOCS || 'warehouse-documents';

const region = 'us-east-1';

const s3 = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

async function ensureBucketExists(bucket) {
  try {
    // Try creating the bucket (no-op if exists)
    await s3.send({
      // Using CreateBucketCommand dynamically to avoid importing extra symbols here
      ...{ Bucket: bucket, Command: 'CreateBucket' }
    });
  } catch (err) {
    // Many S3-compatible servers will return errors when bucket exists; ignore
    // We'll fall back to creating objects which auto-creates on MinIO
  }
}

const { CreateBucketCommand, PutBucketPolicyCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');

async function makeBucketIfNeeded(bucket) {
  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log('Created bucket', bucket);
  } catch (err) {
    // ignore exists error
    console.log('Bucket create check for', bucket, ':', err.name || err.message);
  }

  // Try to set a public read policy (only for dev/local MinIO)
  try {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`]
        }
      ]
    });
    await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }));
    console.log('Set public read policy for', bucket);
  } catch (err) {
    console.log('Could not set bucket policy for', bucket, err.message || err.name);
  }
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/presign-upload', async (req, res) => {
  try {
    const { filename, contentType, kind } = req.body; // kind: 'image' | 'document'
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

    const bucket = kind === 'document' ? bucketDocs : bucketImages;
    const key = `${Date.now()}-${crypto.randomUUID()}-${filename}`;

    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 }); // 10 minutes

  // Public URL (MinIO default) — use host-visible public endpoint so browser can access it
  const publicUrl = `${publicEndpoint.replace(/\/$/, '')}/${bucket}/${encodeURIComponent(key)}`;

    res.json({ uploadUrl: url, publicUrl, bucket, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Optional: production S3 presign endpoint (requires AWS credentials via env)
app.post('/presign-s3', async (req, res) => {
  try {
    const { filename, contentType, kind } = req.body;
    const AWS_ENDPOINT = process.env.AWS_S3_ENDPOINT; // optional custom endpoint
    const AWS_ACCESS = process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
    const AWS_BUCKET_IMAGES = process.env.AWS_BUCKET_IMAGES || bucketImages;
    const AWS_BUCKET_DOCS = process.env.AWS_BUCKET_DOCS || bucketDocs;

    if (!AWS_ACCESS || !AWS_SECRET) return res.status(400).json({ error: 'AWS credentials not configured' });

    const prodS3 = new S3Client({ region, endpoint: AWS_ENDPOINT || undefined, credentials: { accessKeyId: AWS_ACCESS, secretAccessKey: AWS_SECRET } });
    const bucket = kind === 'document' ? AWS_BUCKET_DOCS : AWS_BUCKET_IMAGES;
    const key = `${Date.now()}-${crypto.randomUUID()}-${filename}`;
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(prodS3, cmd, { expiresIn: 60 * 10 });
    const publicUrl = `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
    res.json({ uploadUrl: url, publicUrl, bucket, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, async () => {
  console.log(`MinIO presign server listening on ${port}`);
  try {
    await makeBucketIfNeeded(bucketImages);
    await makeBucketIfNeeded(bucketDocs);
  } catch (err) {
    console.log('Bucket setup error', err.message || err.name);
  }
});

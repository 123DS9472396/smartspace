/* Minimal production presign server using AWS SDK
   - Endpoint: POST /presign (body: { filename, contentType, kind })
   - Requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_IMAGES, AWS_BUCKET_DOCS
*/

const express = require('express');
const bodyParser = require('body-parser');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
app.use(bodyParser.json());

const region = process.env.AWS_REGION || 'us-east-1';
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketImages = process.env.AWS_BUCKET_IMAGES || 'warehouse-images';
const bucketDocs = process.env.AWS_BUCKET_DOCS || 'warehouse-documents';

if (!accessKey || !secretKey) {
  console.error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
}

const s3 = new S3Client({ region, credentials: { accessKeyId: accessKey, secretAccessKey: secretKey } });

app.post('/presign', async (req, res) => {
  try {
    const { filename, contentType, kind } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

    const bucket = kind === 'document' ? bucketDocs : bucketImages;
    const key = `${Date.now()}-${filename}`;
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
    res.json({ uploadUrl: url, publicUrl, bucket, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`S3 presign server listening on ${port}`));

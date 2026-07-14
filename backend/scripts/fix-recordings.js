import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const RECORDINGS_DIR = path.join(__dirname, '..', 'recordings');

function uploadFile(filePath) {
  const filename = path.basename(filePath);
  const publicId = `autoniv/recordings/${filename.replace(/\.[^.]+$/, '')}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', public_id: publicId, format: 'wav', type: 'upload' },
      (error, result) => { if (error) return reject(error); resolve(result.secure_url); }
    );
    fs.createReadStream(filePath).pipe(stream);
  });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Call = mongoose.connection.db.collection('calls');

  const localCalls = await Call.find({ recordingUrl: { $regex: '^/api/recordings/' } }).toArray();
  console.log(`Found ${localCalls.length} calls with local recording paths\n`);

  const localFiles = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.wav'));
  const localFileMap = {};
  localFiles.forEach(f => { localFileMap[f.replace('.wav', '')] = f; });

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const call of localCalls) {
    const callSid = call.vapiCallId;
    const file = localFileMap[callSid];

    if (!file) {
      console.log(`SKIP ${callSid} - no local file found`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`Uploading ${file}...`);
      const url = await uploadFile(path.join(RECORDINGS_DIR, file));
      await Call.updateOne({ _id: call._id }, { $set: { recordingUrl: url } });
      console.log(` done`);
      uploaded++;
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped (no file), ${failed} failed`);
  await mongoose.disconnect();
}

main();

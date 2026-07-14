import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
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
      {
        resource_type: 'raw',
        public_id: publicId,
        format: 'wav',
        type: 'upload',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    fs.createReadStream(filePath).pipe(stream);
  });
}

async function main() {
  console.log('Cloudinary cloud:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('Recordings dir:', RECORDINGS_DIR);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Call = mongoose.model('Call', new mongoose.Schema({
      vapiCallId: String,
      recordingUrl: String,
    }, { strict: false }));

    const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.wav'));
    console.log(`Found ${files.length} WAV files to upload\n`);

    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      const filePath = path.join(RECORDINGS_DIR, file);
      const callSid = file.replace('.wav', '');

      try {
        process.stdout.write(`Uploading ${file}...`);
        const url = await uploadFile(filePath);

        await Call.updateOne(
          { vapiCallId: callSid },
          { $set: { recordingUrl: url } }
        );

        console.log(` ✓`);
        uploaded++;
      } catch (err) {
        console.log(` ✗ ${err.message}`);
        failed++;
      }
    }

    console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();

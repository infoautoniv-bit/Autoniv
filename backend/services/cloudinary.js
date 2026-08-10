import { v2 as cloudinary } from 'cloudinary';
import { log } from './logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadRecording(buffer, filename) {
  log.info(`[Cloudinary] Starting upload: ${filename}, buffer size: ${buffer.length}`);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'autoniv/recordings',
        public_id: filename.replace(/\.[^.]+$/, ''),
        format: 'wav',
        type: 'upload',
      },
      (error, result) => {
        if (error) {
          log.error(`[Cloudinary] Upload failed:`, error);
          return reject(error);
        }
        log.info(`[Cloudinary] Upload success: ${result.secure_url}`);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function deleteRecording(recordingUrl) {
  if (!recordingUrl || !recordingUrl.includes('cloudinary.com')) return;

  try {
    const match = recordingUrl.match(/\/autoniv\/recordings\/([^/?]+)/);
    if (!match) return;

    const publicId = `autoniv/recordings/${match[1]}`;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    log.info(`[Cloudinary] Deleted recording: ${publicId}`);
  } catch (err) {
    log.error(`[Cloudinary] Failed to delete recording:`, err.message);
  }
}

export async function deleteRecordings(recordingUrls) {
  if (!Array.isArray(recordingUrls)) return;
  await Promise.all(recordingUrls.map(url => deleteRecording(url)));
}

export default cloudinary;

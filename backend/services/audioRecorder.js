import fs from 'fs';
import path from 'path';

// Precomputed G.711 mu-law -> PCM16 decode table. Twilio telephony audio is
// 8kHz mu-law in both directions; built once at module load.
const MULAW_DECODE_TABLE = (() => {
  const table = new Int16Array(256);
  for (let i = 0; i < 256; i++) {
    const u = ~i & 0xff;
    const mantissa = u & 0x0f;
    const exponent = (u & 0x70) >> 4;
    const t = ((mantissa << 3) + 0x84) << exponent;
    table[i] = (u & 0x80) ? (0x84 - t) : (t - 0x84);
  }
  return table;
})();

export class AudioRecorder {
  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
    this.startTime = Date.now();
    // 16MB buffer pre-allocation (approx. 5.5 minutes of 24kHz 16-bit mono audio)
    this.buffer = Buffer.alloc(16 * 1024 * 1024);
    this.maxByteOffset = 0;
  }

  /**
   * Resamples a PCM16 buffer from 16000Hz to 24000Hz using linear interpolation
   */
  resample16To24(pcmBuffer) {
    const inputSamples = pcmBuffer.length / 2;
    const outputSamples = Math.floor(inputSamples * 1.5);
    const outputBuffer = Buffer.alloc(outputSamples * 2);

    for (let i = 0; i < outputSamples; i++) {
      const inputIndex = i / 1.5;
      const indexLow = Math.floor(inputIndex);
      const indexHigh = Math.min(inputSamples - 1, indexLow + 1);
      const weight = inputIndex - indexLow;

      const s0 = pcmBuffer.readInt16LE(indexLow * 2);
      const s1 = pcmBuffer.readInt16LE(indexHigh * 2);

      const interpolated = Math.round(s0 * (1 - weight) + s1 * weight);
      outputBuffer.writeInt16LE(interpolated, i * 2);
    }
    return outputBuffer;
  }

  /**
   * General linear resampler from any source rate to this.sampleRate.
   */
  resampleLinear(pcmBuffer, fromRate) {
    const toRate = this.sampleRate;
    if (fromRate === toRate) return pcmBuffer;
    const inputSamples = pcmBuffer.length / 2;
    if (inputSamples === 0) return Buffer.alloc(0);
    const ratio = toRate / fromRate;
    const outputSamples = Math.floor(inputSamples * ratio);
    const out = Buffer.alloc(outputSamples * 2);
    for (let i = 0; i < outputSamples; i++) {
      const inputIndex = i / ratio;
      const indexLow = Math.floor(inputIndex);
      const indexHigh = Math.min(inputSamples - 1, indexLow + 1);
      const weight = inputIndex - indexLow;
      const s0 = pcmBuffer.readInt16LE(indexLow * 2);
      const s1 = pcmBuffer.readInt16LE(indexHigh * 2);
      out.writeInt16LE(Math.round(s0 * (1 - weight) + s1 * weight), i * 2);
    }
    return out;
  }

  /**
   * Decode a G.711 mu-law buffer (Twilio 8kHz telephony) to PCM16.
   */
  static decodeMulaw(mulawBuffer) {
    const out = Buffer.alloc(mulawBuffer.length * 2);
    for (let i = 0; i < mulawBuffer.length; i++) {
      out.writeInt16LE(MULAW_DECODE_TABLE[mulawBuffer[i]], i * 2);
    }
    return out;
  }

  // Time-align and mix a PCM16 buffer (already at this.sampleRate) into the track.
  _mixAt(activeBuffer, timestamp) {
    const elapsedMs = timestamp - this.startTime;
    const sampleOffset = Math.floor(elapsedMs * (this.sampleRate / 1000));
    const byteOffset = sampleOffset * 2;

    if (byteOffset + activeBuffer.length > this.buffer.length) {
      // Resize buffer dynamically if it exceeds the current allocation
      const newSize = Math.max(this.buffer.length * 2, byteOffset + activeBuffer.length);
      const newBuffer = Buffer.alloc(newSize);
      this.buffer.copy(newBuffer);
      this.buffer = newBuffer;
    }

    // Mix PCM16 samples sequentially or simultaneously
    for (let i = 0; i < activeBuffer.length - 1; i += 2) {
      const targetOffset = byteOffset + i;
      if (targetOffset >= this.buffer.length - 1) break;

      const srcVal = activeBuffer.readInt16LE(i);
      const existingVal = this.buffer.readInt16LE(targetOffset);

      let mixed = srcVal + existingVal;
      if (mixed > 32767) mixed = 32767;
      if (mixed < -32768) mixed = -32768;

      this.buffer.writeInt16LE(mixed, targetOffset);
    }

    const endOffset = byteOffset + activeBuffer.length;
    if (endOffset > this.maxByteOffset) {
      this.maxByteOffset = endOffset;
    }
  }

  writeAudio(pcmBuffer, timestamp, sourceSampleRate = 24000) {
    let activeBuffer = pcmBuffer;
    if (sourceSampleRate === 16000) {
      activeBuffer = this.resample16To24(pcmBuffer);
    } else if (sourceSampleRate !== this.sampleRate) {
      activeBuffer = this.resampleLinear(pcmBuffer, sourceSampleRate);
    }
    this._mixAt(activeBuffer, timestamp);
  }

  /**
   * Write an 8kHz mu-law telephony chunk (decode -> resample -> mix).
   */
  writeMulaw8k(mulawBuffer, timestamp) {
    if (!mulawBuffer || mulawBuffer.length === 0) return;
    const pcm8k = AudioRecorder.decodeMulaw(mulawBuffer);
    const pcm = this.resampleLinear(pcm8k, 8000);
    this._mixAt(pcm, timestamp);
  }

  getWavBuffer() {
    const dataSize = this.maxByteOffset;
    const wavHeader = Buffer.alloc(44);

    // RIFF Header
    wavHeader.write('RIFF', 0);
    wavHeader.writeInt32LE(36 + dataSize, 4);
    wavHeader.write('WAVE', 8);

    // Format Chunk
    wavHeader.write('fmt ', 12);
    wavHeader.writeInt32LE(16, 16);
    wavHeader.writeInt16LE(1, 20);
    wavHeader.writeInt16LE(1, 22); // Mono channel
    wavHeader.writeInt32LE(this.sampleRate, 24);
    wavHeader.writeInt32LE(this.sampleRate * 2, 28);
    wavHeader.writeInt16LE(2, 32);
    wavHeader.writeInt16LE(16, 34);

    // Data Chunk
    wavHeader.write('data', 36);
    wavHeader.writeInt32LE(dataSize, 40);

    return Buffer.concat([wavHeader, this.buffer.slice(0, dataSize)]);
  }
}

import { log } from '../logger.js';

class LLMQueue {
  constructor(concurrency = 8) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
    this.providerUsage = { groq: 0, openai: 0, gemini: 0 };
    this.lastReset = Date.now();
    this.resetInterval = 60000; // reset counts every minute
  }

  resetIfNeeded() {
    if (Date.now() - this.lastReset > this.resetInterval) {
      this.providerUsage = { groq: 0, openai: 0, gemini: 0 };
      this.lastReset = Date.now();
    }
  }

  getLeastUsedProvider() {
    this.resetIfNeeded();
    const sorted = Object.entries(this.providerUsage).sort((a, b) => a[1] - b[1]);
    return sorted[0][0];
  }

  incrementProvider(provider) {
    this.resetIfNeeded();
    if (this.providerUsage[provider] !== undefined) {
      this.providerUsage[provider]++;
    }
  }

  async add(fn, provider = 'unknown') {
    return new Promise((resolve, reject) => {
      const task = async () => {
        this.running++;
        this.incrementProvider(provider);
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.running--;
          this.processNext();
        }
      };

      if (this.running < this.concurrency) {
        task();
      } else {
        log.info('llm_queue_waiting', { queueLength: this.queue.length + 1, running: this.running });
        this.queue.push(task);
      }
    });
  }

  processNext() {
    if (this.queue.length > 0 && this.running < this.concurrency) {
      const next = this.queue.shift();
      next();
    }
  }

  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      concurrency: this.concurrency,
      providerUsage: { ...this.providerUsage },
    };
  }
}

export const llmQueue = new LLMQueue(8); // max 8 concurrent LLM calls

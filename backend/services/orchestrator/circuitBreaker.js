import { log } from '../logger.js';

export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 15000;
    this.halfOpenMax = options.halfOpenMax || 2;

    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.halfOpenCalls = 0;
  }

  async execute(fn, fallbackFn = null) {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenCalls = 0;
        log.info('circuit_breaker_half_open', { name: this.name });
      } else {
        log.warn('circuit_breaker_open_reject', { name: this.name, nextAttemptInMs: this.nextAttempt - Date.now() });
        if (fallbackFn) return await fallbackFn(new Error(`Circuit breaker '${this.name}' is OPEN`));
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      if (this.halfOpenCalls > this.halfOpenMax) {
        log.warn('circuit_breaker_half_open_limit_reached', { name: this.name });
        if (fallbackFn) return await fallbackFn(new Error(`Circuit breaker '${this.name}' is HALF_OPEN and busy`));
        throw new Error(`Circuit breaker '${this.name}' is HALF_OPEN capacity exceeded`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallbackFn) {
        return await fallbackFn(err);
      }
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      log.info('circuit_breaker_closed', { name: this.name });
    }
  }

  onFailure(err) {
    this.failureCount++;
    log.error('circuit_breaker_failure', { name: this.name, failures: this.failureCount, error: err?.message });

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
      log.error('circuit_breaker_tripped', { name: this.name, resetTimeoutMs: this.resetTimeout });
    }
  }
}

const breakers = new Map();

export function getCircuitBreaker(name, options) {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options));
  }
  return breakers.get(name);
}

import { verifyVapiSignature } from '../middleware/webhookSignature.js';

describe('webhookSignature', () => {
  describe('verifyVapiSignature middleware', () => {
    it('is a function', () => {
      expect(typeof verifyVapiSignature).toBe('function');
    });

    it('has 3 parameters (req, res, next)', () => {
      expect(verifyVapiSignature.length).toBe(3);
    });
  });
});

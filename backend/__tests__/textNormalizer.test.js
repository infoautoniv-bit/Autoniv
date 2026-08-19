import { normalizeForSpeech } from '../services/speech/textNormalizer.js';

describe('Text Normalizer for Voice Synthesis', () => {
  test('expands abbreviations into spoken phonetic English', () => {
    const raw = 'Dr. Smith visited St. Marks Ave. at 9 a.m. for an Apt.';
    const normalized = normalizeForSpeech(raw);

    expect(normalized).toContain('Doctor');
    expect(normalized).toContain('Saint Marks Avenue');
    expect(normalized).toContain('A M');
    expect(normalized).toContain('Apartment');
  });

  test('normalizes currency amounts naturally', () => {
    const raw = 'The setup fee is $49.99 and monthly is ₹4,999.';
    const normalized = normalizeForSpeech(raw);

    expect(normalized).toContain('49 dollars and 99 cents');
    expect(normalized).toContain('4999 rupees');
  });

  test('spells out ticket numbers and order IDs clearly', () => {
    const raw = 'Your complaint is logged under TKT-89402.';
    const normalized = normalizeForSpeech(raw);

    expect(normalized).toContain('Ticket 8 9 4 0 2');
  });

  test('strips markdown bolding, emojis, and bullet points', () => {
    const raw = '• **Special Offer:** 🚀 Get 20% off today!';
    const normalized = normalizeForSpeech(raw);

    expect(normalized).not.toContain('**');
    expect(normalized).not.toContain('•');
    expect(normalized).not.toContain('🚀');
    expect(normalized).toBe('Special Offer: Get 20% off today!');
  });
});

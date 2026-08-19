import { extractCallerInfo, injectCallerContext } from '../services/orchestrator/callerInfo.js';

describe('Caller Information Memory & Extraction', () => {
  test('extracts caller full name, phone number, and standard email', () => {
    const callerInfo = {};
    const text = "Hi, my name is Sarah Connor. My phone is +1-555-234-5678 and email is sarah.c@cyberdyne.org";
    extractCallerInfo(text, callerInfo);

    expect(callerInfo.name).toBe('Sarah Connor');
    expect(callerInfo.phone).toBe('+1-555-234-5678');
    expect(callerInfo.email).toBe('sarah.c@cyberdyne.org');
  });

  test('extracts spoken email format (name at domain dot com)', () => {
    const callerInfo = {};
    const text = "You can reach me at alex at clinic dot com and my number is 9876543210";
    extractCallerInfo(text, callerInfo);

    expect(callerInfo.email).toBe('alex@clinic.com');
    expect(callerInfo.phone).toBe('9876543210');
  });

  test('injects caller memory context into system prompt to prevent re-asking', () => {
    const conversationHistory = [
      { role: 'system', content: 'You are an AI receptionist.' },
      { role: 'user', content: 'Hi' },
    ];

    const callerInfo = {
      name: 'Michael Scott',
      phone: '555-0199',
      email: 'michael@dundermifflin.com',
    };

    injectCallerContext(conversationHistory, callerInfo);

    expect(conversationHistory[0].content).toContain('CRITICAL CALLER MEMORY');
    expect(conversationHistory[0].content).toContain('Michael Scott');
    expect(conversationHistory[0].content).toContain('555-0199');
    expect(conversationHistory[0].content).toContain('michael@dundermifflin.com');
    expect(conversationHistory[0].content).toContain('NEVER ASK AGAIN');
  });

  test('extracts spoken word phone numbers (nine eight seven six...)', () => {
    const callerInfo = {};
    const text = "Sure my number is nine eight seven six five four three two one zero";
    extractCallerInfo(text, callerInfo);

    expect(callerInfo.phone).toBe('9876543210');
  });
});

import { renderTemplate, extractTemplateVariables } from '../services/orchestrator/templateEngine.js';

describe('templateEngine', () => {
  it('interpolates simple variables', () => {
    const template = 'Hello {{name}}, welcome to {{company}}!';
    const result = renderTemplate(template, { name: 'Alice', company: 'Autoniv' });
    expect(result).toBe('Hello Alice, welcome to Autoniv!');
  });

  it('handles nested properties', () => {
    const template = 'Greetings from {{user.company}} and agent {{user.profile.title}}!';
    const context = {
      user: {
        company: 'HealthPlus Clinic',
        profile: { title: 'Lead Specialist' },
      },
    };
    const result = renderTemplate(template, context);
    expect(result).toBe('Greetings from HealthPlus Clinic and agent Lead Specialist!');
  });

  it('uses fallback values when variable is missing', () => {
    const template = 'Hello {{customer_name | "valued caller"}}, your balance is {{balance | "$0.00"}}.';
    const result = renderTemplate(template, {});
    expect(result).toBe('Hello valued caller, your balance is $0.00.');
  });

  it('prefers actual value over fallback when present', () => {
    const template = 'Hello {{name | "Guest"}}!';
    const result = renderTemplate(template, { name: 'Dr. John' });
    expect(result).toBe('Hello Dr. John!');
  });

  it('handles empty template or missing context gracefully', () => {
    expect(renderTemplate('')).toBe('');
    expect(renderTemplate(null)).toBe('');
    expect(renderTemplate('Hello {{name}}', null)).toBe('Hello {{name}}');
  });

  it('extracts unique variable names from templates', () => {
    const template = 'Hi {{callerName}}, your appointment with {{doctor}} at {{clinic}} is on {{date}}. Bye {{callerName}}!';
    const vars = extractTemplateVariables(template);
    expect(vars).toEqual(['callerName', 'doctor', 'clinic', 'date']);
  });
});

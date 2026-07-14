import { VOICE_OPTIONS } from './voices';

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'fr', label: '🇫🇷 French' },
  { value: 'de', label: '🇩🇪 German' },
  { value: 'it', label: '🇮🇹 Italian' },
  { value: 'pt', label: '🇵🇹 Portuguese' },
  { value: 'pl', label: '🇵🇱 Polish' },
  { value: 'hi', label: '🇮🇳 Hindi' },
  { value: 'ar', label: '🇸🇦 Arabic' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'ko', label: '🇰🇷 Korean' },
  { value: 'zh', label: '🇨🇳 Chinese' },
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'ru', label: '🇷🇺 Russian' },
  { value: 'tr', label: '🇹🇷 Turkish' },
];

export const AGENT_TYPES = [
  {
    value: 'receptionist', label: 'Receptionist', icon: 'receptionist',
  },
  {
    value: 'appointment', label: 'Scheduler', icon: 'appointment',
  },
  {
    value: 'faq', label: 'Q&A Support', icon: 'faq',
  },
];

export const PROMPT_TEMPLATES = [
  {
    id: 'dentist',
    label: '🦷 Dental Clinic',
    prompt: 'You are a friendly scheduling assistant for Smile Dental. Greet patients warmly, check for preferred times (mornings/afternoons), collect full name, phone number, and brief reason for the visit (cleaning, checkup, pain). State that a receptionist will text confirmation.'
  },
  {
    id: 'realestate',
    label: '🏢 Real Estate',
    prompt: 'You are an intake assistant for Elite Realtors. Greet callers, ask if they want to buy, sell, or rent. Collect their budget range, neighborhood preference, name, and email.'
  },
  {
    id: 'receptionist',
    label: '💼 General Receptionist',
    prompt: 'You are a professional office receptionist. Greet caller, ask for their name and business details, collect contact number, and inform them that we will route their message.'
  },
  {
    id: 'support',
    label: '💬 Helpdesk Support',
    prompt: 'You are a technical support helper. Greet callers, ask for their name and account email, gather a description of their issue, and let them know a support specialist will email them a solution shortly.'
  }
];

export const AGENT_TEMPLATES = [
  {
    title: 'Front-Desk Receptionist',
    description: 'Greets callers warmly, captures names, phone numbers, and routes business messages.',
    type: 'receptionist',
    prompt: 'You are a warm, professional front-desk receptionist. Greet the caller warmly, collect their name and email, and ask how you can assist them.',
    language: 'en',
    voiceId: VOICE_OPTIONS[0].value,
    icon: '🏢',
    borderClass: 'border-l-blue-500 hover:border-blue-300',
  },
  {
    title: 'Appointment Scheduler',
    description: 'Guides clients to book calendar time slots and gathers checkup requirements.',
    type: 'appointment',
    prompt: 'You are an appointment booking coordinator. Help the caller schedule their visit by guiding them to choose a date/time and collecting their details.',
    language: 'en',
    voiceId: VOICE_OPTIONS[5].value,
    icon: '📅',
    borderClass: 'border-l-emerald-500 hover:border-emerald-300',
  },
  {
    title: 'Customer FAQ Specialist',
    description: 'Answers FAQs, schedules, and catalog specifications from prompts.',
    type: 'faq',
    prompt: 'You are a helpful customer FAQ assistant. Answer questions concisely based on our business hours, pricing plans, and location guidelines.',
    language: 'en',
    voiceId: VOICE_OPTIONS[3].value,
    icon: '💬',
    borderClass: 'border-l-purple-500 hover:border-purple-300',
  },
];

export const DEFAULT_FORM_DATA = {
  name: '',
  type: 'receptionist',
  prompt: '',
  language: 'en',
  voiceId: VOICE_OPTIONS[0].value,
};

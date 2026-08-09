import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { GradientText, Reveal, MONO, SANS } from './design';
import { USPSlider } from './sections/USPSlider';

type IndustryId = 'healthcare' | 'realestate' | 'finance' | 'ecommerce' | 'education' | 'travel';

interface TranscriptItem {
  speaker: 'agent' | 'user' | 'system';
  text: string;
  timestamp: string;
  highlightKey?: string;
  toolCall?: { name: string; args: string; result: string };
  delayMs: number;
  durationMs: number;
}

interface DemoRecording {
  id: string;
  title: string;
  subtitle: string;
  agentName: string;
  agentAvatar: string;
  industry: IndustryId;
  duration: string;
  durationMs: number;
  audioUrl?: string;
  systemPrompt: string;
  toolSchema: string;
  orchestration: {
    sttEngine: string;
    llmEngine: string;
    ttsEngine: string;
    sarvamVoiceId: string;
    sarvamVoiceLabel: string;
    totalLatency: string;
    sttLatency: string;
    llmLatency: string;
    ttsLatency: string;
  };
  languages: string[];
  phoneNumber: string;
  tags: string[];
  description: string;
  extractedEntities: { label: string; value: string }[];
  transcript: TranscriptItem[];
}

interface IndustryTab {
  id: IndustryId;
  label: string;
  icon: string;
  tagline: string;
  accentColor: string;
  metrics: { value: string; label: string }[];
}

interface USPItem {
  icon: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  stat: string;
  statLabel: string;
  accentColor: string;
}

const USP_SLIDES: USPItem[] = [
  {
    icon: '🇮🇳',
    badge: 'AUTONIV NATIVE ENGINE',
    title: 'Vernacular Indian Language Mastery',
    highlight: 'Hindi, Hinglish, Tamil, Telugu & 10+ Dialects',
    description: 'Native neural voice synthesis powered by Autoniv Voice Engine and Speech-to-Text for authentic regional accents.',
    stat: '10+',
    statLabel: 'Indian Vernaculars',
    accentColor: '#10B981',
  },
  {
    icon: '⚡',
    badge: 'SUB-340ms ULTRA LOW LATENCY',
    title: 'Real-Time Conversational Flow',
    highlight: 'Faster than Human Response Time',
    description: 'Groq Llama 3.3 70B and Gemini 2.5 Flash streaming pipeline eliminate awkward pauses or long speech delays.',
    stat: '340ms',
    statLabel: 'Total Voice Latency',
    accentColor: '#2563EB',
  },
  {
    icon: '🛠️',
    badge: 'AUTONIV TOOL ORCHESTRATION',
    title: 'Zero-Code Function Tool Calling',
    highlight: 'Automated CRM, Google Calendar & WhatsApp SMS',
    description: 'AI agents query slot availability, book appointments, pre-approve loans, and trigger instant WhatsApp confirmations during calls.',
    stat: '100%',
    statLabel: 'Automated Execution',
    accentColor: '#7C3AED',
  },
  {
    icon: '🎙️',
    badge: '2-PERSON DIALOGUE ENGINE',
    title: 'Distinct Dual-Speaker Voice Separation',
    highlight: 'Realistic Agent vs Customer Caller Dialogue',
    description: 'Intelligent multi-speaker engine assigns contrasting male and female voices for realistic two-way phone conversations.',
    stat: '8+',
    statLabel: 'Autoniv Voice Models',
    accentColor: '#DB2777',
  },
  {
    icon: '🔒',
    badge: 'BANK-GRADE SECURITY',
    title: 'HIPAA & SOC-2 Enterprise Compliance',
    highlight: 'End-to-End Encrypted Voice Logs & Audit Trails',
    description: 'Strict privacy guardrails prevent unauthorized PII/OTP disclosure with 100% compliant audit trails for healthcare & finance.',
    stat: '99.9%',
    statLabel: 'Uptime SLA',
    accentColor: '#D97706',
  },
  {
    icon: '💰',
    badge: 'COST EFFICIENCY',
    title: '90% Cost Reduction vs Legacy Callers',
    highlight: 'Starting at ₹0.90 / min vs Human Call Desk',
    description: 'Automate repetitive patient triage, site visit scheduling, and COD verification calls without scaling headcount.',
    stat: '90%',
    statLabel: 'OpEx Savings',
    accentColor: '#0891B2',
  },
];

const SARVAM_VOICES = [
  { id: 'sarvam:bulbul:v3:shreya', name: 'Autoniv Shreya (Female - Hindi/English Sweet)' },
  { id: 'sarvam:bulbul:v3:shubh', name: 'Autoniv Shubh (Male - Deep Resonant Hindi)' },
  { id: 'sarvam:bulbul:v3:aditya', name: 'Autoniv Aditya (Male - Clear Professional)' },
  { id: 'sarvam:bulbul:v3:ritu', name: 'Autoniv Ritu (Female - Corporate Executive)' },
  { id: 'sarvam:bulbul:v3:priya', name: 'Autoniv Priya (Female - Warm Concierge)' },
  { id: 'sarvam:bulbul:v3:dev', name: 'Autoniv Dev (Male - Doctor Medical)' },
  { id: 'sarvam:bulbul:v3:rahul', name: 'Autoniv Rahul (Male - Energetic Counselor)' },
  { id: 'sarvam:bulbul:v3:simran', name: 'Autoniv Simran (Female - E-Commerce Dispatch)' },
];

const INDUSTRIES: IndustryTab[] = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    tagline: 'HIPAA-compliant patient intake, triage & automated appointment booking with Autoniv',
    accentColor: '#10B981',
    metrics: [
      { value: '68%', label: 'Less Desk Load' },
      { value: '3.5×', label: 'More Bookings' },
      { value: '99.4%', label: 'Triage Accuracy' },
    ],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    icon: '🏠',
    tagline: 'Site visit scheduling, lead qualification & automated property tours with Autoniv',
    accentColor: '#2563EB',
    metrics: [
      { value: '3.4×', label: 'Lead Conversion' },
      { value: '24/7', label: 'Site Visit Booking' },
      { value: '340ms', label: 'Autoniv Latency' },
    ],
  },
  {
    id: 'finance',
    label: 'Financial Services',
    icon: '🏦',
    tagline: 'Loan pre-screening, EMI reminders & secure fraud verification with Autoniv',
    accentColor: '#7C3AED',
    metrics: [
      { value: '58%', label: 'Collection Lift' },
      { value: '100%', label: 'Audit Trail' },
      { value: '98.9%', label: 'Verification Rate' },
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    icon: '🛒',
    tagline: 'COD order verification, cart recovery & return tracking with Autoniv',
    accentColor: '#D97706',
    metrics: [
      { value: '42%', label: 'Cart Recovery' },
      { value: '-60%', label: 'COD Returns (RTO)' },
      { value: '99.9%', label: 'Call Coverage' },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    icon: '🎓',
    tagline: 'Student admission counseling, course inquiries & fee alerts with Autoniv',
    accentColor: '#DB2777',
    metrics: [
      { value: '75%', label: 'Counseling Automated' },
      { value: '4.2×', label: 'Enrolment Speed' },
      { value: '96%', label: 'Parent CSAT' },
    ],
  },
  {
    id: 'travel',
    label: 'Travel & Hospitality',
    icon: '🏨',
    tagline: 'Hotel reservations, table bookings, flight updates & concierge with Autoniv',
    accentColor: '#0891B2',
    metrics: [
      { value: '88%', label: 'Instant Booking' },
      { value: '20+', label: 'Languages Supported' },
      { value: '0 sec', label: 'Wait Time' },
    ],
  },
];

const DEMO_RECORDINGS: Record<IndustryId, DemoRecording[]> = {
  healthcare: [
    {
      id: 'hc-1',
      title: 'Patient Intake & Cardiology Schedule',
      subtitle: 'Autoniv Healthcare Voice Agent',
      agentName: 'Dr. Sarah (Autoniv Care AI)',
      agentAvatar: '🩺',
      industry: 'healthcare',
      duration: '00:48',
      durationMs: 48000,
      audioUrl: '',
      systemPrompt: `# 🏥 AUTONIV VOICE AGENT SYSTEM PROMPT — HEALTHCARE INTAKE & TRIAGE

## 1. AGENT IDENTITY & ROLE
- **Name**: Dr. Sarah (Virtual Medical Intake Assistant)
- **Organization**: MetroCare Health System powered by Autoniv
- **Primary Mission**: Screen patient symptoms, determine urgency level, verify insurance coverage, and schedule Cardiology consultations using Autoniv neural voices.

## 2. VOICE & VERNACULAR TONE GUIDELINES
- Speak in a warm, empathetic, reassuring medical voice (Autoniv Shreya - 1.3x pitch).
- Support English, Hindi, and Hinglish dynamically.
- Use natural conversational fillers ("I understand...", "Let me check Dr. Reynolds' schedule for you...").
- CRITICAL REGULATORY GUARDRAIL: Never diagnose medical conditions or promise specific cures. For acute chest pain, shortness of breath, or emergency symptoms, IMMEDIATELY instruct caller: "Please hang up and dial emergency services (108/911) right now."

## 3. MANDATORY DATA COLLECTION FIELDS
You MUST collect and log these 4 parameters before confirming any appointment:
1. **Patient Full Name** (Spell back to confirm)
2. **Contact Phone Number** (Repeat digits back)
3. **Primary Symptoms & Duration** (Screening triage)
4. **Insurance Provider** (e.g., BlueCross, Star Health, HDFC Ergo)

## 4. CONVERSATION WORKFLOW
1. **Greeting & Intro**: "Hello! Thank you for calling MetroCare Health. I'm Dr. Sarah, your AI medical intake assistant powered by Autoniv. How can I care for you today?"
2. **Symptom Assessment**: Listen carefully. If non-emergency, proceed to slot check.
3. **Tool Execution**: Call checkAppointmentAvailability({ department: 'Cardiology', date: 'Tomorrow' }).
4. **Offer Slot**: Present 10:30 AM slot with Dr. Reynolds.
5. **Insurance Collection**: Confirm BlueCross coverage.
6. **Final Lock-In**: Call saveAppointment({ patient, time, insurance }), generate reference code #APP-84920, and dispatch SMS calendar invite.`,

      toolSchema: `{
  "tools": [
    {
      "name": "checkAppointmentAvailability",
      "description": "Checks medical doctor schedule slots in real-time.",
      "parameters": {
        "type": "object",
        "properties": {
          "department": { "type": "string", "example": "Cardiology" },
          "date": { "type": "string", "example": "Tomorrow" },
          "preferredTime": { "type": "string", "example": "10:30 AM" }
        },
        "required": ["department", "date"]
      }
    },
    {
      "name": "saveAppointment",
      "description": "Locks in confirmed patient appointment slot and dispatches SMS.",
      "parameters": {
        "type": "object",
        "properties": {
          "patientName": { "type": "string" },
          "specialty": { "type": "string" },
          "slotTime": { "type": "string" },
          "insurance": { "type": "string" }
        },
        "required": ["patientName", "specialty", "slotTime"]
      }
    }
  ]
}`,
      orchestration: {
        sttEngine: 'Autoniv STT',
        llmEngine: 'Groq Llama 3.3 70B',
        ttsEngine: 'Autoniv Neural TTS',
        sarvamVoiceId: 'sarvam:bulbul:v3:shreya',
        sarvamVoiceLabel: 'Autoniv Shreya (Female)',
        totalLatency: '340ms',
        sttLatency: '90ms',
        llmLatency: '140ms',
        ttsLatency: '110ms',
      },
      languages: ['English', 'Hindi', 'Hinglish'],
      phoneNumber: '+1 (800) 555-0142',
      tags: ['Appointment Booking', 'Patient Triage', 'Google Calendar Sync'],
      description: 'Autoniv Voice Agent screens patient symptoms, triggers checkAppointmentAvailability tool, and confirms Cardiology consultation.',
      extractedEntities: [
        { label: 'Patient Name', value: 'Robert Miller' },
        { label: 'Specialty', value: 'Cardiology' },
        { label: 'Date & Time', value: 'Tomorrow, 10:30 AM' },
        { label: 'Insurance Provider', value: 'BlueCross Health' },
      ],
      transcript: [
        {
          speaker: 'agent',
          text: "Hello! Thank you for calling MetroCare Health. I'm Dr. Sarah, your AI medical intake assistant powered by Autoniv. How can I care for you today?",
          timestamp: '00:02',
          delayMs: 0,
          durationMs: 6000,
        },
        {
          speaker: 'user',
          text: "Hi Sarah, I've been experiencing mild chest tightness after exercise and want to see a heart doctor.",
          timestamp: '00:09',
          delayMs: 7000,
          durationMs: 7000,
        },
        {
          speaker: 'system',
          text: "🔧 Tool Triggered: checkAppointmentAvailability({ department: 'Cardiology', date: 'Tomorrow' })",
          timestamp: '00:16',
          toolCall: {
            name: 'checkAppointmentAvailability',
            args: 'department: Cardiology, date: Tomorrow',
            result: 'Slot Available at 10:30 AM with Dr. Reynolds',
          },
          delayMs: 14000,
          durationMs: 1000,
        },
        {
          speaker: 'agent',
          text: "I understand your concern, Robert. If you feel severe acute pain or shortness of breath, please dial emergency immediately. Otherwise, I have checked slot availability for Dr. Reynolds in Cardiology for tomorrow at 10:30 AM. Would that work for you?",
          timestamp: '00:18',
          highlightKey: 'Date & Time',
          delayMs: 15000,
          durationMs: 12000,
        },
        {
          speaker: 'user',
          text: "Yes, 10:30 AM works well. I have BlueCross Health insurance.",
          timestamp: '00:32',
          highlightKey: 'Insurance Provider',
          delayMs: 28000,
          durationMs: 5000,
        },
        {
          speaker: 'system',
          text: "🔧 Tool Triggered: saveAppointment({ patient: 'Robert Miller', time: '10:30 AM', insurance: 'BlueCross' })",
          timestamp: '00:37',
          toolCall: {
            name: 'saveAppointment',
            args: 'patient: Robert Miller, time: 10:30 AM',
            result: 'Appointment Confirmed ID: #APP-84920',
          },
          delayMs: 33000,
          durationMs: 1000,
        },
        {
          speaker: 'agent',
          text: "Perfect! I have verified your BlueCross coverage and locked in your Cardiology consultation for tomorrow at 10:30 AM. A confirmation text and calendar invite have been sent to your phone. Take care!",
          timestamp: '00:39',
          delayMs: 34000,
          durationMs: 11000,
        },
      ],
    },
    {
      id: 'hc-2',
      title: 'Prescription Refill & Post-Op Follow-Up',
      subtitle: 'Autoniv Patient Outreach • Autoniv Dev Voice',
      agentName: 'Dr. Dev (Autoniv Clinic AI)',
      agentAvatar: '💊',
      industry: 'healthcare',
      duration: '00:42',
      durationMs: 42000,
      audioUrl: '',
      systemPrompt: `# 💊 AUTONIV VOICE AGENT SYSTEM PROMPT — PRESCRIPTION REFILL OUTREACH

## 1. AGENT IDENTITY & ROLE
- **Name**: Dr. Dev (Outbound Clinic AI Agent)
- **Organization**: City Health Clinic powered by Autoniv
- **Primary Mission**: Perform automated post-surgery check-ins, collect patient recovery ratings (1-10), and coordinate automated pharmacy refills using Autoniv Dev neural voice.

## 2. VOICE & TONAL GUIDELINES
- Deep, calm, authoritative medical doctor voice (Autoniv Dev - 0.65x pitch).
- Speak reassuringly in Hindi and Hinglish.

## 3. MANDATORY DATA COLLECTION & TOOL TRIGGERING
- Capture recovery scale (1 to 10).
- Trigger function tool requestPrescriptionRefill({ rx: 'Amoxicillin 500mg', pharmacyId: 'CVS-419' }).
- Confirm pickup location with SMS dispatch.`,

      toolSchema: `{
  "tools": [
    {
      "name": "requestPrescriptionRefill",
      "description": "Dispatches electronic prescription refill request to verified pharmacy.",
      "parameters": {
        "type": "object",
        "properties": {
          "rx": { "type": "string", "example": "Amoxicillin 500mg" },
          "pharmacyId": { "type": "string", "example": "CVS-419" }
        },
        "required": ["rx", "pharmacyId"]
      }
    }
  ]
}`,
      orchestration: {
        sttEngine: 'Autoniv STT',
        llmEngine: 'Gemini 2.5 Flash',
        ttsEngine: 'Autoniv Neural TTS',
        sarvamVoiceId: 'sarvam:bulbul:v3:dev',
        sarvamVoiceLabel: 'Autoniv Dev (Male)',
        totalLatency: '350ms',
        sttLatency: '95ms',
        llmLatency: '145ms',
        ttsLatency: '110ms',
      },
      languages: ['English', 'Hinglish', 'Hindi'],
      phoneNumber: '+1 (800) 555-0198',
      tags: ['Prescription Refill', 'Outbound Automated Call'],
      description: 'Automated post-surgery check-in collecting recovery ratings and coordinating automated pharmacy refills using Autoniv Dev voice.',
      extractedEntities: [
        { label: 'Medication', value: 'Amoxicillin 500mg' },
        { label: 'Recovery Rating', value: '8/10 (Stable)' },
        { label: 'Pharmacy', value: 'CVS Pharmacy #419' },
      ],
      transcript: [
        {
          speaker: 'agent',
          text: 'Good morning! This is Dr. Dev calling from City Health Clinic powered by Autoniv. How is your recovery progress today on a scale of 1 to 10?',
          timestamp: '00:03',
          delayMs: 0,
          durationMs: 8000,
        },
        {
          speaker: 'user',
          text: "It's around a 3 today, much better! But I am running low on my antibiotic prescription.",
          timestamp: '00:12',
          delayMs: 9000,
          durationMs: 6000,
        },
        {
          speaker: 'system',
          text: "🔧 Tool Triggered: requestPrescriptionRefill({ rx: 'Amoxicillin 500mg', pharmacyId: 'CVS-419' })",
          timestamp: '00:18',
          toolCall: {
            name: 'requestPrescriptionRefill',
            args: 'rx: Amoxicillin 500mg',
            result: 'Refill Sent to CVS Pharmacy #419',
          },
          delayMs: 15000,
          durationMs: 1000,
        },
        {
          speaker: 'agent',
          text: 'Glad to hear you are recovering nicely! I have submitted a refill for Amoxicillin 500mg to CVS Pharmacy #419 right away. Should I confirm this pickup?',
          timestamp: '00:20',
          highlightKey: 'Medication',
          delayMs: 16000,
          durationMs: 7000,
        },
        {
          speaker: 'user',
          text: 'Yes please, that pharmacy location is right by my office.',
          timestamp: '00:29',
          delayMs: 24000,
          durationMs: 4000,
        },
        {
          speaker: 'agent',
          text: 'Refill confirmed! CVS will send you an SMS as soon as it is ready for pickup. Have a wonderful rest of your day!',
          timestamp: '00:35',
          delayMs: 29000,
          durationMs: 7000,
        },
      ],
    },
  ],

  realestate: [
    {
      id: 're-1',
      title: 'Luxury Apartment Qualification & Site Visit',
      subtitle: 'Autoniv Real Estate • Autoniv Aditya Voice',
      agentName: 'Aditya (Autoniv Estate Agent)',
      agentAvatar: '🏢',
      industry: 'realestate',
      duration: '00:54',
      durationMs: 54000,
      audioUrl: '',
      systemPrompt: `# 🏢 AUTONIV VOICE AGENT SYSTEM PROMPT — REAL ESTATE QUALIFICATION

## 1. AGENT IDENTITY & ROLE
- **Name**: Aditya (Senior Real Estate Advisor)
- **Organization**: Premier Homes powered by Autoniv
- **Primary Mission**: Engage inbound buyer leads inquiring about luxury penthouses, verify budget eligibility ($1.2M - $1.5M), check bank pre-approval, and schedule private site visit walkthroughs using Autoniv Aditya neural voice.

## 2. VOICE & VERNACULAR TONE GUIDELINES
- Crisp, articulate, high-converting real estate consultant voice (Autoniv Aditya - 0.85x pitch).
- Speak fluently in English, Hindi, and Hinglish.

## 3. MANDATORY DATA COLLECTION FIELDS
1. **Interested Property Unit**: (e.g. Skyline Residences #14B)
2. **Buyer Budget Range**: ($1.2M - $1.5M)
3. **Mortgage Pre-Approval Status**: (Bank name e.g. JPMorgan Chase)
4. **Site Visit Date & Time**: (Saturday at 2:00 PM)

## 4. FUNCTION TOOL INVOCATION
Trigger function tool saveLead({ type: 'Buyer', budget: '$1.4M', preApproved: true }) as soon as pre-approval status is confirmed.`,

      toolSchema: `{
  "tools": [
    {
      "name": "saveLead",
      "description": "Registers qualified property lead into CRM pipeline.",
      "parameters": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["Buyer", "Seller", "Renter"] },
          "budget": { "type": "string" },
          "preApproved": { "type": "boolean" }
        },
        "required": ["type", "budget"]
      }
    }
  ]
}`,
      orchestration: {
        sttEngine: 'Autoniv STT',
        llmEngine: 'Groq Llama 3.3 70B',
        ttsEngine: 'Autoniv Neural TTS',
        sarvamVoiceId: 'sarvam:bulbul:v3:aditya',
        sarvamVoiceLabel: 'Autoniv Aditya (Male)',
        totalLatency: '330ms',
        sttLatency: '85ms',
        llmLatency: '135ms',
        ttsLatency: '110ms',
      },
      languages: ['English', 'Hindi'],
      phoneNumber: '+1 (888) 402-9102',
      tags: ['Lead Qualification', 'Site Visit Booking', 'Budget Verification'],
      description: 'Engages inbound buyer leads, confirms budget range, and triggers saveLead to log pre-approval details in Autoniv Aditya voice.',
      extractedEntities: [
        { label: 'Property', value: 'Skyline Residences #14B' },
        { label: 'Budget Range', value: '$1.2M - $1.5M' },
        { label: 'Walkthrough Date', value: 'Saturday at 2:00 PM' },
        { label: 'Pre-Approved', value: 'Yes (JPMorgan Chase)' },
      ],
      transcript: [
        {
          speaker: 'agent',
          text: 'Hi there! Thanks for inquiring about Skyline Residences. This is Aditya with Premier Homes powered by Autoniv. Are you looking for a 2-bedroom or 3-bedroom penthouse?',
          timestamp: '00:02',
          delayMs: 0,
          durationMs: 7000,
        },
        {
          speaker: 'user',
          text: "Hi Aditya! I'm interested in the 3-bedroom penthouse on floor 14. What is the asking price?",
          timestamp: '00:10',
          delayMs: 8000,
          durationMs: 6000,
        },
        {
          speaker: 'agent',
          text: 'Unit 14B is listed at $1.35 Million with skyline views. May I check if your budget aligns with this range and if you have bank pre-approval?',
          timestamp: '00:18',
          highlightKey: 'Budget Range',
          delayMs: 15000,
          durationMs: 8000,
        },
        {
          speaker: 'user',
          text: 'Yes, my budget is around $1.4M and I have a pre-approval letter from Chase.',
          timestamp: '00:27',
          highlightKey: 'Pre-Approved',
          delayMs: 24000,
          durationMs: 5000,
        },
        {
          speaker: 'system',
          text: "🔧 Tool Triggered: saveLead({ type: 'Buyer', budget: '$1.4M', preApproved: true })",
          timestamp: '00:32',
          toolCall: {
            name: 'saveLead',
            args: 'type: Buyer, budget: $1.4M',
            result: 'Lead Registered in CRM #LEAD-7741',
          },
          delayMs: 29000,
          durationMs: 1000,
        },
        {
          speaker: 'agent',
          text: 'Excellent! I can reserve a private walkthrough for you this Saturday at 2:00 PM with senior agent Marcus. Shall I lock that in?',
          timestamp: '00:34',
          highlightKey: 'Walkthrough Date',
          delayMs: 30000,
          durationMs: 8000,
        },
        {
          speaker: 'user',
          text: 'Saturday at 2:00 PM is perfect.',
          timestamp: '00:43',
          delayMs: 39000,
          durationMs: 3000,
        },
        {
          speaker: 'agent',
          text: 'You are booked! Directions and confirmation code have been sent to your WhatsApp and email. We look forward to meeting you Saturday!',
          timestamp: '00:47',
          delayMs: 43000,
          durationMs: 8000,
        },
      ],
    },
  ],

  finance: [
    {
      id: 'fin-1',
      title: 'Personal Loan Pre-Screening & Instant Rate',
      subtitle: 'Autoniv Financial AI • Autoniv Shubh Voice',
      agentName: 'Shubh (Autoniv Capital AI)',
      agentAvatar: '💼',
      industry: 'finance',
      duration: '00:48',
      durationMs: 48000,
      audioUrl: '',
      systemPrompt: `# 🏦 AUTONIV VOICE AGENT SYSTEM PROMPT — LOAN UNDERWRITING

## 1. AGENT IDENTITY & ROLE
- **Name**: Shubh (AI Loan Underwriting Specialist)
- **Organization**: Apex Financial powered by Autoniv
- **Primary Mission**: Calculate instant personal loan pre-approval rates, monthly EMIs, and APR percentages in under 60 seconds with zero credit score impact using Autoniv Shubh neural voice.

## 2. SECURITY & COMPLIANCE GUARDRAILS
- NEVER ask for sensitive passwords, OTPs, Aadhaar, PAN, CVVs, or full credit card numbers.
- Provide clear transparent APR breakdowns (6.4%) and monthly payments ($765).

## 3. FUNCTION TOOL EXECUTION
Call calculateLoanRate({ amount: 25000, income: 8500 }) to compute instant interest rates.`,

      toolSchema: `{
  "tools": [
    {
      "name": "calculateLoanRate",
      "description": "Calculates real-time loan underwriting eligibility and monthly EMI.",
      "parameters": {
        "type": "object",
        "properties": {
          "amount": { "type": "number", "example": 25000 },
          "income": { "type": "number", "example": 8500 }
        },
        "required": ["amount", "income"]
      }
    }
  ]
}`,
      orchestration: {
        sttEngine: 'Autoniv STT',
        llmEngine: 'Groq Llama 3.3 70B',
        ttsEngine: 'Autoniv Neural TTS',
        sarvamVoiceId: 'sarvam:bulbul:v3:shubh',
        sarvamVoiceLabel: 'Autoniv Shubh (Male)',
        totalLatency: '340ms',
        sttLatency: '90ms',
        llmLatency: '140ms',
        ttsLatency: '110ms',
      },
      languages: ['English', 'Hindi', 'Hinglish'],
      phoneNumber: '+1 (800) 890-4100',
      tags: ['Loan Screening', 'KYC Collection', 'Instant Estimate'],
      description: 'Calculates loan eligibility based on income, employment status, and requested credit line in real time using Autoniv Shubh voice.',
      extractedEntities: [
        { label: 'Requested Amount', value: '$25,000' },
        { label: 'Monthly Income', value: '$8,500' },
        { label: 'Approved APR Rate', value: '6.4%' },
        { label: 'Term Length', value: '36 Months' },
      ],
      transcript: [
        {
          speaker: 'agent',
          text: "Welcome to Apex Financial! I'm Shubh, your AI loan specialist powered by Autoniv. I can check your personal loan pre-approval rate in under 60 seconds with no credit score impact. How much funding are you seeking?",
          timestamp: '00:02',
          delayMs: 0,
          durationMs: 9000,
        },
        {
          speaker: 'user',
          text: "Hi Shubh, I'm looking for a $25,000 loan for home renovation.",
          timestamp: '00:12',
          highlightKey: 'Requested Amount',
          delayMs: 10000,
          durationMs: 5000,
        },
        {
          speaker: 'agent',
          text: 'Great choice! Could you confirm your monthly gross income and employment status to run instant underwriting calculations?',
          timestamp: '00:18',
          delayMs: 16000,
          durationMs: 6000,
        },
        {
          speaker: 'user',
          text: 'I am full-time employed as a Software Engineer earning $8,500 per month.',
          timestamp: '00:25',
          highlightKey: 'Monthly Income',
          delayMs: 23000,
          durationMs: 5000,
        },
        {
          speaker: 'system',
          text: "🔧 Tool Triggered: calculateLoanRate({ amount: 25000, income: 8500 })",
          timestamp: '00:30',
          toolCall: {
            name: 'calculateLoanRate',
            args: 'amount: 25000, income: 8500',
            result: 'Approved APR: 6.4%, Monthly EMI: $765',
          },
          delayMs: 28000,
          durationMs: 1000,
        },
        {
          speaker: 'agent',
          text: 'Thank you! Based on your parameters, you are pre-approved for $25,000 at a 6.4% APR with monthly payments of $765 over 36 months. Should I send the instant transfer application link?',
          timestamp: '00:32',
          highlightKey: 'Approved APR Rate',
          delayMs: 29000,
          durationMs: 12000,
        },
      ],
    },
  ],

  ecommerce: [
    {
      id: 'ecom-1',
      title: 'Cash on Delivery (COD) Order Verification',
      subtitle: 'Autoniv E-Commerce • Autoniv Simran Voice',
      agentName: 'Simran (Autoniv Order AI)',
      agentAvatar: '📦',
      industry: 'ecommerce',
      duration: '00:52',
      durationMs: 52000,
      audioUrl: '',
      systemPrompt: `# 📦 AUTONIV VOICE AGENT SYSTEM PROMPT — E-COMMERCE COD DISPATCH

## 1. AGENT IDENTITY & ROLE
- **Name**: Simran (Order Verification Specialist)
- **Organization**: SwiftCart powered by Autoniv
- **Primary Objective**: Verify Cash on Delivery (COD) orders before warehouse dispatch to drastically reduce Return to Origin (RTO) expenses using Autoniv Simran neural voice.

## 2. FUNCTION TOOL EXECUTION
Trigger verifyOrderShipment({ orderId: 'SC-98421', status: 'Confirmed' }) upon buyer voice confirmation.`,

      toolSchema: `{
  "tools": [
    {
      "name": "verifyOrderShipment",
      "description": "Updates Shopify/WooCommerce shipment status to Express Dispatch.",
      "parameters": {
        "type": "object",
        "properties": {
          "orderId": { "type": "string" },
          "status": { "type": "string" }
        },
        "required": ["orderId", "status"]
      }
    }
  ]
}`,
      orchestration: {
        sttEngine: 'Autoniv STT',
        llmEngine: 'Gemini 2.5 Flash',
        ttsEngine: 'Autoniv Neural TTS',
        sarvamVoiceId: 'sarvam:bulbul:v3:simran',
        sarvamVoiceLabel: 'Autoniv Simran (Female)',
        totalLatency: '330ms',
        sttLatency: '85ms',
        llmLatency: '135ms',
        ttsLatency: '110ms',
      },
      languages: ['English', 'Hindi', 'Hinglish'],
      phoneNumber: '+1 (800) 330-9112',
      tags: ['COD Verification', 'Shopify Integration', 'RTO Reduction'],
      description: 'Outbound AI verification call confirming cash-on-delivery order details before dispatching shipment using Autoniv Simran voice.',
      extractedEntities: [
        { label: 'Order ID', value: '#SC-98421' },
        { label: 'Item Name', value: 'Wireless Headphones' },
        { label: 'Total Amount', value: '$129.00 (COD)' },
        { label: 'Status', value: 'Verified for Express Dispatch' },
      ],
      transcript: [
        {
          speaker: 'agent',
          text: "Hi David! This is Simran calling from SwiftCart powered by Autoniv regarding your recent Cash on Delivery order #SC-98421 for Wireless Headphones worth $129. Are you available to confirm this order?",
          timestamp: '00:02',
          highlightKey: 'Order ID',
          delayMs: 0,
          durationMs: 9000,
        },
        {
          speaker: 'user',
          text: 'Yes! I placed that order yesterday. Please ship it.',
          timestamp: '00:12',
          delayMs: 10000,
          durationMs: 4000,
        },
        {
          speaker: 'system',
          text: "🔧 Tool Triggered: verifyOrderShipment({ orderId: 'SC-98421', status: 'Confirmed' })",
          timestamp: '00:16',
          toolCall: {
            name: 'verifyOrderShipment',
            args: 'orderId: SC-98421, status: Confirmed',
            result: 'Order Status Updated: Express Dispatch Ready',
          },
          delayMs: 14000,
          durationMs: 1000,
        },
        {
          speaker: 'agent',
          text: 'Awesome! Your order is verified and slated for express shipping tomorrow morning. Estimated delivery is Friday afternoon. Thank you for shopping with SwiftCart!',
          timestamp: '00:17',
          highlightKey: 'Status',
          delayMs: 15000,
          durationMs: 8000,
        },
      ],
    },
  ],

  education: [
    {
      id: 'edu-1',
      title: 'University Admission Counseling & Intake',
      subtitle: 'Autoniv EdTech • Autoniv Rahul Voice',
      agentName: 'Rahul (EduGuide AI Counselor)',
      agentAvatar: '🎓',
      industry: 'education',
      duration: '00:50',
      durationMs: 50000,
      audioUrl: '',
      systemPrompt: `# 🎓 AUTONIV VOICE AGENT SYSTEM PROMPT — ADMISSIONS COUNSELING

## 1. AGENT IDENTITY & ROLE
- **Name**: Rahul (Senior Admissions Counselor)
- **Organization**: Horizon University powered by Autoniv
- **Primary Mission**: Provide degree program details (M.S. Data Science), evaluate academic eligibility, calculate Merit Scholarship grants (25%), and schedule 1-on-1 counselor calls using Autoniv Rahul neural voice.`,

      toolSchema: `{
  "tools": [
    {
      "name": "saveLead",
      "description": "Registers prospective student application in university database.",
      "parameters": {
        "type": "object",
        "properties": {
          "program": { "type": "string" },
          "scholarshipEligible": { "type": "boolean" }
        }
      }
    }
  ]
}`,
      orchestration: {
        sttEngine: 'Autoniv STT',
        llmEngine: 'Groq Llama 3.3 70B',
        ttsEngine: 'Autoniv Neural TTS',
        sarvamVoiceId: 'sarvam:bulbul:v3:rahul',
        sarvamVoiceLabel: 'Autoniv Rahul (Male)',
        totalLatency: '350ms',
        sttLatency: '95ms',
        llmLatency: '145ms',
        ttsLatency: '110ms',
      },
      languages: ['English', 'Hindi'],
      phoneNumber: '+1 (800) 700-1920',
      tags: ['Admission Counseling', 'Course Syllabus', 'Enrollment Drive'],
      description: 'Provides course details, eligibility criteria, tuition breakdown, and schedules a counselor strategy call using Autoniv Rahul voice.',
      extractedEntities: [
        { label: 'Program', value: 'M.S. in Data Science' },
        { label: 'Format', value: 'Online Hybrid (12 Months)' },
        { label: 'Intake Batch', value: 'Fall Semester (Sept 15)' },
        { label: 'Scholarship Grant', value: '25% Merit Discount' },
      ],
      transcript: [
        {
          speaker: 'agent',
          text: "Hello Samantha! Welcome to Horizon University. I'm Rahul, your AI admissions guide powered by Autoniv. How can I assist your educational journey today?",
          timestamp: '00:03',
          delayMs: 0,
          durationMs: 9000,
        },
        {
          speaker: 'user',
          text: 'Hi Rahul! I wanted to check if the program is fully online and what the tuition fees look like.',
          timestamp: '00:13',
          delayMs: 10000,
          durationMs: 6000,
        },
        {
          speaker: 'agent',
          text: 'The program is a flexible 12-month hybrid format with live evening workshops. Total tuition is $18,000, and based on your GPA, you qualify for our 25% Merit Scholarship discount!',
          timestamp: '00:20',
          highlightKey: 'Scholarship Grant',
          delayMs: 17000,
          durationMs: 10000,
        },
        {
          speaker: 'user',
          text: 'That sounds amazing! When is the final application deadline for the Fall batch?',
          timestamp: '00:31',
          delayMs: 28000,
          durationMs: 5000,
        },
        {
          speaker: 'agent',
          text: 'The Fall intake deadline is August 25th. I can book a 15-minute 1-on-1 strategy call with Dean Mitchell to help finalize your application document checklist. Should I lock that in for tomorrow at 4:00 PM?',
          timestamp: '00:37',
          highlightKey: 'Intake Batch',
          delayMs: 34000,
          durationMs: 11000,
        },
      ],
    },
  ],

  travel: [
    {
      id: 'trv-1',
      title: 'Boutique Hotel Suite Booking & Airport Shuttle',
      subtitle: 'Autoniv Concierge • Autoniv Priya Voice',
      agentName: 'Priya (Grand Resort Concierge)',
      agentAvatar: '🌴',
      industry: 'travel',
      duration: '00:46',
      durationMs: 46000,
      audioUrl: '',
      systemPrompt: `# 🏨 AUTONIV VOICE AGENT SYSTEM PROMPT — LUXURY CONCIERGE & HOTEL BOOKING

## 1. AGENT IDENTITY & ROLE
- **Name**: Priya (Digital Resort Concierge)
- **Organization**: Grand Vista Resort & Spa powered by Autoniv
- **Primary Mission**: Handle luxury suite reservations ($340/night), organize airport shuttle transfers, and log special guest requests using Autoniv Priya neural voice.`,

      toolSchema: `{
  "tools": [
    {
      "name": "checkAppointmentAvailability",
      "description": "Verifies hotel suite availability across requested stay dates.",
      "parameters": {
        "type": "object",
        "properties": {
          "roomType": { "type": "string" },
          "dates": { "type": "string" }
        }
      }
    }
  ]
}`,
      orchestration: {
        sttEngine: 'Autoniv STT',
        llmEngine: 'Groq Llama 3.3 70B',
        ttsEngine: 'Autoniv Neural TTS',
        sarvamVoiceId: 'sarvam:bulbul:v3:priya',
        sarvamVoiceLabel: 'Autoniv Priya (Female)',
        totalLatency: '330ms',
        sttLatency: '85ms',
        llmLatency: '135ms',
        ttsLatency: '110ms',
      },
      languages: ['English', 'Hindi', 'Hinglish'],
      phoneNumber: '+1 (800) 920-8484',
      tags: ['Hotel Booking', 'Flight Concierge', 'VIP Transfer'],
      description: 'Handles suite availability checks, upgrades, airport shuttle logistics, and special dietary requests using Autoniv Priya voice.',
      extractedEntities: [
        { label: 'Resort', value: 'Grand Vista Resort & Spa' },
        { label: 'Room Type', value: 'Oceanfront King Suite' },
        { label: 'Stay Dates', value: 'Nov 12 - Nov 16 (4 Nights)' },
        { label: 'Special Request', value: 'Private Airport Pickup' },
      ],
      transcript: [
        {
          speaker: 'agent',
          text: "Namaste! Thank you for calling Grand Vista Resort. I'm Priya, your digital concierge powered by Autoniv. How may I customize your stay?",
          timestamp: '00:02',
          delayMs: 0,
          durationMs: 7000,
        },
        {
          speaker: 'user',
          text: "Hi Priya, I'd like to check room availability for an oceanfront suite from November 12th to November 16th.",
          timestamp: '00:10',
          delayMs: 8000,
          durationMs: 6000,
        },
        {
          speaker: 'agent',
          text: 'I have our flagship Oceanfront King Suite available for those 4 nights at $340 per night including complimentary breakfast and spa access. Would you like me to reserve this suite?',
          timestamp: '00:17',
          highlightKey: 'Room Type',
          delayMs: 15000,
          durationMs: 10000,
        },
        {
          speaker: 'user',
          text: 'Yes please! Also, can you arrange an airport shuttle transfer for my arrival at 3 PM?',
          timestamp: '00:28',
          highlightKey: 'Special Request',
          delayMs: 26000,
          durationMs: 5000,
        },
        {
          speaker: 'agent',
          text: 'Consider it done! Your Oceanfront Suite is locked in, and a private chauffeur will await you at Terminal 2 with a name placard. We look forward to welcoming you!',
          timestamp: '00:34',
          delayMs: 32000,
          durationMs: 9000,
        },
      ],
    },
  ],
};

function synthesizeVocalSpeech(speakerName: string, isFemale: boolean, durationSec: number = 2.5) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const pitchTable: Record<string, { baseFreq: number; formant: number }> = {
      shreya: { baseFreq: 310, formant: 980 },
      priya: { baseFreq: 270, formant: 880 },
      ritu: { baseFreq: 240, formant: 820 },
      simran: { baseFreq: 330, formant: 1050 },
      shubh: { baseFreq: 110, formant: 420 },
      dev: { baseFreq: 100, formant: 380 },
      aditya: { baseFreq: 150, formant: 520 },
      rahul: { baseFreq: 180, formant: 600 },
    };

    const config = pitchTable[speakerName.toLowerCase()] || {
      baseFreq: isFemale ? 280 : 130,
      formant: isFemale ? 900 : 450,
    };

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.09, now);
    masterGain.connect(ctx.destination);

    const wordCount = Math.max(3, Math.floor(durationSec * 3));
    const wordDuration = Math.min(0.4, durationSec / wordCount);

    for (let w = 0; w < wordCount; w++) {
      const startTime = now + w * (wordDuration + 0.05);
      const endTime = startTime + wordDuration;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const wordGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      const inflection = Math.sin(w * 1.5) * 25;
      osc1.frequency.setValueAtTime(config.baseFreq + inflection, startTime);
      osc2.frequency.setValueAtTime(config.formant + inflection, startTime);

      wordGain.gain.setValueAtTime(0, startTime);
      wordGain.gain.linearRampToValueAtTime(0.14, startTime + 0.04);
      wordGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc1.connect(wordGain);
      osc2.connect(wordGain);
      wordGain.connect(masterGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(endTime);
      osc2.stop(endTime);
    }
  } catch {
    // Suppress audio context autoplay restrictions
  }
}

export function DemoRecordings() {
  const [activeTab, setActiveTab] = useState<IndustryId>('healthcare');
  const [selectedDemo, setSelectedDemo] = useState<DemoRecording>(DEMO_RECORDINGS['healthcare'][0]);
  const [selectedSarvamVoice, setSelectedSarvamVoice] = useState<string>('sarvam:bulbul:v3:shreya');
  const [selectedUserVoice, setSelectedUserVoice] = useState<string>('sarvam:bulbul:v3:shubh');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [activeTranscriptIdx, setActiveTranscriptIdx] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showWebCallModal, setShowWebCallModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [activePromptTab, setActivePromptTab] = useState<'prompt' | 'schema' | 'sarvam'>('prompt');
  const [activeUspIdx, setActiveUspIdx] = useState<number>(0);
  const [webCallStatus, setWebCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [webCallDuration, setWebCallDuration] = useState<number>(0);
  const [userQuery, setUserQuery] = useState<string>('');
  const [webCallMessages, setWebCallMessages] = useState<{ speaker: 'agent' | 'user'; text: string; time: string }[]>([]);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioFileRef = useRef<HTMLAudioElement | null>(null);
  const webCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTranscriptIdxRef = useRef<number>(0);
  const currentTimeMsRef = useRef<number>(0);

  const currentTab = useMemo(() => INDUSTRIES.find((tab) => tab.id === activeTab)!, [activeTab]);
  const demos = useMemo(() => DEMO_RECORDINGS[activeTab] || [], [activeTab]);

  useEffect(() => {
    const sliderInterval = setInterval(() => {
      setActiveUspIdx((prev) => (prev + 1) % USP_SLIDES.length);
    }, 4500);
    return () => clearInterval(sliderInterval);
  }, []);

  const speakTurn = useCallback(async (item: TranscriptItem, agentVoiceId: string, userVoiceId: string = selectedUserVoice) => {
    let voiceIdToUse = item.speaker === 'user' ? userVoiceId : agentVoiceId;
    if (item.speaker === 'user' && !voiceIdToUse) {
      const isAgentFemale = ['shreya', 'ritu', 'priya', 'simran'].some((v) => agentVoiceId.toLowerCase().includes(v));
      voiceIdToUse = isAgentFemale ? 'sarvam:bulbul:v3:shubh' : 'sarvam:bulbul:v3:shreya';
    }

    const speakerName = (voiceIdToUse.split(':').pop() || 'shreya').toLowerCase();
    const isFemale = ['shreya', 'ritu', 'priya', 'simran'].includes(speakerName);

    if (!isMuted) {
      try {
        const langCode = selectedDemo.languages.includes('Hindi') ? 'hi' : 'en';
        const ttsUrl = `/api/tts/speak?text=${encodeURIComponent(item.text)}&voiceId=${encodeURIComponent(voiceIdToUse)}&language=${encodeURIComponent(langCode)}`;

        if (audioFileRef.current) audioFileRef.current.pause();
        const audio = new Audio(ttsUrl);
        audioFileRef.current = audio;
        audio.playbackRate = playbackSpeed;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          return;
        }
      } catch {
        // Fallback to direct Sarvam API or Web Speech
      }
    }

    const sarvamApiKey = import.meta.env.VITE_SARVAM_API_KEY;
    if (sarvamApiKey && !isMuted) {
      try {
        const langCode = selectedDemo.languages.includes('Hindi') ? 'hi-IN' : 'en-IN';
        const res = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': sarvamApiKey,
          },
          body: JSON.stringify({
            inputs: [item.text],
            text: item.text,
            target_language_code: langCode,
            speaker: speakerName,
            pitch: isFemale ? 0.25 : -0.25,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 22050,
            enable_preprocessing: true,
            model: 'bulbul:v3',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audios && data.audios[0]) {
            const audioSrc = `data:audio/wav;base64,${data.audios[0]}`;
            if (audioFileRef.current) audioFileRef.current.pause();
            audioFileRef.current = new Audio(audioSrc);
            audioFileRef.current.playbackRate = playbackSpeed;
            audioFileRef.current.play();
            return;
          }
        }
      } catch {
        // Fallback to Web Speech API
      }
    }

    synthesizeVocalSpeech(speakerName, isFemale, item.durationMs / 1000);
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = playbackSpeed;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const matchedVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          if (isFemale) return name.includes('female') || name.includes('zira') || name.includes('swara') || name.includes('google hindi');
          return name.includes('male') || name.includes('david') || name.includes('mark') || name.includes('george');
        }) || voices.find((v) => v.lang.includes('IN') || v.lang.includes('hi'));

        if (matchedVoice) utterance.voice = matchedVoice;
      }

      utterance.pitch = isFemale ? 1.25 : 0.75;
      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis failures
    }
  }, [isMuted, playbackSpeed, selectedDemo, selectedUserVoice]);

  const pausePlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioFileRef.current) {
      audioFileRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPlaying(false);
  }, []);

  const stopPlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioFileRef.current) {
      audioFileRef.current.pause();
      audioFileRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    currentTimeMsRef.current = 0;
    activeTranscriptIdxRef.current = 0;
    setCurrentTimeMs(0);
    setActiveTranscriptIdx(0);
  }, []);

  const handleTabChange = (id: IndustryId) => {
    setActiveTab(id);
    const newDemo = DEMO_RECORDINGS[id]?.[0];
    if (newDemo) {
      setSelectedDemo(newDemo);
      setSelectedSarvamVoice(newDemo.orchestration.sarvamVoiceId);
      stopPlayback();
    }
  };

  const handleSelectDemo = (demo: DemoRecording) => {
    setSelectedDemo(demo);
    setSelectedSarvamVoice(demo.orchestration.sarvamVoiceId);
    stopPlayback();
  };

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pausePlayback();
      return;
    }

    if (selectedDemo.audioUrl) {
      if (!audioFileRef.current || audioFileRef.current.src !== selectedDemo.audioUrl) {
        audioFileRef.current = new Audio(selectedDemo.audioUrl);
      }
      audioFileRef.current.playbackRate = playbackSpeed;
      audioFileRef.current.play().then(() => setIsPlaying(true)).catch(() => { });

      const interval = 100;
      timerRef.current = setInterval(() => {
        if (!audioFileRef.current) return;
        const elapsed = audioFileRef.current.currentTime * 1000;
        currentTimeMsRef.current = elapsed;
        setCurrentTimeMs(elapsed);

        if (audioFileRef.current.ended) {
          stopPlayback();
          return;
        }

        const transcript = selectedDemo.transcript;
        const currentIdx = transcript.findIndex((item, idx) => {
          const nextItem = transcript[idx + 1];
          if (!nextItem) return elapsed >= item.delayMs;
          return elapsed >= item.delayMs && elapsed < nextItem.delayMs;
        });

        if (currentIdx !== -1 && currentIdx !== activeTranscriptIdxRef.current) {
          activeTranscriptIdxRef.current = currentIdx;
          setActiveTranscriptIdx(currentIdx);
        }
      }, interval);

      return;
    }

    setIsPlaying(true);

    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    let elapsed = currentTimeMsRef.current;
    const transcript = selectedDemo.transcript;

    let startIdx = transcript.findIndex((item, idx) => {
      const nextItem = transcript[idx + 1];
      if (!nextItem) return elapsed >= item.delayMs;
      return elapsed >= item.delayMs && elapsed < nextItem.delayMs;
    });

    if (startIdx === -1) startIdx = 0;

    activeTranscriptIdxRef.current = startIdx;
    setActiveTranscriptIdx(startIdx);

    if (!('speechSynthesis' in window) || !window.speechSynthesis.speaking) {
      if (transcript[startIdx] && transcript[startIdx].speaker !== 'system') {
        speakTurn(transcript[startIdx], selectedSarvamVoice, selectedUserVoice);
      }
    }

    const interval = 100;
    timerRef.current = setInterval(() => {
      elapsed += interval * playbackSpeed;
      currentTimeMsRef.current = elapsed;
      setCurrentTimeMs(elapsed);

      if (elapsed >= selectedDemo.durationMs) {
        stopPlayback();
        return;
      }

      const currentIdx = transcript.findIndex((item, idx) => {
        const nextItem = transcript[idx + 1];
        if (!nextItem) return elapsed >= item.delayMs;
        return elapsed >= item.delayMs && elapsed < nextItem.delayMs;
      });

      if (currentIdx !== -1 && currentIdx !== activeTranscriptIdxRef.current) {
        activeTranscriptIdxRef.current = currentIdx;
        setActiveTranscriptIdx(currentIdx);
        if (transcript[currentIdx] && transcript[currentIdx].speaker !== 'system') {
          speakTurn(transcript[currentIdx], selectedSarvamVoice, selectedUserVoice);
        }
      }
    }, interval);
  }, [isPlaying, selectedDemo, selectedSarvamVoice, selectedUserVoice, playbackSpeed, speakTurn, pausePlayback, stopPlayback]);

  const startWebCall = () => {
    setShowWebCallModal(true);
    setWebCallStatus('connecting');
    setWebCallDuration(0);
    const greetingText = `Namaste! Thank you for calling ${selectedDemo.agentName}. How can I assist you with ${selectedDemo.title} today?`;
    setWebCallMessages([
      { speaker: 'agent', text: greetingText, time: '00:00' }
    ]);

    setTimeout(() => {
      setWebCallStatus('connected');
      speakTurn({ speaker: 'agent', text: greetingText, timestamp: '00:00', delayMs: 0, durationMs: 4000 }, selectedSarvamVoice, selectedUserVoice);
      webCallTimerRef.current = setInterval(() => {
        setWebCallDuration((prev) => prev + 1);
      }, 1000);
    }, 1200);
  };

  const handleSendWebCallMessage = (userText: string) => {
    if (!userText.trim()) return;
    const timeSecs = webCallDuration;
    const mins = Math.floor(timeSecs / 60);
    const secs = timeSecs % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const userMsg = { speaker: 'user' as const, text: userText, time: timeStr };
    setWebCallMessages((prev) => [...prev, userMsg]);
    speakTurn({ speaker: 'user', text: userText, timestamp: timeStr, delayMs: 0, durationMs: 3000 }, selectedSarvamVoice, selectedUserVoice);

    setTimeout(() => {
      let agentReply = `Got it! Autoniv Voice Engine has processed "${userText}" and updated your records. Is there anything else I can help you with?`;

      const lower = userText.toLowerCase();
      if (lower.includes('appointment') || lower.includes('book') || lower.includes('schedule')) {
        agentReply = `I have pre-checked slot availability and booked your appointment for tomorrow. A confirmation SMS with details has been sent!`;
      } else if (lower.includes('rate') || lower.includes('interest') || lower.includes('loan') || lower.includes('finance')) {
        agentReply = `Our loan interest rates currently start at 8.40% p.a. with instant pre-approval. Would you like me to share full plan details?`;
      } else if (lower.includes('order') || lower.includes('status') || lower.includes('where') || lower.includes('track')) {
        agentReply = `Your order #84920 has been dispatched via Express Delivery and is scheduled to arrive tomorrow by 4:00 PM.`;
      }

      const replyMins = Math.floor((timeSecs + 2) / 60);
      const replySecs = (timeSecs + 2) % 60;
      const replyTimeStr = `${replyMins}:${replySecs.toString().padStart(2, '0')}`;

      const agentMsg = { speaker: 'agent' as const, text: agentReply, time: replyTimeStr };
      setWebCallMessages((prev) => [...prev, agentMsg]);
      speakTurn({ speaker: 'agent', text: agentReply, timestamp: replyTimeStr, delayMs: 0, durationMs: 4000 }, selectedSarvamVoice, selectedUserVoice);
    }, 1400);
  };

  const endWebCall = () => {
    if (webCallTimerRef.current) clearInterval(webCallTimerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioFileRef.current) audioFileRef.current.pause();
    setWebCallStatus('ended');
    setTimeout(() => {
      setShowWebCallModal(false);
      setWebCallStatus('idle');
    }, 1000);
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      if (webCallTimerRef.current) clearInterval(webCallTimerRef.current);
    };
  }, [stopPlayback]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeUsp = USP_SLIDES[activeUspIdx];

  const currentTurn = selectedDemo.transcript[activeTranscriptIdx] || selectedDemo.transcript[0];
  const isAgentSpeaking = isPlaying && currentTurn?.speaker === 'agent';
  const isCallerSpeaking = isPlaying && currentTurn?.speaker === 'user';

  return (
    <div className="m-body-pad" style={{ background: '#F8FAFC', color: '#0F172A', fontFamily: SANS, minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes studioPulse {
          0%, 100% { transform: scale(1); opacity: 0.95; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.06); opacity: 1; box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
        }
        @keyframes glowRing {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        @keyframes pipelineSignal {
          0% { left: 0%; opacity: 0.2; }
          50% { opacity: 1; }
          100% { left: 100%; opacity: 0.2; }
        }
        @keyframes fadeHighlight {
          0% { box-shadow: 0 0 0 0 ${currentTab.accentColor}40; }
          100% { box-shadow: 0 0 0 0 ${currentTab.accentColor}00; }
        }
        .agent-card-hover { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .agent-card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.1) !important; }
        .agent-card-hover:hover .agent-avatar-el { transform: scale(1.08); }
        .agent-card-hover:hover .agent-play-label { opacity: 1; }
        .agent-avatar-el { transition: transform 0.25s ease; }
        .agent-play-label { opacity: 0; transition: opacity 0.2s ease; }
        .tab-btn-hover { transition: all 0.2s ease; }
        .tab-btn-hover:hover { background: #F1F5F9 !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 768px) {
          .m-hide { display: none !important; }
          .m-flex-col { flex-direction: column !important; }
          .m-grid-1 { grid-template-columns: 1fr !important; }
          .m-grid-2 { grid-template-columns: repeat(2, 1fr) !important; }
          .m-text-center { text-align: center !important; }
          .m-px-16 { padding-left: 16px !important; padding-right: 16px !important; }
          .m-gap-12 { gap: 12px !important; }
          .m-p-12 { padding: 12px !important; }
          .m-full-modal { border-radius: 0 !important; max-width: 100% !important; width: 100% !important; max-height: 100vh !important; height: 100vh !important; }
          .m-scroll-x { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .m-pipeline-scroll { flex-wrap: nowrap !important; justify-content: flex-start !important; padding-bottom: 8px; }
          .m-workforce-scroll { grid-template-columns: repeat(6, 130px) !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .m-bottom-ctrl { display: flex !important; }
          .m-hero-stat { flex-direction: row !important; flex-wrap: nowrap !important; gap: 8px !important; justify-content: center !important; }
        }
        @media (min-width: 769px) {
          .m-bottom-ctrl { display: none !important; }
        }
      `}</style>

      <USPSlider />
      <PublicNavbar />


      {/* ── 2. COMPACT HERO ── */}
      <section className='mt-30' style={{ padding: '32px 16px 24px', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 10, fontWeight: 800, color: currentTab.accentColor, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: MONO, marginBottom: 8 }}>
              AUTONIV VOICE INTELLIGENCE
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.8rem)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.12, marginBottom: 8 }}>
              AI agents that actually talk to your <GradientText>customers</GradientText>.
            </h1>
          </Reveal>

          <Reveal delay={130}>
            <p style={{ fontSize: 'clamp(0.85rem, 2vw, 1.05rem)', color: '#64748B', lineHeight: 1.5, maxWidth: 640, margin: '0 auto 18px' }}>
              Build, deploy and monitor production-grade voice agents capable of understanding customers, calling tools, and completing real-world tasks.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="m-hero-stat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'nowrap', overflowX: 'auto', padding: '4px 0' }}>
              {[
                { value: '340ms', label: 'Latency' },
                { value: '20+', label: 'Languages' },
                { value: '24/7', label: 'Availability' },
                { value: '99.9%', label: 'Uptime', color: '#059669' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {i > 0 && <span style={{ width: 1, height: 14, background: '#CBD5E1', flexShrink: 0, marginRight: 6 }} />}
                  <span style={{ fontSize: 'clamp(12px, 3.2vw, 18px)', fontWeight: 900, color: s.color || '#0F172A', fontFamily: MONO, whiteSpace: 'nowrap' }}>{s.value}</span>
                  <span style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 3–6. MAIN PRODUCT AREA ── */}
      <section id="demo-workstation" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Live Platform Capability Pill */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: activeUsp.accentColor, fontFamily: MONO, flexWrap: 'wrap' }}>
          <span>{activeUsp.icon}</span>
          <span>{activeUsp.badge}:</span>
          <span style={{ color: '#0F172A' }}>{activeUsp.title}</span>
          <span style={{ background: `${activeUsp.accentColor}15`, color: activeUsp.accentColor, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{activeUsp.stat} {activeUsp.statLabel}</span>
        </div>

        {/* 3. INDUSTRY SWITCHER */}
        <div style={{ marginBottom: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 4, display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {INDUSTRIES.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="tab-btn-hover"
                style={{
                  flex: '1 1 0px',
                  minWidth: 130,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  background: isActive ? `${tab.accentColor}10` : 'transparent',
                  border: 'none',
                  borderTop: isActive ? `3px solid ${tab.accentColor}` : '3px solid transparent',
                  color: isActive ? '#0F172A' : '#94A3B8',
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. PERFORMANCE STRIP */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 24px', marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {currentTab.metrics.map((m, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? '1px solid #F1F5F9' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: i === 0 ? currentTab.accentColor : '#0F172A', fontFamily: MONO, display: 'block', lineHeight: 1 }}>{m.value}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', fontFamily: MONO, letterSpacing: '0.04em' }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Demo scenario selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {demos.map((demo) => {
            const isSelected = selectedDemo.id === demo.id;
            return (
              <button
                key={demo.id}
                onClick={() => handleSelectDemo(demo)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: isSelected ? '#FFFFFF' : '#F8FAFC',
                  border: isSelected ? `2px solid ${currentTab.accentColor}` : '1px solid #E2E8F0',
                  color: isSelected ? '#0F172A' : '#94A3B8',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <span>{demo.agentAvatar}</span>
                <span>{demo.title}</span>
                <span style={{ fontSize: 10, opacity: 0.7, fontFamily: MONO }}>({demo.duration})</span>
              </button>
            );
          })}
        </div>

        {/* 5. MAIN PRODUCT PANEL — TWO COLUMNS */}
        <div className="m-grid-1" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'flex-start' }}>

          {/* LEFT: AGENT PANEL */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Avatar + Name + LIVE badge */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 16 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `${currentTab.accentColor}15`,
                  border: `2px solid ${currentTab.accentColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 38,
                  margin: '0 auto 12px',
                  position: 'relative',
                  animation: isAgentSpeaking ? 'studioPulse 1.5s infinite' : 'none',
                }}
              >
                {selectedDemo.agentAvatar}
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {selectedDemo.agentName}
              </h2>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 10 }}>
                {selectedDemo.subtitle}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#047857', fontFamily: MONO }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', animation: 'glowRing 1.5s infinite' }} />
                LIVE DEMO
              </div>
            </div>

            {/* Spec list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Agent Voice</span>
                <select
                  value={selectedSarvamVoice}
                  onChange={(e) => setSelectedSarvamVoice(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, fontFamily: MONO, color: '#0F172A', background: '#F8FAFC', outline: 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  {SARVAM_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Caller Voice</span>
                <select
                  value={selectedUserVoice}
                  onChange={(e) => setSelectedUserVoice(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, fontFamily: MONO, color: '#0F172A', background: '#F8FAFC', outline: 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  {SARVAM_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Voice', value: selectedDemo.orchestration.sarvamVoiceLabel },
                { label: 'Languages', value: selectedDemo.languages.join(' · ') },
                { label: 'Latency', value: selectedDemo.orchestration.totalLatency, color: '#059669' },
                { label: 'Model', value: selectedDemo.orchestration.llmEngine, color: '#2563EB' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#94A3B8', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ color: row.color || '#0F172A', fontWeight: 700, fontFamily: MONO, fontSize: 11, textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Play button + status */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <button
                onClick={togglePlayPause}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: isPlaying ? '#EF4444' : currentTab.accentColor,
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  margin: '0 auto 8px',
                  cursor: 'pointer',
                  boxShadow: `0 4px 16px ${currentTab.accentColor}35`,
                  transition: 'transform 0.15s ease',
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div style={{ fontSize: 11, fontWeight: 700, color: isPlaying ? '#059669' : '#94A3B8', fontFamily: MONO, textTransform: 'uppercase' }}>
                {isAgentSpeaking ? `● ${selectedDemo.agentName.split(' ')[0]} speaking` : isCallerSpeaking ? '● Caller speaking' : isPlaying ? '● Playing' : 'Click ▶ to start'}
              </div>
            </div>

            <button
              onClick={() => setShowPromptModal(true)}
              style={{ width: '100%', padding: '8px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: MONO }}
            >
              Inspect System Prompt & Tools
            </button>
          </div>

          {/* RIGHT: LIVE CONVERSATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', letterSpacing: '0.04em', fontFamily: MONO }}>LIVE CONVERSATION</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#047857', fontFamily: MONO }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
                  CONNECTED
                </div>
              </div>

              {/* Transcript blocks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 360, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
                {selectedDemo.transcript.map((item, idx) => {
                  const isSystem = item.speaker === 'system';
                  const isAgent = item.speaker === 'agent';
                  const isActiveTurn = activeTranscriptIdx === idx && isPlaying;

                  if (isSystem) return null;

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.timestamp} · {isAgent ? 'DR. SARAH' : 'CALLER'}
                      </div>

                      <div
                        style={{
                          background: isActiveTurn ? `${currentTab.accentColor}08` : isAgent ? '#F8FAFC' : '#FFFFFF',
                          border: isActiveTurn ? `2px solid ${currentTab.accentColor}` : isAgent ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                          borderRadius: 12,
                          padding: '12px 16px',
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: '#0F172A',
                          boxShadow: isActiveTurn ? `0 2px 8px ${currentTab.accentColor}15` : 'none',
                          transition: 'all 0.25s ease',
                        }}
                      >
                        {item.text}
                      </div>

                      {item.toolCall && (
                        <div style={{ marginTop: 4, background: '#0B0F1A', border: '1px solid #1E293B', borderRadius: 10, padding: 12, color: '#E2E8F0', fontFamily: MONO, fontSize: 11 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: '#38BDF8', fontWeight: 800 }}>AI ACTION: {item.toolCall.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9 }}>
                              <span style={{ color: '#64748B' }}>Calling</span>
                              <span style={{ color: '#64748B' }}>→</span>
                              <span style={{ color: '#64748B' }}>Processing</span>
                              <span style={{ color: '#10B981' }}>→</span>
                              <span style={{ color: '#10B981', background: '#064E3B', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>Completed ✓</span>
                              <span style={{ color: '#38BDF8', background: '#0C4A6E', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>142ms</span>
                            </div>
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: 10, marginBottom: 6 }}>args: {item.toolCall.args}</div>
                          <div style={{ color: '#4ADE80', fontWeight: 700, borderTop: '1px solid #1E293B', paddingTop: 6 }}>
                            ✓ RESULT: {item.toolCall.result}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Waveform */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isPlaying ? '#059669' : '#94A3B8', fontFamily: MONO, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {isAgentSpeaking ? `● ${selectedDemo.agentName.split(' ')[0]} is speaking` : isCallerSpeaking ? '● Caller is speaking' : '● Standby'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, height: 24, justifyContent: 'flex-end' }}>
                  {Array.from({ length: 28 }).map((_, i) => {
                    const seed = Math.sin(i * 1.5 + (isPlaying ? currentTimeMs * 0.015 : 0));
                    const barHeight = isPlaying ? 6 + Math.abs(seed) * 18 : 4;
                    return (
                      <div
                        key={i}
                        style={{
                          width: 3,
                          height: `${barHeight}px`,
                          borderRadius: 1.5,
                          background: isPlaying ? currentTab.accentColor : '#E2E8F0',
                          transition: 'height 0.1s ease',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Scrubber + Controls */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', fontFamily: MONO, marginBottom: 6 }}>
                  <span>{formatTime(currentTimeMs)}</span>
                  <span>{selectedDemo.duration}</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={selectedDemo.durationMs}
                  value={currentTimeMs}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    currentTimeMsRef.current = newTime;
                    setCurrentTimeMs(newTime);
                  }}
                  style={{ width: '100%', accentColor: currentTab.accentColor, cursor: 'pointer', marginBottom: 10 }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={togglePlayPause} style={{ width: 30, height: 30, borderRadius: 6, background: '#0F172A', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick={stopPlayback} style={{ width: 30, height: 30, borderRadius: 6, background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14 }}>
                      ↻
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.25 : 1)} style={{ padding: '3px 8px', borderRadius: 5, background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, fontFamily: MONO, cursor: 'pointer' }}>
                      {playbackSpeed}×
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} style={{ padding: '3px 8px', borderRadius: 5, background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: 11, cursor: 'pointer' }}>
                      {isMuted ? '🔇' : '🔊'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. EXTRACTED INTELLIGENCE */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: MONO, marginBottom: 12 }}>
                Extracted Intelligence
              </h3>

              <div className="m-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {selectedDemo.extractedEntities.map((ent, idx) => {
                  const isHighlighted = isPlaying && currentTurn?.highlightKey && (
                    ent.label.toLowerCase().includes(currentTurn.highlightKey.toLowerCase()) ||
                    ent.value.toLowerCase().includes(currentTurn.highlightKey.toLowerCase())
                  );
                  return (
                    <div
                      key={idx}
                      style={{
                        background: isHighlighted ? `${currentTab.accentColor}15` : '#F8FAFC',
                        border: isHighlighted ? `2px solid ${currentTab.accentColor}` : '1px solid #E2E8F0',
                        borderRadius: 8,
                        padding: 10,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ fontSize: 9, color: isHighlighted ? currentTab.accentColor : '#94A3B8', fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ent.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: isHighlighted ? '#0F172A' : '#2563EB', marginTop: 3, fontFamily: MONO }}>{ent.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. VOICE PIPELINE ── */}
      <section id="pipeline" style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '40px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: currentTab.accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>
            SYSTEM ARCHITECTURE
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 28 }}>
            How the conversation happens
          </h2>

          <div className="m-pipeline-scroll m-scroll-x" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', position: 'relative', paddingBottom: 8 }}>
            {isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 100,
                  background: `linear-gradient(90deg, transparent, ${currentTab.accentColor}30, transparent)`,
                  pointerEvents: 'none',
                  animation: 'pipelineSignal 2.5s infinite linear',
                }}
              />
            )}

            {[
              { title: 'CALLER', sub: 'Input Stream', latency: '0ms' },
              { title: 'AUTONIV STT', sub: 'Vernacular Speech', latency: selectedDemo.orchestration.sttLatency },
              { title: 'LLM BRAIN', sub: selectedDemo.orchestration.llmEngine, latency: selectedDemo.orchestration.llmLatency },
              { title: 'TOOL ORCHESTRATION', sub: 'CRM & Calendar', latency: '15ms' },
              { title: 'AUTONIV TTS', sub: 'Neural Voice', latency: selectedDemo.orchestration.ttsLatency },
              { title: 'CALLER', sub: 'Output Audio', latency: selectedDemo.orchestration.totalLatency },
            ].map((node, idx, arr) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', minWidth: 140, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#0F172A', fontFamily: MONO }}>{node.title}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', margin: '3px 0 5px' }}>{node.sub}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 3, fontFamily: MONO, display: 'inline-block' }}>
                    {node.latency}
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{ color: currentTab.accentColor, fontWeight: 900, fontSize: 16 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. WHY AUTONIV ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>
            ENTERPRISE ADVANTAGE
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
            Why top enterprises choose Autoniv
          </h2>
        </div>

        <div className="m-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '🇮🇳', title: 'Vernacular AI', desc: 'Native mastery across 10+ Indian regional languages and accents.', metric: '10+ Languages', color: '#10B981' },
            { icon: '⚡', title: 'Ultra-Low Latency', desc: 'Conversations delivered in sub-340ms for human-like speech flow.', metric: '340ms Latency', color: '#2563EB' },
            { icon: '🛠', title: 'Tool Orchestration', desc: 'AI agents that query databases, book slots, and send WhatsApp SMS.', metric: '100% Automated', color: '#7C3AED' },
            { icon: '🎙', title: 'Natural Voices', desc: 'High-fidelity neural voice models tailored for Indian enterprise telephony.', metric: '8+ Voice Models', color: '#DB2777' },
            { icon: '🔒', title: 'Enterprise Security', desc: 'SOC-2 compliant end-to-end encryption with guaranteed uptime SLA.', metric: '99.9% Uptime', color: '#059669' },
            { icon: '💰', title: 'Lower Costs', desc: 'Drastically reduce contact center overhead with zero human delays.', metric: '90% Cost Savings', color: '#D97706' },
          ].map((card, idx) => (
            <div key={idx} className="agent-card-hover" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 22, borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 14 }}>{card.desc}</p>
              <div style={{ fontSize: 14, fontWeight: 900, color: card.color, fontFamily: MONO }}>{card.metric}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. MEET YOUR AI WORKFORCE ── */}
      <section style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '48px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>
              PRODUCTION AGENTS
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
              Meet your AI workforce
            </h2>
          </div>

          <div className="m-workforce-scroll m-scroll-x" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { name: 'Dr. Sarah', industry: 'Healthcare', icon: '🩺', voice: 'Shreya', duration: '00:48', tab: 'healthcare' as const },
              { name: 'Aditya', industry: 'Real Estate', icon: '🏠', voice: 'Aditya', duration: '00:54', tab: 'realestate' as const },
              { name: 'Shubh', industry: 'Finance', icon: '🏦', voice: 'Shubh', duration: '00:48', tab: 'finance' as const },
              { name: 'Simran', industry: 'E-Commerce', icon: '🛒', voice: 'Simran', duration: '00:45', tab: 'ecommerce' as const },
              { name: 'Rahul', industry: 'Education', icon: '🎓', voice: 'Rahul', duration: '00:50', tab: 'education' as const },
              { name: 'Priya', industry: 'Travel', icon: '🏨', voice: 'Priya', duration: '00:46', tab: 'travel' as const },
            ].map((agent, idx) => (
              <div
                key={idx}
                onClick={() => handleTabChange(agent.tab)}
                className="agent-card-hover"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer' }}
              >
                <div className="agent-avatar-el" style={{ fontSize: 32, marginBottom: 6 }}>{agent.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{agent.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '2px 0 8px' }}>{agent.industry}</div>
                <div className="agent-play-label" style={{ fontSize: 10, color: INDUSTRIES.find(t => t.id === agent.tab)?.accentColor || '#2563EB', fontWeight: 700, fontFamily: MONO }}>Play conversation →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. DEVELOPER MODE ── */}
      <section id="developer-mode" style={{ background: '#0B0F1A', color: '#E2E8F0', padding: '48px 16px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: MONO, marginBottom: 6 }}>
              DEVELOPER EXPERIENCE
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>
              Built for developers. Ready for production.
            </h2>
          </div>

          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0B0F1A', padding: '10px 16px', borderBottom: '1px solid #1F2937' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['prompt', 'schema', 'sarvam'] as const).map((tabKey) => (
                  <button
                    key={tabKey}
                    onClick={() => setActivePromptTab(tabKey)}
                    style={{
                      background: activePromptTab === tabKey ? '#1F2937' : 'transparent',
                      color: activePromptTab === tabKey ? '#38BDF8' : '#64748B',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: MONO,
                      cursor: 'pointer',
                    }}
                  >
                    {tabKey === 'prompt' ? 'System Prompt' : tabKey === 'schema' ? 'Tools JSON' : 'Voice Pipeline'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    const textToCopy = activePromptTab === 'prompt' ? selectedDemo.systemPrompt : activePromptTab === 'schema' ? selectedDemo.toolSchema : `// Autoniv Neural Voice Pipeline Config\n{\n  "voiceModel": "${selectedDemo.orchestration.sarvamVoiceId}",\n  "sttEngine": "${selectedDemo.orchestration.sttEngine}",\n  "llmEngine": "${selectedDemo.orchestration.llmEngine}",\n  "targetLatency": "${selectedDemo.orchestration.totalLatency}",\n  "sampleRate": 22050\n}`;
                    navigator.clipboard.writeText(textToCopy);
                    alert("Copied to clipboard ✓");
                  }}
                  style={{ background: '#1F2937', border: 'none', color: '#E2E8F0', padding: '4px 10px', borderRadius: 5, fontSize: 10, fontFamily: MONO, cursor: 'pointer', fontWeight: 700 }}
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowPromptModal(true)}
                  style={{ background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '4px 10px', borderRadius: 5, fontSize: 10, fontFamily: MONO, cursor: 'pointer', fontWeight: 700 }}
                >
                  Expand
                </button>
              </div>
            </div>

            <div style={{ padding: 20, fontFamily: MONO, fontSize: 12, color: '#D1D5DB', lineHeight: 1.7, maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {activePromptTab === 'prompt' && selectedDemo.systemPrompt}
              {activePromptTab === 'schema' && selectedDemo.toolSchema}
              {activePromptTab === 'sarvam' && `// Autoniv Neural Voice Pipeline Config
{
  "voiceModel": "${selectedDemo.orchestration.sarvamVoiceId}",
  "sttEngine": "${selectedDemo.orchestration.sttEngine}",
  "llmEngine": "${selectedDemo.orchestration.llmEngine}",
  "targetLatency": "${selectedDemo.orchestration.totalLatency}",
  "sampleRate": 22050
}`}
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. LIVE CALL CTA ── */}
      <section style={{ background: '#0B0F1A', color: '#FFFFFF', padding: '56px 16px', textAlign: 'center', borderTop: '1px solid #1F2937', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(i / 40) * 100}%`,
                top: '50%',
                width: 3,
                height: `${12 + Math.sin(i * 0.8) * 8}px`,
                background: currentTab.accentColor,
                borderRadius: 1.5,
                transform: 'translateY(-50%)',
              }}
            />
          ))}
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Don't just listen. Talk to an AI agent.
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 28 }}>
            Experience Autoniv's conversational intelligence yourself.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={startWebCall}
              style={{
                padding: '14px 32px',
                borderRadius: 10,
                background: `linear-gradient(135deg, ${currentTab.accentColor}, ${currentTab.accentColor}DD)`,
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                boxShadow: `0 4px 20px ${currentTab.accentColor}40`,
              }}
            >
              🎙 Start a Live Conversation
            </button>
            <Link
              to="/register"
              style={{
                padding: '14px 32px',
                borderRadius: 10,
                background: '#1F2937',
                border: '1px solid #374151',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Build Your Own Agent →
            </Link>
          </div>
        </div>
      </section>

      {/* ── MODALS ── */}

      {/* Web Call Modal */}
      {showWebCallModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(16px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: window.innerWidth <= 768 ? 0 : 24 }}>
          <div className={window.innerWidth <= 768 ? 'm-full-modal' : ''} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 20, padding: window.innerWidth <= 768 ? 20 : 28, maxWidth: 520, width: '100%', boxShadow: '0 25px 70px -15px rgba(0,0,0,0.3)', position: 'relative', maxHeight: window.innerWidth <= 768 ? '100vh' : '90vh', overflowY: 'auto' }}>
            <button
              onClick={endWebCall}
              style={{ position: 'absolute', top: 16, right: 16, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '50%', width: 30, height: 30, color: '#64748B', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${currentTab.accentColor}, ${currentTab.accentColor}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px', boxShadow: `0 0 30px ${currentTab.accentColor}40`, animation: webCallStatus === 'connected' ? 'studioPulse 2s infinite' : 'none' }}>
                🎙️
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                {selectedDemo.agentName}
              </h3>
              <div style={{ fontSize: 11, color: '#059669', fontFamily: MONO, fontWeight: 700, marginBottom: 6 }}>
                Autoniv Voice Stream • {selectedDemo.title}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: webCallStatus === 'connected' ? '#ECFDF5' : '#FEF3C7', border: webCallStatus === 'connected' ? '1px solid #A7F3D0' : '1px solid #FDE68A', borderRadius: 99, fontSize: 11, fontWeight: 700, color: webCallStatus === 'connected' ? '#047857' : '#D97706', fontFamily: MONO }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: webCallStatus === 'connected' ? '#10B981' : '#F59E0B', animation: webCallStatus === 'connected' ? 'glowRing 1.5s infinite' : 'none' }} />
                <span>{webCallStatus === 'connecting' ? 'Connecting...' : webCallStatus === 'connected' ? `Active • ${formatTime(webCallDuration * 1000)}` : 'Ended'}</span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, height: 200, overflowY: 'auto', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {webCallMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.speaker === 'agent' ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    background: msg.speaker === 'agent' ? '#FFFFFF' : '#EFF6FF',
                    border: msg.speaker === 'agent' ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                    borderRadius: msg.speaker === 'agent' ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                    padding: '8px 12px',
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: msg.speaker === 'agent' ? '#0F172A' : '#1E40AF',
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', fontFamily: MONO, marginBottom: 2 }}>
                    {msg.speaker === 'agent' ? `🤖 ${selectedDemo.agentName}` : '👤 You'} • {msg.time}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', fontFamily: MONO, textTransform: 'uppercase', marginBottom: 6, textAlign: 'left' }}>
                Quick Replies:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[
                  "Book appointment for tomorrow 3 PM",
                  "What are your interest rates?",
                  "Track my order #84920",
                ].map((sampleText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendWebCallMessage(sampleText)}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#1E40AF',
                      borderRadius: 99,
                      padding: '5px 10px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    "{sampleText}"
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!userQuery.trim()) return;
                const txt = userQuery;
                setUserQuery('');
                handleSendWebCallMessage(txt);
              }}
              style={{ display: 'flex', gap: 6, marginBottom: 14 }}
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  color: '#0F172A',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${currentTab.accentColor}, ${currentTab.accentColor}CC)`,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Send 🗣️
              </button>
            </form>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsMicMuted(!isMicMuted)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                {isMicMuted ? '🔇 Mic Muted' : '🎙️ Mic Active'}
              </button>

              <button
                type="button"
                onClick={endWebCall}
                style={{ flex: 2, padding: '10px', borderRadius: 10, background: '#EF4444', color: '#FFFFFF', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer' }}
              >
                🔴 End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Inspector Modal */}
      {showPromptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: window.innerWidth <= 768 ? 0 : 24 }}>
          <div className={window.innerWidth <= 768 ? 'm-full-modal' : ''} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 20, padding: window.innerWidth <= 768 ? 16 : 32, maxWidth: 900, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px -15px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
              onClick={() => setShowPromptModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '50%', width: 32, height: 32, color: '#475569', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
              <span style={{ fontSize: 36, background: '#F1F5F9', padding: 10, borderRadius: 14 }}>{selectedDemo.agentAvatar}</span>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{selectedDemo.agentName}</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 5, fontFamily: MONO, fontWeight: 700, border: '1px solid #A7F3D0' }}>
                    🇮🇳 {selectedDemo.orchestration.sarvamVoiceLabel}
                  </span>
                  <span style={{ fontSize: 11, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 5, fontFamily: MONO, fontWeight: 700, border: '1px solid #BFDBFE' }}>
                    🧠 {selectedDemo.orchestration.llmEngine}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
              <button
                onClick={() => setActivePromptTab('prompt')}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: activePromptTab === 'prompt' ? '2px solid #2563EB' : '1px solid #E2E8F0', background: activePromptTab === 'prompt' ? '#EFF6FF' : '#F8FAFC', color: activePromptTab === 'prompt' ? '#1E40AF' : '#64748B' }}
              >
                📜 System Prompt ({selectedDemo.systemPrompt.length} chars)
              </button>

              <button
                onClick={() => setActivePromptTab('schema')}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: activePromptTab === 'schema' ? '2px solid #10B981' : '1px solid #E2E8F0', background: activePromptTab === 'schema' ? '#ECFDF5' : '#F8FAFC', color: activePromptTab === 'schema' ? '#047857' : '#64748B' }}
              >
                🔧 Tools JSON
              </button>

              <button
                onClick={() => setActivePromptTab('sarvam')}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: activePromptTab === 'sarvam' ? '2px solid #7C3AED' : '1px solid #E2E8F0', background: activePromptTab === 'sarvam' ? '#F5F3FF' : '#F8FAFC', color: activePromptTab === 'sarvam' ? '#6D28D9' : '#64748B' }}
              >
                🎙️ Voice Config
              </button>
            </div>

            {activePromptTab === 'prompt' && (
              <div style={{ background: '#0B0F1A', border: '1px solid #1F2937', borderRadius: 12, padding: 20, fontFamily: MONO, fontSize: 12, color: '#D1D5DB', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20, overflowX: 'auto' }}>
                {selectedDemo.systemPrompt}
              </div>
            )}

            {activePromptTab === 'schema' && (
              <div style={{ background: '#022C22', border: '1px solid #065F46', borderRadius: 12, padding: 20, fontFamily: MONO, fontSize: 12, color: '#A7F3D0', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20, overflowX: 'auto' }}>
                {selectedDemo.toolSchema}
              </div>
            )}

            {activePromptTab === 'sarvam' && (
              <div style={{ background: '#1E1B4B', border: '1px solid #4338CA', borderRadius: 12, padding: 20, color: '#DDD6FE', marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 14 }}>🇮🇳 Autoniv Neural Voice Pipeline</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontFamily: MONO, fontSize: 12 }}>
                  <div style={{ background: '#312E81', padding: 12, borderRadius: 8 }}>
                    <div style={{ color: '#A5B4FC', fontSize: 10 }}>VOICE MODEL</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 3 }}>{selectedDemo.orchestration.sarvamVoiceId}</div>
                  </div>
                  <div style={{ background: '#312E81', padding: 12, borderRadius: 8 }}>
                    <div style={{ color: '#A5B4FC', fontSize: 10 }}>TTS ENDPOINT</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 3 }}>api.sarvam.ai/tts</div>
                  </div>
                  <div style={{ background: '#312E81', padding: 12, borderRadius: 8 }}>
                    <div style={{ color: '#A5B4FC', fontSize: 10 }}>SAMPLE RATE</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, marginTop: 3 }}>22,050 Hz</div>
                  </div>
                  <div style={{ background: '#312E81', padding: 12, borderRadius: 8 }}>
                    <div style={{ color: '#A5B4FC', fontSize: 10 }}>LATENCY</div>
                    <div style={{ color: '#10B981', fontWeight: 700, marginTop: 3 }}>{selectedDemo.orchestration.totalLatency}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPromptModal(false)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#0F172A', color: '#ffffff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* ── MOBILE STICKY AUDIO CONTROLLER ── */}
      <div className="m-bottom-ctrl" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E2E8F0', padding: '8px 12px', display: 'none', alignItems: 'center', gap: 8 }}>
        <button onClick={togglePlayPause} style={{ width: 36, height: 36, borderRadius: '50%', background: isPlaying ? '#EF4444' : currentTab.accentColor, color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={stopPlayback} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ↻
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94A3B8', fontFamily: MONO }}>
            <span>{formatTime(currentTimeMs)}</span>
            <span>{selectedDemo.duration}</span>
          </div>
          <input
            type="range"
            min={0}
            max={selectedDemo.durationMs}
            value={currentTimeMs}
            onChange={(e) => {
              const newTime = Number(e.target.value);
              currentTimeMsRef.current = newTime;
              setCurrentTimeMs(newTime);
            }}
            style={{ width: '100%', accentColor: currentTab.accentColor, cursor: 'pointer', height: 4 }}
          />
        </div>
        <button onClick={() => setIsMuted(!isMuted)} style={{ width: 32, height: 32, borderRadius: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <Footer />
    </div>
  );
}

export default DemoRecordings;

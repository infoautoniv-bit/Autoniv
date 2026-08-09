export type IndustryId = 'healthcare' | 'realestate' | 'finance' | 'ecommerce' | 'education' | 'travel';

export interface TranscriptItem {
  speaker: 'agent' | 'user' | 'system';
  text: string;
  timestamp: string;
  highlightKey?: string;
  toolCall?: { name: string; args: string; result: string };
  delayMs: number;
  durationMs: number;
}

export interface DemoRecording {
  id: string;
  title: string;
  subtitle: string;
  agentName: string;
  agentAvatar: string;
  industry: IndustryId;
  duration: string;
  durationMs: number;
  audioUrl?: string;
  videoUrl?: string;
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

export interface IndustryTab {
  id: IndustryId;
  label: string;
  icon: string;
  tagline: string;
  accentColor: string;
  metrics: { value: string; label: string }[];
}

export interface USPItem {
  icon: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  stat: string;
  statLabel: string;
  accentColor: string;
}

export const USP_SLIDES: USPItem[] = [
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

export const SARVAM_VOICES = [
  { id: 'sarvam:bulbul:v3:shreya', name: 'Autoniv Shreya (Female - Hindi/English Sweet)' },
  { id: 'sarvam:bulbul:v3:shubh', name: 'Autoniv Shubh (Male - Deep Resonant Hindi)' },
  { id: 'sarvam:bulbul:v3:aditya', name: 'Autoniv Aditya (Male - Clear Professional)' },
  { id: 'sarvam:bulbul:v3:ritu', name: 'Autoniv Ritu (Female - Corporate Executive)' },
  { id: 'sarvam:bulbul:v3:priya', name: 'Autoniv Priya (Female - Warm Concierge)' },
  { id: 'sarvam:bulbul:v3:dev', name: 'Autoniv Dev (Male - Doctor Medical)' },
  { id: 'sarvam:bulbul:v3:rahul', name: 'Autoniv Rahul (Male - Energetic Counselor)' },
  { id: 'sarvam:bulbul:v3:simran', name: 'Autoniv Simran (Female - E-Commerce Dispatch)' },
];

export const INDUSTRIES: IndustryTab[] = [
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

export const DEMO_RECORDINGS: Record<IndustryId, DemoRecording[]> = {
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
    {
      id: 'hc-screen-1',
      title: 'Screen Recording Demo',
      subtitle: 'Autoniv Screen Capture',
      agentName: 'Demo Agent',
      agentAvatar: '🎬',
      industry: 'healthcare',
      duration: '03:00',
      durationMs: 180000,
      videoUrl: 'https://res.cloudinary.com/nbxnvgwr/video/upload/v1786287172/autoniv/demos/screen-recording-demo.mp4',
      systemPrompt: 'Screen recording demo showcasing the Autoniv platform in action.',
      toolSchema: '{}',
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
      languages: ['English'],
      phoneNumber: '',
      tags: ['Screen Recording', 'Demo'],
      description: 'Screen recording of the Autoniv platform.',
      extractedEntities: [],
      transcript: [],
    }
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

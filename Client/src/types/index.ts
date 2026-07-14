export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: 'admin' | 'user';
  company?: string;
  plan: string;
  chatPlan?: string;
  voicePlan?: string;
  minutesUsed: number;
  minutesLimit: number;
  callsUsed: number;
  callsLimit: number;
  chatUsed: number;
  chatLimit: number;
  isActive: boolean;
  chatEnabled?: boolean;
  voiceEnabled?: boolean;
  features?: {
    chat: Record<string, boolean | number>;
    voice: Record<string, boolean | number>;
    // Legacy compat — these may be present from older API responses
    agents?: Record<string, boolean>;
    appointments?: Record<string, boolean>;
    leads?: Record<string, boolean>;
  };
  createdAt?: string;
  updatedAt?: string;
  callCount?: number;
  lastCallAt?: string | null;
  lastCallEnded?: string | null;
}

export interface Agent {
  id: string;
  userId: string;
  vapiId?: string;
  name: string;
  type: 'receptionist' | 'appointment' | 'faq';
  prompt?: string;
  voiceId?: string;
  language?: string;
  phoneNumberId?: string;
  phoneNumber?: string;
  isActive: boolean;
  callCount: number;
  userName?: string;
  userEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  useCustomEngine?: boolean;
  customEngineModel?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
}

export interface Call {
  id: string;
  agentId?: string;
  userId: string;
  vapiCallId?: string;
  callerNumber?: string;
  duration: number;
  status: 'completed' | 'missed' | 'failed' | 'in-progress';
  recordingUrl?: string;
  transcript?: string;
  agentName?: string;
  userName?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface Lead {
  id: string;
  agentId?: string;
  callId?: string;
  userId: string;
  name?: string;
  phone?: string;
  email?: string;
  purpose?: string;
  notes?: string;
  status?: 'new' | 'contacted' | 'converted' | 'lost';
  leadType?: 'call' | 'public' | 'chat';
  agentName?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Stats {
  totalUsers: number;
  activeAgents: number;
  inactiveAgents: number;
  totalAgents: number;
  callsToday: number;
  totalMinutes: number;
}

export interface TrendPoint {
  date: string;
  calls: number;
  minutes: number;
}

export interface PeriodOverview {
  totalUsers: number;
  activeAgents: number;
  inactiveAgents: number;
  totalAgents: number;
  totalMinutes: number;
  totalCalls: number;
}

export interface MyStats {
  agentCount: number;
  callCount: number;
  minuteUsed: number;
  leadCount: number;
}

export interface UpgradeRequest {
  id: string;
  userId: string;
  currentPlan: string;
  requestedPlan: string;
  status: 'pending' | 'approved' | 'rejected';
  userName?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  agentId?: string;
  callId?: string;
  userId: string;
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  agentName?: string;
  userName?: string;
  createdAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  minutesLimit: number;
  price: number;
  features: string[];
}

export interface AddOnCatalogEntry {
  id: string;
  icon: string;
  title: string;
  price: string;
  category: 'recurring' | 'one-time';
  description: string;
  type?: 'chat' | 'voice';
}

export interface UserAddOn {
  id: string;
  userId: string;
  addOnId: string;
  notes?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  userName?: string;
  userEmail?: string;
  addOn?: AddOnCatalogEntry | null;
  createdAt: string;
  updatedAt?: string;
}

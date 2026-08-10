import axios from 'axios';
import api, { BASE_URL } from './api.base';
import type { WhiteLabelSettings } from '../types';

export interface TeamMember {
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'agent';
  status: 'active' | 'pending';
  addedAt: string;
}

export interface TeamData {
  planName?: string;
  owner: { id: string; name: string; email: string; role: string };
  teamMembers: TeamMember[];
  usedSeats: number;
  totalSeats: number;
}

export const teamService = {
  getTeam: () => api.get<TeamData>('/team'),
  inviteMember: (data: { name: string; email: string; role?: string }) =>
    api.post('/team/invite', data),
  removeMember: (memberId: string) => api.delete(`/team/${memberId}`),
};

export const chatService = {
  send: (message: string) => api.post('/chat', { message }),
};

export const agentChatService = {
  send: (message: string) => api.post('/agent-chat', { message }),
};

export const userChatService = {
  send: (
    message: string,
    context?: any,
    history?: { role: string; text: string }[],
  ) => api.post('/user-chat', { message, context, history }),
};

export interface ChatSessionSummary {
  id: string;
  title: string;
  channel?: string;
  isExternal?: boolean;
  messageCount: number;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface ChatSessionDetail {
  id: string;
  title: string;
  channel?: string;
  isExternal?: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const chatHistoryService = {
  list: () => api.get<{ sessions: ChatSessionSummary[]; chatUsed?: number }>('/chat-history'),
  get: (id: string) => api.get<ChatSessionDetail>(`/chat-history/${id}`),
  create: (data: { title?: string; messages?: ChatMessage[] }) =>
    api.post<ChatSessionDetail & { chatUsed?: number }>('/chat-history', data),
  update: (id: string, data: { title?: string; messages?: ChatMessage[] }) =>
    api.put<ChatSessionDetail>(`/chat-history/${id}`, data),
  delete: (id: string) => api.delete<{ message: string; chatUsed?: number }>(`/chat-history/${id}`),
};

export const publicDemoService = {
  getAgent: () =>
    axios.get(`${BASE_URL}/agents/public/demo`),
};

export const apiKeyService = {
  get: () => api.get('/users/api-key'),
  regenerate: () => api.post('/users/api-key/regenerate'),
};

export const whiteLabelService = {
  get: () => api.get<{ whiteLabelSettings: WhiteLabelSettings }>('/users/white-label'),
  update: (settings: WhiteLabelSettings) =>
    api.put<{ message: string; whiteLabelSettings: WhiteLabelSettings }>('/users/white-label', settings),
};

export const ttsService = {
  preview: (voiceId: string, language: string, text?: string, raw?: boolean) =>
    api.post('/tts/preview', { voiceId, language, text, raw }, { responseType: 'blob' }),
};

export const phoneNumberService = {
  getAll: () => api.get<{ phoneNumbers: import('../types').PhoneNumber[] }>('/phone-numbers'),
  getUsersList: () => api.get<{ users: import('../types').AssignableUser[] }>('/phone-numbers/users-list'),
  getAgentsList: () => api.get<{ agents: import('../types').AssignableAgent[] }>('/phone-numbers/agents-list'),
  create: (data: {
    phoneNumber: string;
    friendlyName?: string;
    platform: string;
    credentials?: Record<string, any>;
    assignedToAgent?: string | null;
    assignedToUser?: string | null;
    capabilities?: string[];
  }) => api.post<{ phoneNumber: import('../types').PhoneNumber }>('/phone-numbers', data),
  update: (id: string, data: {
    friendlyName?: string;
    platform?: string;
    credentials?: Record<string, any>;
    capabilities?: string[];
    status?: string;
  }) => api.put<{ phoneNumber: import('../types').PhoneNumber }>(`/phone-numbers/${id}`, data),
  assign: (id: string, data: {
    assignedToAgent?: string | null;
    assignedToUser?: string | null;
  }) => api.put<{ phoneNumber: import('../types').PhoneNumber }>(`/phone-numbers/${id}/assign`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/phone-numbers/${id}`),
};

export const contactService = {
  submit: (data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
  }) =>
    api.post<{ message: string; contactId?: string }>('/contact', data),
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<{ items: any[]; pagination: any }>('/contact', { params }),
  updateStatus: (id: string, status: string) =>
    api.put<{ message: string; contact: any }>(`/contact/${id}`, { status }),
};

export const supportService = {
  submit: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) =>
    api.post('/support', data),
};

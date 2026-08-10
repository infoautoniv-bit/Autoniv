import { z } from 'zod';

export const agentFormSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Name must be 100 characters or less'),
  type: z.enum(['receptionist', 'appointment', 'faq']),
  prompt: z.string().max(10000, 'Prompt must be 10,000 characters or less').optional().nullable(),
  language: z.string().max(50).default('en'),
  voiceId: z.string().min(1, 'Voice selection is required'),
  phoneNumberId: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  twilioAccountSid: z.string().optional().nullable(),
  twilioAuthToken: z.string().optional().nullable(),
  hubspotToken: z.string().optional().nullable(),
  webhookUrl: z
    .string()
    .url('Please enter a valid URL (e.g. https://example.com/webhook)')
    .or(z.literal(''))
    .optional()
    .nullable(),
  webhookSecret: z.string().optional().nullable(),
  googleSheetId: z.string().optional().nullable(),
  googleSheetUrl: z.string().optional().nullable(),
  fieldMapping: z.string().optional().nullable(),
  customHeaders: z.string().optional().nullable(),
  payloadTemplate: z.string().optional().nullable(),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;

export const chatbotFormSchema = z.object({
  name: z.string().min(1, 'Chatbot name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().default(''),
  systemPrompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters long')
    .max(10000, 'System prompt must be 10,000 characters or less'),
  welcomeMessage: z.string().min(1, 'Welcome message is required').default('Hi! How can I help you today?'),
  brandColor: z.string().default('#0077ff'),
  brandLogo: z.string().optional().nullable(),
});

export type ChatbotFormValues = z.infer<typeof chatbotFormSchema>;

/**
 * Conversation Graph Engine (State Machine Dialogue Orchestrator)
 *
 * Breaks linear prompts into discrete, goal-directed nodes:
 *   [Greeting] -> [Qualification] -> [Service Discussion] -> [Booking] -> [Wrap-Up]
 *
 * Each node maintains:
 * - Scoped prompt instructions
 * - Specific allowed tools
 * - Slot requirements
 * - Transition rules to advance state
 */

import { renderTemplate } from './templateEngine.js';
import { log } from '../logger.js';

export const DEFAULT_NODES = {
  greeting: {
    id: 'greeting',
    name: 'Greeting & Identification',
    prompt: `You are in the GREETING phase.
- Warmly introduce yourself as the AI assistant for {{company | 'the business'}}.
- Keep opening concise (under 2 sentences).
- Ask how you can assist the caller today.`,
    allowedTools: ['getAppointment', 'checkEmergencyAvailability'],
    transitions: [
      { target: 'booking', trigger: /book|schedule|appointment|slot|reserve|reschedule|visit/i },
      { target: 'service_discussion', trigger: /price|cost|timing|hour|location|address|service|doctor|treatment|what do you do/i },
      { target: 'qualification', trigger: /help|inquiry|question|call|speak/i },
    ],
  },
  qualification: {
    id: 'qualification',
    name: 'Intent Qualification',
    prompt: `You are in the QUALIFICATION phase.
- Understand the caller's primary requirement.
- If they want to book an appointment, gather their preferred date and service.
- If they have a specific inquiry, identify the topic and answer clearly.`,
    allowedTools: ['getAppointment', 'checkEmergencyAvailability', 'saveLead'],
    transitions: [
      { target: 'booking', trigger: /book|schedule|appointment|slot|date|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i },
      { target: 'service_discussion', trigger: /detail|more info|price|rate|fees|how much|doctor/i },
      { target: 'wrap_up', trigger: /no thanks|that's all|nothing else|bye|goodbye|all set/i },
    ],
  },
  service_discussion: {
    id: 'service_discussion',
    name: 'Service Discussion & FAQ',
    prompt: `You are in the SERVICE & FAQ phase.
- Answer caller questions accurately using your knowledge base.
- Be concise and polite.
- After answering, smoothly ask if they would like to proceed with booking a slot.`,
    allowedTools: ['getAppointment', 'checkEmergencyAvailability', 'saveLead'],
    transitions: [
      { target: 'booking', trigger: /yes|book|schedule|sure|okay|proceed|appointment|let's do it/i },
      { target: 'wrap_up', trigger: /no|that's all|thank you|thanks|bye|nothing else/i },
    ],
  },
  booking: {
    id: 'booking',
    name: 'Appointment Slot Booking',
    prompt: `You are in the BOOKING phase.
- Collect preferred Date, Time, Caller Name, and Phone number if not already known.
- Use 'saveAppointment' or 'saveLead' as soon as the caller agrees on a time slot.
- Confirm the confirmed details back to the caller clearly.`,
    allowedTools: ['saveAppointment', 'saveLead', 'getAppointment', 'updateAppointment', 'cancelAppointment', 'checkEmergencyAvailability'],
    transitions: [
      { target: 'wrap_up', trigger: /confirmed|booked|saved|all set|done|thank you|see you/i, requiresTool: 'saveAppointment' },
    ],
  },
  wrap_up: {
    id: 'wrap_up',
    name: 'Wrap-Up & Closing',
    prompt: `You are in the WRAP-UP phase.
- Summarize the outcome (e.g. appointment date or details confirmed).
- Ask if there is anything else you can help with.
- If caller is satisfied, wish them a great day and say a warm goodbye.`,
    allowedTools: ['saveLead'],
    transitions: [
      { target: 'end', trigger: /bye|goodbye|no|that's all|thank you|have a good day/i },
    ],
  },
};

export class ConversationGraph {
  constructor(customNodes = null, initialNodeId = 'greeting') {
    this.nodes = customNodes || DEFAULT_NODES;
    this.currentNodeId = this.nodes[initialNodeId] ? initialNodeId : 'greeting';
    this.historyState = [this.currentNodeId];
  }

  getCurrentNode() {
    return this.nodes[this.currentNodeId] || this.nodes.greeting;
  }

  /**
   * Evaluates possible state transitions based on last user turn, assistant text, and executed tools.
   */
  evaluateTransition({ userMessage = '', assistantMessage = '', executedToolName = null }) {
    const node = this.getCurrentNode();
    if (!node || !Array.isArray(node.transitions)) return this.currentNodeId;

    const combinedText = `${userMessage} ${assistantMessage}`;

    for (const transition of node.transitions) {
      // Check required tool execution condition
      if (transition.requiresTool) {
        if (executedToolName === transition.requiresTool) {
          this.transitionTo(transition.target);
          return this.currentNodeId;
        }
        continue;
      }

      // Check regex / pattern trigger
      if (transition.trigger && transition.trigger.test(combinedText)) {
        this.transitionTo(transition.target);
        return this.currentNodeId;
      }
    }

    return this.currentNodeId;
  }

  transitionTo(targetNodeId) {
    if (this.nodes[targetNodeId] && targetNodeId !== this.currentNodeId) {
      log.info('graph_state_transition', {
        from: this.currentNodeId,
        to: targetNodeId,
      });
      this.currentNodeId = targetNodeId;
      this.historyState.push(targetNodeId);
      return true;
    }
    return false;
  }

  /**
   * Builds composite system prompt composed of:
   * 1. Global Agent Guardrails & Persona
   * 2. Active Node Scope & Guidelines
   * 3. Template Context Variables
   */
  buildNodePrompt({ globalPrompt = '', context = {} }) {
    const node = this.getCurrentNode();
    const renderedGlobal = renderTemplate(globalPrompt, context);
    const renderedNodePrompt = renderTemplate(node.prompt, context);

    return `${renderedGlobal}

[ACTIVE CONVERSATION STATE: ${node.name.toUpperCase()}]
${renderedNodePrompt}

[STATE GUIDELINE]
Stay focused on the goals of the current state. Transition smoothly when appropriate.`;
  }
}

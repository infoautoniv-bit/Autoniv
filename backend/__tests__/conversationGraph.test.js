import { ConversationGraph, DEFAULT_NODES } from '../services/orchestrator/conversationGraph.js';

describe('ConversationGraph State Machine', () => {
  test('initializes with default greeting node', () => {
    const graph = new ConversationGraph();
    expect(graph.currentNodeId).toBe('greeting');
    const node = graph.getCurrentNode();
    expect(node.id).toBe('greeting');
    expect(node.name).toBe('Greeting & Identification');
  });

  test('transitions from greeting to booking upon user booking intent', () => {
    const graph = new ConversationGraph();
    const nextNodeId = graph.evaluateTransition({
      userMessage: 'Hi, I would like to book an appointment for tomorrow.',
    });
    expect(nextNodeId).toBe('booking');
    expect(graph.currentNodeId).toBe('booking');
  });

  test('transitions from greeting to service_discussion upon pricing query', () => {
    const graph = new ConversationGraph();
    const nextNodeId = graph.evaluateTransition({
      userMessage: 'What are your prices and clinic hours?',
    });
    expect(nextNodeId).toBe('service_discussion');
    expect(graph.currentNodeId).toBe('service_discussion');
  });

  test('transitions from booking to wrap_up when saveAppointment tool is executed', () => {
    const graph = new ConversationGraph();
    graph.transitionTo('booking');
    expect(graph.currentNodeId).toBe('booking');

    const nextNodeId = graph.evaluateTransition({
      userMessage: 'Okay, 3 PM sounds great.',
      assistantMessage: 'Your appointment is confirmed for tomorrow at 3 PM.',
      executedToolName: 'saveAppointment',
    });
    expect(nextNodeId).toBe('wrap_up');
    expect(graph.currentNodeId).toBe('wrap_up');
  });

  test('builds composited prompt with active state scope and template interpolation', () => {
    const graph = new ConversationGraph();
    const prompt = graph.buildNodePrompt({
      globalPrompt: 'You are an agent for {{company}}.',
      context: { company: 'City Health Clinic' },
    });
    expect(prompt).toContain('You are an agent for City Health Clinic.');
    expect(prompt).toContain('[ACTIVE CONVERSATION STATE: GREETING & IDENTIFICATION]');
    expect(prompt).toContain('City Health Clinic');
  });
});

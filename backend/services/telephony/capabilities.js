export const PROVIDER_CAPABILITIES = {
  twilio:     { nativeCapable: true,  streamingLive: true,  label: 'Twilio' },
  signalwire: { nativeCapable: true,  streamingLive: true,  label: 'SignalWire' },

  // Native-capable providers whose real-time adapters are not yet shipped.
  // They fall back to turn-based today.
  plivo:      { nativeCapable: true,  streamingLive: false, label: 'Plivo' },
  exotel:     { nativeCapable: true,  streamingLive: false, label: 'Exotel' },
  ozonetel:   { nativeCapable: true,  streamingLive: false, label: 'Ozonetel' },

  // Turn-based only (click-to-call / campaign carriers that bridge legs but
  // cannot hand audio to an external AI in real time).
  mcube:      { nativeCapable: false, streamingLive: false, label: 'MCUBE' },
  tatatele:   { nativeCapable: false, streamingLive: false, label: 'Tata Tele' },
  maqsam:     { nativeCapable: false, streamingLive: false, label: 'Maqsam' },
  vobiz:      { nativeCapable: false, streamingLive: false, label: 'Vobiz' },
  voicelink:  { nativeCapable: false, streamingLive: false, label: 'VoiceLink' },
  telnyx:     { nativeCapable: false, streamingLive: false, label: 'Telnyx' },
  custom:     { nativeCapable: false, streamingLive: false, label: 'Custom / SIP' },

  // Own AI engines — cannot run on our orchestrator by design.
  retell:     { nativeCapable: false, streamingLive: false, unsupported: true, label: 'Retell AI' },
  vapi:       { nativeCapable: false, streamingLive: false, ownEngine: true,   label: 'Vapi AI' },
};

/**
 * The tier that ACTUALLY runs for a platform today on the custom engine.
 * @param {string} platform
 * @returns {CapabilityTier}
 */
export function activeTier(platform) {
  const cap = PROVIDER_CAPABILITIES[String(platform || '').toLowerCase()];
  if (!cap) return 'turn-based'; // unknown platform: attempt the universal loop
  if (cap.unsupported) return 'unsupported';
  // Vapi has its own engine and is handled outside the orchestrator entirely;
  // it should never reach the custom-engine inbound/outbound paths.
  if (cap.ownEngine) return 'unsupported';
  return cap.streamingLive ? 'native-stream' : 'turn-based';
}

/**
 * The eventual target tier (once deferred native adapters ship). Used only for
 * UI labeling ("Real-time (coming soon)").
 * @param {string} platform
 * @returns {CapabilityTier}
 */
export function targetTier(platform) {
  const cap = PROVIDER_CAPABILITIES[String(platform || '').toLowerCase()];
  if (!cap) return 'turn-based';
  if (cap.unsupported || cap.ownEngine) return 'unsupported';
  return cap.nativeCapable ? 'native-stream' : 'turn-based';
}

/** True when the platform cannot run on the custom orchestrator at all. */
export function isUnsupportedOnCustomEngine(platform) {
  return activeTier(platform) === 'unsupported';
}

/**
 * Compact capability descriptor for the frontend. One entry per known platform.
 */
export function capabilitySummary() {
  return Object.entries(PROVIDER_CAPABILITIES).map(([platform, cap]) => ({
    platform,
    label: cap.label,
    activeTier: activeTier(platform),
    targetTier: targetTier(platform),
    comingSoon: targetTier(platform) === 'native-stream' && activeTier(platform) !== 'native-stream',
  }));
}

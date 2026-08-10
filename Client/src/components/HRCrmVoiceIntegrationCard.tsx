import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isGreaterThanStarter } from '../utils/plan';
import { apiKeyService, agentService } from '../services/api';
import { API_BASE_URL } from '../config/api';
import type { User, Agent } from '../types';
import { Modal } from './Modal';

interface HRCrmVoiceIntegrationCardProps {
  user: User | null;
}

export const HRCrmVoiceIntegrationCard: React.FC<HRCrmVoiceIntegrationCardProps> = ({ user }) => {
  const [apiKey, setApiKey] = useState<string>(user?.apiKey || 'ak_live_autoniv_sample_key');
  const [loadingKey, setLoadingKey] = useState<boolean>(false);
  const [keyGenerated, setKeyGenerated] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const unlocked = isGreaterThanStarter(user);
  const apiBase = API_BASE_URL.replace(/\/api\/?$/, '');

  const fetchApiKey = async () => {
    try {
      setLoadingKey(true);
      const res = await apiKeyService.get();
      if (res.data?.apiKey) {
        setApiKey(res.data.apiKey);
      }
    } catch {
      // ignored
    } finally {
      setLoadingKey(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await agentService.getMy({ limit: 100 });
      const list = res.data?.agents || res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(list) && list.length > 0) {
        setAgents(list);
        setSelectedAgentId(list[0].id || list[0]._id || '');
      }
    } catch {
      // ignored
    }
  };

  useEffect(() => {
    if (unlocked) {
      if (!user?.apiKey) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchApiKey();
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAgents();
    }
  }, [unlocked, user]);

  const executeRegenerateKey = async () => {
    try {
      setLoadingKey(true);
      const res = await apiKeyService.regenerate();
      if (res.data?.apiKey) {
        setApiKey(res.data.apiKey);
        setKeyGenerated(true);
        setTimeout(() => setKeyGenerated(false), 4000);
      }
    } catch {
      // ignored
    } finally {
      setLoadingKey(false);
    }
  };

  const agentIdString = selectedAgentId ? `\n    "agentId": "${selectedAgentId}",` : '';
  const agentAttributeString = selectedAgentId ? ` data-agent-id="${selectedAgentId}"` : '';

  const curlExample = `curl -X POST ${apiBase}/api/widget/call \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{${agentIdString}
    "phone": "+917489010144",
    "name": "Ankit Sharma",
    "context": { "jobRole": "Senior React Developer", "experience": "4 years" },
    "webhookUrl": "https://your-hrcrm.com/api/webhooks/autoniv"
  }'`;

  const scriptExample = `<script src="${apiBase}/api/widget/voiceWidget.js" data-api-key="${apiKey}"${agentAttributeString} data-position="bottom-right"></script>`;

  const copyToClipboard = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  if (!unlocked) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🔒 Growth & Enterprise Feature
            </div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              HR CRM AI Voice Integration & Web Widget
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trigger automated candidate screening calls directly from your ATS/CRM via REST API and embed 1-click AI Voice Call buttons inside candidate profiles with assigned AI agents.
            </p>
          </div>
          <Link
            to="/dashboard/billing"
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white shadow-lg shadow-blue-500/25 transition-all whitespace-nowrap"
          >
            Upgrade Plan to Unlock →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2">
            ✓ Active on Your Plan
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            HR CRM AI Voice API & Web Widget
          </h3>
          <p className="text-xs text-slate-500">
            Trigger candidate screening calls programmatically or embed 1-click voice call widgets assigned to any AI Agent.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-mono text-slate-700 font-bold truncate max-w-[200px]">
              {loadingKey ? 'Fetching API Key...' : apiKey}
            </span>
            <button
              onClick={() => copyToClipboard(apiKey, setCopiedKey)}
              disabled={loadingKey}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {copiedKey ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={loadingKey}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {loadingKey ? 'Generating...' : '🔑 Generate New Key'}
          </button>
        </div>
      </div>

      {keyGenerated && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>✨ New API Key generated successfully! Save your key safely.</span>
        </div>
      )}

      {/* Agent Selector Dropdown */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
            🤖 Assigned AI Voice Agent
          </label>
          <p className="text-[11px] text-slate-500">
            Select which AI Voice Agent (system prompt & voice) handles candidate calls for this integration snippet.
          </p>
        </div>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[240px]"
        >
          <option value="">Default Active Agent</option>
          {agents.map((a: any) => (
            <option key={a.id || a._id} value={a.id || a._id}>
              {a.name} ({a.type || 'Voice'})
            </option>
          ))}
        </select>
      </div>

      {/* Option B: API Outbound Trigger */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Option B: Trigger Candidate Screening Call (REST API)
          </span>
          <button
            onClick={() => copyToClipboard(curlExample, setCopiedCurl)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
          >
            {copiedCurl ? 'Copied!' : 'Copy Curl'}
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
          {curlExample}
        </pre>
      </div>

      {/* Option A: Embeddable Voice Widget */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Option A: Embeddable 1-Line Web Voice Widget Script
          </span>
          <button
            onClick={() => copyToClipboard(scriptExample, setCopiedScript)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
          >
            {copiedScript ? 'Copied!' : 'Copy Script Tag'}
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-slate-900 text-blue-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
          {scriptExample}
        </pre>
      </div>

      {/* HMAC Webhook Security Notice */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
        <span className="text-base">🛡️</span>
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800">HMAC SHA-256 Webhook Security: </span>
          All post-call candidate screening results and transcripts sent to your CRM webhook URL include header <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono">X-Autoniv-Signature: t=timestamp,v1=hash</code> for cryptographically verified candidate PII.
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Regenerate API Key?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Are you sure you want to regenerate your API key? Existing webhooks and integrations using the old key will stop working immediately until updated.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                executeRegenerateKey();
              }}
              className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              Regenerate Key
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

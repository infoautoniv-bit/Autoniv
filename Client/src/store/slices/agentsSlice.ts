import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Agent } from '../../types';
import { agentService } from '../../services/api.agents';
import type { PaginationParams } from '../../services/api.base';
import type { PaginationMeta } from '../../components/Pagination';
import { loadFromSession, saveToSession } from '../../utils/storage';

interface AgentsState {
  items: Agent[];
  myAgents: Agent[];
  pagination: PaginationMeta;
  myPagination: PaginationMeta;
  loading: boolean;
  error: string | null;
}

const defaultPagination: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false };

const initialState: AgentsState = {
  items: [],
  myAgents: loadFromSession<Agent[]>('cache:myAgents') ?? [],
  pagination: defaultPagination,
  myPagination: defaultPagination,
  loading: false,
  error: null,
};

const normalize = (agent: any): Agent => ({
  ...agent,
  id: agent._id ?? agent.id,
});

const normalizeList = (agents: any[]): Agent[] => agents.map(normalize);

export const fetchAllAgents = createAsyncThunk(
  'agents/fetchAll',
  async (pp?: PaginationParams) => {
    const res = await agentService.getAll(pp);
    return { items: normalizeList(res.data.items), pagination: res.data.pagination as PaginationMeta };
  }
);

export const fetchMyAgents = createAsyncThunk(
  'agents/fetchMy',
  async (pp?: PaginationParams) => {
    const res = await agentService.getMy(pp);
    return { items: normalizeList(res.data.items), pagination: res.data.pagination as PaginationMeta };
  }
);

export const createAgent = createAsyncThunk(
  'agents/create',
  async (data: {
    name: string;
    type: string;
    prompt?: string;
    language?: string;
    voiceId?: string;
    useCustomEngine?: boolean;
    customEngineModel?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    phoneNumberId?: string;
    phoneNumber?: string;
  }) => {
    const res = await agentService.create(data);
    return normalize(res.data.agent);
  }
);

export const updateAgent = createAsyncThunk(
  'agents/update',
  async ({
    id,
    data,
  }: {
    id: string;
    data: {
      name: string;
      type?: string;
      prompt?: string;
      isActive: boolean;
      language?: string;
      voiceId?: string;
      useCustomEngine?: boolean;
      customEngineModel?: string;
      twilioAccountSid?: string;
      twilioAuthToken?: string;
    };
  }) => {
    const res = await agentService.update(id, data);
    return normalize(res.data.agent);
  }
);

export const toggleAgent = createAsyncThunk(
  'agents/toggle',
  async ({ id, isActive }: { id: string; isActive: boolean }) => {
    await agentService.toggleActive(id, isActive);
    return { id, isActive };
  }
);

export const deleteAgent = createAsyncThunk('agents/delete', async (id: string) => {
  await agentService.delete(id);
  return id;
});

export const updateAgentConfig = createAsyncThunk(
  'agents/updateConfig',
  async ({
    id,
    data,
  }: {
    id: string;
    data: { name?: string; prompt?: string; phoneNumberId?: string };
  }) => {
    const res = await agentService.update(id, data as any);
    return normalize(res.data.agent);
  }
);

export const assignPhone = createAsyncThunk(
  'agents/assignPhone',
  async ({
    id,
    phoneNumberId,
    phoneNumber,
    twilioAccountSid,
    twilioAuthToken,
  }: {
    id: string;
    phoneNumberId: string;
    phoneNumber?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
  }) => {
    const res = await agentService.assignPhone(id, phoneNumberId, phoneNumber, twilioAccountSid, twilioAuthToken);
    return normalize(res.data.agent);
  }
);

export const unlinkPhone = createAsyncThunk(
  'agents/unlinkPhone',
  async ({ id }: { id: string }) => {
    const res = await agentService.unlinkPhone(id);
    return normalize(res.data.agent);
  }
);

const matchId = (agent: Agent, id: string) =>
  agent.id === id || (agent as any)._id === id;

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items ?? [];
        state.pagination = action.payload.pagination ?? defaultPagination;
      })
      .addCase(fetchAllAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch agents';
      })
      .addCase(fetchMyAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAgents.fulfilled, (state, action) => {
        state.loading = false;
        const items = action.payload.items ?? [];
        const pendingTemps = state.myAgents.filter((a) => typeof a.id === 'string' && a.id.startsWith('temp-'));
        const map = new Map<string, Agent>();
        for (const item of items) {
          map.set(item.id || (item as any)._id, item);
        }
        for (const temp of pendingTemps) {
          if (!map.has(temp.id)) map.set(temp.id, temp);
        }
        state.myAgents = Array.from(map.values());
        state.myPagination = action.payload.pagination ?? defaultPagination;
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(fetchMyAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch agents';
      })
      .addCase(createAgent.pending, (state, action) => {
        const arg = action.meta.arg;
        const tempId = 'temp-' + action.meta.requestId;
        const optimisticAgent = {
          id: tempId,
          _id: tempId,
          userId: 'temp',
          name: arg.name || 'New Agent',
          type: (arg.type as any) || 'receptionist',
          prompt: arg.prompt || '',
          language: arg.language || 'en',
          voiceId: arg.voiceId || '',
          isActive: true,
          callCount: 0,
          useCustomEngine: arg.useCustomEngine ?? true,
          customEngineModel: arg.customEngineModel || 'groq:llama-3.3-70b',
          phoneNumber: arg.phoneNumber || '',
          phoneNumberId: arg.phoneNumberId || '',
          createdAt: new Date().toISOString(),
        } as unknown as Agent;
        if (!state.myAgents.some((a) => a.id === tempId)) {
          state.myAgents.unshift(optimisticAgent);
          saveToSession('cache:myAgents', state.myAgents);
        }
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        const tempId = 'temp-' + action.meta.requestId;
        const realAgent = action.payload;
        const realId = realAgent.id || (realAgent as any)._id;
        const filtered = state.myAgents.filter(
          (a) => a.id !== tempId && (a as any)._id !== tempId && a.id !== realId && (a as any)._id !== realId
        );
        state.myAgents = [realAgent, ...filtered];
        const filteredItems = state.items.filter(
          (a) => a.id !== tempId && (a as any)._id !== tempId && a.id !== realId && (a as any)._id !== realId
        );
        state.items = [realAgent, ...filteredItems];
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(createAgent.rejected, (state, action) => {
        const tempId = 'temp-' + action.meta.requestId;
        state.myAgents = state.myAgents.filter((a) => a.id !== tempId);
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        const id = action.payload.id;
        const myIdx = state.myAgents.findIndex((a) => matchId(a, id));
        if (myIdx !== -1) state.myAgents[myIdx] = action.payload;
        const itemIdx = state.items.findIndex((a) => matchId(a, id));
        if (itemIdx !== -1) state.items[itemIdx] = action.payload;
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(toggleAgent.fulfilled, (state, action) => {
        const { id, isActive } = action.payload;
        const update = (arr: Agent[]) => {
          const idx = arr.findIndex((a) => matchId(a, id));
          if (idx !== -1) arr[idx].isActive = isActive;
        };
        update(state.items);
        update(state.myAgents);
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(deleteAgent.pending, (state, action) => {
        const id = action.meta.arg;
        state.myAgents = state.myAgents.filter((a) => !matchId(a, id));
        state.items = state.items.filter((a) => !matchId(a, id));
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(deleteAgent.fulfilled, (state, action) => {
        const id = action.payload;
        state.myAgents = state.myAgents.filter((a) => !matchId(a, id));
        state.items = state.items.filter((a) => !matchId(a, id));
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(assignPhone.fulfilled, (state, action) => {
        const id = action.payload.id;
        const itemIdx = state.items.findIndex((a) => matchId(a, id));
        if (itemIdx !== -1) state.items[itemIdx] = action.payload;
        const myIdx = state.myAgents.findIndex((a) => matchId(a, id));
        if (myIdx !== -1) state.myAgents[myIdx] = action.payload;
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(unlinkPhone.fulfilled, (state, action) => {
        const id = action.payload.id;
        const itemIdx = state.items.findIndex((a) => matchId(a, id));
        if (itemIdx !== -1) state.items[itemIdx] = action.payload;
        const myIdx = state.myAgents.findIndex((a) => matchId(a, id));
        if (myIdx !== -1) state.myAgents[myIdx] = action.payload;
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(updateAgentConfig.fulfilled, (state, action) => {
        const id = action.payload.id;
        const itemIdx = state.items.findIndex((a) => matchId(a, id));
        if (itemIdx !== -1) state.items[itemIdx] = action.payload;
        const myIdx = state.myAgents.findIndex((a) => matchId(a, id));
        if (myIdx !== -1) state.myAgents[myIdx] = action.payload;
        saveToSession('cache:myAgents', state.myAgents);
      });
  },
});

export default agentsSlice.reducer;

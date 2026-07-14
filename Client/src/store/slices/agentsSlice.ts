import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Agent } from '../../types';
import { agentService, type PaginationParams } from '../../services/api';
import type { PaginationMeta } from '../../components/Pagination';

interface AgentsState {
  items: Agent[];
  myAgents: Agent[];
  pagination: PaginationMeta;
  myPagination: PaginationMeta;
  loading: boolean;
  error: string | null;
}

function loadFromSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function saveToSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
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
        state.myAgents = action.payload.items ?? [];
        state.myPagination = action.payload.pagination ?? defaultPagination;
        saveToSession('cache:myAgents', state.myAgents);
      })
      .addCase(fetchMyAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch agents';
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.myAgents.push(action.payload);
        state.items.push(action.payload);
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

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { claimService } from '../../services/claimService';
import { ExpenseClaim } from '../../types';

interface ClaimsState {
  claims: ExpenseClaim[];
  currentClaim: ExpenseClaim | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClaimsState = {
  claims: [],
  currentClaim: null,
  loading: false,
  error: null,
};

export const fetchClaims = createAsyncThunk('claims/fetchClaims', async (_, { rejectWithValue }) => {
  try {
    const data = await claimService.listClaims();
    return data.claims;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch claims');
  }
});

export const fetchClaimDetails = createAsyncThunk(
  'claims/fetchClaimDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await claimService.getClaim(id);
      return data.claim;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch claim details');
    }
  }
);

export const createClaim = createAsyncThunk(
  'claims/createClaim',
  async (
    payload: { amount: number; category: string; description: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await claimService.createClaim(payload);
      return data.claim;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create claim');
    }
  }
);

export const updateClaim = createAsyncThunk(
  'claims/updateClaim',
  async (
    payload: { id: string; amount?: number; category?: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...updateData } = payload;
      const data = await claimService.updateClaim(id, updateData);
      return data.claim;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update claim');
    }
  }
);

export const deleteClaim = createAsyncThunk(
  'claims/deleteClaim',
  async (id: string, { rejectWithValue }) => {
    try {
      await claimService.deleteClaim(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete claim');
    }
  }
);

export const submitClaim = createAsyncThunk(
  'claims/submitClaim',
  async (payload: { id: string; note?: string }, { rejectWithValue }) => {
    try {
      const data = await claimService.submitClaim(payload.id, payload.note);
      return data.claim;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit claim');
    }
  }
);

export const approveClaim = createAsyncThunk(
  'claims/approveClaim',
  async (payload: { id: string; note?: string }, { rejectWithValue }) => {
    try {
      const data = await claimService.approveClaim(payload.id, payload.note);
      return data.claim;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve claim');
    }
  }
);

export const rejectClaim = createAsyncThunk(
  'claims/rejectClaim',
  async (payload: { id: string; note?: string }, { rejectWithValue }) => {
    try {
      const data = await claimService.rejectClaim(payload.id, payload.note);
      return data.claim;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reject claim');
    }
  }
);

export const markPaidClaim = createAsyncThunk(
  'claims/markPaidClaim',
  async (payload: { id: string; note?: string }, { rejectWithValue }) => {
    try {
      const data = await claimService.markPaidClaim(payload.id, payload.note);
      return data.claim;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to pay claim');
    }
  }
);

const claimsSlice = createSlice({
  name: 'claims',
  initialState,
  reducers: {
    clearClaimsError(state) {
      state.error = null;
    },
    clearCurrentClaim(state) {
      state.currentClaim = null;
    },
  },
  extraReducers: (builder) => {
    // Helper to set pending states
    const setPending = (state: ClaimsState) => {
      state.loading = true;
      state.error = null;
    };
    // Helper to set rejected states
    const setRejected = (state: ClaimsState, action: any) => {
      state.loading = false;
      state.error = action.payload as string;
    };

    builder
      // Fetch claims
      .addCase(fetchClaims.pending, setPending)
      .addCase(fetchClaims.fulfilled, (state, action: PayloadAction<ExpenseClaim[]>) => {
        state.loading = false;
        state.claims = action.payload;
      })
      .addCase(fetchClaims.rejected, setRejected)

      // Fetch claim details
      .addCase(fetchClaimDetails.pending, setPending)
      .addCase(fetchClaimDetails.fulfilled, (state, action: PayloadAction<ExpenseClaim>) => {
        state.loading = false;
        state.currentClaim = action.payload;
      })
      .addCase(fetchClaimDetails.rejected, setRejected)

      // Create claim
      .addCase(createClaim.pending, setPending)
      .addCase(createClaim.fulfilled, (state, action: PayloadAction<ExpenseClaim>) => {
        state.loading = false;
        state.claims.unshift(action.payload);
      })
      .addCase(createClaim.rejected, setRejected)

      // Update claim
      .addCase(updateClaim.pending, setPending)
      .addCase(updateClaim.fulfilled, (state, action: PayloadAction<ExpenseClaim>) => {
        state.loading = false;
        state.claims = state.claims.map((c) => (c.id === action.payload.id ? action.payload : c));
        if (state.currentClaim?.id === action.payload.id) {
          state.currentClaim = action.payload;
        }
      })
      .addCase(updateClaim.rejected, setRejected)

      // Delete claim
      .addCase(deleteClaim.pending, setPending)
      .addCase(deleteClaim.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.claims = state.claims.filter((c) => c.id !== action.payload);
        if (state.currentClaim?.id === action.payload) {
          state.currentClaim = null;
        }
      })
      .addCase(deleteClaim.rejected, setRejected)

      // Submit, Approve, Reject, Pay - all return updated claims and should update state list & details
      .addMatcher(
        (action) =>
          [
            submitClaim.fulfilled.type,
            approveClaim.fulfilled.type,
            rejectClaim.fulfilled.type,
            markPaidClaim.fulfilled.type,
          ].includes(action.type),
        (state, action: PayloadAction<ExpenseClaim>) => {
          state.loading = false;
          state.claims = state.claims.map((c) => (c.id === action.payload.id ? action.payload : c));
          if (state.currentClaim?.id === action.payload.id) {
            state.currentClaim = action.payload;
          }
        }
      )
      .addMatcher(
        (action) =>
          [
            submitClaim.pending.type,
            approveClaim.pending.type,
            rejectClaim.pending.type,
            markPaidClaim.pending.type,
          ].includes(action.type),
        setPending
      )
      .addMatcher(
        (action) =>
          [
            submitClaim.rejected.type,
            approveClaim.rejected.type,
            rejectClaim.rejected.type,
            markPaidClaim.rejected.type,
          ].includes(action.type),
        setRejected
      );
  },
});

export const { clearClaimsError, clearCurrentClaim } = claimsSlice.actions;
export default claimsSlice.reducer;

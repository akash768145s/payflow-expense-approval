import { api } from './api';
import { ExpenseClaim } from '../types';

export const claimService = {
  async listClaims(): Promise<{ claims: ExpenseClaim[] }> {
    const response = await api.get<{ claims: ExpenseClaim[] }>('/claims');
    return response.data;
  },

  async getClaim(id: string): Promise<{ claim: ExpenseClaim }> {
    const response = await api.get<{ claim: ExpenseClaim }>(`/claims/${id}`);
    return response.data;
  },

  async createClaim(data: {
    amount: number;
    category: string;
    description: string;
  }): Promise<{ claim: ExpenseClaim }> {
    const response = await api.post<{ claim: ExpenseClaim }>('/claims', data);
    return response.data;
  },

  async updateClaim(
    id: string,
    data: {
      amount?: number;
      category?: string;
      description?: string;
    }
  ): Promise<{ claim: ExpenseClaim }> {
    const response = await api.patch<{ claim: ExpenseClaim }>(`/claims/${id}`, data);
    return response.data;
  },

  async deleteClaim(id: string): Promise<void> {
    await api.delete(`/claims/${id}`);
  },

  async submitClaim(id: string, note?: string): Promise<{ claim: ExpenseClaim }> {
    const response = await api.post<{ claim: ExpenseClaim }>(`/claims/${id}/submit`, { note });
    return response.data;
  },

  async approveClaim(id: string, note?: string): Promise<{ claim: ExpenseClaim }> {
    const response = await api.post<{ claim: ExpenseClaim }>(`/claims/${id}/approve`, { note });
    return response.data;
  },

  async rejectClaim(id: string, note?: string): Promise<{ claim: ExpenseClaim }> {
    const response = await api.post<{ claim: ExpenseClaim }>(`/claims/${id}/reject`, { note });
    return response.data;
  },

  async markPaidClaim(id: string, note?: string): Promise<{ claim: ExpenseClaim }> {
    const response = await api.post<{ claim: ExpenseClaim }>(`/claims/${id}/mark-paid`, { note });
    return response.data;
  },

  async sendBackClaim(id: string, reason: string): Promise<{ claim: ExpenseClaim }> {
    const response = await api.post<{ claim: ExpenseClaim }>(`/claims/${id}/send-back`, { reason });
    return response.data;
  },
};

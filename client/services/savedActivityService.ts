/**
 * Saved Warehouses and Activity Tracking Service
 * Provides methods for managing saved warehouses, activity logs, and inquiries
 */

import {
  SavedWarehouseRequest,
  SavedWarehouseResponse,
  SavedWarehousesResponse,
  SavedStatusResponse,
  ActivityLogRequest,
  ActivityTimelineResponse,
  InquiryRequest,
  InquiryResponse,
  SeekerInquiriesResponse,
  ActivityStatsResponse
} from '@shared/api';

const API_BASE = '';

export class SavedWarehouseService {
  async toggleSaved(request: SavedWarehouseRequest): Promise<SavedWarehouseResponse> {
    const response = await fetch(`${API_BASE}/api/saved/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getSavedWarehouses(
    seekerId: string, 
    filters?: {
      city?: string;
      price_range?: string;
      sort_by?: string;
      sort_order?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<SavedWarehousesResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE}/api/saved/${seekerId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async checkSavedStatus(seekerId: string, warehouseId: string): Promise<SavedStatusResponse> {
    const response = await fetch(`${API_BASE}/api/saved/${seekerId}/status/${warehouseId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export class ActivityService {
  async logActivity(request: ActivityLogRequest): Promise<void> {
    const response = await fetch(`${API_BASE}/api/activity/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async getActivityTimeline(
    seekerId: string,
    filters?: {
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ActivityTimelineResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE}/api/activity/${seekerId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getActivityStats(seekerId: string): Promise<ActivityStatsResponse> {
    const response = await fetch(`${API_BASE}/api/activity/${seekerId}/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sendInquiry(request: InquiryRequest): Promise<InquiryResponse> {
    const response = await fetch(`${API_BASE}/api/inquiries/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getSeekerInquiries(
    seekerId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<SeekerInquiriesResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE}/api/inquiries/${seekerId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instances
export const savedWarehouseService = new SavedWarehouseService();
export const activityService = new ActivityService();

/**
 * Filter Status Endpoint
 * Provides real-time status of the profanity filter
 */

import { FilterEngine } from '../../core/filterEngine';

export interface FilterStatusRequest {
  mediaSourceId?: string;
}

export interface FilterStatusResponse {
  enabled: boolean;
  confidenceThreshold: number;
  actionOnProfanity: 'mute' | 'skip' | 'both' | 'notify';
  lastProcessedTime?: number;
  matchedWordsCount?: number;
}

export class FilterStatusEndpoint {
  private filterEngine: FilterEngine;

  constructor(filterEngine: FilterEngine) {
    this.filterEngine = filterEngine;
  }

  async getStatus(request: FilterStatusRequest): Promise<FilterStatusResponse> {
    const config = this.filterEngine.getConfig();
    
    return {
      enabled: config.enabled,
      confidenceThreshold: config.confidenceThreshold,
      actionOnProfanity: config.actionOnProfanity,
      lastProcessedTime: Date.now()
    };
  }

  async toggleEnabled(enabled: boolean): Promise<void> {
    await this.filterEngine.updateConfig({ enabled });
  }

  async setConfidenceThreshold(threshold: number): Promise<void> {
    await this.filterEngine.updateConfig({ confidenceThreshold: threshold });
  }

  async setActionOnProfanity(action: 'mute' | 'skip' | 'both' | 'notify'): Promise<void> {
    await this.filterEngine.updateConfig({ actionOnProfanity: action });
  }
}

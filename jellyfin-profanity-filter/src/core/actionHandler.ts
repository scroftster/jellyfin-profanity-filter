/**
 * Action Handler - Handles mute/skip actions for Jellyfin Profanity Filter plugin
 * Executes playback control commands via Jellyfin API
 */

import { logger } from '../utils/logger';
import { configLoader } from '../utils/config';

export interface PlaybackControlRequest {
  mediaSourceId: string;
  itemId: string;
  action?: string;
}

export interface MuteRequest extends PlaybackControlRequest {
  action: 'mute';
}

export interface SkipRequest extends PlaybackControlRequest {
  action: 'skip';
  delayMs?: number;
}

export interface FilterStatusResponse {
  mediaSourceId: string;
  itemId: string;
  filterEnabled: boolean;
  lastProcessedTime: number;
  currentAction: 'playing' | 'paused' | 'skipping';
}

export type PlaybackControlContext = Record<string, unknown> | undefined;

export class ActionHandler {
  private isInitialized: boolean = false;
  private jellyfinApiUrl: string;
  private authHeader: string;
  private activePlaybackSession: PlaybackControlRequest | null = null;

  constructor() {
    this.jellyfinApiUrl = process.env.JELLYFIN_API_URL || 'http://localhost:8096';
    this.authHeader = `Bearer ${process.env.JELLYFIN_API_KEY || ''}`;
  }

  /**
   * Initialize the action handler with Jellyfin API credentials
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.jellyfinApiUrl = process.env.JELLYFIN_API_URL || 'http://localhost:8096';
    this.authHeader = `Bearer ${process.env.JELLYFIN_API_KEY || ''}`;
    
    this.isInitialized = true;
    logger.info('Action handler initialized', { apiUrl: this.jellyfinApiUrl });
  }

  /**
   * Pause playback (mute action)
   */
  public async pausePlayback(request: MuteRequest): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const req = request as PlaybackControlRequest;
      const response = await fetch(
        `${this.jellyfinApiUrl}/api/videos/pause?mediaSourceId=${encodeURIComponent(req.mediaSourceId)}&itemId=${encodeURIComponent(req.itemId)}`,
        {
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to pause playback: ${response.status}`);
      }

      logger.info('Playback paused successfully', { mediaSourceId: request.mediaSourceId, itemId: request.itemId });
    } catch (error) {
      logger.error('Failed to pause playback', { error: String(error) });
      throw error as Error;
    }
  }

  /**
   * Skip word (resume after delay)
   */
  public async skipWord(request: SkipRequest): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // First, pause the current playback
      const muteReq = { mediaSourceId: request.mediaSourceId, itemId: request.itemId } as PlaybackControlRequest;
      await this.pausePlayback({ ...muteReq, action: 'mute' });

      // Wait for the specified delay
      if (request.delayMs) {
        await new Promise(resolve => setTimeout(resolve, request.delayMs));
      }

      // Then resume playback
      const resumeReq = { mediaSourceId: request.mediaSourceId, itemId: request.itemId } as PlaybackControlRequest;
      await this.resumePlayback(resumeReq);

      logger.info('Word skipped successfully', { mediaSourceId: request.mediaSourceId, itemId: request.itemId });
    } catch (error) {
      logger.error('Failed to skip word', { error: String(error) });
      throw error as Error;
    }
  }

  /**
   * Resume playback after muting/skipping
   */
  public async resumePlayback(request: PlaybackControlRequest): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(
        `${this.jellyfinApiUrl}/api/videos/play?mediaSourceId=${encodeURIComponent(request.mediaSourceId)}&itemId=${encodeURIComponent(request.itemId)}`,
        {
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to resume playback: ${response.status}`);
      }

      logger.info('Playback resumed successfully', { mediaSourceId: request.mediaSourceId, itemId: request.itemId });
    } catch (error) {
      logger.error('Failed to resume playback', { error: String(error) });
      throw error as Error;
    }
  }

  /**
   * Get filter status for a media source
   */
  public async getFilterStatus(request: PlaybackControlRequest): Promise<FilterStatusResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(
        `${this.jellyfinApiUrl}/plugins/profanity-filter/api/status?mediaSourceId=${encodeURIComponent(request.mediaSourceId)}`,
        {
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get filter status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        mediaSourceId: request.mediaSourceId,
        itemId: request.itemId,
        filterEnabled: configLoader.isEnabled(),
        lastProcessedTime: Date.now(),
        currentAction: 'playing'
      };
    } catch (error) {
      logger.error('Failed to get filter status', { error: String(error) });
      throw error as Error;
    }
  }

  /**
   * Set active playback session for tracking
   */
  public setActiveSession(session: PlaybackControlRequest): void {
    this.activePlaybackSession = session;
    logger.debug('Active playback session set', { mediaSourceId: session.mediaSourceId });
  }

  /**
   * Clear active playback session
   */
  public clearActiveSession(): void {
    this.activePlaybackSession = null;
    logger.debug('Active playback session cleared');
  }

  /**
   * Get current active session
   */
  public getActiveSession(): PlaybackControlRequest | null {
    return this.activePlaybackSession;
  }

  /**
   * Reset the action handler
   */
  public async reset(): Promise<void> {
    this.isInitialized = false;
    this.activePlaybackSession = null;
    logger.info('Action handler reset');
  }
}

export const actionHandler = new ActionHandler();

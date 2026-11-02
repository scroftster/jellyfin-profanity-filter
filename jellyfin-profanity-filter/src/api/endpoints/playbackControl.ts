/**
 * Playback Control Endpoint
 * Handles pause/resume actions for profanity filtering
 */

import { ActionHandler, MuteRequest, SkipRequest } from '../../core/actionHandler';

export interface PausePlaybackRequest {
  mediaSourceId: string;
  itemId: string;
}

export interface SkipWordRequest extends PausePlaybackRequest {
  delayMs?: number;
}

export class PlaybackControlEndpoint {
  private actionHandler: ActionHandler;

  constructor(actionHandler: ActionHandler) {
    this.actionHandler = actionHandler;
  }

  async pause(request: PausePlaybackRequest): Promise<void> {
    await this.actionHandler.pausePlayback({
      mediaSourceId: request.mediaSourceId,
      itemId: request.itemId,
      action: 'mute'
    });
  }

  async skip(request: SkipWordRequest): Promise<void> {
    await this.actionHandler.skipWord({
      mediaSourceId: request.mediaSourceId,
      itemId: request.itemId,
      action: 'skip',
      delayMs: request.delayMs || 5000
    });
  }

  async resume(mediaSourceId: string, itemId: string): Promise<void> {
    await this.actionHandler.resumePlayback({ mediaSourceId, itemId });
  }
}

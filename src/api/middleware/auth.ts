/**
 * Authentication Middleware for Plugin API Endpoints
 */

export interface AuthRequest extends Request {
  headers: Headers;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
}

export class AuthMiddleware {
  private jellyfinApiUrl: string;
  private authHeader: string;

  constructor() {
    this.jellyfinApiUrl = (globalThis as any).JELLYFIN_API_URL || 'http://localhost:8096';
    this.authHeader = `Bearer ${(globalThis as any).JELLYFIN_API_KEY || ''}`;
  }

  async verifyAuth(): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${this.jellyfinApiUrl}/System/GetAccessPolicy`,
        {
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return { success: false, message: 'Authentication failed' };
      }

      const data = await response.json();
      
      if (data.AccessPolicy?.EnableUserManagement) {
        return { success: true };
      }

      return { success: true };
    } catch (error) {
      console.error('Auth verification error:', error);
      return { success: false, message: 'Authentication error' };
    }
  }
}

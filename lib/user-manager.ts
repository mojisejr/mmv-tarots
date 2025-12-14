// Static User Manager for MiMiVibe Tarot App
// Manages persistent user identification without authentication

export class StaticUserManager {
  private static readonly STORAGE_KEY = 'mmv_user_id';
  private static readonly USER_PREFIX = 'user_';

  /**
   * Get or create a persistent user ID
   * Uses localStorage to maintain user identity across sessions
   */
  static getUserId(): string {
    // Try to get existing user ID from localStorage
    let userId: string | null = null;

    try {
      userId = localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      // Fallback to sessionStorage if localStorage is not available
      console.warn('localStorage not available, falling back to sessionStorage');
      try {
        userId = sessionStorage.getItem(this.STORAGE_KEY);
      } catch (sessionError) {
        console.error('No storage available:', sessionError);
      }
    }

    // If no user ID exists, create a new one
    if (!userId) {
      userId = this.generateNewUserId();
      this.saveUserId(userId);
    }

    return userId;
  }

  /**
   * Generate a new unique user ID
   */
  private static generateNewUserId(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `${this.USER_PREFIX}${timestamp}_${randomStr}`;
  }

  /**
   * Save user ID to storage
   */
  private static saveUserId(userId: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, userId);
    } catch (error) {
      // Fallback to sessionStorage
      console.warn('Failed to save to localStorage, using sessionStorage');
      try {
        sessionStorage.setItem(this.STORAGE_KEY, userId);
      } catch (sessionError) {
        console.error('Failed to save user ID:', sessionError);
      }
    }
  }

  /**
   * Reset user ID (for testing or development)
   */
  static resetUserId(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      // Fallback to sessionStorage
      try {
        sessionStorage.removeItem(this.STORAGE_KEY);
      } catch (sessionError) {
        console.error('Failed to remove user ID:', sessionError);
      }
    }
  }

  /**
   * Check if user ID exists
   */
  static hasUserId(): boolean {
    try {
      return localStorage.getItem(this.STORAGE_KEY) !== null ||
             sessionStorage.getItem(this.STORAGE_KEY) !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user identifier for API calls
   * This is the same as getUserId() but with a clearer name for API usage
   */
  static getUserIdentifier(): string {
    return this.getUserId();
  }
}
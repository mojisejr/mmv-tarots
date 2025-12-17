import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StaticUserManager } from '../user-manager';

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Store original implementations
const originalLocalStorage = global.localStorage;
const originalSessionStorage = global.sessionStorage;

describe('StaticUserManager', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(global, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original implementations
    global.localStorage = originalLocalStorage;
    global.sessionStorage = originalSessionStorage;
  });

  describe('getUserId', () => {
    it('should return existing user ID from localStorage', () => {
      // Arrange
      const existingUserId = 'user_1234567890_abcdef123';
      localStorageMock.getItem.mockReturnValue(existingUserId);

      // Act
      const userId = StaticUserManager.getUserId();

      // Assert
      expect(userId).toBe(existingUserId);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('mmv_user_id');
    });

    it('should create new user ID if none exists', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      // Mock Math.random to return predictable value
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
      const mockNow = 1703123456789;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      // Act
      const userId = StaticUserManager.getUserId();

      // Assert
      // The format should be user_{timestamp}_{randomString}
      expect(userId).toMatch(/^user_1703123456789_[a-z0-9]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('mmv_user_id', userId);

      // Clean up
      mockRandom.mockRestore();
    });

    it('should fall back to sessionStorage if localStorage fails', () => {
      // Arrange
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      const existingUserId = 'user_1234567890_abcdef123';
      sessionStorageMock.getItem.mockReturnValue(existingUserId);

      // Act
      const userId = StaticUserManager.getUserId();

      // Assert
      expect(userId).toBe(existingUserId);
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('mmv_user_id');
    });

    it('should create new user ID if both storages fail', () => {
      // Arrange
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      sessionStorageMock.getItem.mockImplementation(() => {
        throw new Error('sessionStorage not available');
      });

      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.987654321);
      const mockNow = 1703123456789;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      // Act
      const userId = StaticUserManager.getUserId();

      // Assert
      // The format should be user_{timestamp}_{randomString}
      expect(userId).toMatch(/^user_1703123456789_[a-z0-9]+$/);

      // Clean up
      mockRandom.mockRestore();
    });
  });

  describe('resetUserId', () => {
    it('should remove user ID from localStorage', () => {
      // Act
      StaticUserManager.resetUserId();

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mmv_user_id');
    });

    it('should fall back to sessionStorage if localStorage fails', () => {
      // Arrange
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Act
      StaticUserManager.resetUserId();

      // Assert
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('mmv_user_id');
    });
  });

  describe('hasUserId', () => {
    it('should return true if user ID exists in localStorage', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('user_123');

      // Act
      const hasUserId = StaticUserManager.hasUserId();

      // Assert
      expect(hasUserId).toBe(true);
    });

    it('should return true if user ID exists in sessionStorage', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue('user_456');

      // Act
      const hasUserId = StaticUserManager.hasUserId();

      // Assert
      expect(hasUserId).toBe(true);
    });

    it('should return false if no user ID exists', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue(null);

      // Act
      const hasUserId = StaticUserManager.hasUserId();

      // Assert
      expect(hasUserId).toBe(false);
    });

    it('should return false if storage access fails', () => {
      // Arrange
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      sessionStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Act
      const hasUserId = StaticUserManager.hasUserId();

      // Assert
      expect(hasUserId).toBe(false);
    });
  });

  describe('getUserIdentifier', () => {
    it('should return the same as getUserId', () => {
      // Arrange
      const expectedUserId = 'user_test_123';
      localStorageMock.getItem.mockReturnValue(expectedUserId);

      // Act
      const userId = StaticUserManager.getUserIdentifier();

      // Assert
      expect(userId).toBe(expectedUserId);
    });
  });
});
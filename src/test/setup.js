import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Vapi since it's not available in test environment
global.Vapi = class MockVapi {
  constructor() {
    this.isAvailable = false;
    this.isCallActive = false;
    this.isMuted = false;
    this.isUserSpeaking = false;
    this.isAssistantSpeaking = false;
    this.volumeLevel = 0;
    this.connectionStatus = 'disconnected';
    this.lastError = null;
  }
  
  startCall() {}
  stopCall() {}
  toggleMute() {}
  sendMessage() {}
};

// Mock scrollIntoView since it's not available in jsdom
Element.prototype.scrollIntoView = vi.fn();
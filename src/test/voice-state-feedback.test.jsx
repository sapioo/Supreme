import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArgumentInput from '../components/courtroom/ArgumentInput';

// Mock the voice-related props
const mockProps = {
  onSubmit: vi.fn(),
  disabled: false,
  micDisabled: false,
  currentRound: 1,
  totalRounds: 3,
  selectedSide: 'petitioner',
  voiceEnabled: true,
  isVoiceMode: true,
  onToggleVoiceMode: vi.fn(),
  isCallActive: false,
  isMuted: false,
  isUserSpeaking: false,
  isAiSpeaking: false,
  connectionStatus: 'idle',
  onStartVoice: vi.fn(),
  onStopVoice: vi.fn(),
  onToggleMute: vi.fn(),
  canStartVoice: true,
  voiceError: '',
};

describe('Enhanced Voice State Feedback', () => {
  it('should display enhanced status message when AI is speaking', () => {
    render(
      <ArgumentInput
        {...mockProps}
        isAiSpeaking={true}
        isCallActive={true}
      />
    );
    
    // Check for enhanced muted mic message
    expect(screen.getByText('Your microphone is muted while opposing counsel speaks')).toBeInTheDocument();
  });

  it('should show muted banner when AI is speaking', () => {
    render(
      <ArgumentInput
        {...mockProps}
        isAiSpeaking={true}
        isCallActive={true}
      />
    );
    
    // Check for muted banner
    expect(screen.getByText('Microphone Temporarily Muted')).toBeInTheDocument();
    expect(screen.getByText('Wait for opposing counsel to finish speaking')).toBeInTheDocument();
  });

  it('should show connection status when call is active', () => {
    render(
      <ArgumentInput
        {...mockProps}
        isCallActive={true}
        connectionStatus="connected"
      />
    );
    
    // Check for connection status indicator
    expect(screen.getByText('Voice session active')).toBeInTheDocument();
  });

  it('should display enhanced error panel with troubleshooting when voice error occurs', () => {
    render(
      <ArgumentInput
        {...mockProps}
        voiceError="Microphone access denied"
        isCallActive={false}
      />
    );
    
    // Check for enhanced error display
    expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
    expect(screen.getByText('Troubleshooting:')).toBeInTheDocument();
    expect(screen.getByText('Check microphone permissions in your browser')).toBeInTheDocument();
  });

  it('should show enhanced mute button with text when call is active', () => {
    render(
      <ArgumentInput
        {...mockProps}
        isCallActive={true}
        isAiSpeaking={false}
        isMuted={false}
      />
    );
    
    // Check for enhanced mute button
    expect(screen.getByText('Mute')).toBeInTheDocument();
  });

  it('should show enhanced status for connecting state', () => {
    render(
      <ArgumentInput
        {...mockProps}
        connectionStatus="connecting"
      />
    );
    
    // Check for enhanced connecting message
    expect(screen.getByText('Connecting to courtroom...')).toBeInTheDocument();
  });

  it('should show enhanced error status message', () => {
    render(
      <ArgumentInput
        {...mockProps}
        connectionStatus="error"
      />
    );
    
    // Check for enhanced error message with guidance
    expect(screen.getByText('Connection error — check microphone permissions and try again')).toBeInTheDocument();
  });
});
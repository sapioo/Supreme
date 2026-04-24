import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotificationToast from './NotificationToast';

describe('NotificationToast', () => {
  it('renders notification with correct message and type', () => {
    const notification = {
      id: 1,
      message: 'Test notification',
      type: 'info'
    };
    const onRemove = vi.fn();

    render(<NotificationToast notification={notification} onRemove={onRemove} />);
    
    expect(screen.getByText('Test notification')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('notification-toast--info');
  });

  it('calls onRemove when close button is clicked', async () => {
    const notification = {
      id: 1,
      message: 'Test notification',
      type: 'info'
    };
    const onRemove = vi.fn();

    render(<NotificationToast notification={notification} onRemove={onRemove} />);
    
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith(1);
    }, { timeout: 500 });
  });

  it('displays correct icon for different notification types', () => {
    const types = [
      { type: 'success', expectedIcon: '✓' },
      { type: 'warning', expectedIcon: '⚠' },
      { type: 'error', expectedIcon: '✕' },
      { type: 'timer', expectedIcon: '⏰' },
      { type: 'round', expectedIcon: '🏛' },
      { type: 'voice', expectedIcon: '🎤' },
      { type: 'info', expectedIcon: 'ℹ' }
    ];

    types.forEach(({ type, expectedIcon }) => {
      const notification = {
        id: 1,
        message: `Test ${type} notification`,
        type
      };
      const onRemove = vi.fn();

      const { unmount } = render(<NotificationToast notification={notification} onRemove={onRemove} />);
      
      expect(screen.getByText(expectedIcon)).toBeInTheDocument();
      
      unmount();
    });
  });
});
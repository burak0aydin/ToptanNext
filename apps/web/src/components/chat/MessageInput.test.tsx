import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MessageInput } from './MessageInput';

const emitMock = jest.fn();

jest.mock('@/features/chat/hooks/useSocket', () => ({
  useSocket: () => ({
    socket: { emit: emitMock },
    isConnected: true,
  }),
}));

jest.mock('@/features/chat/api/chat.api', () => ({
  getPresignedUploadUrl: jest.fn(),
}));

describe('MessageInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends message with Enter and does not send with Shift+Enter', async () => {
    render(
      <MessageInput
        conversationId='conv-1'
        onOpenQuoteModal={jest.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText('Lütfen mesajınızı buraya girin');

    fireEvent.change(textarea, { target: { value: 'Merhaba dünya' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(emitMock).toHaveBeenCalledWith(
        'send_message',
        expect.objectContaining({
          conversationId: 'conv-1',
          type: 'TEXT',
          body: 'Merhaba dünya',
        }),
      );
    });

    fireEvent.change(textarea, { target: { value: 'Yeni satır testi' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    const sendCalls = emitMock.mock.calls.filter((call) => call[0] === 'send_message');
    expect(sendCalls).toHaveLength(1);
  });

  it('emits typing_start and typing_stop with 2s debounce', () => {
    jest.useFakeTimers();

    render(
      <MessageInput
        conversationId='conv-typing'
        onOpenQuoteModal={jest.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText('Lütfen mesajınızı buraya girin');

    fireEvent.change(textarea, { target: { value: 'a' } });

    expect(emitMock).toHaveBeenCalledWith('typing_start', {
      conversationId: 'conv-typing',
    });

    jest.advanceTimersByTime(2100);

    expect(emitMock).toHaveBeenCalledWith('typing_stop', {
      conversationId: 'conv-typing',
    });

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
});

'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadChatAttachment } from '@/features/chat/api/chat.api';
import { useSocket } from '@/features/chat/hooks/useSocket';
import { AttachmentPreview } from './AttachmentPreview';

type MessageInputProps = {
  conversationId: string;
  onOpenQuoteModal: () => void;
  canSendQuote?: boolean;
  compact?: boolean;
};

export function MessageInput({
  conversationId,
  onOpenQuoteModal,
  canSendQuote = true,
  compact = false,
}: MessageInputProps) {
  const { socket } = useSocket();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const stopTyping = () => {
    if (!socket || !isTypingRef.current) {
      return;
    }

    socket.emit('typing_stop', {
      conversationId,
    });
    isTypingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = (nextValue: string) => {
    setValue(nextValue);

    if (!socket) {
      return;
    }

    if (!isTypingRef.current) {
      socket.emit('typing_start', {
        conversationId,
      });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      stopTyping();
    }, 2_000);
  };

  const uploadAttachment = async (file: File): Promise<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }> => {
    return uploadChatAttachment(file);
  };

  const handleSend = async () => {
    if (!socket) {
      return;
    }

    const text = value.trim();

    if (text.length === 0 && attachments.length === 0) {
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const uploadedAttachments = await Promise.all(
        attachments.map((file) => uploadAttachment(file)),
      );

      const messageType = text.length > 0
        ? 'TEXT'
        : uploadedAttachments.every((item) => item.mimeType.startsWith('image/'))
          ? 'IMAGE'
          : 'FILE';

      socket.emit('send_message', {
        conversationId,
        type: messageType,
        body: text.length > 0 ? text : undefined,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      setValue('');
      setAttachments([]);
      stopTyping();
    } catch (error) {
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message
        : 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='shrink-0 space-y-3 border-t border-slate-200 bg-white p-3 sm:p-4'>
      <AttachmentPreview
        files={attachments}
        onRemove={(index) => {
          setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
        }}
      />

      {sendError ? (
        <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700'>
          {sendError}
        </p>
      ) : null}

      <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
        <textarea
          value={value}
          onChange={(event) => handleTyping(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder='Mesajınızı yazın...'
          className={[
            'w-full resize-none border-none bg-transparent text-sm text-slate-700 outline-none',
            compact ? 'h-16' : 'h-16 sm:h-20 lg:h-24',
          ].join(' ')}
        />

        <div className='mt-2 flex min-w-0 items-center gap-2'>
          <button
            type='button'
            aria-label='Dosya ekle'
            className='flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-primary'
            onClick={() => fileInputRef.current?.click()}
          >
            <span className='material-symbols-outlined'>attach_file</span>
          </button>

          <button
            type='button'
            aria-label='Emoji ekle'
            className='flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-primary'
            onClick={() => {
              setValue((current) => `${current}🙂`);
            }}
          >
            <span className='material-symbols-outlined'>mood</span>
          </button>

          <span className='ml-auto hidden truncate text-[11px] font-semibold text-slate-300 sm:block'>
            SHIFT + ENTER ile yeni satır
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        multiple
        className='hidden'
        onChange={(event) => {
          const selected = Array.from(event.target.files ?? []);
          if (selected.length > 0) {
            setAttachments((current) => [...current, ...selected].slice(0, 6));
          }

          event.target.value = '';
        }}
      />

      <div className={canSendQuote ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'grid grid-cols-1'}>
        {canSendQuote ? (
          <button
            type='button'
            onClick={onOpenQuoteModal}
            className='min-h-11 rounded-xl bg-[#FF5A1F] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90'
          >
            Özel Teklif Gönder
          </button>
        ) : null}
        <button
          type='button'
          disabled={isSending}
          onClick={() => {
            void handleSend();
          }}
          className='min-h-11 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60'
        >
          Gönder
        </button>
      </div>
    </div>
  );
}

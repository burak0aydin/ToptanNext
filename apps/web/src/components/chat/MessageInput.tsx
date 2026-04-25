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
  const [isExpanded, setIsExpanded] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const canSendMessage = value.trim().length > 0 || attachments.length > 0;
  const inputPanelHeight = isExpanded
    ? 'min-h-[156px]'
    : canSendQuote
      ? compact
        ? 'min-h-[112px]'
        : 'min-h-[118px]'
      : compact
        ? 'min-h-[92px]'
        : 'min-h-[100px]';

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
    <div className='shrink-0 space-y-2 border-t border-slate-100 bg-white p-2 sm:p-2.5'>
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

      <div
        className={[
          'relative rounded-xl bg-[#F7F8FA] px-3 py-3 sm:px-3.5',
          inputPanelHeight,
        ].join(' ')}
      >
        <button
          type='button'
          aria-label={isExpanded ? 'Mesaj alanını küçült' : 'Mesaj alanını büyüt'}
          className='absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:text-slate-800'
          onClick={() => setIsExpanded((current) => !current)}
        >
          <span className='material-symbols-outlined text-[19px]'>
            {isExpanded ? 'close_fullscreen' : 'open_in_full'}
          </span>
        </button>

        <textarea
          value={value}
          onChange={(event) => handleTyping(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder='Lütfen mesajınızı buraya girin'
          className={[
            'w-full resize-none border-none bg-transparent pr-8 text-[13px] font-medium leading-relaxed text-slate-700 outline-none placeholder:text-slate-400 sm:text-sm',
            isExpanded ? 'h-[94px]' : compact ? 'h-[34px]' : 'h-[40px]',
          ].join(' ')}
        />

        <div className='absolute bottom-2.5 left-3 flex min-w-0 items-center gap-1'>
          <button
            type='button'
            aria-label='Dosya ekle'
            className='flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-primary'
            onClick={() => fileInputRef.current?.click()}
          >
            <span className='material-symbols-outlined text-[19px]'>attach_file</span>
          </button>

          <button
            type='button'
            aria-label='Emoji ekle'
            className='flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-primary'
            onClick={() => {
              setValue((current) => `${current}🙂`);
            }}
          >
            <span className='material-symbols-outlined text-[19px]'>mood</span>
          </button>
        </div>

        <div className='absolute bottom-2.5 right-3 flex w-[108px] flex-col items-stretch gap-1.5 sm:w-[120px]'>
          {canSendQuote ? (
            <button
              type='button'
              onClick={onOpenQuoteModal}
              className='min-h-7 cursor-pointer rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#FF5A1F] shadow-sm ring-1 ring-[#FF5A1F]/20 transition-colors hover:bg-[#FF5A1F] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/30'
            >
              Teklif Gönder
            </button>
          ) : null}
          <button
            type='button'
            disabled={isSending || !canSendMessage}
            onClick={() => {
              void handleSend();
            }}
            className={[
              'min-h-7 rounded-full px-2.5 py-1 text-[11px] font-bold text-white transition-colors disabled:cursor-not-allowed',
              canSendMessage
                ? 'bg-primary hover:bg-primary-container disabled:bg-primary/60'
                : 'bg-[#C8C8C8]',
            ].join(' ')}
          >
            Gönder
          </button>
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
    </div>
  );
}

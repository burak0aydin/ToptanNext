'use client';

import { useEffect, useRef, useState } from 'react';
import { getPresignedUploadUrl } from '@/features/chat/api/chat.api';
import { useSocket } from '@/features/chat/hooks/useSocket';
import { AttachmentPreview } from './AttachmentPreview';

type MessageInputProps = {
  conversationId: string;
  onOpenQuoteModal: () => void;
};

export function MessageInput({
  conversationId,
  onOpenQuoteModal,
}: MessageInputProps) {
  const { socket } = useSocket();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

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
    const uploadInfo = await getPresignedUploadUrl({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    const uploadResponse = await fetch(uploadInfo.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Dosya yüklenemedi.');
    }

    return {
      fileName: file.name,
      fileUrl: uploadInfo.fileUrl,
      fileSize: file.size,
      mimeType: file.type,
    };
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
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='space-y-3 border-t border-slate-200 bg-white p-4'>
      <AttachmentPreview
        files={attachments}
        onRemove={(index) => {
          setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
        }}
      />

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
          className='h-24 w-full resize-none border-none bg-transparent text-sm text-slate-700 outline-none'
        />

        <div className='mt-2 flex items-center gap-2'>
          <button
            type='button'
            className='text-slate-500 hover:text-primary'
            onClick={() => fileInputRef.current?.click()}
          >
            <span className='material-symbols-outlined'>attach_file</span>
          </button>

          <button
            type='button'
            className='text-slate-500 hover:text-primary'
            onClick={() => {
              setValue((current) => `${current}🙂`);
            }}
          >
            <span className='material-symbols-outlined'>mood</span>
          </button>

          <span className='ml-auto text-[11px] font-semibold text-slate-300'>SHIFT + ENTER ile yeni satır</span>
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

      <div className='grid grid-cols-2 gap-3'>
        <button
          type='button'
          onClick={onOpenQuoteModal}
          className='rounded-xl bg-[#FF5A1F] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90'
        >
          Özel Teklif Gönder
        </button>
        <button
          type='button'
          disabled={isSending}
          onClick={() => {
            void handleSend();
          }}
          className='rounded-xl bg-primary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60'
        >
          Gönder
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageThread } from '@/components/chat/MessageThread';
import { QuoteOfferModal } from '@/components/chat/QuoteOfferModal';
import { fetchConversationById } from '@/features/chat/api/chat.api';
import { useSocket } from '@/features/chat/hooks/useSocket';
import { getUserRoleFromToken } from '@/lib/auth-token';

type ConversationPageProps = {
  params: {
    conversationId: string;
  };
};

export default function ConversationPage({ params }: ConversationPageProps) {
  const { socket } = useSocket();
  const [isSupplier, setIsSupplier] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    setIsSupplier(getUserRoleFromToken() === 'SUPPLIER');
  }, []);

  const conversationQuery = useQuery({
    queryKey: ['chat', 'conversation', params.conversationId],
    queryFn: () => fetchConversationById(params.conversationId),
  });

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='min-h-0 flex-1'>
        <MessageThread conversationId={params.conversationId} />
      </div>

      <MessageInput
        conversationId={params.conversationId}
        canSendQuote={isSupplier}
        onOpenQuoteModal={() => {
          setIsQuoteModalOpen(true);
        }}
      />

      <QuoteOfferModal
        open={isQuoteModalOpen}
        defaultProductListingId={conversationQuery.data?.productListingId ?? null}
        onClose={() => setIsQuoteModalOpen(false)}
        onSubmit={async (payload) => {
          if (!socket) {
            throw new Error('Socket bağlantısı yok.');
          }

          socket.emit('send_quote_offer', {
            conversationId: params.conversationId,
            quoteData: payload,
          });
        }}
      />
    </div>
  );
}

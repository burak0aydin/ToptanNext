'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPaymentCard,
  deletePaymentCard,
  fetchPaymentCards,
  selectPaymentCard,
  CreatePaymentCardInput,
  PaymentCardRecord,
  updatePaymentCard,
  UpdatePaymentCardInput,
} from '@/features/payment-cards/api/payment-cards.api';
import PaymentCardForm from '@/features/payment-cards/components/PaymentCardForm';
import SavedPaymentCard from '@/features/payment-cards/components/SavedPaymentCard';

export default function SavedCardsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentCardRecord | null>(null);

  const { data: cards = [] } = useQuery({
    queryKey: ['payment-cards'],
    queryFn: fetchPaymentCards,
  });

  const createMutation = useMutation({
    mutationFn: createPaymentCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-cards'] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentCardInput }) =>
      updatePaymentCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-cards'] });
      setEditingCard(null);
      setIsFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-cards'] });
    },
  });

  const selectMutation = useMutation({
    mutationFn: selectPaymentCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-cards'] });
    },
  });

  const handleSubmit = (data: CreatePaymentCardInput | UpdatePaymentCardInput) => {
    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, data: data as UpdatePaymentCardInput });
      return;
    }

    createMutation.mutate(data as CreatePaymentCardInput);
  };

  const handleDelete = (cardId: string) => {
    if (confirm('Bu kartı silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(cardId);
    }
  };

  if (isFormOpen) {
    return (
      <PaymentCardForm
        initialData={editingCard}
        onSubmit={handleSubmit}
        onClose={() => {
          setEditingCard(null);
          setIsFormOpen(false);
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
        errorMessage={createMutation.error?.message || updateMutation.error?.message}
      />
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Kayıtlı Kartlarım</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Ödeme kartlarınızı buradan güvenli şekilde yönetebilirsiniz.
        </p>
      </header>

      {cards.length > 0 ? (
        <h2 className="mb-4 text-xl font-bold text-slate-900">Kayıtlı Kartlar</h2>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <SavedPaymentCard
            key={card.id}
            card={card}
            onSelect={() => selectMutation.mutate(card.id)}
            onEdit={() => {
              setEditingCard(card);
              setIsFormOpen(true);
            }}
            onDelete={() => handleDelete(card.id)}
            isLoading={selectMutation.isPending || deleteMutation.isPending}
          />
        ))}

        <button
          onClick={() => {
            setEditingCard(null);
            setIsFormOpen(true);
          }}
          className="group flex h-[218px] self-start flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white transition hover:border-blue-300 hover:bg-slate-50"
        >
          <span className="mb-3 text-5xl text-slate-300 transition group-hover:text-blue-400">
            +
          </span>
          <p className="text-base font-semibold text-slate-600 group-hover:text-slate-800">
            Kart Ekleyin
          </p>
        </button>
      </div>
    </div>
  );
}

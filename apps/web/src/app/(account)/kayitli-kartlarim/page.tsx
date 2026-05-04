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

  const cardsQuery = useQuery<PaymentCardRecord[], Error>({
    queryKey: ['payment-cards'],
    queryFn: fetchPaymentCards,
    retry: false,
    refetchOnMount: 'always',
  });
  const cards = cardsQuery.data ?? [];

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
      {cardsQuery.isLoading ? (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          Kayıtlı kartlarınız yükleniyor...
        </div>
      ) : null}

      {cardsQuery.isError ? (
        <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">Kartlar yüklenemedi.</p>
          <p className="mt-1 text-red-600">{cardsQuery.error.message}</p>
          <button
            type="button"
            onClick={() => void cardsQuery.refetch()}
            className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-medium text-red-700 shadow-sm ring-1 ring-red-100"
          >
            Tekrar Dene
          </button>
        </div>
      ) : null}

      {cards.length > 0 ? (
        <h2 className="mb-3 text-base font-medium text-slate-900 sm:mb-4 sm:text-xl">Kayıtlı Kartlar</h2>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
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
          className="group flex h-[132px] self-start flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white transition hover:border-blue-300 hover:bg-slate-50 sm:h-[218px]"
        >
          <span className="mb-1 text-3xl text-slate-300 transition group-hover:text-blue-400 sm:mb-3 sm:text-5xl">
            +
          </span>
          <p className="text-center text-xs font-medium text-slate-600 group-hover:text-slate-800 sm:text-base">
            Kart Ekleyin
          </p>
        </button>
      </div>

      {!cardsQuery.isLoading && !cardsQuery.isError && cards.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500 sm:text-sm">
          Henüz kayıtlı kartınız yok. Eklediğiniz kartlar burada kart olarak görünecek.
        </p>
      ) : null}
    </div>
  );
}

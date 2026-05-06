'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { hasAccessToken } from '@/lib/auth-token';
import {
  createConversation,
  createLogisticsOffer,
  fetchOpenLogisticsRequests,
  type LogisticsRequest,
} from '@/features/chat/api/chat.api';
import { LogisticsLoadCard } from '../../components/LogisticsLoadCard';

function formatRequestNo(id: string): string {
  return `TR-${id.slice(-6).toUpperCase()}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function AcikTaleplerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-near');
  const [selectedRequest, setSelectedRequest] = useState<LogisticsRequest | null>(null);
  const [price, setPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('2');
  const [isInsured, setIsInsured] = useState(true);
  const [notes, setNotes] = useState('');

  const requestsQuery = useQuery({
    queryKey: ['logistics-open-requests'],
    queryFn: fetchOpenLogisticsRequests,
  });

  const startConversationMutation = useMutation({
    mutationFn: (request: LogisticsRequest) => createConversation({ logisticsRequestId: request.id }),
    onSuccess: (conversation) => {
      router.push(`/lojistik/mesajlar/${conversation.id}`);
    },
  });

  const offerMutation = useMutation({
    mutationFn: () => {
      if (!selectedRequest) {
        throw new Error('Lojistik talebi seçilmedi.');
      }

      return createLogisticsOffer(selectedRequest.id, {
        price: Number(price),
        currency: 'TRY',
        estimatedDays: Number(estimatedDays),
        isInsured,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setSelectedRequest(null);
      setPrice('');
      setEstimatedDays('2');
      setNotes('');
      await queryClient.invalidateQueries({ queryKey: ['logistics-open-requests'] });
    },
  });

  const requests = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('tr-TR');
    const items = requestsQuery.data ?? [];
    const filtered = term
      ? items.filter((request) =>
          [
            request.fromCity,
            request.toCity,
            request.productName,
            request.requesterCompanyName,
            formatRequestNo(request.id),
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase('tr-TR')
            .includes(term),
        )
      : items;

    return [...filtered].sort((left, right) => {
      const diff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      return sortBy === 'date-far' ? -diff : diff;
    });
  }, [requestsQuery.data, searchTerm, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-symbols-outlined text-sm text-slate-400">search</span>
            </div>
            <input
              type="text"
              placeholder="Rota veya İlan No Ara..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm leading-5 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtrele
          </button>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="date-near">Tarihe Göre (Yakın)</option>
            <option value="date-far">Tarihe Göre (Uzak)</option>
          </select>
        </div>
      </div>

      {requestsQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500">
          Açık yük ilanları yükleniyor...
        </div>
      ) : null}

      {requestsQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
          Açık yük ilanları alınamadı. Lojistik partner hesabıyla giriş yaptığınızdan emin olun.
        </div>
      ) : null}

      <div className="space-y-4">
        {requests.map((request) => {
          const myOffer = request.offers.find((offer) => offer.status !== 'REJECTED');

          return (
            <LogisticsLoadCard
              key={request.id}
              loadType="FTL"
              loadTypeLabel={request.productName ? `Yük: ${request.productName}` : 'ToptanNext Yük Talebi'}
              adNumber={formatRequestNo(request.id)}
              pickupCity={request.fromCity.toLocaleUpperCase('tr-TR')}
              pickupDistrict={request.requesterCompanyName ?? request.requesterName ?? 'Satıcı'}
              deliveryCity={request.toCity.toLocaleUpperCase('tr-TR')}
              deliveryDistrict="Alıcı teslimatı"
              pallets={request.palletCount ?? 1}
              weight={request.itemCount ?? 0}
              volume={request.itemCount ? Math.max(1, Math.ceil(request.itemCount / 40)) : 1}
              specialTags={request.status === 'COLLECTING'
                ? [{ label: `${request.offers.length} Teklif Var`, icon: 'local_offer', color: 'default' }]
                : []}
              loadDate={formatDate(request.createdAt)}
              timeLeft="Aktif"
              timeLeftColor="amber"
              loadTypeColor="blue"
              offerButtonLabel={myOffer ? 'Teklifi Güncelle' : 'Teklif Ver'}
              onOffer={() => {
                setSelectedRequest(request);
                setPrice(myOffer ? String(myOffer.price) : '');
                setEstimatedDays(myOffer ? String(myOffer.estimatedDays) : '2');
                setIsInsured(myOffer?.isInsured ?? true);
                setNotes(myOffer?.notes ?? '');
              }}
              onChat={() => {
                if (!hasAccessToken()) {
                  router.push(`/login?next=${encodeURIComponent('/lojistik/acik-talepler')}`);
                  return;
                }

                startConversationMutation.mutate(request);
              }}
            />
          );
        })}

        {!requestsQuery.isLoading && requests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
            Şu anda açık yük ilanı bulunmuyor.
          </div>
        ) : null}
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
          <form
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault();
              offerMutation.mutate();
            }}
          >
            <h2 className="text-lg font-bold text-slate-900">Yük İlanına Teklif Ver</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedRequest.fromCity} → {selectedRequest.toCity} / #{formatRequestNo(selectedRequest.id)}
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Teklif Tutarı</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                  min={1}
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="24500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Tahmini Gün</span>
                <input
                  value={estimatedDays}
                  onChange={(event) => setEstimatedDays(event.target.value)}
                  required
                  min={1}
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  checked={isInsured}
                  onChange={(event) => setIsInsured(event.target.checked)}
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                />
                Sigortalı taşıma
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Not</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            {offerMutation.isError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
                {offerMutation.error instanceof Error ? offerMutation.error.message : 'Teklif gönderilemedi.'}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => setSelectedRequest(null)}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={offerMutation.isPending}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                {offerMutation.isPending ? 'Gönderiliyor...' : 'Teklifi Gönder'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  selectAddress,
  AddressRecord,
  CreateAddressInput,
} from '@/features/addresses/api/addresses.api';
import AddressCard from '@/features/addresses/components/AddressCard';
import AddressForm from '@/features/addresses/components/AddressForm';

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressRecord | null>(null);

  const addressesQuery = useQuery<AddressRecord[], Error>({
    queryKey: ['addresses'],
    queryFn: fetchUserAddresses,
    retry: false,
    refetchOnMount: 'always',
  });
  const addresses = addressesQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAddressInput> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditingAddress(null);
      setIsFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const selectMutation = useMutation({
    mutationFn: selectAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const handleSubmit = async (data: CreateAddressInput) => {
    if (editingAddress) {
      await updateMutation.mutateAsync({ id: editingAddress.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (address: AddressRecord) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDelete = (addressId: string) => {
    if (confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(addressId);
    }
  };

  const handleSelect = (addressId: string) => {
    selectMutation.mutate(addressId);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  if (isFormOpen) {
    return (
      <AddressForm
        initialData={editingAddress}
        onSubmit={handleSubmit}
        onClose={handleCloseForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    );
  }

  return (
    <div>
      <header className="mb-4 sm:mb-8">
        <h1 className="text-lg font-medium text-on-surface sm:text-2xl">Adres Bilgilerim</h1>
        <p className="mt-1 text-xs text-on-surface-variant sm:mt-2 sm:text-sm">
          Teslimat ve fatura adreslerinizi buradan yönetebilirsiniz.
        </p>
      </header>

      {addressesQuery.isLoading ? (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          Kayıtlı adresleriniz yükleniyor...
        </div>
      ) : null}

      {addressesQuery.isError ? (
        <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">Adresler yüklenemedi.</p>
          <p className="mt-1 text-red-600">{addressesQuery.error.message}</p>
          <button
            type="button"
            onClick={() => void addressesQuery.refetch()}
            className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-medium text-red-700 shadow-sm ring-1 ring-red-100"
          >
            Tekrar Dene
          </button>
        </div>
      ) : null}

      {addresses.length > 0 ? (
        <h2 className="mb-3 text-base font-medium text-slate-900 sm:mb-4 sm:text-xl">Teslimat Adresi</h2>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            isSelected={address.isSelected}
            onSelect={() => handleSelect(address.id)}
            onEdit={() => handleEdit(address)}
            onDelete={() => handleDelete(address.id)}
            isLoading={selectMutation.isPending || deleteMutation.isPending}
          />
        ))}

        <button
          onClick={() => setIsFormOpen(true)}
          className="group flex h-[132px] self-start flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white transition hover:border-blue-300 hover:bg-slate-50 sm:h-[218px]"
        >
          <span className="mb-1 text-3xl text-slate-300 transition group-hover:text-blue-400 sm:mb-3 sm:text-5xl">
            +
          </span>
          <p className="text-center text-xs font-medium text-slate-600 group-hover:text-slate-800 sm:text-base">
            Adres Ekleyin
          </p>
        </button>
      </div>

      {!addressesQuery.isLoading && !addressesQuery.isError && addresses.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500 sm:text-sm">
          Henüz kayıtlı adresiniz yok. Eklediğiniz adresler burada kart olarak görünecek.
        </p>
      ) : null}
    </div>
  );
}

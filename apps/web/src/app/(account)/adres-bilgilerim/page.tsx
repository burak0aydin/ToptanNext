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

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchUserAddresses,
  });

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
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Adres Bilgilerim</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Teslimat ve fatura adreslerinizi buradan yönetebilirsiniz.
        </p>
      </header>

      {addresses.length > 0 ? (
        <h2 className="mb-4 text-xl font-bold text-slate-900">Teslimat Adresi</h2>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          className="group flex h-[218px] self-start flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white transition hover:border-blue-300 hover:bg-slate-50"
        >
          <span className="mb-3 text-5xl text-slate-300 transition group-hover:text-blue-400">
            +
          </span>
          <p className="text-base font-semibold text-slate-600 group-hover:text-slate-800">
            Adres Ekleyin
          </p>
        </button>
      </div>
    </div>
  );
}

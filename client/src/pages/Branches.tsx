import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeletons';
import { Plus, X, Building2, Phone, MapPin } from 'lucide-react';

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  isActive: boolean;
}

export const Branches: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: branches, isLoading, isError } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await axiosClient.get('/branches');
      return response.data;
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormValues) => {
      const response = await axiosClient.post('/branches', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      showToast('Branch created successfully', 'success');
      setIsFormOpen(false);
      reset();
    },
    onError: () => {
      showToast('Failed to create branch', 'error');
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
  });

  const onSubmit = (data: BranchFormValues) => {
    createBranchMutation.mutate(data);
  };

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Branches</h1>
          <p className="page-subtitle">Manage company logistics branches</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary btn-md">
          <Plus size={16} /> Add Branch
        </button>
      </div>

      {isError && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm">
          Failed to load branches. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches?.map((branch) => (
          <div key={branch.id} className="card p-6 relative overflow-hidden group hover:border-primary transition-all duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-primary-hover/30" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-text-primary text-base leading-tight">{branch.name}</h3>
                <div className="flex items-start gap-1.5 text-xs text-text-muted">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span>{branch.address}, {branch.city}, {branch.state}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Phone size={14} className="shrink-0" />
                  <span>{branch.contactNumber}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md w-full p-6 relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-text-primary mb-4">Create New Branch</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Branch Name</label>
                <input {...register('name')} className="input-base" placeholder="e.g. Vadodara Main" />
                {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Address</label>
                <input {...register('address')} className="input-base" placeholder="e.g. 101 Logistics Center" />
                {errors.address && <p className="text-xs text-danger mt-1">{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">City</label>
                  <input {...register('city')} className="input-base" placeholder="Vadodara" />
                  {errors.city && <p className="text-xs text-danger mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">State</label>
                  <input {...register('state')} className="input-base" placeholder="Gujarat" />
                  {errors.state && <p className="text-xs text-danger mt-1">{errors.state.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Contact Number</label>
                <input {...register('contactNumber')} className="input-base" placeholder="+91 99999 88888" />
                {errors.contactNumber && <p className="text-xs text-danger mt-1">{errors.contactNumber.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" disabled={createBranchMutation.isPending} className="btn btn-primary btn-sm">
                  {createBranchMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;

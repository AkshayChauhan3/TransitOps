import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';
import { Plus, X, Mail, Trash2 } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'BRANCH_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  branchId: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  branchId: number | null;
  branch?: { name: string } | null;
  createdAt: string;
}

interface Branch {
  id: number;
  name: string;
}

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const { data: users, isLoading, isError } = useQuery<ApiUser[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axiosClient.get('/users');
      return response.data;
    },
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await axiosClient.get('/branches');
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosClient.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User created successfully', 'success');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error?.message || 'Failed to create user';
      showToast(msg, 'error');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User deleted successfully', 'success');
      setDeleteConfirmId(null);
    },
    onError: () => {
      showToast('Failed to delete user', 'error');
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: isSuperAdmin ? 'BRANCH_ADMIN' : 'FLEET_MANAGER',
      branchId: '',
    }
  });

  const onSubmit = (data: UserFormValues) => {
    const payload = {
      ...data,
      branchId: data.branchId ? Number(data.branchId) : undefined
    };
    createUserMutation.mutate(payload);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'badge badge-danger';
      case 'BRANCH_ADMIN': return 'badge badge-accent';
      case 'FLEET_MANAGER': return 'badge badge-info';
      case 'DISPATCHER': return 'badge badge-success';
      case 'SAFETY_OFFICER': return 'badge badge-warning';
      case 'FINANCIAL_ANALYST': return 'badge badge-neutral';
      default: return 'badge badge-neutral';
    }
  };

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Add and configure access credentials for branch users</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary btn-md">
          <Plus size={16} /> Add User
        </button>
      </div>

      {isError && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm">
          Failed to load users. Please refresh the page.
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                        {u.name[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-text-primary">{u.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Mail size={14} className="text-text-muted" />
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={getRoleBadge(u.role)}>{u.role.replace(/_/g, ' ')}</span>
                  </td>
                  <td>{u.branch?.name || 'Central / Software Provider'}</td>
                  <td>
                    {currentUser?.id !== u.id && (
                      <div className="flex items-center gap-2">
                        {deleteConfirmId === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => deleteUserMutation.mutate(u.id)} className="btn btn-danger btn-sm py-1">Confirm</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="btn btn-ghost btn-sm py-1">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(u.id)} className="text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-all" title="Delete User">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md w-full p-6 relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-text-primary mb-4">Add User Credentials</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Full Name</label>
                <input {...register('name')} className="input-base" placeholder="John Doe" />
                {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Email Address</label>
                <input {...register('email')} className="input-base" placeholder="johndoe@transitops.com" />
                {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Password</label>
                <input {...register('password')} type="password" className="input-base" placeholder="••••••••" />
                {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">System Role</label>
                  <select {...register('role')} className="filter-select w-full bg-background-secondary border-border p-2.5 rounded-lg text-sm text-text-primary">
                    {isSuperAdmin ? (
                      <>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="BRANCH_ADMIN">Branch Admin</option>
                      </>
                    ) : (
                      <>
                        <option value="FLEET_MANAGER">Fleet Manager</option>
                        <option value="DISPATCHER">Trip Dispatcher</option>
                        <option value="SAFETY_OFFICER">Safety Officer</option>
                        <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                      </>
                    )}
                  </select>
                </div>

                {isSuperAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Assigned Branch</label>
                    <select {...register('branchId')} className="filter-select w-full bg-background-secondary border-border p-2.5 rounded-lg text-sm text-text-primary">
                      <option value="">None (Super Admin Hub)</option>
                      {branches?.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" disabled={createUserMutation.isPending} className="btn btn-primary btn-sm">
                  {createUserMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

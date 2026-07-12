import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosClient from '../api/axiosClient';
import type { Driver, DriverStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeletons';
import { Plus, Filter, Edit2, Trash2, X, Check, Info, Calendar, AlertTriangle } from 'lucide-react';

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiry: z.string().min(1, 'License expiry date is required'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']),
  dispatchable: z.boolean(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

const getStatusBadge = (status: DriverStatus): string => {
  switch (status) {
    case 'AVAILABLE':  return 'badge badge-success';
    case 'ON_TRIP':    return 'badge badge-info';
    case 'OFF_DUTY':   return 'badge badge-neutral';
    case 'SUSPENDED':  return 'badge badge-danger';
    default:           return 'badge badge-neutral';
  }
};

export const Drivers: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'FLEET_MANAGER';
  const hasWriteAccess = isManager;

  const [filterStatus, setFilterStatus] = useState('');
  const [filterDispatchable, setFilterDispatchable] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: drivers, isLoading, isError } = useQuery<Driver[]>({
    queryKey: ['drivers', filterStatus, filterDispatchable],
    queryFn: async () => {
      const response = await axiosClient.get('/drivers', {
        params: {
          status: filterStatus || undefined,
          dispatchable: filterDispatchable === '' ? undefined : filterDispatchable === 'true',
        },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (d: DriverFormValues) => (await axiosClient.post('/drivers', d)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); showToast('Driver registered!', 'success'); setIsFormOpen(false); },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to register driver', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async (d: DriverFormValues) => {
      if (!selectedDriver) return;
      return (await axiosClient.put(`/drivers/${selectedDriver.id}`, d)).data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); showToast('Driver updated!', 'success'); setIsFormOpen(false); setSelectedDriver(null); },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to update driver', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await axiosClient.delete(`/drivers/${id}`)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); showToast('Driver deleted', 'success'); setDeleteConfirmId(null); },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to delete driver', 'error'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: { name: '', email: '', licenseNumber: '', licenseExpiry: '', status: 'AVAILABLE', dispatchable: true },
  });

  const handleOpenForm = (driver: Driver | null) => {
    if (driver) {
      setSelectedDriver(driver);
      reset({ name: driver.name, email: driver.email, licenseNumber: driver.licenseNumber, licenseExpiry: driver.licenseExpiry, status: driver.status, dispatchable: driver.dispatchable });
    } else {
      setSelectedDriver(null);
      reset({ name: '', email: '', licenseNumber: '', licenseExpiry: '', status: 'AVAILABLE', dispatchable: true });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: DriverFormValues) => {
    selectedDriver ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  const checkLicenseStatus = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { expired: diffDays <= 0, expiringSoon: diffDays > 0 && diffDays <= 30, daysLeft: diffDays };
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', borderRadius: 9,
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
    backgroundColor: 'var(--background)', color: 'var(--text-primary)',
    padding: '9px 12px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: 'var(--text-muted)', marginBottom: 6,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      <div className="page-header reveal reveal-1">
        <div>
          <h1 className="page-title">Crew Directory</h1>
          <p className="page-subtitle">Driver profiles, license status, and dispatch eligibility</p>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="btn btn-primary btn-md"
          style={{ flexShrink: 0 }}
        >
          <Plus size={14} strokeWidth={2} />
          Add Driver
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar reveal reveal-2">
        <Filter size={13} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filter</span>
        <div style={{ width: 1, height: 16, backgroundColor: 'var(--border)', margin: '0 2px' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select value={filterDispatchable} onChange={e => setFilterDispatchable(e.target.value)} className="filter-select">
          <option value="">All Dispatch Status</option>
          <option value="true">Dispatchable</option>
          <option value="false">Blocked</option>
        </select>
        {(filterStatus || filterDispatchable) && (
          <button onClick={() => { setFilterStatus(''); setFilterDispatchable(''); }} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--color-accent-h)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to load drivers.
        </div>
      ) : drivers?.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Info size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>No drivers match the current filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {drivers?.map((driver, i) => {
            const license = checkLicenseStatus(driver.licenseExpiry);
            return (
              <div
                key={driver.id}
                className={`card card-hover reveal reveal-${Math.min(i + 3, 8)}`}
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  borderColor: license.expired
                    ? 'rgba(239,68,68,0.25)'
                    : license.expiringSoon
                    ? 'rgba(251,191,36,0.25)'
                    : undefined,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{driver.name}</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{driver.email}</p>
                  </div>
                  <span className={getStatusBadge(driver.status)}>{driver.status.replace('_', ' ')}</span>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>License No.</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{driver.licenseNumber}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Dispatch</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: driver.dispatchable ? '#34d399' : '#f87171' }}>
                      {driver.dispatchable ? <><Check size={12} strokeWidth={2.5} /> Ready</> : <><X size={12} strokeWidth={2.5} /> Blocked</>}
                    </p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>License Expiry</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      <Calendar size={12} strokeWidth={1.75} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: license.expired ? '#f87171' : license.expiringSoon ? '#fbbf24' : 'var(--text-secondary)',
                      }}>
                        {new Date(driver.licenseExpiry).toLocaleDateString()}
                      </span>
                      {license.expired && <span className="badge badge-danger">Expired</span>}
                      {license.expiringSoon && <span className="badge badge-warning">{license.daysLeft}d left</span>}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                {hasWriteAccess && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleOpenForm(driver)}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Edit2 size={12} strokeWidth={2} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(driver.id)}
                      className="btn btn-danger btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Trash2 size={12} strokeWidth={2} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: '100%', maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedDriver ? 'Edit Driver Profile' : 'Register Driver'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="btn btn-ghost btn-icon"><X size={16} strokeWidth={1.75} /></button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" {...register('name')} style={inputStyle(!!errors.name)} placeholder="e.g. Karan Patel" />
                  {errors.name && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.name.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" {...register('email')} style={inputStyle(!!errors.email)} placeholder="e.g. karan@example.com" />
                  {errors.email && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.email.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>License No.</label>
                  <input type="text" {...register('licenseNumber')} style={inputStyle(!!errors.licenseNumber)} placeholder="e.g. DL-123456" />
                  {errors.licenseNumber && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.licenseNumber.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>License Expiry</label>
                  <input type="date" {...register('licenseExpiry')} style={inputStyle(!!errors.licenseExpiry)} />
                  {errors.licenseExpiry && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.licenseExpiry.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select {...register('status')} style={inputStyle()}>
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_TRIP">On Trip</option>
                    <option value="OFF_DUTY">Off Duty</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                <input type="checkbox" id="dispatchable" {...register('dispatchable')} />
                Available for trip dispatch scheduling
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-ghost btn-md">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn btn-primary btn-md">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: '100%', maxWidth: 380, padding: '28px 28px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={32} strokeWidth={1.5} style={{ color: '#f87171', margin: '0 auto 14px' }} />
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Remove Driver?</h4>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This will permanently delete the driver profile and disconnect all route history.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-ghost btn-md">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirmId)} className="btn btn-md" style={{ backgroundColor: '#ef4444', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Drivers;

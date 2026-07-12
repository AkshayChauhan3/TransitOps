import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosClient from '../api/axiosClient';
import type { Vehicle, VehicleStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeletons';
import { Plus, Filter, Edit2, Trash2, X, Info, AlertTriangle } from 'lucide-react';

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Vehicle name is required'),
  model: z.string().min(1, 'Model is required'),
  type: z.string().min(1, 'Type is required'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']),
  maxLoadCapacity: z.number().positive('Capacity must be positive'),
  odometer: z.number().nonnegative('Odometer cannot be negative'),
  acquisitionCost: z.number().nonnegative('Cost cannot be negative'),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const getStatusBadge = (status: VehicleStatus) => {
  switch (status) {
    case 'AVAILABLE': return 'badge badge-success';
    case 'ON_TRIP':   return 'badge badge-info';
    case 'IN_SHOP':   return 'badge badge-warning';
    case 'RETIRED':   return 'badge badge-danger';
    default:          return 'badge badge-neutral';
  }
};

const formatType = (type: string) => type.replace(/_/g, ' ');

export const Vehicles: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'FLEET_MANAGER' || user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_ADMIN';
  const hasWriteAccess = isManager;

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: vehicles, isLoading, isError } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', filterType, filterStatus],
    queryFn: async () => {
      const response = await axiosClient.get('/vehicles', {
        params: { type: filterType || undefined, status: filterStatus || undefined },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (v: VehicleFormValues) => {
      return (await axiosClient.post('/vehicles', {
        ...v,
        branchId: user?.branchId || 1, // Fallback to 1 if superadmin/none
      })).data;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); 
      showToast('Vehicle added successfully!', 'success'); 
      setIsFormOpen(false); 
    },
    onError: (err: any) => showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to add vehicle', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async (v: VehicleFormValues) => {
      if (!selectedVehicle) return;
      return (await axiosClient.put(`/vehicles/${selectedVehicle.id}`, {
        ...v,
        branchId: selectedVehicle.branchId,
      })).data;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); 
      showToast('Vehicle updated!', 'success'); 
      setIsFormOpen(false); 
      setSelectedVehicle(null); 
    },
    onError: (err: any) => showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update vehicle', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await axiosClient.delete(`/vehicles/${id}`)).data,
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); 
      showToast('Vehicle deleted', 'success'); 
      setDeleteConfirmId(null); 
    },
    onError: (err: any) => showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete vehicle', 'error'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { 
      registrationNumber: '', 
      name: '',
      model: '', 
      type: 'SEMI_TRUCK', 
      status: 'AVAILABLE', 
      maxLoadCapacity: 5000, 
      odometer: 0,
      acquisitionCost: 0 
    },
  });

  const handleOpenForm = (vehicle: Vehicle | null) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      reset({ 
        registrationNumber: vehicle.registrationNumber, 
        name: vehicle.name,
        model: vehicle.model, 
        type: vehicle.type, 
        status: vehicle.status, 
        maxLoadCapacity: vehicle.maxLoadCapacity,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost
      });
    } else {
      setSelectedVehicle(null);
      reset({ 
        registrationNumber: '', 
        name: '',
        model: '', 
        type: 'SEMI_TRUCK', 
        status: 'AVAILABLE', 
        maxLoadCapacity: 5000,
        odometer: 0,
        acquisitionCost: 0
      });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: VehicleFormValues) => {
    selectedVehicle ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    borderRadius: 9,
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
    backgroundColor: 'var(--background)',
    color: 'var(--text-primary)',
    padding: '9px 12px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--text-muted)',
    marginBottom: 6,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      <div className="page-header reveal reveal-1">
        <div>
          <h1 className="page-title">Fleet Units</h1>
          <p className="page-subtitle">Vehicle classifications, status, and payload limits</p>
        </div>
        {hasWriteAccess && (
          <button
            onClick={() => handleOpenForm(null)}
            className="btn btn-primary btn-md"
            style={{ flexShrink: 0 }}
          >
            <Plus size={14} strokeWidth={2} />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar reveal reveal-2">
        <Filter size={13} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filter</span>
        <div style={{ width: 1, height: 16, backgroundColor: 'var(--border)', margin: '0 2px' }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="filter-select">
          <option value="">All Types</option>
          <option value="SEMI_TRUCK">Semi Truck</option>
          <option value="BOX_TRUCK">Box Truck</option>
          <option value="FLATBED">Flatbed</option>
          <option value="VAN">Cargo Van</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </select>
        {(filterType || filterStatus) && (
          <button onClick={() => { setFilterType(''); setFilterStatus(''); }} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--color-interactive)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to load vehicles.
        </div>
      ) : vehicles?.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Info size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>No vehicles match the current filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {vehicles?.map((vehicle, i) => (
            <div
              key={vehicle.id}
              className={`card card-hover reveal reveal-${Math.min(i + 3, 8)}`}
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-interactive)' }}>
                    {formatType(vehicle.type)}
                  </span>
                  <h3 style={{ margin: '3px 0 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {vehicle.registrationNumber}
                  </h3>
                </div>
                <span className={getStatusBadge(vehicle.status)}>{vehicle.status.replace('_', ' ')}</span>
              </div>

              {/* Card details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Name',        value: vehicle.name },
                  { label: 'Model',       value: vehicle.model },
                  { label: 'Max Payload', value: `${vehicle.maxLoadCapacity.toLocaleString()} kg` },
                  { label: 'Odometer',    value: `${vehicle.odometer.toLocaleString()} km` },
                  { label: 'Cost',        value: `$${vehicle.acquisitionCost.toLocaleString()}` },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{item.label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Card Actions */}
              {hasWriteAccess && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleOpenForm(vehicle)}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Edit2 size={12} strokeWidth={2} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(vehicle.id)}
                    className="btn btn-danger btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Trash2 size={12} strokeWidth={2} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: '100%', maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="btn btn-ghost btn-icon"><X size={16} strokeWidth={1.75} /></button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Registration No.</label>
                  <input type="text" {...register('registrationNumber')} style={inputStyle(!!errors.registrationNumber)} placeholder="e.g. MH-12-GQ-1234" />
                  {errors.registrationNumber && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.registrationNumber.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input type="text" {...register('name')} style={inputStyle(!!errors.name)} placeholder="e.g. Tata Ace" />
                  {errors.name && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.name.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Model</label>
                  <input type="text" {...register('model')} style={inputStyle(!!errors.model)} placeholder="e.g. 2023" />
                  {errors.model && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.model.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Vehicle Type</label>
                  <select {...register('type')} style={inputStyle()}>
                    <option value="SEMI_TRUCK">Semi Truck</option>
                    <option value="BOX_TRUCK">Box Truck</option>
                    <option value="FLATBED">Flatbed</option>
                    <option value="VAN">Cargo Van</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select {...register('status')} style={inputStyle()}>
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_TRIP">On Trip</option>
                    <option value="IN_SHOP">In Shop</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Max Capacity (kg)</label>
                  <input type="number" {...register('maxLoadCapacity', { valueAsNumber: true })} style={inputStyle(!!errors.maxLoadCapacity)} />
                  {errors.maxLoadCapacity && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.maxLoadCapacity.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Odometer (km)</label>
                  <input type="number" {...register('odometer', { valueAsNumber: true })} style={inputStyle(!!errors.odometer)} />
                  {errors.odometer && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.odometer.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Acquisition Cost ($)</label>
                  <input type="number" {...register('acquisitionCost', { valueAsNumber: true })} style={inputStyle(!!errors.acquisitionCost)} />
                  {errors.acquisitionCost && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.acquisitionCost.message}</p>}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-ghost btn-md">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn btn-primary btn-md">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save Unit'}
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
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Delete Vehicle?</h4>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This action is permanent and cannot be undone.
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
export default Vehicles;

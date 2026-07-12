import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosClient from '../api/axiosClient';
import type { Trip, TripStatus, Vehicle, Driver } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeletons';
import { Plus, MapPin, Weight, Navigation, Info, Clock, Filter, CheckCircle, XCircle, Play, X } from 'lucide-react';

const tripSchema = z.object({
  source: z.string().min(2, 'Source is required'),
  destination: z.string().min(2, 'Destination is required'),
  vehicleId: z.coerce.number().int().positive('Vehicle is required'),
  driverId: z.coerce.number().int().positive('Driver is required'),
  cargoWeight: z.number().positive('Cargo weight must be positive'),
  plannedDistance: z.number().positive('Planned distance must be positive'),
});

const completionSchema = z.object({
  finalOdometer: z.number().positive('Odometer reading must be positive'),
  actualDistance: z.number().positive('Actual distance must be positive'),
  revenue: z.number().nonnegative('Revenue cannot be negative'),
});

type TripFormValues = z.infer<typeof tripSchema>;
type CompletionFormValues = z.infer<typeof completionSchema>;

const getTripStatusBadge = (status: TripStatus): string => {
  switch (status) {
    case 'DRAFT':      return 'badge badge-neutral';
    case 'DISPATCHED': return 'badge badge-info';
    case 'COMPLETED':  return 'badge badge-success';
    case 'CANCELLED':  return 'badge badge-danger';
    default:           return 'badge badge-neutral';
  }
};

export const Trips: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTripDetails, setActiveTripDetails] = useState<Trip | null>(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const isFleetManager = user?.role === 'FLEET_MANAGER' || user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_ADMIN';
  const isDispatcher = user?.role === 'DISPATCHER';
  const hasLifecycleAccess = isFleetManager || isDispatcher;

  const { data: trips, isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['trips', filterStatus],
    queryFn: async () => (await axiosClient.get('/trips', { params: { status: filterStatus || undefined } })).data,
  });

  const { data: availableVehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', 'available'],
    queryFn: async () => (await axiosClient.get('/vehicles', { params: { status: 'AVAILABLE' } })).data,
    enabled: isCreateOpen,
  });

  const { data: availableDrivers } = useQuery<Driver[]>({
    queryKey: ['drivers', 'available'],
    queryFn: async () => (await axiosClient.get('/drivers', { params: { status: 'AVAILABLE' } })).data,
    enabled: isCreateOpen,
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema) as any,
    defaultValues: { source: '', destination: '', vehicleId: 0, driverId: 0, cargoWeight: 0, plannedDistance: 0 },
  });

  const { register: registerComplete, handleSubmit: handleSubmitComplete, reset: resetComplete, formState: { errors: errorsComplete } } = useForm<CompletionFormValues>({
    resolver: zodResolver(completionSchema) as any,
    defaultValues: { finalOdometer: 0, actualDistance: 0, revenue: 0 },
  });

  const watchedVehicleId = useWatch({ control, name: 'vehicleId' });
  const watchedCargoWeight = useWatch({ control, name: 'cargoWeight' }) || 0;
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (watchedVehicleId && availableVehicles) {
      setSelectedVehicleDetails(availableVehicles.find(v => v.id === Number(watchedVehicleId)) || null);
    } else {
      setSelectedVehicleDetails(null);
    }
  }, [watchedVehicleId, availableVehicles]);

  const isOverCapacity = !!(selectedVehicleDetails && watchedCargoWeight > selectedVehicleDetails.maxLoadCapacity);

  const createTripMutation = useMutation({
    mutationFn: (data: TripFormValues) => axiosClient.post('/trips', data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['trips'] }); 
      showToast('Trip created as DRAFT', 'success'); 
      setIsCreateOpen(false); 
      reset(); 
      setBackendError(null); 
    },
    onError: (error: any) => { 
      const msg = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create trip'; 
      setBackendError(msg); 
      showToast(msg, 'error'); 
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: (trip: Trip) => axiosClient.post(`/trips/${trip.id}/dispatch`, {
      vehicleId: trip.vehicleId,
      driverId: trip.driverId
    }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['trips'] }); 
      showToast('Trip dispatched', 'success'); 
      setActiveTripDetails(null); 
    },
    onError: (error: any) => showToast(error.response?.data?.error?.message || error.response?.data?.message || 'Dispatch failed', 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: (tripId: number) => axiosClient.post(`/trips/${tripId}/cancel`),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['trips'] }); 
      showToast('Trip cancelled', 'success'); 
      setActiveTripDetails(null); 
    },
    onError: (error: any) => showToast(error.response?.data?.error?.message || error.response?.data?.message || 'Cancellation failed', 'error'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompletionFormValues }) => 
      axiosClient.post(`/trips/${id}/complete`, {
        finalOdometer: data.finalOdometer,
        actualDistance: data.actualDistance,
        revenue: data.revenue
      }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['trips'] }); 
      showToast('Trip completed!', 'success'); 
      setIsCompleteOpen(false); 
      setActiveTripDetails(null); 
      resetComplete(); 
    },
    onError: (error: any) => showToast(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to complete trip', 'error'),
  });

  const handleCreateSubmit = (data: TripFormValues) => {
    if (isOverCapacity) { showToast('Cargo weight exceeds vehicle capacity!', 'error'); return; }
    createTripMutation.mutate(data);
  };

  const handleCompleteSubmit = (data: CompletionFormValues) => {
    if (activeTripDetails) completeMutation.mutate({ id: activeTripDetails.id, data });
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

      {/* Header */}
      <div className="page-header reveal reveal-1">
        <div>
          <h1 className="page-title">Trips & Dispatches</h1>
          <p className="page-subtitle">Schedule freight movements, dispatch drivers, and track route metrics</p>
        </div>
        {isFleetManager && (
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-md" style={{ flexShrink: 0 }}>
            <Plus size={14} strokeWidth={2} />
            Create Trip
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar reveal reveal-2">
        <Filter size={13} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filter</span>
        <div style={{ width: 1, height: 16, backgroundColor: 'var(--border)', margin: '0 2px' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {filterStatus && (
          <button onClick={() => setFilterStatus('')} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--color-interactive)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Clear</button>
        )}
      </div>

      {/* Trip Cards */}
      {tripsLoading ? (
        <TableSkeleton rows={4} />
      ) : trips?.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Info size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>No trips scheduled yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {trips?.map((trip, i) => (
            <div
              key={trip.id}
              onClick={() => setActiveTripDetails(trip)}
              className={`card card-hover reveal reveal-${Math.min(i + 3, 8)}`}
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    #{trip.id}
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>{trip.source}</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>→</span>
                    <span>{trip.destination}</span>
                  </h3>
                </div>
                <span className={getTripStatusBadge(trip.status)} style={{ flexShrink: 0 }}>{trip.status}</span>
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Cargo</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{trip.cargoWeight.toLocaleString()} kg</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Distance</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{trip.plannedDistance.toLocaleString()} km</p>
                </div>
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-interactive)', fontSize: 11, fontWeight: 600, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                <span>View Details & Actions</span>
                <Clock size={12} strokeWidth={1.75} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Trip Modal ── */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: '100%', maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Create Trip Plan</h3>
              <button onClick={() => { setIsCreateOpen(false); setBackendError(null); }} className="btn btn-ghost btn-icon"><X size={16} strokeWidth={1.75} /></button>
            </div>

            <form onSubmit={handleSubmit(data => handleCreateSubmit(data as TripFormValues))} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {backendError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, fontSize: 12, color: '#f87171' }}>
                  <XCircle size={14} strokeWidth={2} />
                  {backendError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Source</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={13} strokeWidth={1.75} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input type="text" {...register('source')} style={{ ...inputStyle(!!errors.source), paddingLeft: 30 }} placeholder="Origin city" />
                  </div>
                  {errors.source && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.source.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Destination</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={13} strokeWidth={1.75} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input type="text" {...register('destination')} style={{ ...inputStyle(!!errors.destination), paddingLeft: 30 }} placeholder="Destination city" />
                  </div>
                  {errors.destination && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.destination.message}</p>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Assign Vehicle</label>
                  <select {...register('vehicleId')} style={inputStyle(!!errors.vehicleId)}>
                    <option value="">Select available vehicle…</option>
                    {availableVehicles?.map(v => (
                      <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model}) — Max: {v.maxLoadCapacity.toLocaleString()} kg</option>
                    ))}
                  </select>
                  {errors.vehicleId && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.vehicleId.message}</p>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Assign Driver</label>
                  <select {...register('driverId')} style={inputStyle(!!errors.driverId)}>
                    <option value="">Select available driver…</option>
                    {availableDrivers?.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
                    ))}
                  </select>
                  {errors.driverId && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.driverId.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Cargo Weight (kg)</label>
                  <input type="number" {...register('cargoWeight', { valueAsNumber: true })} style={inputStyle(!!errors.cargoWeight || isOverCapacity)} />
                  {selectedVehicleDetails && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: isOverCapacity ? '#f87171' : '#34d399' }}>
                      Max: {selectedVehicleDetails.maxLoadCapacity.toLocaleString()} kg — {isOverCapacity ? 'Exceeded!' : 'Safe'}
                    </p>
                  )}
                  {errors.cargoWeight && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.cargoWeight.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Planned Distance (km)</label>
                  <input type="number" {...register('plannedDistance', { valueAsNumber: true })} style={inputStyle(!!errors.plannedDistance)} />
                  {errors.plannedDistance && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.plannedDistance.message}</p>}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => { setIsCreateOpen(false); setBackendError(null); }} className="btn btn-ghost btn-md">Cancel</button>
                <button type="submit" disabled={createTripMutation.isPending || isOverCapacity} className="btn btn-primary btn-md" style={{ opacity: isOverCapacity ? 0.5 : 1 }}>
                  {createTripMutation.isPending ? 'Creating…' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Trip Details Modal ── */}
      {activeTripDetails && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Trip Details</h3>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: {activeTripDetails.id}</p>
              </div>
              <button onClick={() => setActiveTripDetails(null)} className="btn btn-ghost btn-icon"><X size={16} strokeWidth={1.75} /></button>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Status row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Current Status</span>
                <span className={getTripStatusBadge(activeTripDetails.status)}>{activeTripDetails.status}</span>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Origin', value: activeTripDetails.source, icon: <MapPin size={13} strokeWidth={1.75} style={{ color: 'var(--color-interactive)' }} /> },
                  { label: 'Destination', value: activeTripDetails.destination, icon: <MapPin size={13} strokeWidth={1.75} style={{ color: 'var(--color-interactive)' }} /> },
                  { label: 'Cargo Weight', value: `${activeTripDetails.cargoWeight.toLocaleString()} kg`, icon: <Weight size={13} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} /> },
                  { label: 'Planned Distance', value: `${activeTripDetails.plannedDistance.toLocaleString()} km`, icon: <Navigation size={13} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} /> },
                ].map(item => (
                  <div key={item.label}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{item.label}</span>
                    <div style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.icon}
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion stats */}
              {activeTripDetails.status === 'COMPLETED' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px 16px', backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--border)', borderRadius: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Final Odometer</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>{activeTripDetails.finalOdometer?.toLocaleString()} km</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Actual Distance</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>{activeTripDetails.actualDistance?.toLocaleString()} km</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Revenue</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>${activeTripDetails.revenue?.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {hasLifecycleAccess && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  {(activeTripDetails.status === 'DRAFT' || activeTripDetails.status === 'DISPATCHED') && isFleetManager && (
                    <button onClick={() => cancelMutation.mutate(activeTripDetails.id)} disabled={cancelMutation.isPending} className="btn btn-danger btn-md">
                      <XCircle size={13} strokeWidth={2} />
                      Cancel Trip
                    </button>
                  )}
                  {activeTripDetails.status === 'DRAFT' && isFleetManager && (
                    <button onClick={() => dispatchMutation.mutate(activeTripDetails)} disabled={dispatchMutation.isPending} className="btn btn-primary btn-md">
                      <Play size={13} strokeWidth={2} />
                      {dispatchMutation.isPending ? 'Dispatching…' : 'Dispatch'}
                    </button>
                  )}
                  {activeTripDetails.status === 'DISPATCHED' && (
                    <button onClick={() => {
                      resetComplete({
                        finalOdometer: activeTripDetails.vehicle?.odometer || 0,
                        actualDistance: activeTripDetails.plannedDistance,
                        revenue: 1000
                      });
                      setIsCompleteOpen(true);
                    }} className="btn btn-md" style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                      <CheckCircle size={13} strokeWidth={2} />
                      Complete Trip
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Complete Trip Modal ── */}
      {isCompleteOpen && activeTripDetails && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-panel" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Log Trip Completion</h3>
              <button onClick={() => setIsCompleteOpen(false)} className="btn btn-ghost btn-icon"><X size={16} strokeWidth={1.75} /></button>
            </div>

            <form onSubmit={handleSubmitComplete(data => handleCompleteSubmit(data as CompletionFormValues))} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>End Odometer (km)</label>
                <input type="number" {...registerComplete('finalOdometer', { valueAsNumber: true })} style={inputStyle(!!errorsComplete.finalOdometer)} placeholder="e.g. 102450" />
                {errorsComplete.finalOdometer && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsComplete.finalOdometer.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Actual Distance (km)</label>
                <input type="number" {...registerComplete('actualDistance', { valueAsNumber: true })} style={inputStyle(!!errorsComplete.actualDistance)} placeholder="e.g. 150" />
                {errorsComplete.actualDistance && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsComplete.actualDistance.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Revenue ($)</label>
                <input type="number" {...registerComplete('revenue', { valueAsNumber: true })} style={inputStyle(!!errorsComplete.revenue)} placeholder="e.g. 1200" />
                {errorsComplete.revenue && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsComplete.revenue.message}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsCompleteOpen(false)} className="btn btn-ghost btn-md">Cancel</button>
                <button type="submit" disabled={completeMutation.isPending} className="btn btn-md" style={{ backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                  {completeMutation.isPending ? 'Submitting…' : 'Complete & Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Trips;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosClient from '../api/axiosClient';
import type { MaintenanceLog, Vehicle } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';
import { Plus, Wrench, CheckCircle2, Calendar, DollarSign, X } from 'lucide-react';

const maintenanceSchema = z.object({
  vehicleId: z.coerce.number().int().positive('Vehicle is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  cost: z.number().nonnegative('Cost must be positive or zero'),
});

const closeMaintenanceSchema = z.object({
  technicianName: z.string().min(1, 'Technician name is required'),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;
type CloseFormValues = z.infer<typeof closeMaintenanceSchema>;

export const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [closingLog, setClosingLog] = useState<MaintenanceLog | null>(null);

  const { data: logs, isLoading: logsLoading } = useQuery<MaintenanceLog[]>({
    queryKey: ['maintenance'],
    queryFn: async () => (await axiosClient.get('/maintenance')).data,
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', 'maintenance-eligible'],
    queryFn: async () => {
      const res = await axiosClient.get('/vehicles');
      return res.data.filter((v: Vehicle) => v.status === 'AVAILABLE');
    },
    enabled: isStartOpen,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema) as any,
    defaultValues: { vehicleId: 0, serviceType: 'Routine Maintenance', description: '', cost: 0 },
  });

  const { register: registerClose, handleSubmit: handleSubmitClose, reset: resetClose, formState: { errors: errorsClose } } = useForm<CloseFormValues>({
    resolver: zodResolver(closeMaintenanceSchema),
    defaultValues: { technicianName: '' },
  });

  const startMutation = useMutation({
    mutationFn: (data: MaintenanceFormValues) => {
      return axiosClient.post('/maintenance', {
        ...data,
        branchId: user?.branchId || 1,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      showToast('Maintenance logged — Vehicle set to IN_SHOP', 'success');
      setIsStartOpen(false);
      reset();
    },
    onError: (error: any) => showToast(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to log maintenance', 'error'),
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, technicianName }: { id: number; technicianName: string }) =>
      axiosClient.post(`/maintenance/${id}/close`, { technicianName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      showToast('Maintenance closed — Vehicle set to AVAILABLE', 'success');
      setClosingLog(null);
      resetClose();
    },
    onError: (error: any) => showToast(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to close maintenance', 'error'),
  });

  const handleOpenCloseModal = (log: MaintenanceLog) => {
    setClosingLog(log);
    resetClose({ technicianName: '' });
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
          <h1 className="page-title">Maintenance Logs</h1>
          <p className="page-subtitle">Track repairs, inspections, and service records for all fleet units</p>
        </div>
        <button onClick={() => setIsStartOpen(true)} className="btn btn-primary btn-md" style={{ flexShrink: 0 }}>
          <Plus size={14} strokeWidth={2} />
          Log Service
        </button>
      </div>

      {/* Table */}
      {logsLoading ? (
        <TableSkeleton rows={4} />
      ) : logs?.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Wrench size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>No maintenance events logged yet</p>
        </div>
      ) : (
        <div className="card reveal reveal-2" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Cost</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs?.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {log.vehicle?.registrationNumber || 'Unknown'}
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {log.serviceType}
                    </td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }} title={log.description || ''}>
                      {log.description || 'No description'}
                    </td>
                    <td>
                      <span className={log.status === 'PENDING' ? 'badge badge-warning' : 'badge badge-success'}>
                        {log.status === 'PENDING' ? 'In Repair' : 'Closed'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${log.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                        <Calendar size={12} strokeWidth={1.75} />
                        {log.startedAt ? new Date(log.startedAt).toLocaleDateString() : '–'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {log.status === 'PENDING' ? (
                        <button
                          onClick={() => handleOpenCloseModal(log)}
                          className="btn btn-md"
                          style={{ backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontSize: 11 }}
                        >
                          <CheckCircle2 size={12} strokeWidth={2} />
                          Close Log
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Completed by {log.technicianName}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Service Modal */}
      {isStartOpen && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Log Maintenance Action</h3>
              <button onClick={() => setIsStartOpen(false)} className="btn btn-ghost btn-icon"><X size={16} strokeWidth={1.75} /></button>
            </div>

            <form onSubmit={handleSubmit(data => startMutation.mutate(data as MaintenanceFormValues))} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Select Vehicle</label>
                <select {...register('vehicleId')} style={inputStyle(!!errors.vehicleId)}>
                  <option value="">Choose available vehicle…</option>
                  {vehicles?.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model})</option>
                  ))}
                </select>
                {errors.vehicleId && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.vehicleId.message}</p>}
                <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Only AVAILABLE vehicles are shown.</p>
              </div>

              <div>
                <label style={labelStyle}>Service Type</label>
                <select {...register('serviceType')} style={inputStyle(!!errors.serviceType)}>
                  <option value="Routine Maintenance">Routine Maintenance</option>
                  <option value="Engine Repair">Engine Repair</option>
                  <option value="Tire Replacement">Tire Replacement</option>
                  <option value="Brake Overhaul">Brake Overhaul</option>
                  <option value="Electrical Repair">Electrical Repair</option>
                  <option value="Body Work">Body Work</option>
                </select>
                {errors.serviceType && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.serviceType.message}</p>}
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  style={{ ...inputStyle(!!errors.description), resize: 'vertical' }}
                  placeholder="Describe the repair, inspection or parts replaced…"
                />
                {errors.description && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.description.message}</p>}
              </div>

              <div>
                <label style={labelStyle}>Initial Cost Estimate ($)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={13} strokeWidth={1.75} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input type="number" step="0.01" {...register('cost', { valueAsNumber: true })} style={{ ...inputStyle(!!errors.cost), paddingLeft: 30 }} />
                </div>
                {errors.cost && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errors.cost.message}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsStartOpen(false)} className="btn btn-ghost btn-md">Cancel</button>
                <button type="submit" disabled={startMutation.isPending} className="btn btn-primary btn-md">
                  {startMutation.isPending ? 'Logging…' : 'Log Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance Modal */}
      {closingLog && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Close Maintenance Log</h3>
              <button onClick={() => setClosingLog(null)} className="btn btn-ghost btn-icon"><X size={16} strokeWidth={1.75} /></button>
            </div>

            <form onSubmit={handleSubmitClose(data => { if (closingLog) closeMutation.mutate({ id: closingLog.id, technicianName: data.technicianName }); })} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Technician Name</label>
                <input type="text" {...registerClose('technicianName')} style={inputStyle(!!errorsClose.technicianName)} placeholder="e.g. John Doe" />
                {errorsClose.technicianName && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsClose.technicianName.message}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setClosingLog(null)} className="btn btn-ghost btn-md">Cancel</button>
                <button type="submit" disabled={closeMutation.isPending} className="btn btn-md" style={{ backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                  {closeMutation.isPending ? 'Closing…' : 'Close Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Maintenance;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosClient from '../api/axiosClient';
import type { Vehicle, OperationalCostSummary } from '../types';
import { useToast } from '../context/ToastContext';
import { Flame, DollarSign, Calculator, FileText, Clock, Plus } from 'lucide-react';

const fuelSchema = z.object({
  vehicleId: z.coerce.number().int().positive('Vehicle is required'),
  liters: z.number().positive('Liters must be a positive number'),
  cost: z.number().positive('Cost must be positive'),
  date: z.string().min(1, 'Date is required'),
  tripId: z.string().optional(),
});

const expenseSchema = z.object({
  vehicleId: z.coerce.number().int().positive('Vehicle is required'),
  type: z.enum(['TOLL', 'FUEL', 'MAINTENANCE', 'OTHER']),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
});

type FuelFormValues = z.infer<typeof fuelSchema>;
type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const Expenses: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'fuel' | 'expense' | 'cost'>('fuel');
  const [selectedCostVehicleId, setSelectedCostVehicleId] = useState('');

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', 'expense-dropdown'],
    queryFn: async () => (await axiosClient.get('/vehicles')).data,
  });

  const { data: costSummary, isLoading: costLoading } = useQuery<OperationalCostSummary>({
    queryKey: ['operational-cost', selectedCostVehicleId],
    queryFn: async () => (await axiosClient.get(`/finance/vehicles/${selectedCostVehicleId}/operational-cost`)).data,
    enabled: !!selectedCostVehicleId,
  });

  const { register: registerFuel, handleSubmit: handleSubmitFuel, reset: resetFuel, formState: { errors: errorsFuel } } = useForm<FuelFormValues>({
    resolver: zodResolver(fuelSchema) as any,
    defaultValues: { vehicleId: 0, liters: 0, cost: 0, date: new Date().toISOString().split('T')[0], tripId: '' },
  });

  const { register: registerExpense, handleSubmit: handleSubmitExpense, reset: resetExpense, formState: { errors: errorsExpense } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: { vehicleId: 0, type: 'TOLL', amount: 0, date: new Date().toISOString().split('T')[0] },
  });

  const logFuelMutation = useMutation({
    mutationFn: (data: FuelFormValues) => {
      return axiosClient.post('/finance/fuel-logs', {
        vehicleId: data.vehicleId,
        liters: data.liters,
        cost: data.cost,
        date: new Date(data.date).toISOString(),
        tripId: data.tripId ? parseInt(data.tripId) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-cost'] });
      showToast('Fuel log recorded successfully', 'success');
      resetFuel({ vehicleId: 0, liters: 0, cost: 0, date: new Date().toISOString().split('T')[0], tripId: '' });
    },
    onError: (error: any) => showToast(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to record fuel log', 'error'),
  });

  const logExpenseMutation = useMutation({
    mutationFn: (data: ExpenseFormValues) => {
      return axiosClient.post('/finance/expenses', {
        vehicleId: data.vehicleId,
        type: data.type,
        amount: data.amount,
        date: new Date(data.date).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-cost'] });
      showToast('Expense recorded successfully', 'success');
      resetExpense({ vehicleId: 0, type: 'TOLL', amount: 0, date: new Date().toISOString().split('T')[0] });
    },
    onError: (error: any) => showToast(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to record expense', 'error'),
  });

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

  const tabs = [
    { id: 'fuel' as const, label: 'Fuel Log', icon: <Flame size={13} strokeWidth={1.75} /> },
    { id: 'expense' as const, label: 'General Expenses', icon: <DollarSign size={13} strokeWidth={1.75} /> },
    { id: 'cost' as const, label: 'Cost Summary', icon: <Calculator size={13} strokeWidth={1.75} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div className="reveal reveal-1">
        <h1 className="page-title">Fuel & Expenses</h1>
        <p className="page-subtitle">Log fuel consumption, operational expenditures, and review cost summaries</p>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 2 }} className="reveal reveal-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              fontSize: 13, fontWeight: 500,
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-interactive)' : 'transparent'}`,
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              marginBottom: -1,
              transition: 'color 160ms, border-color 160ms',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

        {/* Form panel */}
        <div>
          {/* ── Fuel Log ── */}
          {activeTab === 'fuel' && (
            <div className="card reveal reveal-3" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Flame size={16} strokeWidth={1.75} style={{ color: '#fb923c' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Log Fuel Entry</h3>
              </div>

              <form onSubmit={handleSubmitFuel(data => logFuelMutation.mutate(data as FuelFormValues))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Vehicle</label>
                    <select {...registerFuel('vehicleId')} style={inputStyle(!!errorsFuel.vehicleId)}>
                      <option value="">Choose vehicle…</option>
                      {vehicles?.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model})</option>)}
                    </select>
                    {errorsFuel.vehicleId && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsFuel.vehicleId.message}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Liters</label>
                    <input type="number" step="0.01" {...registerFuel('liters', { valueAsNumber: true })} style={inputStyle(!!errorsFuel.liters)} />
                    {errorsFuel.liters && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsFuel.liters.message}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Total Cost ($)</label>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={13} strokeWidth={1.75} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input type="number" step="0.01" {...registerFuel('cost', { valueAsNumber: true })} style={{ ...inputStyle(!!errorsFuel.cost), paddingLeft: 30 }} />
                    </div>
                    {errorsFuel.cost && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsFuel.cost.message}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input type="date" {...registerFuel('date')} style={inputStyle(!!errorsFuel.date)} />
                    {errorsFuel.date && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsFuel.date.message}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Trip ID (optional)</label>
                    <input type="text" {...registerFuel('tripId')} style={inputStyle()} placeholder="Link to a trip…" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={logFuelMutation.isPending} className="btn btn-primary btn-lg">
                    <Plus size={14} strokeWidth={2} />
                    {logFuelMutation.isPending ? 'Logging…' : 'Log Fuel'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── General Expenses ── */}
          {activeTab === 'expense' && (
            <div className="card reveal reveal-3" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <DollarSign size={16} strokeWidth={1.75} style={{ color: 'var(--color-interactive)' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Log General Expense</h3>
              </div>

              <form onSubmit={handleSubmitExpense(data => logExpenseMutation.mutate(data as ExpenseFormValues))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Vehicle</label>
                    <select {...registerExpense('vehicleId')} style={inputStyle(!!errorsExpense.vehicleId)}>
                      <option value="">Choose vehicle…</option>
                      {vehicles?.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model})</option>)}
                    </select>
                    {errorsExpense.vehicleId && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsExpense.vehicleId.message}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select {...registerExpense('type')} style={inputStyle()}>
                      <option value="TOLL">Highway Toll</option>
                      <option value="FUEL">Fuel</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Amount ($)</label>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={13} strokeWidth={1.75} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input type="number" step="0.01" {...registerExpense('amount', { valueAsNumber: true })} style={{ ...inputStyle(!!errorsExpense.amount), paddingLeft: 30 }} />
                    </div>
                    {errorsExpense.amount && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsExpense.amount.message}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input type="date" {...registerExpense('date')} style={inputStyle(!!errorsExpense.date)} />
                    {errorsExpense.date && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>{errorsExpense.date.message}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={logExpenseMutation.isPending} className="btn btn-primary btn-lg">
                    <Plus size={14} strokeWidth={2} />
                    {logExpenseMutation.isPending ? 'Logging…' : 'Log Expense'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Cost Summary ── */}
          {activeTab === 'cost' && (
            <div className="card reveal reveal-3" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Calculator size={16} strokeWidth={1.75} style={{ color: 'var(--color-interactive)' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Operational Cost by Vehicle</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Select Vehicle</label>
                  <select value={selectedCostVehicleId} onChange={e => setSelectedCostVehicleId(e.target.value)} style={inputStyle()}>
                    <option value="">Choose vehicle…</option>
                    {vehicles?.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model})</option>)}
                  </select>
                </div>

                {costLoading && selectedCostVehicleId ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                    <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--color-interactive)', borderRadius: '50%' }} className="spin" />
                  </div>
                ) : costSummary && selectedCostVehicleId ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Fuel Costs', value: costSummary.breakdown.fuel, icon: <Flame size={16} strokeWidth={1.75} />, color: '#fb923c' },
                      { label: 'Maintenance', value: costSummary.breakdown.maintenance, icon: <Calculator size={16} strokeWidth={1.75} />, color: 'var(--color-interactive)' },
                      { label: 'Other / Tolls', value: costSummary.breakdown.otherExpenses, icon: <FileText size={16} strokeWidth={1.75} />, color: 'var(--text-muted)' },
                    ].map(item => (
                      <div key={item.label} style={{ borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', backgroundColor: 'var(--color-surface-2)' }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{item.label}</span>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: 3 }}>
                            ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div style={{ padding: 8, borderRadius: 9, backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: item.color }}>
                          {item.icon}
                        </div>
                      </div>
                    ))}
                    <div style={{ gridColumn: '1 / -1', borderRadius: 12, padding: '16px 18px', backgroundColor: 'rgba(75,99,130,0.1)', border: '1px solid rgba(75,99,130,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-interactive)' }}>Total Cost</span>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginTop: 3 }}>
                          ${costSummary.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div style={{ padding: 10, borderRadius: 10, backgroundColor: 'var(--color-interactive)', color: '#fff' }}>
                        <DollarSign size={18} strokeWidth={1.75} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 20px', border: '1px dashed var(--border)', borderRadius: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Select a vehicle to view cost analysis</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div>
          <div className="card reveal reveal-4" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <Clock size={13} strokeWidth={1.75} style={{ color: 'var(--color-interactive)' }} />
              <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost Rules</h4>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Fuel purchases sync immediately to operational cost calculations.',
                'General maintenance logs feed the maintenance index automatically.',
                'Cost indexes are aggregated dynamically from all transaction modules.',
              ].map((rule, i) => (
                <li key={i} style={{ display: 'flex', gap: 9, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--text-muted)', marginTop: 7, flexShrink: 0 }} />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Expenses;

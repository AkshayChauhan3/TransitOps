import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import type { VehicleReportItem } from '../types';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeletons';
import { Download, FileSpreadsheet, ArrowUpRight, TrendingDown, Info } from 'lucide-react';

export const Reports: React.FC = () => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const { data: reports, isLoading, isError } = useQuery<VehicleReportItem[]>({
    queryKey: ['reports-vehicles'],
    queryFn: async () => (await axiosClient.get('/reports/vehicles')).data,
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('transitops_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/reports/vehicles/export.csv`,
        { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Could not download CSV file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TransitOps_Vehicles_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('CSV report downloaded', 'success');
    } catch (error: any) {
      showToast(error.message || 'CSV export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div className="page-header reveal reveal-1">
        <div>
          <h1 className="page-title">Performance Reports</h1>
          <p className="page-subtitle">Fleet efficiency, ROI, and operational cost analysis</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={isExporting || isLoading}
          className="btn btn-primary btn-md"
          style={{ flexShrink: 0 }}
        >
          {isExporting
            ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin" />
            : <Download size={14} strokeWidth={2} />
          }
          Export CSV
        </button>
      </div>

      {/* Info panel */}
      <div className="card reveal reveal-2" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <FileSpreadsheet size={16} strokeWidth={1.75} style={{ color: 'var(--color-accent-h)', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Aggregated Fleet Report</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 700 }}>
          Consolidated view of vehicle performance metrics — fuel efficiency, utilization rates, operational costs, and financial ROI ratios derived from dispatch and maintenance logs.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, width: 'fit-content' }}>
          <Info size={12} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Data compiled from real-time dispatch and activity logs</span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to retrieve vehicle report metrics.
        </div>
      ) : reports?.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <FileSpreadsheet size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>No performance metrics generated yet</p>
        </div>
      ) : (
        <div className="card reveal reveal-3" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Model</th>
                  <th>Fuel Efficiency</th>
                  <th>Utilization</th>
                  <th>Operational Cost</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {reports?.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {item.registrationNumber}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.model}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.fuelEfficiency.toFixed(2)}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>km/L</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 48, height: 4, backgroundColor: 'var(--color-surface-2)', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ height: '100%', width: `${item.fleetUtilizationPercent}%`, backgroundColor: 'var(--color-interactive)', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.fleetUtilizationPercent}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${item.operationalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontWeight: 700, color: item.roi >= 1 ? '#34d399' : '#fbbf24', fontSize: 13 }}>
                          {item.roi.toFixed(2)}x
                        </span>
                        {item.roi >= 1
                          ? <ArrowUpRight size={13} strokeWidth={2} style={{ color: '#34d399' }} />
                          : <TrendingDown size={13} strokeWidth={2} style={{ color: '#fbbf24' }} />
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default Reports;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { LoadingState } from '../components/ui/StateContainers';
import { mockSalesData } from '../api/mockData';
import { fetchDashboardSummary, fetchOrders } from '../api/manager';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Truck, CheckCircle, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    const loadDashboardData = async () => {
      try {
        const [summaryResponse, pendingResponse] = await Promise.all([
          fetchDashboardSummary(),
          fetchOrders('PENDING')
        ]);
        
        if (isMounted) {
          setStats({
            pending: summaryResponse.pendingOrders || 0,
            partial: summaryResponse.partialOrders || 0,
            approved: summaryResponse.approvedOrders || 0,
            approvedNotDispatched: summaryResponse.approvedNotDispatched || 0,
            deadStock: summaryResponse.deadStockItems || 0,
            todaySales: `₹${summaryResponse.todaySales || 0}`
          });
          
          const list = Array.isArray(pendingResponse) ? pendingResponse : (pendingResponse?.orders || []);
          setPendingOrders(list);
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard pull failed", err);
        if (isMounted) {
          setStats({ pending: 0, partial: 0, approved: 0, approvedNotDispatched: 0, deadStock: 0, todaySales: '₹0' });
          setPendingOrders([]);
          setLoading(false);
        }
      }
    };
    
    loadDashboardData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <LoadingState message="Loading dashboard KPIs..." />;

  const kpis = [
    { label: 'Pending Orders', value: stats.pending, icon: <Package size={24} />, color: 'var(--color-orange)' },
    { label: 'Partially Approved', value: stats.partial, icon: <AlertTriangle size={24} />, color: 'var(--color-yellow)' },
    { label: 'Approved Orders', value: stats.approved, icon: <CheckCircle size={24} />, color: 'var(--color-green)' },
    { label: 'Ready for Dispatch', value: stats.approvedNotDispatched, icon: <Truck size={24} />, color: 'var(--color-primary)' },
    { label: 'Dead Stock Items', value: stats.deadStock, icon: <Package size={24} />, color: 'var(--color-red)' },
    { label: 'Today Sales', value: stats.todaySales, icon: <DollarSign size={24} />, color: 'var(--color-text-main)' },
  ];

  return (
    <div className="dashboard">
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <Card key={i} className="kpi-card">
            <CardContent className="kpi-content">
              <div className="kpi-info">
                <span className="kpi-label">{kpi.label}</span>
                <span className="kpi-value">{kpi.value}</span>
              </div>
              <div className="kpi-icon" style={{ color: kpi.color, backgroundColor: `${kpi.color}15` }}>
                {kpi.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="charts-grid">
        <Card className="chart-card">
          <CardHeader title="Sales Trend (Weekly)" />
          <CardContent className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockSalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                />
                <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader title="Recent Activity" action={<button className="btn-text" onClick={() => navigate('/orders')}>View All</button>} />
          <CardContent>
            <div className="activity-list">
              {pendingOrders.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '1.5rem 0', textAlign: 'center' }}>
                  No pending orders at the moment.
                </div>
              ) : (
                pendingOrders.slice(0, 4).map(o => (
                  <div key={o.orderId || o.id} className="activity-item">
                    <div className="activity-icon" style={{ backgroundColor: 'var(--color-orange)15', color: 'var(--color-orange)' }}>
                      <Package size={16} />
                    </div>
                    <div className="activity-details">
                      <p className="activity-title">
                        Order <strong>{o.orderId || o.id}</strong> from <strong>{o.outletId || o.outlet}</strong> is pending approval.
                      </p>
                      <span className="activity-time">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

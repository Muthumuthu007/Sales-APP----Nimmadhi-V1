import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { fetchManagerEmployees, fetchOutlets } from '../api/employees';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';

const Employees = () => {
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOutlets().then((data) => {
      const result = data?.outlets || data?.data || [];
      setOutlets(result);
      if (result.length) setOutletId(result[0].outletId || result[0].id);
    }).catch(() => setError('Unable to load outlets.'));
  }, []);

  const load = useCallback(async (target = outletId) => {
    if (!target) return;
    setLoading(true); setError('');
    try {
      const data = await fetchManagerEmployees(target);
      setEmployees(data?.employees || data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Unable to load employees.');
    } finally { setLoading(false); }
  }, [outletId]);

  useEffect(() => { if (outletId) load(outletId); }, [outletId, load]);

  const outletOptions = [{ value: '', label: 'Select outlet' }, ...outlets.map((outlet) => ({ value: outlet.outletId || outlet.id, label: `${outlet.outletName || outlet.name || 'Outlet'} (${outlet.outletId || outlet.id})` }))];
  const columns = [
    { key: 'name', label: 'Employee' },
    { key: 'phone', label: 'Login username' },
    { key: 'role', label: 'Role' },
    { key: 'workType', label: 'Work type', render: (row) => row.workType === 'FIELD' ? 'Field work' : 'Office' },
    { key: 'salaryModel', label: 'Salary model', render: (row) => row.salary?.salaryModel || row.salaryModel || '-' },
    { key: 'status', label: 'Status', render: (row) => row.isActive === false ? 'Inactive' : 'Active' },
    { key: 'createdAt', label: 'Created', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' },
  ];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div><p className="create-user-eyebrow">Team management</p><h2 style={{ margin: 0 }}>Employees by outlet</h2><p className="text-muted">Choose an outlet to view its staff accounts and employment details.</p></div>
    <Card><CardHeader title="Employee directory" /><CardContent>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap', marginBottom: '1.25rem' }}><div style={{ minWidth: '280px' }}><Select label="Outlet" value={outletId} onChange={(event) => setOutletId(event.target.value)} options={outletOptions} /></div><Button onClick={() => load()} disabled={!outletId || loading}>{loading ? 'Loading…' : 'Refresh'}</Button></div>
      {loading ? <LoadingState message="Loading employees…" /> : error ? <ErrorState error={error} onRetry={() => load()} /> : <Table columns={columns} data={employees} emptyStateMessage="No employees have been created for this outlet." />}
    </CardContent></Card>
  </div>;
};

export default Employees;

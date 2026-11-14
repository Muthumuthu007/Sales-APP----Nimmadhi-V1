import {locationOptions} from '../utils/locationScope';
import {employeeOutlets,employeeAtOutlet,mapEmployeeLocations,locationId} from '../utils/employeeLocations';
import EmployeePasswordReset from '../components/EmployeePasswordReset';
import EmployeeBankEditor from '../components/EmployeeBankEditor';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { fetchManagerEmployees, fetchOutlets, reassignEmployee } from '../api/employees';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';

const Employees = () => {
  const [passwordEmployee,setPasswordEmployee]=useState(null);
  const [bankEmployee,setBankEmployee]=useState(null);
  const [location,setLocation]=useState(''),[outletsReady,setOutletsReady]=useState(false);
  const loadSequence=useRef(0);
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transferEmployee, setTransferEmployee] = useState(null);
  const [destination, setDestination] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [success, setSuccess] = useState('');
  const confirmTransfer = async () => {
    if (!transferEmployee || !destination || destination === transferEmployee.outletId) return;
    setTransferring(true); setTransferError(''); setSuccess('');
    try {
      await reassignEmployee(transferEmployee.empId, transferEmployee.outletId, destination);
      setSuccess(`${transferEmployee.name} reassigned successfully. They must sign in again.`);
      setTransferEmployee(null);
      await load();
    } catch (err) {
      setTransferError(err.response?.data?.error || 'Unable to reassign employee.');
    } finally { setTransferring(false); }
  };

  useEffect(() => {
    fetchOutlets({ignoreLocationScope:true}).then((data) => {
      const result = data?.outlets || data?.data || [];
      setOutlets(result);
      setOutletsReady(true);
    }).catch(() => setError('Unable to load outlets.'));
  }, []);

  const load = useCallback(async () => {
    if(!outletsReady)return;
    const sequence=++loadSequence.current;setLoading(true);setError('');setEmployees([]);
    try {
      const groups=await mapEmployeeLocations(employeeOutlets(outlets,location,outletId),async outlet=>{
        const response=await fetchManagerEmployees(locationId(outlet));
        return (response?.employees || response?.data || []).map(employee=>employeeAtOutlet(employee,outlet));
      });
      if(sequence===loadSequence.current)setEmployees(groups.flat());
    }catch(err){if(sequence===loadSequence.current)setError(err.response?.data?.error || 'Unable to load all selected employees. Refresh to retry.');}
    finally{if(sequence===loadSequence.current)setLoading(false);}
  },[outletsReady,outlets,location,outletId]);
  useEffect(()=>{const tracker=loadSequence;load();return()=>{tracker.current++;};},[load]);

  const outletOptions = [{ value: '', label: 'All outlets' }, ...employeeOutlets(outlets,location).map((outlet) => ({ value: outlet.outletId || outlet.id, label: `${outlet.outletName || outlet.name || 'Outlet'} (${outlet.outletId || outlet.id})` }))];
  const columns = [
    { key: 'name', label: 'Employee' },
    {key:'locationName',label:'Location'},
    {key:'outletName',label:'Outlet',render:row=>`${row.outletName} (${row.outletId})`},
    { key: 'phone', label: 'Login username' },
    { key: 'role', label: 'Role' },
    { key: 'workType', label: 'Work type', render: (row) => row.workType === 'FIELD' ? 'Field work' : 'Demonstrative employee' },
    { key: 'salaryModel', label: 'Salary model', render: (row) => row.salary?.salaryModel || row.salaryModel || '-' },
    { key: 'status', label: 'Status', render: (row) => row.isActive === false ? 'Inactive' : 'Active' },
    { key: 'actions', label: 'Actions', render: (row) => <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}><Button variant="secondary" onClick={()=>setPasswordEmployee(row)}>Reset password</Button><Button variant="secondary" onClick={()=>setBankEmployee(row)}>Edit bank details</Button><Button variant="secondary" onClick={() => { setTransferError(''); setDestination(''); setTransferEmployee(row); }}>Reassign outlet</Button></div> },
    { key: 'createdAt', label: 'Created', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' },
  ];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div><p className="create-user-eyebrow">Team management</p><h2 style={{ margin: 0 }}>Employees by location</h2><p className="text-muted">View all employees or filter by location and outlet.</p></div>
    {success && <p role="status">{success}</p>}
    <Card><CardHeader title="Employee directory" /><CardContent>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap', marginBottom: '1.25rem' }}><div style={{ minWidth: '280px' }}><Select label="Location" value={location} onChange={event=>{setLocation(event.target.value);setOutletId('');}} options={locationOptions(outlets)}/><Select label="Outlet" value={outletId} onChange={(event) => setOutletId(event.target.value)} options={outletOptions} /></div><Button onClick={() => load()} disabled={!outletsReady || loading}>{loading ? 'Loading…' : 'Refresh'}</Button></div>
      {!loading && !error && <p>{employees.length} employees · {locationOptions(outlets).find(option=>option.value===location)?.label}</p>}
      {loading ? <LoadingState message="Loading employees…" /> : error ? <ErrorState error={error} onRetry={() => load()} /> : <Table columns={columns} data={employees} emptyStateMessage="No employees found for the selected location and outlet." />}
    </CardContent></Card>
    {passwordEmployee&&<EmployeePasswordReset employee={passwordEmployee} onClose={()=>setPasswordEmployee(null)} onSaved={message=>{setSuccess(message);setPasswordEmployee(null);}}/>}
    <EmployeeBankEditor employee={bankEmployee} onClose={()=>setBankEmployee(null)} onSaved={message=>{setSuccess(message);setBankEmployee(null);load();}}/>
    <Modal isOpen={Boolean(transferEmployee)} onClose={() => !transferring && setTransferEmployee(null)} title="Reassign employee">
      <p>Move <strong>{transferEmployee?.name}</strong> from <strong>{`${transferEmployee?.outletName} (${transferEmployee?.outletId})`}</strong> to another outlet.</p>
      <Select label="Destination outlet" value={destination} onChange={(event) => setDestination(event.target.value)} disabled={transferring} options={[{value:'',label:'Choose destination outlet'},...outlets.filter(outlet=>locationId(outlet)!==transferEmployee?.outletId).map(outlet=>({value:locationId(outlet),label:`${outlet.outletName || outlet.name} (${locationId(outlet)})`}))]} />
      <p>Login credentials, role and salary settings are retained. Past attendance stays at the original outlet. The employee must sign in again.</p>
      {transferError && <p role="alert">{transferError}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <Button variant="secondary" onClick={() => setTransferEmployee(null)} disabled={transferring}>Cancel</Button>
        <Button onClick={confirmTransfer} disabled={transferring || !destination}>{transferring ? 'Reassigning…' : 'Confirm reassignment'}</Button>
      </div>
    </Modal>
  </div>;
};

export default Employees;

import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { mockEmployees } from '../api/mockData';

const Attendance = () => {
  const columns = [
    { key: 'name', label: 'Employee Name' },
    { key: 'status', label: 'Status (Present/Absent)', render: () => (
      <select style={{ padding: '4px' }}>
        <option value="Present">Present</option>
        <option value="Absent">Absent</option>
        <option value="Half Day">Half Day</option>
      </select>
    )},
    { key: 'checkIn', label: 'Check-in', render: () => <input type="time" defaultValue="09:00" style={{ padding: '4px' }} /> },
    { key: 'checkOut', label: 'Check-out', render: () => <input type="time" defaultValue="18:00" style={{ padding: '4px' }} /> },
    { key: 'ot', label: 'OT Hours', render: () => <input type="number" defaultValue="0" style={{ width: '60px', padding: '4px' }} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Daily Attendance</h2>
      <Card>
        <CardHeader title="Mark Attendance" action={<Input type="date" defaultValue="2026-04-05" />} />
        <CardContent style={{ padding: 0 }}>
          <Table columns={columns} data={mockEmployees} />
          <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary">Save Attendance</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;

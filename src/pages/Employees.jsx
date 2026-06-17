import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { mockEmployees } from '../api/mockData';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';

const Employees = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Salary Type' },
    { key: 'salary', label: 'Salary / Rate', render: (row) => `$${row.salary}` },
    { key: 'otRate', label: 'OT Rate/Hr', render: (row) => `$${row.otRate}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Employee Management</h2>
        <Button onClick={() => setModalOpen(true)}>Add Employee</Button>
      </div>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <Table columns={columns} data={mockEmployees} />
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Employee">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Employee Name" />
          <Select label="Salary Type" options={[{ label: 'Monthly', value: 'Monthly' }, { label: 'Per Day', value: 'Per Day' }]} />
          <Input type="number" label="Salary / Rate ($)" />
          <Input type="number" label="Overtime Rate ($/hr)" />
          <Button variant="primary" style={{ marginTop: '1rem' }} onClick={() => setModalOpen(false)}>Save Employee</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;

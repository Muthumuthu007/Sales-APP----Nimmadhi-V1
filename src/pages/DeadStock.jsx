import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { mockDeadStock } from '../api/mockData';

const DeadStock = () => {
  const columns = [
    { key: 'outlet', label: 'Outlet Name' },
    { key: 'product', label: 'Product' },
    { key: 'lastSold', label: 'Last Sold Date' },
    { key: 'quantity', label: 'Quantity', align: 'center' },
    { key: 'daysUnsold', label: 'Days Unsold', align: 'center', render: (row) => (
      <span style={{ 
        color: row.daysUnsold > 60 ? 'var(--color-red)' : 'var(--color-text-main)', 
        fontWeight: row.daysUnsold > 60 ? '600' : '400' 
      }}>
        {row.daysUnsold}
      </span>
    )}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Dead Stock Monitoring</h2>
      <p className="text-muted">Items highlighted in red have been unsold for &gt; 60 days.</p>
      <Card>
        <CardContent style={{ padding: 0 }}>
          <Table columns={columns} data={mockDeadStock} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DeadStock;

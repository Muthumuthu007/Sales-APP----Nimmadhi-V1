// src/api/mockData.js
export const mockOrders = [
  { id: 'ORD-1001', outlet: 'Downtown Store', date: '2026-04-05', status: 'PENDING', totalAmt: '$1,200', items: 12 },
  { id: 'ORD-1002', outlet: 'Uptown Mall', date: '2026-04-04', status: 'PARTIAL', totalAmt: '$850', items: 8 },
  { id: 'ORD-1003', outlet: 'Suburban Outlet', date: '2026-04-03', status: 'APPROVED', totalAmt: '$2,400', items: 24 },
  { id: 'ORD-1004', outlet: 'City Center', date: '2026-04-02', status: 'DISPATCHED', totalAmt: '$3,100', items: 30 },
];

export const mockDeadStock = [
  { id: 1, outlet: 'Downtown Store', product: 'Orthopedic Mattress - Queen', lastSold: '2026-01-10', daysUnsold: 85, quantity: 12 },
  { id: 2, outlet: 'Suburban Outlet', product: 'Memory Foam Pillow', lastSold: '2026-02-15', daysUnsold: 49, quantity: 24 },
  { id: 3, outlet: 'Uptown Mall', product: 'Spring Mattress - King', lastSold: '2025-12-05', daysUnsold: 121, quantity: 5 },
];

export const mockEmployees = [
  { id: 1, name: 'Alice Smith', type: 'Monthly', salary: 3000, otRate: 20 },
  { id: 2, name: 'Bob Johnson', type: 'Per Day', salary: 150, otRate: 25 },
];

export const mockSalesData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 5000 },
  { name: 'Fri', sales: 6000 },
  { name: 'Sat', sales: 7000 },
  { name: 'Sun', sales: 4500 },
];

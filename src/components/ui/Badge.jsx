import React from 'react';
import './Badge.css';

const STATUS_COLORS = {
  PENDING: 'badge-orange',
  PARTIAL: 'badge-yellow',
  PARTIALLY_APPROVED: 'badge-yellow',
  APPROVED: 'badge-green',
  DISPATCHED: 'badge-primary',
  REJECTED: 'badge-red',
};

export const Badge = ({ status }) => {
  const safeStatus = status || '';
  const colorClass = STATUS_COLORS[safeStatus.toUpperCase()] || 'badge-default';
  const displayText = safeStatus.replace('_', ' ');
  
  return (
    <span className={`badge ${colorClass}`}>
      {displayText}
    </span>
  );
};

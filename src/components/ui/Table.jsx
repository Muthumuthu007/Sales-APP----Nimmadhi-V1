import React from 'react';
import { EmptyState } from './StateContainers';
import './Table.css';

export const Table = ({ columns, data, onRowClick, emptyStateMessage = "No records found.", className = '' }) => {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyStateMessage} />;
  }

  return (
    <div className="table-container">
      <table className={`table ${className}`}>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={`${col.align || 'left'} ${col.className || ''}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={`${col.align || 'left'} ${col.className || ''}`}>
                  {col.render ? col.render(row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

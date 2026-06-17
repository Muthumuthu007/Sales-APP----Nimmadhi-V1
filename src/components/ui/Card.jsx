import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>{children}</div>
);

export const CardHeader = ({ title, action }) => (
  <div className="card-header">
    <h3 className="card-title">{title}</h3>
    {action && <div className="card-action">{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`card-content ${className}`} {...props}>{children}</div>
);

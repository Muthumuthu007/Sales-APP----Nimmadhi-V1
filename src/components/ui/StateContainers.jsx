import React from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import './StateContainers.css';

export const LoadingState = ({ message = "Loading..." }) => (
  <div className="state-container loading">
    <Loader2 className="spinner" size={32} />
    <p>{message}</p>
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="state-container error">
    <AlertCircle className="error-icon" size={32} />
    <p className="error-msg">{error || "Something went wrong."}</p>
    {onRetry && (
      <button className="retry-btn" onClick={onRetry}>Try Again</button>
    )}
  </div>
);

export const EmptyState = ({ title = "No data found", description }) => (
  <div className="state-container empty">
    <Inbox className="empty-icon" size={48} />
    <h4>{title}</h4>
    {description && <p>{description}</p>}
  </div>
);

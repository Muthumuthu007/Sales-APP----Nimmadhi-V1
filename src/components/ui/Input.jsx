import React, { useId } from 'react';
import './Input.css';

export const Input = ({ label, error, ...props }) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  return (
    <div className="input-group">
      {label && <label className="input-label" htmlFor={inputId}>{label}</label>}
      <input className={`input ${error ? 'input-error' : ''}`} aria-invalid={error?true:undefined} aria-describedby={error?`${inputId}-error`:undefined} {...props} id={inputId} />
      {error && <span id={`${inputId}-error`} className="input-error-msg">{error}</span>}
    </div>
  );
};

export const Select = ({ label, options, error, ...props }) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  return (
    <div className="input-group">
      {label && <label className="input-label" htmlFor={inputId}>{label}</label>}
      <select className={`input ${error ? 'input-error' : ''}`} aria-invalid={error?true:undefined} aria-describedby={error?`${inputId}-error`:undefined} {...props} id={inputId}>
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span id={`${inputId}-error`} className="input-error-msg">{error}</span>}
    </div>
  );
};

import React,{useContext} from 'react';
import {AuthContext} from '../../context/AuthContext';
import {isReadOnlyAdmin} from '../../auth/adminAccess';
import './Button.css';

export const Button = ({ children, variant = 'primary', className = '', writeAction=false, ...props }) => {
  const auth=useContext(AuthContext);
  const blocked=writeAction && isReadOnlyAdmin(auth?.adminAccess);
  return (
    <button className={`btn btn-${variant} ${className}`} {...props} disabled={props.disabled || blocked} title={blocked?'View-only access':props.title}>
      {children}
    </button>
  );
};

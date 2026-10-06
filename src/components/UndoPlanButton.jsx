import React, { useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import './UndoPlanButton.css';
import { undoLoadPlan } from '../api/manager';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

const explanations = {
  dispatch: 'Dispatched quantities will return to Dispatch Pending. Godown stock and reservations will be restored.',
  assignment: 'Factory and godown assignments will be removed, and reserved godown stock will be released. You can assign a new source afterward.',
  approval: 'Approved quantities will return to the order’s Pending status, ready for review and approval again.',
};
const requirements = {
  dispatch: 'Quantities already received cannot be undone.',
  assignment: 'If any quantity has been dispatched, undo dispatch first.',
  approval: 'Undo dispatch and source assignment before undoing approval.',
};

export default function UndoPlanButton({ plan, action, onUndone }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const undo = async () => {
    setBusy(true); setError('');
    try {
      await undoLoadPlan(plan, action);
      setOpen(false);
      await onUndone?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to undo this action.');
    } finally { setBusy(false); }
  };
  return <>
    <Button variant="secondary" onClick={() => { setError(''); setOpen(true); }}>Undo {action}</Button>
    <Modal className="undo-dialog" isOpen={open} onClose={() => !busy && setOpen(false)} title={`Undo ${action}`}>
      <div className="undo-dialog-summary">
        <span className="undo-dialog-icon"><RotateCcw size={22} aria-hidden="true" /></span>
        <div><span className="undo-dialog-label">LOAD PLAN</span><strong>{plan.planRef || plan.loadPlanRef || plan.loadPlanId}</strong></div>
      </div>
      <p className="undo-dialog-description">{action === 'dispatch' && plan.lineId ? 'This product’s dispatched quantity will return to Dispatch Pending. Its godown stock and reservation will be restored.' : explanations[action]}</p>
      <div className="undo-dialog-notice"><AlertTriangle size={18} aria-hidden="true" /><p>{requirements[action]}</p></div>
      {error && <div className="undo-dialog-error" role="alert">{error}</div>}
      <div className="undo-dialog-footer">
        <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="primary" disabled={busy} onClick={undo}>{busy ? 'Undoing…' : `Undo ${action}`}</Button>
      </div>
    </Modal>
  </>;
}

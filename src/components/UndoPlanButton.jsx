import React, { useState } from 'react';
import { undoLoadPlan } from '../api/manager';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

const explanations = {
  dispatch: 'This returns all manually dispatched quantities on this load plan to awaiting dispatch and restores godown stock and reservations. Received quantities cannot be undone.',
  assignment: 'This removes the Factory/Godown source assignments and releases godown reservations. You can assign sources again. Undo dispatch first if any quantity has left.',
  approval: 'This returns the quantities approved in this load plan to the order’s pending quantities. Undo dispatch and source assignment first.',
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
    <Modal isOpen={open} onClose={() => !busy && setOpen(false)} title={`Undo ${action}`}>
      <p>{action === 'dispatch' && plan.lineId ? 'This returns the dispatched quantity of this product line to awaiting dispatch and restores its godown stock and reservation. Received quantities cannot be undone.' : explanations[action]}</p>
      {error && <p role="alert">{error}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="primary" disabled={busy} onClick={undo}>{busy ? 'Undoing…' : `Confirm undo ${action}`}</Button>
      </div>
    </Modal>
  </>;
}

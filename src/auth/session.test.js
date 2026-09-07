import assert from 'node:assert/strict';
import test from 'node:test';
import { persistSession } from './session.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('persists the token synchronously before protected-route navigation', () => {
  const storage = createStorage();

  persistSession(storage, {
    token: 'signed-token',
    role: 'MANAGER',
    username: 'admin',
  });

  // This represents the first dashboard request immediately after login.
  assert.equal(storage.getItem('token'), 'signed-token');
  assert.equal(storage.getItem('role'), 'MANAGER');
  assert.equal(storage.getItem('username'), 'admin');
});

test('clears stale outlet and employee data when a manager logs in', () => {
  const storage = createStorage();
  storage.setItem('outletId', 'OUT009');
  storage.setItem('empId', 'EMP001');

  persistSession(storage, {
    token: 'manager-token',
    role: 'MANAGER',
    username: 'admin',
  });

  assert.equal(storage.getItem('outletId'), null);
  assert.equal(storage.getItem('empId'), null);
});

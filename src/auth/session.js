const optionalSessionFields = [
  ['outletId', 'outletId'],
  ['empId', 'empId'],
  ['empName', 'empName'],
];

/**
 * Save the complete authenticated session synchronously.
 * Axios reads localStorage for the Authorization header, so this must happen
 * before routing to a page that requests protected data.
 */
export function persistSession(storage, session) {
  storage.setItem('token', session.token);
  storage.setItem('role', session.role);
  storage.setItem('username', session.username || '');

  optionalSessionFields.forEach(([sessionKey, storageKey]) => {
    if (session[sessionKey]) storage.setItem(storageKey, session[sessionKey]);
    else storage.removeItem(storageKey);
  });
}

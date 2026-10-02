export const outletLabel = (outletId, outlets = []) => {
  if (!outletId) return '—';
  const outlet = outlets.find((item) => (item.outletId || item.id) === outletId);
  const name = outlet?.outletName || outlet?.name || outlet?.username;
  return name ? `${name} (${outletId})` : outletId;
};

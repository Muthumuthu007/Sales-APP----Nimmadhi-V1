export const outletLabel = (outletId, outlets = []) => {
  if (!outletId) return '—';
  const outlet = outlets.find((item) => (item.outletId || item.id) === outletId);
  const name = outlet?.outletName || outlet?.name || outlet?.username;
  const isNimmadhiOutlet = outlet?.isNimmadhiOutlet || String(outletId).toUpperCase().startsWith('NIM');
  const base = name ? `${name} (${outletId})` : outletId;
  return isNimmadhiOutlet ? `NIMMADHI Outlet — ${base}` : base;
};

export const isNimmadhiOutlet = (outlet) => (
  Boolean(outlet?.isNimmadhiOutlet)
  || String(outlet?.outletId || outlet?.id || outlet || '').toUpperCase().startsWith('NIM')
);

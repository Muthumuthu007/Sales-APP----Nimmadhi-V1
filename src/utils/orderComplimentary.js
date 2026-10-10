export function complimentaryForProduct(offers, productId, groupId) {
  return offers.filter(offer => Number(offer.freeQuantity) > 0 && (
    offer.scope === 'OUTLET' ||
    (offer.scope === 'PRODUCT' && offer.productId === productId) ||
    (offer.scope === 'GROUP' && groupId && offer.groupId === groupId)
  ));
}

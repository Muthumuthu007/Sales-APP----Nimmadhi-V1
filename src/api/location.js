import api from './axios';

/**
 * Fetches the registered location coordinates of an outlet.
 * @param {string} outletId
 */
export async function getOutletLocation(outletId) {
  return api.get(`/outlets/${outletId}/location`);
}

/**
 * Updates the geographic boundary coordinates of an outlet.
 * @param {string} outletId
 * @param {object} coordinates - { latitude, longitude }
 */
export async function updateOutletLocation(outletId, coordinates) {
  return api.patch(`/outlets/${outletId}/location`, coordinates);
}

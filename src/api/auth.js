import api from './axios';

export async function login(credentials) {
  const response = await api.post('/login', credentials);
  return response;
}

export async function createUser(data) {
  const response = await api.post('/users', data);
  return response;
}

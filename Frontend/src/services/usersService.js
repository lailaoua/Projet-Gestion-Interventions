import api from './api';

export function getUsers() {
  return api.get('/users');
}

export function getTechnicians() {
  return api.get('/users/technicians');
}

export function createUser(payload) {
  return api.post('/users', payload);
}

export function updateUser(id, payload) {
  return api.put(`/users/${id}`, payload);
}

export function deleteUser(id) {
  return api.delete(`/users/${id}`);
}

import api from './api';

function toFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
}

export function getEquipments() {
  return api.get('/equipments');
}

export function getMyEquipments() {
  return api.get('/client/equipments');
}

export function getClientEquipments() {
  return api.get('/client/equipments');
}

export function getAvailableEquipments() {
  return api.get('/equipments/available');
}

export function createEquipment(payload) {
  return api.post('/equipments', toFormData(payload));
}

export function updateEquipment(id, payload) {
  return api.put(`/equipments/${id}`, toFormData(payload));
}

export function assignEquipmentToMe(id) {
  return api.put(`/equipments/${id}/assign`);
}

export function deleteEquipment(id) {
  return api.delete(`/equipments/${id}`);
}


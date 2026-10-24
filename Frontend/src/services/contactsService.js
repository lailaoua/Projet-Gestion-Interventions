import api from './api';

export const sendContact = (data) => api.post('/contact', data).then(r => r.data);
export const getMyMessages = () => api.get('/contact/my-messages').then(r => r.data);
export const getAllMessages = () => api.get('/contact').then(r => r.data);
export const getMessage = (id) => api.get(`/contact/${id}`).then(r => r.data);
export const markAsRead = (id) => api.put(`/contact/${id}/read`).then(r => r.data);
export const replyMessage = (id, payload) => api.put(`/contact/${id}/reply`, payload).then(r => r.data);
export const deleteMessage = (id) => api.delete(`/contact/${id}`).then(r => r.data);

export default {
  sendContact,
  getMyMessages,
  getAllMessages,
  getMessage,
  markAsRead,
  replyMessage,
  deleteMessage,
};

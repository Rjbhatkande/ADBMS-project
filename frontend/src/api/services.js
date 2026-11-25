import axiosClient from './axiosClient';

export const authApi = {
  register: (payload) => axiosClient.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => axiosClient.post('/auth/login', payload).then((r) => r.data),
  getMe: () => axiosClient.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => axiosClient.put('/auth/profile', payload).then((r) => r.data)
};

export const eventsApi = {
  list: (params = {}) => axiosClient.get('/events', { params }).then((r) => r.data),
  getById: (id) => axiosClient.get(`/events/${id}`).then((r) => r.data),
  create: (payload) => axiosClient.post('/events', payload).then((r) => r.data),
  update: (id, payload) => axiosClient.put(`/events/${id}`, payload).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/events/${id}`).then((r) => r.data),
  addSponsor: (id, sponsorName) =>
    axiosClient.post(`/events/${id}/sponsors`, { sponsorName }).then((r) => r.data),
  removeSponsor: (id, sponsorName) =>
    axiosClient
      .delete(`/events/${id}/sponsors/${encodeURIComponent(sponsorName)}`)
      .then((r) => r.data)
};

export const clubsApi = {
  list: () => axiosClient.get('/clubs').then((r) => r.data),
  getById: (id) => axiosClient.get(`/clubs/${id}`).then((r) => r.data),
  create: (payload) => axiosClient.post('/clubs', payload).then((r) => r.data),
  update: (id, payload) => axiosClient.put(`/clubs/${id}`, payload).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/clubs/${id}`).then((r) => r.data),
  join: (id) => axiosClient.post(`/clubs/${id}/join`).then((r) => r.data),
  leave: (id) => axiosClient.delete(`/clubs/${id}/leave`).then((r) => r.data)
};

export const registrationsApi = {
  list: (params = {}) => axiosClient.get('/registrations', { params }).then((r) => r.data),
  getMine: () => axiosClient.get('/registrations/my').then((r) => r.data),
  create: (payload) => axiosClient.post('/registrations', payload).then((r) => r.data),
  update: (id, payload) => axiosClient.put(`/registrations/${id}`, payload).then((r) => r.data),
  checkIn: (ticketId, checkInStatus) =>
    axiosClient
      .patch(`/registrations/${encodeURIComponent(ticketId)}/checkin`, { checkInStatus })
      .then((r) => r.data),
  remove: (id) => axiosClient.delete(`/registrations/${id}`).then((r) => r.data)
};

export const analyticsApi = {
  overview: () => axiosClient.get('/analytics/overview').then((r) => r.data)
};

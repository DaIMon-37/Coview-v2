import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("coview_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("coview_token");
      localStorage.removeItem("coview_user");
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.patch("/auth/me", data),
  getStats: () => api.get("/auth/stats"),
};

export const partyAPI = {
  create: (data) => api.post("/party/create", data),
  join: (code) => api.post("/party/join", { code }),
  leave: (partyId) => api.post("/party/leave", { partyId }),
  getByCode: (code) => api.get(`/party/${code}`),
  getPublic: (params) => api.get("/party/public", { params }),
  updateSettings: (code, data) => api.patch(`/party/${code}/settings`, data),
  deleteParty: (code) => api.delete(`/party/${code}`),
};

export const chatAPI = {
  getHistory: (partyId) => api.get(`/chat/history/${partyId}`),
  deleteMessage: (messageId) => api.delete(`/chat/message/${messageId}`),
  getUserHistory: () => api.get("/chat/user/history"),
};

export const searchAPI = {
  youtube: (q) => api.get(`/search/youtube?q=${encodeURIComponent(q)}`),
};

export default api;

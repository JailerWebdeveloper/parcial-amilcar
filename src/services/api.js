import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Ejemplo: redirigir a login o limpiar sesión
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funciones de ejemplo para consumir endpoints

/**
 * Obtiene el listado de usuarios
 */
export const fetchUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

/**
 * Crea un nuevo usuario
 */
export const createUser = async (user) => {
  const response = await api.post('/users', user);
  return response.data;
};

// Agrega más funciones para cada endpoint que necesites

export default api;

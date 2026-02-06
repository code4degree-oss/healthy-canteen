import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const auth = {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
};

export const orders = {
    create: (data: any) => api.post('/orders', data),
    getAll: () => api.get('/orders'),
    getActiveSubscription: () => api.get('/orders/active'),
};

export const admin = {
    getAllUsers: () => api.get('/admin/users'),
    createUser: (data: any) => api.post('/admin/users', data),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

    // Menu (Public/Admin Mixed in backend, but accessed via these for management)
    getMenu: () => api.get('/admin/menu'),
    addMenuItem: (data: any) => api.post('/admin/menu', data),
    updateMenuItem: (id: number, data: any) => api.put(`/admin/menu/${id}`, data),
    deleteMenuItem: (id: number) => api.delete(`/admin/menu/${id}`),

    // Addons
    getAddOns: () => api.get('/admin/addons'),
    addAddOn: (data: any) => api.post('/admin/addons', data),
    deleteAddOn: (id: number) => api.delete(`/admin/addons/${id}`),
};

export const delivery = {
    getQueue: () => api.get('/delivery/queue'),
};

export default api;

import axios from 'axios';

export const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
export const BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
    baseURL: API_URL,
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
    googleLogin: (token: string) => api.post('/auth/google', { token }),
    verifyToken: () => api.get('/auth/verify'),
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

    // Subscriptions
    updateSubscription: (id: number, data: any) => api.put(`/admin/subscriptions/${id}`, data),

    // Menu (Public/Admin Mixed in backend, but accessed via these for management)
    // Menu Management
    getMenu: () => api.get('/menu'),
    updateMenu: () => api.get('/menu'), // Use same endpoint for now or specific refresh logic

    // Admin Menu Operations
    createPlan: (data: any) => api.post('/menu/plans', data),
    updatePlan: (id: number, data: any) => api.put(`/menu/plans/${id}`, data),
    deletePlan: (id: number) => api.delete(`/menu/plans/${id}`),
    addMenuItem: (data: FormData) => api.post('/menu/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateMenuItem: (id: number, data: FormData) => api.put(`/menu/items/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteMenuItem: (id: number) => api.delete(`/menu/items/${id}`),

    // Addons
    getAddOns: () => api.get('/admin/addons'),
    addAddOn: (data: any) => api.post('/admin/addons', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateAddOn: (id: number, data: any) => api.put(`/admin/addons/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteAddOn: (id: number) => api.delete(`/admin/addons/${id}`),

    // Delivery Assignment
    getDeliveryPartners: () => api.get('/admin/delivery-partners'),
    assignDelivery: (subscriptionId: number, deliveryUserId: number) => api.post('/admin/assign-delivery', { subscriptionId, deliveryUserId }),
    markReady: (subscriptionId: number) => api.post('/admin/mark-ready', { subscriptionId }),
};

export const delivery = {
    getQueue: () => api.get('/delivery/queue'),
    confirm: (data: any) => api.post('/delivery/confirm', data),
};

export const subscriptions = {
    pause: (data: { subscriptionId: number, startDate: string, days: number }) => api.post('/subscriptions/pause', data),
    cancel: (data: { subscriptionId: number }) => api.post('/subscriptions/cancel', data)
};

export const menu = {
    getAll: () => api.get('/menu')
};

export default api;

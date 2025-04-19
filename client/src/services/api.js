import axios from 'axios';

// Set base URL for API requests
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Request interceptor to add the auth token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('flashcard_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an expired token and we haven't tried to refresh it yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Call the refresh token endpoint
        const refreshToken = localStorage.getItem('flashcard_refresh_token');
        const response = await axios.post('/api/auth/refresh', { token: refreshToken });
        
        // Store the new token
        const { token } = response.data;
        localStorage.setItem('flashcard_token', token);
        
        // Update the Authorization header for the original request
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        
        // Retry the original request with the new token
        return API(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, log the user out
        localStorage.removeItem('flashcard_token');
        localStorage.removeItem('flashcard_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Deck API functions
export const getDecksByUser = async () => {
  const response = await API.get('/decks');
  return response.data;
};

export const createDeck = async (deckData) => {
  const response = await API.post('/decks', deckData);
  return response.data;
};

export const getDeck = async (deckId) => {
  const response = await API.get(`/decks/${deckId}`);
  return response.data;
};

export const updateDeck = async (deckId, deckData) => {
  const response = await API.put(`/decks/${deckId}`, deckData);
  return response.data;
};

export const deleteDeck = async (deckId) => {
  const response = await API.delete(`/decks/${deckId}`);
  return response.data;
};

// Card API functions
export const getCardsByDeck = async (deckId) => {
  const response = await API.get(`/cards/deck/${deckId}`);
  return response.data;
};

export const createCard = async (cardData) => {
  const response = await API.post('/cards', cardData);
  return response.data;
};

export const getCard = async (cardId) => {
  const response = await API.get(`/cards/${cardId}`);
  return response.data;
};

export const updateCard = async (cardId, cardData) => {
  const response = await API.put(`/cards/${cardId}`, cardData);
  return response.data;
};

export const deleteCard = async (cardId) => {
  const response = await API.delete(`/cards/${cardId}`);
  return response.data;
};

export const reviewCard = async (cardId, performanceData) => {
  const response = await API.post(`/cards/${cardId}/review`, performanceData);
  return response.data;
};

// Credit API functions
export const getUserCredits = async () => {
  const response = await API.get('/credits/balance');
  return response.data;
};

export const getCreditPackages = async () => {
  const response = await API.get('/credits/packages');
  return response.data;
};

export const purchaseCredits = async (packageId) => {
  const response = await API.post('/credits/purchase', { packageId });
  return response.data;
};

export const getCreditHistory = async (page = 1) => {
  const response = await API.get(`/credits/transactions?page=${page}`);
  return response.data;
};

// Admin API functions
export const getUsersWithCredits = async () => {
  const response = await API.get('/admin/users');
  return response.data;
};

export const adjustUserCredits = async (userId, amount, reason) => {
  const response = await API.post(`/admin/users/${userId}/credits`, { amount, reason });
  return response.data;
};

export const getAdminCreditPackages = async () => {
  const response = await API.get('/admin/packages');
  return response.data;
};

export const createCreditPackage = async (packageData) => {
  const response = await API.post('/admin/packages', packageData);
  return response.data;
};

export const updateCreditPackage = async (packageId, packageData) => {
  const response = await API.put(`/admin/packages/${packageId}`, packageData);
  return response.data;
};

export const deleteCreditPackage = async (packageId) => {
  const response = await API.delete(`/admin/packages/${packageId}`);
  return response.data;
};

export const getAllTransactions = async (page = 1) => {
  const response = await API.get(`/admin/transactions?page=${page}`);
  return response.data;
};
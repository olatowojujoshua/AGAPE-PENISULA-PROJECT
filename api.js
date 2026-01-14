// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Authentication state
let currentUser = null;
let authToken = null;

// Check if user is logged in
function isLoggedIn() {
    return authToken && currentUser;
}

// Store auth data
function setAuthData(token, user) {
    authToken = token;
    currentUser = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Clear auth data
function clearAuthData() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}

// Load auth data from localStorage
function loadAuthData() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        return true;
    }
    return false;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Add auth token if available
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Registration
async function register(userData) {
    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.success) {
            setAuthData(response.data.token, response.data.user);
            showNotification('Registration successful!', 'success');
            return response.data;
        }
    } catch (error) {
        showNotification(error.message || 'Registration failed', 'error');
        throw error;
    }
}

// Login
async function login(email, password) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success) {
            setAuthData(response.data.token, response.data.user);
            showNotification('Login successful!', 'success');
            return response.data;
        }
    } catch (error) {
        showNotification(error.message || 'Login failed', 'error');
        throw error;
    }
}

// Logout
async function logout() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuthData();
        showNotification('Logged out successfully', 'success');
        updateUIForLoggedOutUser();
    }
}

// Get user profile
async function getUserProfile() {
    try {
        const response = await apiRequest('/auth/profile');
        return response.success ? response.data.user : null;
    } catch (error) {
        console.error('Get profile error:', error);
        return null;
    }
}

// Create chat session
async function createChatSession(title, counsellingType) {
    try {
        const response = await apiRequest('/chat/sessions', {
            method: 'POST',
            body: JSON.stringify({ title, counsellingType })
        });

        if (response.success) {
            return response.data.session;
        }
    } catch (error) {
        showNotification(error.message || 'Failed to create session', 'error');
        throw error;
    }
}

// Get chat sessions
async function getChatSessions(page = 1, limit = 10) {
    try {
        const response = await apiRequest(`/chat/sessions?page=${page}&limit=${limit}`);
        return response.success ? response.data : null;
    } catch (error) {
        console.error('Get sessions error:', error);
        return null;
    }
}

// Get chat session with messages
async function getChatSession(sessionId) {
    try {
        const response = await apiRequest(`/chat/sessions/${sessionId}`);
        return response.success ? response.data : null;
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
}

// Send message
async function sendMessage(sessionId, message) {
    try {
        const response = await apiRequest(`/chat/sessions/${sessionId}/message`, {
            method: 'POST',
            body: JSON.stringify({ message })
        });

        if (response.success) {
            return response.data;
        }
    } catch (error) {
        showNotification(error.message || 'Failed to send message', 'error');
        throw error;
    }
}

// End chat session
async function endChatSession(sessionId) {
    try {
        const response = await apiRequest(`/chat/sessions/${sessionId}/end`, {
            method: 'POST'
        });

        if (response.success) {
            showNotification('Session ended successfully', 'success');
            return response.data.summary;
        }
    } catch (error) {
        showNotification(error.message || 'Failed to end session', 'error');
        throw error;
    }
}

// Update UI based on auth state
function updateUIForLoggedInUser() {
    // Update navigation
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.textContent = currentUser.firstName;
        loginBtn.onclick = showUserMenu;
    }

    // Show/hide elements based on auth
    const authRequiredElements = document.querySelectorAll('.auth-required');
    authRequiredElements.forEach(el => el.style.display = 'block');

    const noAuthElements = document.querySelectorAll('.no-auth');
    noAuthElements.forEach(el => el.style.display = 'none');
}

function updateUIForLoggedOutUser() {
    // Update navigation
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.onclick = showLoginModal;
    }

    // Show/hide elements based on auth
    const authRequiredElements = document.querySelectorAll('.auth-required');
    authRequiredElements.forEach(el => el.style.display = 'none');

    const noAuthElements = document.querySelectorAll('.no-auth');
    noAuthElements.forEach(el => el.style.display = 'block');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease'
    });

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    if (loadAuthData()) {
        updateUIForLoggedInUser();
        console.log('User logged in:', currentUser);
    } else {
        updateUIForLoggedOutUser();
        console.log('No user logged in');
    }
});

// Export functions for use in other scripts
window.authAPI = {
    register,
    login,
    logout,
    getUserProfile,
    createChatSession,
    getChatSessions,
    getChatSession,
    sendMessage,
    endChatSession,
    isLoggedIn,
    currentUser: () => currentUser,
    authToken: () => authToken
};

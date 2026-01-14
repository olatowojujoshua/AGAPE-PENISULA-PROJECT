// Modern JavaScript for Agape Peninsula Counselling Website

// Global State
let currentUser = null;
let selectedCounsellingType = null;
let chatHistory = [];
let isTyping = false;

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const authModal = document.getElementById('authModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupScrollAnimations();
});

function initializeApp() {
    // Check for saved user session
    const savedUser = localStorage.getItem('agapeUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
    
    // Initialize chat with welcome message
    addAIMessage("Hello! I'm your AI counsellor at Agape Peninsula. I'm here to provide compassionate, professional support 24/7. How are you feeling today?");
}

function setupEventListeners() {
    // Mobile Navigation
    hamburger?.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    window.addEventListener('scroll', handleHeaderScroll);

    // Login button
    document.querySelectorAll('.login-btn').forEach(btn => {
        btn.addEventListener('click', openAuthModal);
    });

    // Modal close
    document.querySelector('.close-modal')?.addEventListener('click', closeModal);
    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) closeModal();
    });

    // Auth forms
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);

    // Chat input
    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Mobile Navigation
function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// Header Scroll Effect
function handleHeaderScroll() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
}

// Authentication Functions
function openAuthModal() {
    authModal.classList.add('active');
}

function closeModal() {
    authModal.classList.remove('active');
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === tab);
    });

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    // Simulate login (in production, this would call an API)
    if (email && password) {
        currentUser = {
            email,
            name: email.split('@')[0],
            plan: null,
            joinDate: new Date().toISOString()
        };
        
        localStorage.setItem('agapeUser', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        closeModal();
        showNotification('Welcome back!', 'success');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    // Simulate signup (in production, this would call an API)
    if (name && email && password) {
        currentUser = {
            name,
            email,
            plan: null,
            joinDate: new Date().toISOString()
        };
        
        localStorage.setItem('agapeUser', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        closeModal();
        showNotification('Account created successfully!', 'success');
    }
}

function updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn && currentUser) {
        loginBtn.textContent = currentUser.name;
        loginBtn.onclick = () => showUserDashboard();
    }
}

// AI Chat Functions
function startAIChat() {
    if (!currentUser) {
        openAuthModal();
        showNotification('Please login to start chatting', 'info');
        return;
    }
    
    scrollToSection('ai-counsellor');
    messageInput?.focus();
}

function sendMessage() {
    const message = messageInput?.value.trim();
    if (!message || isTyping) return;

    addUserMessage(message);
    messageInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate AI response
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateAIResponse(message);
        addAIMessage(response);
    }, 1000 + Math.random() * 2000);
}

function sendQuickMessage(message) {
    messageInput.value = message;
    sendMessage();
}

function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    chatHistory.push({ type: 'user', message, timestamp: new Date().toISOString() });
}

function addAIMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    chatHistory.push({ type: 'ai', message, timestamp: new Date().toISOString() });
}

function showTypingIndicator() {
    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = chatMessages.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function generateAIResponse(userMessage) {
    const responses = {
        anxiety: "I understand you're feeling anxious. Let's work through this together. Take a deep breath. What specific situations trigger your anxiety?",
        depressed: "I'm sorry to hear you're feeling depressed. You're not alone in this. Can you tell me more about what's been going on?",
        relationships: "Relationships can be challenging. I'm here to help you navigate these difficulties. What specific relationship issues are you facing?",
        spiritual: "Spiritual guidance is an important part of healing. I can provide both biblical and general counselling approaches. Which would you prefer?",
        default: "Thank you for sharing that with me. I'm here to support you. Could you tell me more about how you're feeling?"
    };

    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return responses.default;
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatMessages.innerHTML = '';
        chatHistory = [];
        addAIMessage("Chat cleared. How can I help you today?");
    }
}

function toggleVoiceChat() {
    showNotification('Voice chat coming soon!', 'info');
}

// Counselling Type Selection
function selectCounsellingType(type) {
    selectedCounsellingType = type;
    
    if (!currentUser) {
        openAuthModal();
        showNotification('Please login to select a counselling type', 'info');
        return;
    }
    
    showNotification(`You selected ${type} counselling. Redirecting to pricing...`, 'success');
    setTimeout(() => scrollToSection('pricing'), 1500);
}

// Payment Functions
function selectPlan(planId) {
    if (!currentUser) {
        openAuthModal();
        showNotification('Please login to select a plan', 'info');
        return;
    }
    
    const plans = {
        'student-daily': { name: 'Student Daily', price: 25 },
        'professional-daily': { name: 'Professional Daily', price: 30 },
        'student-monthly': { name: 'Student Monthly', price: 499 },
        'professional-monthly': { name: 'Professional Monthly', price: 599 },
        'student-yearly': { name: 'Student Yearly', price: 4999 },
        'professional-yearly': { name: 'Professional Yearly', price: 5999 }
    };
    
    const plan = plans[planId];
    if (plan) {
        processPayment(plan);
    }
}

function processPayment(plan) {
    showNotification(`Processing payment for ${plan.name} - $${plan.price}...`, 'info');
    
    // Simulate payment processing
    setTimeout(() => {
        currentUser.plan = plan;
        localStorage.setItem('agapeUser', JSON.stringify(currentUser));
        showNotification(`Payment successful! You now have access to ${plan.name}`, 'success');
        updateUIForLoggedInUser();
    }, 2000);
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '3000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showUserDashboard() {
    showNotification(`Welcome ${currentUser.name}! Plan: ${currentUser.plan?.name || 'None'}`, 'info');
}

// Scroll Animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.type-card, .pricing-card, .testimonial-card, .about-text, .about-image').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Active navigation link highlighting
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href')?.slice(1) === current) {
            link.style.color = '#6366f1';
        }
    });
});

// Add typing dots CSS
const style = document.createElement('style');
style.textContent = `
    .typing-dots {
        display: flex;
        gap: 4px;
        padding: 8px 0;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.7);
        animation: typing 1.4s infinite;
    }
    
    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
        }
        30% {
            transform: translateY(-10px);
        }
    }
`;
document.head.appendChild(style);

// Console log for debugging
console.log('Agape Peninsula Counselling website loaded successfully');

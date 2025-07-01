// frontend/js/api.js - API Service Layer
class PalatypusAPI {
    constructor() {
        this.baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://api.palatypus.com' 
            : 'http://localhost:3000';
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Community endpoints
    async joinCommunity(email, name = '') {
        return this.request('/community/signup', {
            method: 'POST',
            body: JSON.stringify({ email, name })
        });
    }

    async getCommunityStats() {
        return this.request('/community/stats');
    }

    // Music endpoints
    async getLatestMusic() {
        return this.request('/music/latest');
    }

    async getMusicStats() {
        return this.request('/music/stats');
    }

    // Content endpoints
    async getHomepageContent() {
        return this.request('/content/homepage');
    }

    // Analytics endpoints
    async trackEvent(event, data = {}) {
        return this.request('/analytics/track', {
            method: 'POST',
            body: JSON.stringify({ event, data })
        });
    }
}

// Initialize API client
const api = new PalatypusAPI();

// frontend/js/main.js - Modified Main Script
class PalatypusApp {
    constructor() {
        this.currentSlide = 0;
        this.autoSlideInterval = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        try {
            // Load dynamic content
            await this.loadDynamicContent();
            
            // Initialize UI components
            this.initializeCarousel();
            this.initializeScrollEffects();
            this.initializeVideo();
            this.bindEventHandlers();
            
            // Track page view
            this.trackEvent('page_view', { page: 'home' });
            
            // Hide loader
            setTimeout(() => this.hideLoader(), 1000);
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.hideLoader();
        }
    }

    async loadDynamicContent() {
        try {
            // Load homepage content
            const content = await api.getHomepageContent();
            this.renderDynamicContent(content);

            // Load latest music
            const music = await api.getLatestMusic();
            this.renderMusicContent(music);

            // Load community stats
            const stats = await api.getCommunityStats();
            this.updateCommunityStats(stats);

        } catch (error) {
            console.error('Failed to load dynamic content:', error);
            // Fallback to static content
        }
    }

    renderDynamicContent(content) {
        // Update hero section
        if (content.hero) {
            const tagline = document.querySelector('.hero-tagline');
            if (tagline && content.hero.tagline) {
                tagline.textContent = content.hero.tagline;
            }

            const ctaButton = document.querySelector('.find-event-btn');
            if (ctaButton && content.hero.ctaText) {
                ctaButton.innerHTML = `🎵 ${content.hero.ctaText}`;
            }
        }

        // Update announcements
        if (content.announcements && content.announcements.length > 0) {
            this.renderAnnouncements(content.announcements);
        }
    }

    renderMusicContent(music) {
        if (music.featured) {
            // Update music embeds with dynamic URLs
            const spotifyEmbed = document.querySelector('.spotify-embed-container iframe');
            if (spotifyEmbed && music.featured.spotify.embedUrl) {
                spotifyEmbed.src = music.featured.spotify.embedUrl;
            }
        }

        // Add recent tracks display
        if (music.recentTracks) {
            this.renderRecentTracks(music.recentTracks);
        }
    }

    updateCommunityStats(stats) {
        // Update subscriber count display
        const subscriberElements = document.querySelectorAll('.subscriber-count');
        subscriberElements.forEach(el => {
            el.textContent = `${stats.subscriberCount.toLocaleString()} members`;
        });
    }

    // Enhanced signup with backend integration
    async joinCommunity() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            
            // Show loading state
            const button = document.querySelector('.signup-btn');
            const originalText = button.textContent;
            button.textContent = 'Joining...';
            button.disabled = true;

            // Get email from form (you'd add an email input)
            const email = this.getEmailFromForm();
            const name = this.getNameFromForm();

            if (!email) {
                throw new Error('Email is required');
            }

            // Call backend API
            const result = await api.joinCommunity(email, name);

            if (result.success) {
                // Track successful signup
                this.trackEvent('community_signup', { email });

                // Show success message
                this.showSuccessMessage('🎉 Welcome to the community! Check your email for exclusive content.');
                
                // Update UI
                this.updateUIAfterSignup();
                
            } else {
                throw new Error(result.message || 'Signup failed');
            }

        } catch (error) {
            console.error('Signup error:', error);
            this.showErrorMessage(error.message || 'Something went wrong. Please try again.');
            
            // Track error
            this.trackEvent('signup_error', { error: error.message });
            
        } finally {
            this.isLoading = false;
            
            // Reset button
            const button = document.querySelector('.signup-btn');
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    getEmailFromForm() {
        // You'd need to add an email input field to your signup section
        const emailInput = document.querySelector('#email-input');
        return emailInput ? emailInput.value.trim() : null;
    }

    getNameFromForm() {
        const nameInput = document.querySelector('#name-input');
        return nameInput ? nameInput.value.trim() : '';
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    updateUIAfterSignup() {
        // Hide signup form and show thank you message
        const signupSection = document.querySelector('.signup-section');
        if (signupSection) {
            signupSection.innerHTML = `
                <div class="signup-success">
                    <h3>🎉 Welcome to the PaLaTyPuS Community!</h3>
                    <p>Check your email for exclusive content and updates.</p>
                    <div class="social-links">
                        <a href="https://open.spotify.com/artist/4ku7ePqgfHKnfsXybAKR9Z" target="_blank">Follow on Spotify</a>
                        <a href="https://soundcloud.com/p-a-latypus" target="_blank">Follow on SoundCloud</a>
                    </div>
                </div>
            `;
        }
    }

    // Enhanced analytics tracking
    async trackEvent(event, data = {}) {
        try {
            // Add standard data
            const eventData = {
                ...data,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            };

            // Send to backend
            await api.trackEvent(event, eventData);

            // Also send to Google Analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', event, eventData);
            }

        } catch (error) {
            console.error('Analytics tracking failed:', error);
        }
    }

    // Enhanced scroll tracking
    initializeScrollEffects() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            this.handleScroll();
            
            // Debounced scroll tracking
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackScrollDepth();
            }, 500);
        });
    }

    trackScrollDepth() {
        const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );

        // Track milestone scroll depths
        if (scrollPercent >= 75 && !this.tracked75) {
            this.trackEvent('scroll_depth', { percent: 75 });
            this.tracked75 = true;
        } else if (scrollPercent >= 50 && !this.tracked50) {
            this.trackEvent('scroll_depth', { percent: 50 });
            this.tracked50 = true;
        } else if (scrollPercent >= 25 && !this.tracked25) {
            this.trackEvent('scroll_depth', { percent: 25 });
            this.tracked25 = true;
        }
    }

    // Enhanced carousel with analytics
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % 2;
        this.updateCarousel();
        this.resetAutoSlide();
        
        // Track interaction
        this.trackEvent('carousel_next', { slide: this.currentSlide });
    }

    previousSlide() {
        this.currentSlide = (this.currentSlide - 1 + 2) % 2;
        this.updateCarousel();
        this.resetAutoSlide();
        
        // Track interaction
        this.trackEvent('carousel_previous', { slide: this.currentSlide });
    }

    // Music interaction tracking
    scrollToMusic() {
        document.getElementById('music').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Track music section engagement
        this.trackEvent('navigate_to_music');
    }

    // Other methods remain the same...
    initializeCarousel() {
        this.startAutoSlide();
    }

    initializeVideo() {
        // Video initialization logic
    }

    bindEventHandlers() {
        // Bind all event handlers
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });
    }

    hideLoader() {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    // ... rest of your existing methods
}

// Initialize the app
const app = new PalatypusApp();

// Global functions for backward compatibility
function scrollToMusic() {
    app.scrollToMusic();
}

function scrollToContent() {
    app.scrollToContent();
}

function joinCommunity() {
    app.joinCommunity();
}

function nextSlide() {
    app.nextSlide();
}

function previousSlide() {
    app.previousSlide();
}
import config, { getInstagramData } from './config.js';

let posts = []; 
let currentPostIndex = 0;
let isLoading = false;
let hasMore = true;

async function fetchInstagramPosts() {
    try {
        const data = await getInstagramData();
        if (!data || data.length === 0) {
            throw new Error('No posts found');
        }
        return data;
    } catch (error) {
        console.error('Error fetching Instagram posts:', error);
        throw error;
    }
}

async function showMorePosts() {
    if (isLoading || !hasMore) return;
    isLoading = true;

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const text = document.createElement('span');
    text.textContent = 'Loading posts...';
    
    loadingIndicator.appendChild(spinner);
    loadingIndicator.appendChild(text);
    document.getElementById('gallery').appendChild(loadingIndicator);

    try {
        if (posts.length === 0) {
            // Initial load
            const newPosts = await fetchInstagramPosts();
            if (newPosts && newPosts.length > 0) {
                posts = posts.concat(newPosts);
                displayPosts(posts);
            }
        }
        
        isLoading = false;
        hasMore = false; // Since we load all posts at once now
        
    } catch (error) {
        console.error('Error loading posts:', error);
        const gallery = document.getElementById('gallery');
        if (gallery) {
            gallery.innerHTML = '<div class="error">Error loading posts. Please try again later.</div>';
        }
        isLoading = false;
        hasMore = false;
    } finally {
        const indicator = document.querySelector('.loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

function showPost(index) {
    if (index >= 0 && index < posts.length) {
        currentPostIndex = index;
        const post = posts[index];
        const modalImg = document.getElementById('modalImage');
        const modalLink = document.getElementById('modalLink');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (modalImg && modalLink) {
            // Preload image
            const img = new Image();
            img.onload = function() {
                modalImg.src = post.media_url;
            };
            img.src = post.media_url;
            
            modalLink.href = post.permalink;
            
            // Update navigation buttons
            if (prevBtn) {
                prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
                prevBtn.onclick = () => showPost(index - 1);
            }
            if (nextBtn) {
                nextBtn.style.visibility = index === posts.length - 1 ? 'hidden' : 'visible';
                nextBtn.onclick = () => showPost(index + 1);
            }
        }
    }
}

function initModalControls() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    
    // Close button
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove('show');
        };
    }
    
    // Click outside to close
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    };
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('show')) {
            if (e.key === 'ArrowLeft') {
                const prevBtn = document.querySelector('.prev-btn');
                if (prevBtn && prevBtn.style.visibility !== 'hidden') {
                    showPost(currentPostIndex - 1);
                }
            } else if (e.key === 'ArrowRight') {
                const nextBtn = document.querySelector('.next-btn');
                if (nextBtn && nextBtn.style.visibility !== 'hidden') {
                    showPost(currentPostIndex + 1);
                }
            } else if (e.key === 'Escape') {
                modal.classList.remove('show');
            }
        }
    });
}

function initTouchGestures() {
    try {
        const modalContent = document.querySelector('.modallic-content');
        if (!modalContent || !Hammer) {
            console.warn('Modal content or Hammer.js not initialized yet');
            return;
        }

        const hammer = new Hammer(modalContent);
        hammer.on('swipeleft', () => {
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn && !nextBtn.disabled) nextBtn.click();
        });
        
        hammer.on('swiperight', () => {
            const prevBtn = document.querySelector('.prev-btn');
            if (prevBtn && !prevBtn.disabled) prevBtn.click();
        });
    } catch (error) {
        console.warn('Error initializing touch gestures:', error);
    }
}

async function loadInstagramPosts() {
    const gallery = document.getElementById('gallery');
    if (!gallery) {
        console.error('Gallery element not found');
        return;
    }

    // Reset state
    posts = [];
    currentPostIndex = 0;
    isLoading = false;
    hasMore = true;
    
    gallery.innerHTML = '';
    
    try {
        await showMorePosts();
        
        if (posts.length === 0) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'No posts found';
            gallery.appendChild(errorDiv);
            return;
        }
        
        // Initialize modal controls
        initModalControls();
        
        // Create sentinel for infinite scrolling
        createSentinel();
        
        // Initialize touch gestures after a short delay
        setTimeout(initTouchGestures, 1000);
        
    } catch (error) {
        console.error('Error loading posts:', error);
        gallery.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = 'Error loading posts. Please try again later.';
        gallery.appendChild(errorDiv);
    }
}

// Intersection Observer for infinite scrolling
const observerOptions = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
};

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading && hasMore) {
            console.log('Loading more posts...');
            showMorePosts();
        }
    });
}, observerOptions);

// Create and observe sentinel element
function createSentinel() {
    // Remove existing sentinel
    const existingSentinel = document.querySelector('.sentinel');
    if (existingSentinel) {
        existingSentinel.remove();
    }
    
    const sentinel = document.createElement('div');
    sentinel.className = 'sentinel';
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    document.getElementById('gallery').appendChild(sentinel);
    intersectionObserver.observe(sentinel);
}

function displayPosts(posts) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    gallery.innerHTML = ''; // Clear existing content
    
    if (!posts || posts.length === 0) {
        gallery.innerHTML = '<div class="error">No posts found</div>';
        return;
    }
    
    posts.forEach((post, index) => {
        if (!post.media_url) return; // Skip posts without media
        
        const div = document.createElement('div');
        div.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.src = post.media_url;
        img.alt = post.caption || 'Instagram post';
        
        div.addEventListener('click', () => {
            showPost(index);
            const modal = document.getElementById('modal');
            modal.classList.add('show');
        });
        
        div.appendChild(img);
        gallery.appendChild(div);
    });
}

// Initialize
loadInstagramPosts();

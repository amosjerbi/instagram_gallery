import config, { getInstagramData } from './config.js';

let currentPage = 0;
let posts = []; 
let currentPostIndex = 0;
let isLoading = false;
let hasMore = true;

async function fetchInstagramPosts() {
    try {
        console.log('Fetching Instagram posts...');
        const data = await getInstagramData();
        console.log('Raw data:', data);
        
        if (!data) {
            console.error('No data received from getInstagramData');
            throw new Error('No data received');
        }
        
        if (!Array.isArray(data.data)) {
            console.error('Data is not in expected format:', data);
            throw new Error('Invalid data format');
        }
        
        console.log('Fetched data:', data.data ? `${data.data.length} posts` : 'No posts in data');
        if (!data.data || data.data.length === 0) {
            throw new Error('No posts found');
        }
        return data.data;
    } catch (error) {
        console.error('Error fetching Instagram posts:', error);
        throw error;
    }
}

async function showMorePosts() {
    if (isLoading || !hasMore) {
        console.log('Skipping showMorePosts - isLoading:', isLoading, 'hasMore:', hasMore);
        return;
    }
    isLoading = true;
    console.log('Loading more posts...');

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
            console.log('Initial load - fetching all posts');
            const allPosts = await fetchInstagramPosts();
            if (allPosts && allPosts.length > 0) {
                posts = allPosts;
                console.log('Successfully loaded', posts.length, 'posts');
            }
        }

        const startIndex = currentPage * config.postsPerPage;
        const endIndex = startIndex + config.postsPerPage;
        console.log('Displaying posts from index', startIndex, 'to', endIndex);
        const postsToDisplay = posts.slice(startIndex, endIndex);
        
        if (postsToDisplay.length > 0) {
            console.log('Displaying batch of', postsToDisplay.length, 'posts');
            displayPostsBatch(postsToDisplay);
            currentPage++;
            hasMore = endIndex < posts.length;
            console.log('Updated state - currentPage:', currentPage, 'hasMore:', hasMore);
        } else {
            console.log('No more posts to display');
            hasMore = false;
        }
        
    } catch (error) {
        console.error('Error loading posts:', error);
        const gallery = document.getElementById('gallery');
        if (gallery) {
            gallery.innerHTML = '<div class="error">Error loading posts. Please try again later.</div>';
        }
        hasMore = false;
    } finally {
        isLoading = false;
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
    
    if (modal) {
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

function displayPostsBatch(newPosts) {
    console.log('Displaying batch of posts:', newPosts.length);
    const gallery = document.getElementById('gallery');
    if (!gallery) {
        console.error('Gallery element not found');
        return;
    }
    
    if (!newPosts || newPosts.length === 0) {
        console.log('No posts to display in this batch');
        if (posts.length === 0) {
            gallery.innerHTML = '<div class="error">No posts found</div>';
        }
        return;
    }
    
    // Remove existing sentinel before adding new posts
    const existingSentinel = document.querySelector('.sentinel');
    if (existingSentinel) {
        existingSentinel.remove();
    }
    
    newPosts.forEach((post, index) => {
        if (!post.media_url) {
            console.log('Skipping post', index, '- no media_url');
            return;
        }
        
        const div = document.createElement('div');
        div.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.src = post.media_url;
        img.alt = post.caption || 'Instagram post';
        
        div.addEventListener('click', () => {
            const absoluteIndex = (currentPage - 1) * config.postsPerPage + index;
            showPost(absoluteIndex);
            const modal = document.getElementById('modal');
            modal.classList.add('show');
        });
        
        div.appendChild(img);
        gallery.appendChild(div);
    });
    
    // Create new sentinel after adding posts
    if (hasMore) {
        createSentinel();
        console.log('Created new sentinel because hasMore is true');
    } else {
        console.log('No sentinel created because hasMore is false');
    }
    console.log('Finished displaying batch of posts');
}

function loadInstagramPosts() {
    const gallery = document.getElementById('gallery');
    if (!gallery) {
        console.error('Gallery element not found');
        return;
    }

    // Reset state
    posts = [];
    currentPage = 0;
    currentPostIndex = 0;
    isLoading = false;
    hasMore = true;
    
    gallery.innerHTML = '';
    
    try {
        showMorePosts();
        
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
    rootMargin: '200px', // Increased margin to trigger earlier
    threshold: 0.1
};

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading && hasMore) {
            console.log('Sentinel is visible, loading more posts...');
            showMorePosts();
        }
    });
}, observerOptions);

// Create and observe sentinel element
function createSentinel() {
    // Remove existing sentinel if it exists
    const existingSentinel = document.querySelector('.sentinel');
    if (existingSentinel) {
        existingSentinel.remove();
    }
    
    const sentinel = document.createElement('div');
    sentinel.className = 'sentinel';
    sentinel.style.height = '50px';  // Made taller for better detection
    sentinel.style.width = '100%';
    sentinel.style.marginTop = '20px';
    sentinel.style.marginBottom = '20px';
    document.getElementById('gallery').appendChild(sentinel);
    
    console.log('Created new sentinel element');
    intersectionObserver.observe(sentinel);
}

// Initialize
loadInstagramPosts();

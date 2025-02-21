import config from './config.js';
import MediaCache from './cache.js';

let posts = []; // Global variable to store posts
let currentPostIndex = 0;
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;

function initTouchGestures() {
    const modalContent = document.querySelector('.modallic-content');
    if (!modalContent || !window.Hammer) {
        console.error('Modal content or Hammer.js not found');
        return;
    }

    const hammer = new Hammer(modalContent);
    
    // Configure horizontal swipe
    hammer.get('swipe').set({ 
        direction: Hammer.DIRECTION_HORIZONTAL,
        threshold: 5,
        velocity: 0.1
    });
    
    hammer.on('swipeleft', () => {
        console.log('Swipe left detected');
        nextPost();
    });
    
    hammer.on('swiperight', () => {
        console.log('Swipe right detected');
        prevPost();
    });
}

function initInfiniteScroll() {
    console.log('Initializing infinite scroll');
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading && hasMorePosts) {
                console.log('Loading more posts from scroll trigger');
                loadMorePosts();
            }
        });
    }, options);

    // Create and observe sentinel element
    const sentinel = document.createElement('div');
    sentinel.id = 'sentinel';
    sentinel.style.height = '1px';
    document.getElementById('gallery').appendChild(sentinel);
    observer.observe(sentinel);
}

async function loadMorePosts() {
    if (isLoading || !hasMorePosts) return;
    
    isLoading = true;
    console.log('Loading more posts, page:', currentPage + 1);
    
    try {
        currentPage++;
        await showMorePosts();
    } catch (error) {
        console.error('Error loading more posts:', error);
    } finally {
        isLoading = false;
    }
}

function showMorePosts() {
    return new Promise((resolve) => {
        console.log('=== Starting showMorePosts ===');
        console.log('Current page:', currentPage);
        const startIndex = (currentPage - 1) * config.postsPerPage;
        const endIndex = startIndex + config.postsPerPage;
        console.log(`Showing posts from index ${startIndex} to ${endIndex}`);
        
        const postsToShow = posts.slice(startIndex, endIndex);
        console.log('Posts to show:', postsToShow.length);
        
        if (postsToShow.length === 0) {
            console.log('No more posts to show');
            hasMorePosts = false;
            resolve();
            return;
        }
        
        postsToShow.forEach((post, index) => {
            console.log(`Creating element for post ${index + startIndex}:`, post.id);
            const div = document.createElement('div');
            div.className = 'gallery-item';

            const img = document.createElement('img');
            img.className = 'img';
            
            // Try to get image URL from cache first
            let imageUrl = MediaCache.get(post.id);
            if (!imageUrl) {
                imageUrl = post.permalink + 'media/?size=l';
                // Cache the URL if loading is successful
                img.addEventListener('load', () => {
                    MediaCache.set(post.id, imageUrl);
                });
            }
            
            console.log(`Post ${post.id} URL:`, imageUrl);
            img.src = imageUrl;
            img.alt = post.caption || 'Instagram post';
            img.loading = 'lazy';
            
            img.onerror = () => {
                console.error(`Image load error for post ${post.id}:`, imageUrl);
                console.error('Post data:', JSON.stringify(post, null, 2));
                // Remove failed URL from cache
                MediaCache.remove(post.id);
                img.src = 'https://placehold.co/600x600?text=Image+Unavailable';
                div.classList.add('error');
            };

            img.onload = () => {
                console.log(`Image loaded successfully for post ${post.id}`);
                div.classList.remove('error');
            };
            
            div.addEventListener('click', () => {
                console.log(`Clicked post ${post.id} at index ${startIndex + index}`);
                showPost(startIndex + index);
            });

            div.appendChild(img);
            document.getElementById('gallery').appendChild(div);
        });
        
        hasMorePosts = endIndex < posts.length;
        console.log('Has more posts:', hasMorePosts);
        console.log('=== Finished showMorePosts ===');
        resolve();
    });
}

function showPost(index) {
    currentPostIndex = index;
    const post = posts[index];
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    const modalLink = document.getElementById('modalLink');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // Update navigation buttons
    prevBtn.style.display = index === 0 ? 'none' : 'flex';
    nextBtn.style.display = index === posts.length - 1 ? 'none' : 'flex';

    // Try to get image URL from cache first
    let imageUrl = MediaCache.get(post.id);
    if (!imageUrl) {
        imageUrl = post.permalink + 'media/?size=l';
        // Cache the URL if loading is successful
        modalImage.addEventListener('load', () => {
            MediaCache.set(post.id, imageUrl);
        }, { once: true });
    }

    // Update modal content
    modalImage.src = imageUrl;
    modalImage.alt = post.caption || 'Instagram post';
    modalLink.href = post.permalink;

    // Show modal with proper display style
    modal.style.display = 'flex';

    // Update modal image error handling
    modalImage.onerror = () => {
        console.error('Modal image failed to load:', post.permalink);
        // Remove failed URL from cache
        MediaCache.remove(post.id);
        modalImage.src = 'https://placehold.co/600x600?text=Image+Unavailable';
    };
}

function hideModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

function prevPost() {
    if (currentPostIndex > 0) {
        showPost(currentPostIndex - 1);
    }
}

function nextPost() {
    if (currentPostIndex < posts.length - 1) {
        showPost(currentPostIndex + 1);
    }
}

function initModalControls() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const modalContent = document.querySelector('.modallic-content');

    // Close modal when clicking outside the content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Close button
    closeBtn.addEventListener('click', hideModal);

    // Navigation buttons
    prevBtn.addEventListener('click', prevPost);
    nextBtn.addEventListener('click', nextPost);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'flex') {
            if (e.key === 'Escape') {
                hideModal();
            } else if (e.key === 'ArrowLeft') {
                prevPost();
            } else if (e.key === 'ArrowRight') {
                nextPost();
            }
        }
    });

    // Initialize touch gestures
    initTouchGestures();
}

async function loadInstagramPosts() {
    console.log('=== Starting loadInstagramPosts ===');
    const gallery = document.getElementById('gallery');
    if (!gallery) {
        console.error('Gallery element not found');
        return;
    }

    try {
        console.log('Attempting to fetch Instagram posts...');
        const jsonPath = 'data/instagram.json';
        console.log('Fetching JSON from:', jsonPath);
        
        const response = await fetch(jsonPath);
        console.log('Fetch response:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Total posts in data:', data.data?.length || 0);
        gallery.innerHTML = '';

        if (!data.data || data.data.length === 0) {
            throw new Error('No posts found in the response');
        }

        // Store posts globally and filter media types
        posts = data.data.filter(post => {
            const isAllowed = config.allowedMediaTypes.includes(post.media_type);
            console.log(`Post ${post.id}: type=${post.media_type}, allowed=${isAllowed}`);
            return isAllowed;
        });
        
        console.log('Filtered posts count:', posts.length);

        if (posts.length === 0) {
            throw new Error('No compatible posts found');
        }

        // Show initial posts
        console.log('Showing initial posts...');
        await showMorePosts();
        
        // Initialize infinite scroll
        initInfiniteScroll();
        
        // Initialize modal controls after posts are loaded
        initModalControls();
        
        console.log('=== Finished loadInstagramPosts ===');
    } catch (error) {
        console.error('Error in loadInstagramPosts:', error);
        gallery.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = 'Error loading posts: ' + error.message;
        gallery.appendChild(errorDiv);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', loadInstagramPosts);

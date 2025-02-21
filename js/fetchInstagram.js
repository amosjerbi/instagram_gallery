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
            const div = createGalleryItem(post);
            document.getElementById('gallery').appendChild(div);
        });
        
        hasMorePosts = endIndex < posts.length;
        console.log('Has more posts:', hasMorePosts);
        console.log('=== Finished showMorePosts ===');
        resolve();
    });
}

function createGalleryItem(post) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    
    // Add video class and play icon if media type is VIDEO or REEL
    if (post.media_type === 'VIDEO' || post.media_type === 'REEL') {
        div.className += ' video';
        const playIcon = document.createElement('div');
        playIcon.className = 'play-icon';
        playIcon.innerHTML = '<ion-icon name="play"></ion-icon>';
        div.appendChild(playIcon);
    }

    const img = document.createElement('img');
    img.src = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
    img.loading = 'lazy';
    
    div.appendChild(img);
    div.addEventListener('click', () => showPost(post));
    return div;
}

function showPost(post) {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    
    if (post.media_type === 'VIDEO' || post.media_type === 'REEL') {
        // Create video element for videos/reels
        const video = document.createElement('video');
        video.src = post.media_url;
        video.controls = true;
        video.autoplay = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '85vh';
        video.style.borderRadius = '16px';
        
        // Replace image with video
        modalImage.style.display = 'none';
        video.id = 'modalVideo';
        
        // Remove existing video if any
        const existingVideo = document.getElementById('modalVideo');
        if (existingVideo) {
            existingVideo.remove();
        }
        
        modalImage.parentNode.insertBefore(video, modalImage);
    } else {
        // Handle image posts
        modalImage.style.display = 'block';
        modalImage.src = post.media_url;
        
        // Remove video if exists
        const existingVideo = document.getElementById('modalVideo');
        if (existingVideo) {
            existingVideo.remove();
        }
    }
    
    modal.style.display = 'flex';
    currentPostIndex = posts.findIndex(p => p.id === post.id);
    updateNavigationButtons();
}

function hideModal() {
    const modal = document.getElementById('modal');
    const video = document.getElementById('modalVideo');
    
    // Stop video playback if exists
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
    
    modal.style.display = 'none';
}

function prevPost() {
    if (currentPostIndex > 0) {
        showPost(posts[currentPostIndex - 1]);
    }
}

function nextPost() {
    if (currentPostIndex < posts.length - 1) {
        showPost(posts[currentPostIndex + 1]);
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

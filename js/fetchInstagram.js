import config from './config.js';

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
            
            const imageUrl = post.permalink + 'media/?size=l';
            console.log(`Post ${post.id} URL:`, imageUrl);
            img.src = imageUrl;
            img.alt = post.caption || 'Instagram post';
            img.loading = 'lazy';
            
            img.onerror = () => {
                console.error(`Image load error for post ${post.id}:`, imageUrl);
                console.error('Post data:', JSON.stringify(post, null, 2));
                img.src = 'https://placehold.co/600x600?text=Image+Unavailable';
                div.classList.add('error');
            };

            img.onload = () => {
                console.log(`Image loaded successfully for post ${post.id}`);
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
    const modalCaption = document.querySelector('.modal-caption');
    const modalDate = document.querySelector('.modal-date');
    const modalLink = document.querySelector('.modal-link');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // Update navigation buttons
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === posts.length - 1;

    // Update modal content
    modalImage.src = post.permalink + 'media/?size=l';
    modalImage.alt = post.caption || 'Instagram post';
    modalCaption.textContent = post.caption || '';
    modalDate.textContent = new Date(post.timestamp).toLocaleDateString();
    modalLink.href = post.permalink;

    // Show modal with animation
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);

    // Update modal image error handling
    modalImage.onerror = () => {
        console.error('Modal image failed to load:', post.permalink);
        modalImage.src = 'https://placehold.co/600x600?text=Image+Unavailable';
    };
}

function hideModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
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

    // Close button
    closeBtn.onclick = hideModal;

    // Click outside to close
    modal.onclick = (event) => {
        if (event.target === modal) {
            hideModal();
        }
    };

    // Navigation buttons
    prevBtn.onclick = prevPost;
    nextBtn.onclick = nextPost;

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block') {
            if (e.key === 'ArrowLeft') prevPost();
            if (e.key === 'ArrowRight') nextPost();
            if (e.key === 'Escape') hideModal();
        }
    });
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

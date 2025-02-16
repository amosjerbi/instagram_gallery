import config from './config.js';

let posts = []; // Global variable to store posts
let currentPostIndex = 0;
let currentPage = 1;

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

function showMorePosts() {
    const startIndex = (currentPage - 1) * config.postsPerPage;
    const endIndex = startIndex + config.postsPerPage;
    const postsToShow = posts.slice(startIndex, endIndex);
    
    postsToShow.forEach((post, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';

        // Create a link to the Instagram post
        const link = document.createElement('a');
        link.href = post.permalink || `https://instagram.com/p/${post.id}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Create thumbnail div with post type indicator
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail';
        
        // Add media type indicator
        const typeIndicator = document.createElement('span');
        typeIndicator.className = 'media-type';
        typeIndicator.textContent = post.media_type === 'VIDEO' ? '▶️' : 
                                  post.media_type === 'CAROUSEL_ALBUM' ? '📑' : '📷';
        
        // Add caption preview
        const caption = document.createElement('div');
        caption.className = 'caption-preview';
        caption.textContent = post.caption ? post.caption.slice(0, 100) + '...' : '';
        
        thumbnail.appendChild(typeIndicator);
        thumbnail.appendChild(caption);
        link.appendChild(thumbnail);
        div.appendChild(link);
        document.getElementById('gallery').appendChild(div);
    });
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (endIndex >= posts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
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
            modalImg.src = post.media_url;
            modalLink.href = post.permalink;
            
            // Update navigation buttons visibility
            if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : 'block';
            if (nextBtn) nextBtn.style.display = index === posts.length - 1 ? 'none' : 'block';
        }
    }
}

function nextPost() {
    console.log('Next post called, current index:', currentPostIndex);
    if (currentPostIndex < posts.length - 1) {
        showPost(currentPostIndex + 1);
    }
}

function prevPost() {
    console.log('Previous post called, current index:', currentPostIndex);
    if (currentPostIndex > 0) {
        showPost(currentPostIndex - 1);
    }
}

async function loadInstagramPosts() {
    const gallery = document.getElementById('gallery');
    if (!gallery) {
        console.error('Gallery element not found');
        return;
    }

    // Create a loading container
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading';
    loadingContainer.textContent = 'Loading posts...';
    gallery.appendChild(loadingContainer);
    
    try {
        console.log('Fetching Instagram posts...');
        const response = await fetch('data/instagram.json');
        if (!response.ok) {
            console.error('Failed to fetch posts:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        gallery.innerHTML = ''; // Only clear the gallery div

        if (!data.data || !Array.isArray(data.data)) {
            console.error('Invalid data format:', data);
            throw new Error('Invalid data format');
        }

        // Store posts globally and filter media types
        posts = data.data.filter(post => {
            console.log('Post media URL:', post.media_url);
            return config.allowedMediaTypes.includes(post.media_type);
        });
        console.log('Filtered posts:', posts.length);

        if (posts.length === 0) {
            console.error('No posts match the allowed media types:', config.allowedMediaTypes);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'No compatible posts found';
            gallery.appendChild(errorDiv);
            return;
        }

        // Add click event for load more
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                currentPage++;
                showMorePosts();
            });
        }

        // Show initial posts
        showMorePosts();

        // Initialize touch gestures
        initTouchGestures();

        // Add modal close functionality
        const modal = document.getElementById('modal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }
        
        // Add navigation button functionality
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', prevPost);
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', nextPost);
        }
        
        // Add click outside modal to close
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (modal.style.display === 'block') {
                if (e.key === 'ArrowLeft') prevPost();
                if (e.key === 'ArrowRight') nextPost();
                if (e.key === 'Escape') modal.style.display = 'none';
            }
        });

    } catch (error) {
        console.error('Error loading posts:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = 'Error loading posts. Please try again later.';
        gallery.appendChild(errorDiv);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', loadInstagramPosts);

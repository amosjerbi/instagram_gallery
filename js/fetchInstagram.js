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

        // Create the embed iframe
        const iframe = document.createElement('iframe');
        iframe.className = 'instagram-embed';
        iframe.src = `https://www.instagram.com/p/${post.id}/embed`;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.allowTransparency = true;

        div.appendChild(iframe);

        // Add click event listener to show the modal
        div.addEventListener('click', (e) => {
            e.preventDefault();
            showModal(post, index);
        });

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
    
    // Add Instagram embed script
    if (!document.getElementById('instagram-embed-script')) {
        const script = document.createElement('script');
        script.id = 'instagram-embed-script';
        script.src = '//www.instagram.com/embed.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }
}

function showModal(post, index) {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modallic-content');
    
    // Create embed iframe for modal
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.instagram.com/p/${post.id}/embed/captioned`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.allowTransparency = true;
    
    // Clear previous content and add new iframe
    modalContent.innerHTML = '';
    modalContent.appendChild(iframe);
    
    // Show modal
    modal.style.display = 'flex';
    
    // Update navigation buttons
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    
    prevBtn.style.display = index > 0 ? 'block' : 'none';
    nextBtn.style.display = index < posts.length - 1 ? 'block' : 'none';
    
    prevBtn.onclick = () => {
        if (index > 0) showModal(posts[index - 1], index - 1);
    };
    
    nextBtn.onclick = () => {
        if (index < posts.length - 1) showModal(posts[index + 1], index + 1);
    };
    
    // Close button handler
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}

function nextPost() {
    console.log('Next post called, current index:', currentPostIndex);
    if (currentPostIndex < posts.length - 1) {
        showModal(posts[currentPostIndex + 1], currentPostIndex + 1);
    }
}

function prevPost() {
    console.log('Previous post called, current index:', currentPostIndex);
    if (currentPostIndex > 0) {
        showModal(posts[currentPostIndex - 1], currentPostIndex - 1);
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

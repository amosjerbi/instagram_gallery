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
    console.log('=== Starting showMorePosts ===');
    console.log('Current page:', currentPage);
    const startIndex = (currentPage - 1) * config.postsPerPage;
    const endIndex = startIndex + config.postsPerPage;
    console.log(`Showing posts from index ${startIndex} to ${endIndex}`);
    
    const postsToShow = posts.slice(startIndex, endIndex);
    console.log('Posts to show:', postsToShow.length);
    
    postsToShow.forEach((post, index) => {
        console.log(`Creating element for post ${index + startIndex}:`, post.id);
        const div = document.createElement('div');
        div.className = 'gallery-item';

        const img = document.createElement('img');
        img.className = 'img';
        
        // Use the Instagram permalink for the image
        const imageUrl = post.permalink + 'media/?size=l';
        console.log(`Post ${post.id} URL:`, imageUrl);
        img.src = imageUrl;
        img.alt = post.caption || 'Instagram post';
        img.loading = 'lazy';
        
        // Add error handling for images
        img.onerror = () => {
            console.error(`Image load error for post ${post.id}:`, imageUrl);
            console.error('Post data:', JSON.stringify(post, null, 2));
            img.src = 'https://placehold.co/600x600?text=Image+Unavailable';
            div.classList.add('error');
        };

        img.onload = () => {
            console.log(`Image loaded successfully for post ${post.id}`);
        };
        
        // Add click event listener to show the modal
        div.addEventListener('click', () => {
            console.log(`Clicked post ${post.id} at index ${startIndex + index}`);
            showPost(startIndex + index);
            document.getElementById('modal').style.display = 'block';
        });

        div.appendChild(img);
        document.getElementById('gallery').appendChild(div);
    });
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        const hasMore = endIndex < posts.length;
        console.log('Has more posts:', hasMore);
        loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    }
    console.log('=== Finished showMorePosts ===');
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
    console.log('=== Starting loadInstagramPosts ===');
    const gallery = document.getElementById('gallery');
    if (!gallery) {
        console.error('Gallery element not found');
        return;
    }
    console.log('Gallery element found:', gallery);

    // Create a loading container
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading';
    loadingContainer.textContent = 'Loading posts...';
    gallery.appendChild(loadingContainer);
    console.log('Added loading indicator');
    
    try {
        console.log('Attempting to fetch Instagram posts...');
        console.log('Current URL:', window.location.href);
        const jsonPath = 'data/instagram.json';
        console.log('Fetching JSON from:', jsonPath);
        
        const response = await fetch(jsonPath);
        console.log('Fetch response:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
        });

        if (!response.ok) {
            console.error('Failed to fetch posts:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw data structure:', JSON.stringify(data, null, 2));
        gallery.innerHTML = ''; // Only clear the gallery div

        if (!data.data || data.data.length === 0) {
            console.error('No posts found in the response');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'No posts found';
            gallery.appendChild(errorDiv);
            return;
        }

        console.log('Total posts in data:', data.data.length);
        console.log('Allowed media types:', config.allowedMediaTypes);

        // Store posts globally and filter media types
        posts = data.data.filter(post => {
            const isAllowed = config.allowedMediaTypes.includes(post.media_type);
            console.log(`Post ${post.id}: type=${post.media_type}, allowed=${isAllowed}`);
            return isAllowed;
        });
        
        console.log('Filtered posts count:', posts.length);

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
            console.log('Setting up load more button');
            loadMoreBtn.addEventListener('click', () => {
                currentPage++;
                showMorePosts();
            });
        }

        // Show initial posts
        console.log('Showing initial posts...');
        showMorePosts();
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

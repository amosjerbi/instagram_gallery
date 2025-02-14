import config from './config.js';
import token from './token.js';

let posts = []; 
let currentPostIndex = 0;
let currentPage = 1;

const shimmerTypes = ['shimmer-sweep', 'shimmer-pulse', 'shimmer-wave', 'shimmer-spotlight'];
let currentShimmerType = 'shimmer-spotlight'; // Default to first option

function createLoadingPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = `masonry-item loading ${currentShimmerType}`;
    // Add modern variant if desired
    placeholder.className += ' modern';
    return placeholder;
}

async function fetchInstagramPosts() {
    const fields = 'id,caption,media_type,media_url,permalink,timestamp';
    const limit = config.maxPosts;
    
    const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${token.instagramToken}&limit=${limit}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Instagram posts:', error);
        throw error;
    }
}

function showMorePosts(isLoadMore = false) {
    const startIndex = (currentPage - 1) * config.postsPerPage;
    const endIndex = startIndex + config.postsPerPage;
    const postsToShow = posts.slice(startIndex, endIndex);
    
    const gallery = document.querySelector('.masonry-gallery');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (!gallery) return;

    // Only clear the gallery if it's not a load more action
    if (!isLoadMore) {
        gallery.innerHTML = '';
    }

    postsToShow.forEach((post, index) => {
        if (post.media_type !== 'VIDEO') {
            const div = document.createElement('div');
            div.className = 'masonry-item';

            const img = document.createElement('img');
            img.src = post.media_url;
            img.alt = post.caption || 'Instagram post';
            img.loading = 'lazy';
            
            img.onerror = () => {
                console.error('Failed to load image:', post.media_url);
                div.classList.add('error');
            };
            
            div.addEventListener('click', () => {
                showPost(startIndex + index);
                document.getElementById('modal').style.display = 'block';
            });

            div.appendChild(img);
            gallery.appendChild(div);
        }
    });

    // Update load more button visibility
    if (loadMoreBtn) {
        if (endIndex >= posts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.disabled = false;
        }
    }
}

async function loadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const gallery = document.querySelector('.masonry-gallery');
    
    if (loadMoreBtn) {
        loadMoreBtn.classList.add('loading');
        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;
    }
    
    // Cycle through shimmer types for variety
    currentShimmerType = shimmerTypes[(shimmerTypes.indexOf(currentShimmerType) + 1) % shimmerTypes.length];
    
    const placeholderCount = config.postsPerPage;
    for (let i = 0; i < placeholderCount; i++) {
        gallery.appendChild(createLoadingPlaceholder());
    }
    
    currentPage++;
    showMorePosts(true);
    
    if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Load More';
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
            
            if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : 'block';
            if (nextBtn) nextBtn.style.display = index === posts.length - 1 ? 'none' : 'block';
        }
    }
}

function nextPost() {
    if (currentPostIndex < posts.length - 1) {
        showPost(currentPostIndex + 1);
    }
}

function prevPost() {
    if (currentPostIndex > 0) {
        showPost(currentPostIndex - 1);
    }
}

async function initializeGallery() {
    const gallery = document.querySelector('.masonry-gallery');
    if (!gallery) {
        console.error('Gallery element not found');
        return;
    }

    try {
        gallery.classList.add('initializing');
        gallery.innerHTML = '';
        
        const placeholderCount = window.innerWidth > 1400 ? 12 : 
                               window.innerWidth > 1024 ? 9 : 
                               window.innerWidth > 480 ? 6 : 4;
        
        for (let i = 0; i < placeholderCount; i++) {
            gallery.appendChild(createLoadingPlaceholder());
        }
        
        const data = await fetchInstagramPosts();
        console.log('Received Instagram data:', data);
        
        if (!data.data || data.data.length === 0) {
            gallery.innerHTML = '<div class="error">No posts found</div>';
            return;
        }

        posts = data.data;
        currentPage = 1;
        
        gallery.classList.remove('initializing');
        gallery.innerHTML = '';
        
        showMorePosts(false);

        // Set up load more button
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.removeEventListener('click', loadMore);
            loadMoreBtn.addEventListener('click', loadMore);
        }

        const modal = document.getElementById('modal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }
        
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', prevPost);
        if (nextBtn) nextBtn.addEventListener('click', nextPost);
        
        document.addEventListener('keydown', (e) => {
            if (modal.style.display === 'block') {
                if (e.key === 'ArrowLeft') prevPost();
                if (e.key === 'ArrowRight') nextPost();
                if (e.key === 'Escape') modal.style.display = 'none';
            }
        });

    } catch (error) {
        console.error('Failed to initialize gallery:', error);
        gallery.innerHTML = '<div class="error">Failed to load Instagram posts</div>';
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGallery);

// Export functions for external use
export { initializeGallery, showMorePosts, prevPost, nextPost, loadMore };

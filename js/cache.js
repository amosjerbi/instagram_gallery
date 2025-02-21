// Cache utility for Instagram media URLs
const CACHE_PREFIX = 'instagram_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class MediaCache {
    static getKey(postId) {
        return `${CACHE_PREFIX}${postId}`;
    }

    static set(postId, mediaUrl) {
        const cacheEntry = {
            url: mediaUrl,
            timestamp: Date.now(),
            expires: Date.now() + CACHE_EXPIRY
        };
        try {
            localStorage.setItem(
                this.getKey(postId),
                JSON.stringify(cacheEntry)
            );
            return true;
        } catch (error) {
            console.error('Cache storage error:', error);
            this.cleanup(); // Try to free up space
            return false;
        }
    }

    static get(postId) {
        try {
            const cacheEntry = JSON.parse(
                localStorage.getItem(this.getKey(postId))
            );
            
            if (!cacheEntry) return null;

            // Check if cache entry has expired
            if (Date.now() > cacheEntry.expires) {
                this.remove(postId);
                return null;
            }

            return cacheEntry.url;
        } catch (error) {
            console.error('Cache retrieval error:', error);
            return null;
        }
    }

    static remove(postId) {
        localStorage.removeItem(this.getKey(postId));
    }

    static cleanup() {
        // Remove expired entries and try to free up space
        const keys = Object.keys(localStorage);
        const now = Date.now();

        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const cacheEntry = JSON.parse(localStorage.getItem(key));
                    if (now > cacheEntry.expires) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    // If entry is corrupted, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }
}

export default MediaCache;

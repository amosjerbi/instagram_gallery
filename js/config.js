// Instagram Gallery Configuration
const config = {
    postsPerPage: 50,
    maxPosts: 270,
    apiFields: 'id,caption,media_type,media_url,permalink,timestamp',
    allowedMediaTypes: ['IMAGE', 'CAROUSEL_ALBUM']
};

// Instagram data management
export async function getInstagramData() {
    try {
        const response = await fetch('./assets/data/instagram-posts.json');
        if (!response.ok) {
            throw new Error('Failed to load Instagram data');
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error loading Instagram data:', error);
        throw new Error('Failed to load Instagram data. Please try again later.');
    }
}

export default config;
//end of instagram data

/**
 * PodcastClient - API client for interacting with podcast-related endpoints
 */

export interface PodcastCreator {
    name: string;
    img: string;
}

export interface Episode {
    id: string;
    name: string;
    desc: string;
    thumbnail: string;
    creator_id: string;
    type: string;
    duration: number;
    file: string;
    created_at: string;
    updated_at: string;
}

export interface Podcast {
    id: string;
    name: string;
    desc: string;
    thumbnail: string;
    creator_id: string;
    tags: string[];
    type: string;
    category: string;
    views: number;
    episodes: Episode[];
    created_at: string;
    updated_at: string;
    creator?: PodcastCreator;
}

export interface PodcastWithRelations extends Podcast {
    creator: PodcastCreator;
    episodes: Episode[];
}

export class PodcastClient {
    private baseUrl: string;

    constructor() {
        // Get API URL from environment variables with fallback
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    }

    /**
     * Get all podcasts
     */
    async getAllPodcasts(): Promise<PodcastWithRelations[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/podcasts/`);
            if (!response.ok) {
                throw new Error(`Error fetching podcasts: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch podcasts:', error);
            throw error;
        }
    }

    /**
     * Get a specific podcast by ID
     */
    async getPodcastById(id: string): Promise<PodcastWithRelations> {
        try {
            const response = await fetch(`${this.baseUrl}/api/podcasts/get/${id}`);
            if (!response.ok) {
                throw new Error(`Error fetching podcast: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch podcast with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get most popular podcasts
     */
    async getMostPopularPodcasts(): Promise<PodcastWithRelations[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/podcasts/mostpopular`);
            if (!response.ok) {
                throw new Error(`Error fetching popular podcasts: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch popular podcasts:', error);
            throw error;
        }
    }

    /**
     * Get random podcasts
     */
    async getRandomPodcasts(): Promise<PodcastWithRelations[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/podcasts/random`);
            if (!response.ok) {
                throw new Error(`Error fetching random podcasts: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch random podcasts:', error);
            throw error;
        }
    }

    /**
     * Search podcasts by query
     */
    async searchPodcasts(query: string): Promise<PodcastWithRelations[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/podcasts/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`Error searching podcasts: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to search podcasts with query "${query}":`, error);
            throw error;
        }
    }

    /**
     * Get podcasts by category
     */
    async getPodcastsByCategory(category: string): Promise<PodcastWithRelations[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/podcasts/category?q=${encodeURIComponent(category)}`);
            if (!response.ok) {
                throw new Error(`Error fetching podcasts by category: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch podcasts in category "${category}":`, error);
            throw error;
        }
    }

    /**
     * Get podcasts by tags
     */
    async getPodcastsByTags(tags: string[]): Promise<PodcastWithRelations[]> {
        try {
            const tagsString = tags.join(',');
            const response = await fetch(`${this.baseUrl}/api/podcasts/tags?tags=${encodeURIComponent(tagsString)}`);
            if (!response.ok) {
                throw new Error(`Error fetching podcasts by tags: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch podcasts with tags "${tags}":`, error);
            throw error;
        }
    }

    /**
     * Add view to a podcast
     */
    async addPodcastView(id: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/podcasts/addview/${id}`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error(`Error adding view to podcast: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Failed to add view to podcast with ID ${id}:`, error);
            throw error;
        }
    }
} 
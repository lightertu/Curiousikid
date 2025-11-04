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


export class PodcastClient {
    /**
     * Get all podcasts
     * Calls Next.js API route which proxies to backend
     */
    async getAllPodcasts(): Promise<Podcast[]> {
        try {
            const response = await fetch('/api/podcasts');
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
     * Calls Next.js API route which proxies to backend
     */
    async getPodcastById(id: string): Promise<Podcast> {
        try {
            const response = await fetch(`/api/podcasts/${id}`);
            if (!response.ok) {
                throw new Error(`Error fetching podcast: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch podcast with ID ${id}:`, error);
            throw error;
        }
    }
} 
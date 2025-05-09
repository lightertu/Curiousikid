interface Creator {
    name: string
    img: string
}

interface Episode {
    id: string
    name: string
    desc: string
    file: string
    creator: Creator
}


interface Podcast {
    id: string
    name: string
    category: string
    desc: string
    thumbnail: string
    type: string
    views: number
    creator: Creator
    tags: string[]
    episodes: Episode[]
    createdAt: string
}

export type { Episode, Podcast }
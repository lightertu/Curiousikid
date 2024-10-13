import { unstable_cache, revalidateTag } from 'next/cache';

// Mock data
const mockSongs = [
  { id: '1', 
    name: 'Dr. Victor Carrión: How to Heal From Post-Traumatic Stress Disorder (PTSD)', 
    artist: 'Andrew Huberman', 
    album: 'Huberman Lab', 
    duration: 8818, 
    imageUrl: 'https://megaphone.imgix.net/podcasts/042e6144-725e-11ec-a75d-c38f702aecad/image/Huberman-Lab-Podcast-Thumbnail-3000x3000.png?ixlib=rails-4.3.1&max-w=3000&max-h=3000&fit=crop&auto=format,compress', 
    audioUrl: 'https://dcs-spotify.megaphone.fm/SCIM6456251481.mp3?key=35e96ab6e76366104fc4100b969a39d5&request_event_id=ca383c29-36f0-4abd-9fb9-ac24dc64ca9f&timetoken=1728844385_528C76F0658DC9C55E80F982FFC903B3', 
    createdAt: new Date('2024-09-23') },
];

const mockPlaylists = [
  { id: '1', 
    name: 'Huberman Lab', 
    coverUrl: 'https://megaphone.imgix.net/podcasts/042e6144-725e-11ec-a75d-c38f702aecad/image/Huberman-Lab-Podcast-Thumbnail-3000x3000.png?ixlib=rails-4.3.1&max-w=3000&max-h=3000&fit=crop&auto=format,compress', createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') 
  },
];

const mockPlaylistSongs = [
  { playlistId: '1', songId: '1', order: 1 },
];

export let getAllSongs = unstable_cache(
  async () => {
    return mockSongs.sort((a, b) => a.name.localeCompare(b.name));
  },
  ['all-songs'],
  { tags: ['songs'] }
);

export let getSongById = unstable_cache(
  async (id: string) => {
    return mockSongs.find(song => song.id === id) || null;
  },
  ['song-by-id'],
  { tags: ['songs'] }
);

export let getAllPlaylists = unstable_cache(
  async () => {
    return mockPlaylists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  ['all-playlists'],
  { tags: ['playlists'] }
);

export let getPlaylistWithSongs = unstable_cache(
  async (id: string) => {
    const playlist = mockPlaylists.find(p => p.id === id);
    if (!playlist) return null;

    const playlistSongs = mockPlaylistSongs
      .filter(ps => ps.playlistId === id)
      .map(ps => {
        const song = mockSongs.find(s => s.id === ps.songId);
        return { ...song, order: ps.order };
      })
      .sort((a, b) => a.order - b.order);

    const trackCount = playlistSongs.length;
    const duration = playlistSongs.reduce((total, song) => total + song.duration, 0);

    return {
      ...playlist,
      songs: playlistSongs,
      trackCount,
      duration,
    };
  },
  ['playlist-with-songs'],
  { tags: ['playlists', 'songs'] }
);

export let addSongToPlaylist = async (
  playlistId: string,
  songId: string,
  order: number
) => {
  mockPlaylistSongs.push({ playlistId, songId, order });
  revalidateTag('playlists');
  return { success: true };
};

export let removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
) => {
  const index = mockPlaylistSongs.findIndex(ps => ps.playlistId === playlistId && ps.songId === songId);
  if (index !== -1) {
    mockPlaylistSongs.splice(index, 1);
  }
  revalidateTag('playlists');
  return { success: true };
};

export let createPlaylist = async (
  id: string,
  name: string,
  coverUrl?: string
) => {
  const newPlaylist = { 
    id, 
    name, 
    coverUrl: coverUrl || '', 
    createdAt: new Date(), 
    updatedAt: new Date() 
  };  
  mockPlaylists.push(newPlaylist);
  revalidateTag('playlists');
  return newPlaylist;
};

export let updatePlaylist = async (
  id: string,
  name: string,
  coverUrl?: string
) => {
  const playlist = mockPlaylists.find(p => p.id === id);
  if (playlist) {
    playlist.name = name;
    playlist.coverUrl = coverUrl ?? playlist.coverUrl;
    playlist.updatedAt = new Date();
  }
  revalidateTag('playlists');
  return playlist || null;
};

export let deletePlaylist = async (id: string) => {
  const index = mockPlaylists.findIndex(p => p.id === id);
  if (index !== -1) {
    mockPlaylists.splice(index, 1);
    mockPlaylistSongs.splice(0, mockPlaylistSongs.length, ...mockPlaylistSongs.filter(ps => ps.playlistId !== id));
  }
  revalidateTag('playlists');
  return { success: true };
};

export let searchSongs = unstable_cache(
  async (searchTerm: string) => {
    return mockSongs
      .filter(song => 
        song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.album && song.album.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(song => ({
        ...song,
        similarity: 1, // Mock similarity score
      }))
      .sort((a, b) => b.similarity - a.similarity || a.name.localeCompare(b.name))
      .slice(0, 50);
  },
  ['search-songs'],
  { tags: ['songs'] }
);

export let getRecentlyAddedSongs = unstable_cache(
  async (limit: number = 10) => {
    return mockSongs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  },
  ['recently-added-songs'],
  { tags: ['songs'] }
);

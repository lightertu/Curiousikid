import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from './drizzle';
import { songs, playlists, playlistSongs } from './schema';

export let getAllSongs = async () => []
export let getSongById = unstable_cache(
  async (id: string) => {
    return undefined
  },
  ['song-by-id'],
  { tags: ['songs'] }
);

export let getAllPlaylists = async () => []
export let getPlaylistWithSongs = async () => []
export let addSongToPlaylist = async (
  playlistId: string,
  songId: string,
  order: number
) => {
  return undefined
};

export let removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
) => {
  return undefined;
};

export let createPlaylist = async (
  id: string,
  name: string,
  coverUrl?: string
) => {
  return undefined
};

export let updatePlaylist = async (
  id: string,
  name: string,
  coverUrl?: string
) => {
  return undefined
};

export let deletePlaylist = async (id: string) => {
  return undefined
};

export let searchSongs = unstable_cache(
  async (searchTerm: string) => {
    return undefined
  }
);

export let getRecentlyAddedSongs = unstable_cache(
  async (limit: number = 10) => {
    return undefined
  },
  ['recently-added-songs'],
  { tags: ['songs'] }
);

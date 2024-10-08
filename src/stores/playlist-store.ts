import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { persist } from "zustand/middleware";
import { openDB } from "idb";
import { Song } from "@/types/song";

export type LoopMode = "none" | "single" | "playlist";

interface PlaylistStore {
  loopMode: LoopMode;
  songs: Song[];
  searchQuery: string;
  isLoading: boolean;
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
  setLoopMode: (mode: LoopMode) => void;
  setSongs: (songs: Song[]) => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
  filteredSongs: () => Song[];
  addSongs: (newSongs: Song[]) => void;
  fetchSongs: () => Promise<void>;
  addSong: (song: Omit<Song, "id">) => Promise<void>;
  currentSong: Song | null;
  isPlaying: boolean;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  deleteSong: (songId: number) => Promise<void>;
  resetPlayingState: () => void;
  shuffleAndPlay: () => void;
  currentTime: number;
  duration: number;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  getTotalDuration: () => string;
  ignoredSongs: number[];
  ignoreSong: (songId: number) => void;
  unignoreSong: (songId: number) => void;
  isIgnored: (songId: number) => boolean;
  downloadSong: (songId: number) => Promise<void>;
  undownloadSong: (songId: number) => Promise<void>;
  isDownloaded: (songId: number) => boolean;
  getDownloadedSongBlob: (songId: number) => Promise<Blob | null>;
  downloadingSongs: number[];
  addDownloadingSong: (songId: number) => void;
  removeDownloadingSong: (songId: number) => void;
  getDownloadedCoverBlob: (songId: number) => Promise<Blob | null>;
}

export const usePlaylistStore = create(
  persist<PlaylistStore>(
    (set, get) => ({
      loopMode: "none",
      songs: [],
      searchQuery: "",
      isLoading: true,
      ignoredSongs: [],
      isOnline: true,
      setIsOnline: (status) => set({ isOnline: status }),
      setLoopMode: (mode) => set({ loopMode: mode }),
      setSongs: (songs) => set({ songs }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      filteredSongs: () => {
        const { songs, searchQuery } = get();
        if (!searchQuery) return songs;
        return songs.filter(
          (song) =>
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
        );
      },
      addSongs: (newSongs) =>
        set((state) => ({ songs: [...state.songs, ...newSongs] })),
      fetchSongs: async () => {
        set({ isLoading: true });
        const { isOnline } = get();
        if (!isOnline) {
          console.warn("Offline: Using cached songs");
          set({ isLoading: false });
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase.from("songs").select("*");

        if (error) {
          console.error("Error fetching songs:", error);
          set({ isLoading: false });
          return;
        }

        const formattedSongs: Song[] = await Promise.all(
          data.map(async (song) => {
            const isDownloaded = await checkIfSongIsDownloaded(song.id);
            return {
              id: song.id,
              title: song.name,
              artist: song.artist,
              duration: formatDuration(song.length),
              cover: song.cover,
              url: song.url,
              downloaded: isDownloaded,
            };
          })
        );

        set({ songs: formattedSongs, isLoading: false });
      },

      addSong: async (song) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("songs")
          .insert([
            {
              name: song.title,
              artist: song.artist,
              length: parseDuration(song.duration),
              cover: song.cover,
              url: song.url,
            },
          ])
          .select();

        if (error) {
          console.error("Error adding song:", error);
          return;
        }

        set((state) => ({
          songs: [...state.songs, { ...song, id: data[0].id }],
        }));
      },
      currentSong: null,
      isPlaying: false,
      setCurrentSong: (song) => set({ currentSong: song }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      playNext: () => {
        const { songs, currentSong, loopMode, ignoredSongs } = get();
        const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
        let nextIndex = (currentIndex + 1) % songs.length;

        // Skip ignored songs
        while (ignoredSongs.includes(songs[nextIndex].id)) {
          nextIndex = (nextIndex + 1) % songs.length;
          if (nextIndex === currentIndex) {
            // If we've looped through all songs and they're all ignored, stop playing
            set({ currentSong: null, isPlaying: false });
            return;
          }
        }

        if (nextIndex === 0 && loopMode === "none") {
          set({ currentSong: null, isPlaying: false });
        } else {
          set({ currentSong: songs[nextIndex], isPlaying: true });
        }
      },

      playPrevious: () => {
        const { songs, currentSong, ignoredSongs } = get();
        const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
        let previousIndex = (currentIndex - 1 + songs.length) % songs.length;

        // Skip ignored songs
        while (ignoredSongs.includes(songs[previousIndex].id)) {
          previousIndex = (previousIndex - 1 + songs.length) % songs.length;
          if (previousIndex === currentIndex) {
            // If we've looped through all songs and they're all ignored, stop playing
            set({ currentSong: null, isPlaying: false });
            return;
          }
        }

        set({ currentSong: songs[previousIndex], isPlaying: true });
      },
      volume: 1,
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }), // Ensure volume is between 0 and 1
      toggleMute: () => {
        const { volume } = get();
        set({ volume: volume === 0 ? 1 : 0 });
      },
      deleteSong: async (songId: number) => {
        const supabase = createClient();

        // Get the song to be deleted
        const songToDelete = get().songs.find((song) => song.id === songId);
        if (!songToDelete) return;

        // Delete the song from the database
        const { error: dbError } = await supabase
          .from("songs")
          .delete()
          .eq("id", songId);

        if (dbError) {
          console.error("Error deleting song from database:", dbError);
          return;
        }

        // Delete the audio file from storage
        if (songToDelete.url) {
          const { error: audioError } = await supabase.storage
            .from("songs")
            .remove([songToDelete.url.split("/").pop() || ""]);

          if (audioError) {
            console.error("Error deleting audio file:", audioError);
          }
        }

        // Delete the cover image from storage
        if (songToDelete.cover) {
          const { error: coverError } = await supabase.storage
            .from("covers")
            .remove([songToDelete.cover.split("/").pop() || ""]);

          if (coverError) {
            console.error("Error deleting cover image:", coverError);
          }
        }

        // Update the local state
        set((state) => ({
          songs: state.songs.filter((song) => song.id !== songId),
          currentSong:
            state.currentSong?.id === songId ? null : state.currentSong,
          isPlaying: state.currentSong?.id === songId ? false : state.isPlaying,
        }));
      },
      resetPlayingState: () => set({ isPlaying: false }),
      shuffleAndPlay: () => {
        const { songs } = get();
        if (songs.length === 0) return;
        const randomIndex = Math.floor(Math.random() * songs.length);
        set({ currentSong: songs[randomIndex], isPlaying: true });
      },
      currentTime: 0,
      duration: 0,
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration: duration }),
      getTotalDuration: () => {
        const { songs } = get();
        const totalSeconds = songs.reduce((total, song) => {
          return total + parseDuration(song.duration);
        }, 0);
        return formatDuration(totalSeconds);
      },
      ignoreSong: (songId) =>
        set((state) => ({ ignoredSongs: [...state.ignoredSongs, songId] })),
      unignoreSong: (songId) =>
        set((state) => ({
          ignoredSongs: state.ignoredSongs.filter((id) => id !== songId),
        })),
      isIgnored: (songId) => get().ignoredSongs.includes(songId),
      downloadSong: async (songId: number) => {
        const { songs, addDownloadingSong, removeDownloadingSong } = get();
        const songToDownload = songs.find((song) => song.id === songId);

        if (!songToDownload || !songToDownload.url) {
          console.error("Song not found or URL is missing");
          return;
        }

        try {
          addDownloadingSong(songId);
          // Fetch the song file with cache-busting query parameter
          const response = await fetch(
            `${songToDownload.url}?t=${Date.now()}`,
            {
              cache: "no-store",
            }
          );
          if (!response.ok) throw new Error("Network response was not ok");
          const blob = await response.blob();

          // Save the file to IndexedDB
          const db = await openDB("MusicPlayerDB", 1, {
            upgrade(db) {
              db.createObjectStore("songs");
              db.createObjectStore("covers");
            },
          });

          await db.put("songs", blob, songId.toString());

          // Download and cache the cover if it exists
          if (songToDownload.cover) {
            const coverResponse = await fetch(songToDownload.cover);
            if (coverResponse.ok) {
              const coverBlob = await coverResponse.blob();
              await db.put("covers", coverBlob, songId.toString());
            }
          }

          // Update local state to mark both song and cover as downloaded
          set((state) => ({
            songs: state.songs.map((song) =>
              song.id === songId
                ? { ...song, downloaded: true, coverDownloaded: true }
                : song
            ),
          }));

          removeDownloadingSong(songId);
          console.log(`Song "${songToDownload.title}" cached successfully`);
        } catch (error) {
          console.error("Error caching song:", error);
          removeDownloadingSong(songId);
        }
      },

      getDownloadedCoverBlob: async (songId: number) => {
        try {
          const db = await openDB("MusicPlayerDB", 1);
          return await db.get("covers", songId.toString());
        } catch (error) {
          console.error("Error retrieving cached cover:", error);
          return null;
        }
      },

      // Update the undownloadSong function to remove the cover as well
      undownloadSong: async (songId: number) => {
        try {
          const db = await openDB("MusicPlayerDB", 1);
          await db.delete("songs", songId.toString());
          await db.delete("covers", songId.toString());

          set((state) => ({
            songs: state.songs.map((song) =>
              song.id === songId
                ? { ...song, downloaded: false, coverDownloaded: false }
                : song
            ),
          }));
          console.log(`Song and cover cache removed`);
        } catch (error) {
          console.error("Error removing song and cover cache:", error);
        }
      },
      isDownloaded: (songId: number) => {
        const { songs } = get();
        const song = songs.find((s) => s.id === songId);
        return song ? song.downloaded : false;
      },
      getDownloadedSongBlob: async (songId: number) => {
        try {
          const db = await openDB("MusicPlayerDB", 1);
          return await db.get("songs", songId.toString());
        } catch (error) {
          console.error("Error retrieving cached song:", error);
          return null;
        }
      },
      downloadingSongs: [],
      addDownloadingSong: (songId) =>
        set((state) => ({
          downloadingSongs: [...state.downloadingSongs, songId],
        })),
      removeDownloadingSong: (songId) =>
        set((state) => ({
          downloadingSongs: state.downloadingSongs.filter(
            (id) => id !== songId
          ),
        })),
    }),
    {
      name: "playlist-storage",
      partialize: (state) => ({
        loopMode: state.loopMode,
        volume: state.volume,
        songs: state.songs.map((song) => ({
          ...song,
          downloaded: song.downloaded,
        })),
        searchQuery: "",
        isLoading: false,
        setLoopMode: () => {},
        setSongs: () => {},
        setSearchQuery: () => {},
        setIsLoading: () => {},
        filteredSongs: () => [],
        addSongs: () => {},
        fetchSongs: () => Promise.resolve(),
        addSong: () => Promise.resolve(),
        currentSong: null,
        isPlaying: false,
        setCurrentSong: () => {},
        togglePlay: () => {},
        playNext: () => {},
        playPrevious: () => {},
        setVolume: () => {},
        toggleMute: () => {},
        deleteSong: () => Promise.resolve(),
        resetPlayingState: () => {},
        shuffleAndPlay: () => {},
        currentTime: 0,
        duration: 0,
        setCurrentTime: () => {},
        setDuration: () => {},
        setIsOnline: () => {},
        isOnline: state.isOnline,
        getTotalDuration: () => "0:00",
        ignoredSongs: state.ignoredSongs,
        ignoreSong: () => {},
        unignoreSong: () => {},
        isIgnored: () => false,
        downloadSong: () => Promise.resolve(),
        undownloadSong: () => Promise.resolve(),
        isDownloaded: () => false,
        getDownloadedSongBlob: () => Promise.resolve(null),
        downloadingSongs: [],
        ownloadingSongs: state.downloadingSongs,
        addDownloadingSong: () => {},
        removeDownloadingSong: () => {},
        getDownloadedCoverBlob: () => Promise.resolve(null),
      }),
    }
  )
);

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function parseDuration(duration: string): number {
  const [minutes, seconds] = duration.split(":").map(Number);
  return minutes * 60 + seconds;
}

async function checkIfSongIsDownloaded(songId: number): Promise<boolean> {
  try {
    const db = await openDB("MusicPlayerDB", 1);
    const song = await db.get("songs", songId.toString());
    return !!song;
  } catch (error) {
    console.error("Error checking if song is downloaded:", error);
    return false;
  }
}

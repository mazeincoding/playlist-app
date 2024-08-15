import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { persist } from "zustand/middleware";

export type ViewMode = "grid" | "list";
export type LoopMode = "none" | "playlist" | "single";

export type Song = {
  id: number;
  title: string;
  artist: string;
  duration: string;
  cover?: string | null;
  url?: string;
};

interface PlaylistStore {
  viewMode: ViewMode;
  loopMode: LoopMode;
  songs: Song[];
  searchQuery: string;
  isLoading: boolean;
  setViewMode: (mode: ViewMode) => void;
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
}

export const usePlaylistStore = create(
  persist<PlaylistStore>(
    (set, get) => ({
      viewMode: "grid",
      loopMode: "none",
      songs: [],
      searchQuery: "",
      isLoading: true,
      setViewMode: (mode) => set({ viewMode: mode }),
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
        const supabase = createClient();
        const { data, error } = await supabase.from("songs").select("*");

        if (error) {
          console.error("Error fetching songs:", error);
          set({ isLoading: false });
          return;
        }

        const formattedSongs: Song[] = data.map((song) => ({
          id: song.id,
          title: song.name,
          artist: song.artist,
          duration: formatDuration(song.length),
          cover: song.cover, // The cover URL is now stored directly in the database
          url: song.url,
        }));

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
        const { songs, currentSong, loopMode } = get();
        const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
        let nextIndex = (currentIndex + 1) % songs.length;

        if (nextIndex === 0 && loopMode === "none") {
          set({ currentSong: null, isPlaying: false });
        } else {
          set({ currentSong: songs[nextIndex], isPlaying: true });
        }
      },

      playPrevious: () => {
        const { songs, currentSong } = get();
        const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
        const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
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
    }),
    {
      name: "playlist-storage",
      partialize: (state) => ({
        loopMode: state.loopMode,
        viewMode: state.viewMode,
        volume: state.volume,
        songs: [],
        searchQuery: "",
        isLoading: false,
        setViewMode: () => {},
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

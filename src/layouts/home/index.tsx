"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Search,
  Play,
  FastForward,
  Repeat,
  Shuffle,
  SkipForward,
  Volume2,
  VolumeX,
  LucideIcon,
  List,
  Repeat1,
  SkipBack,
  PlusCircle,
  Pause,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { usePlaylistStore, Song, LoopMode } from "@/stores/playlist-store";
import { AddSongsDialog } from "@/components/add-songs-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HomeLayout() {
  const { viewMode, loopMode, fetchSongs, resetPlayingState } =
    usePlaylistStore();

  useEffect(() => {
    fetchSongs();
    resetPlayingState(); // Reset the playing state when the component mounts
  }, [fetchSongs, resetPlayingState]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <Main viewMode={viewMode} />
      <PlayerControls />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 flex flex-col md:flex-row items-center justify-between px-4 py-3 bg-background sm:px-6 gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <Link href="#" className="text-2xl font-bold" prefetch={false}>
          Playlist
        </Link>
        <ViewModeDropdown />
        <div className="ml-auto md:hidden">
          <AddSongsDialog />
        </div>
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto flex-grow justify-end">
        <SearchBar />
        <div className="hidden md:block">
          <AddSongsDialog />
        </div>
      </div>
    </header>
  );
}

function ViewModeDropdown() {
  const { viewMode, setViewMode } = usePlaylistStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted/50 flex-shrink-0"
        >
          {viewMode === "grid" ? (
            <LayoutGrid className="w-5 h-5" />
          ) : (
            <List className="w-5 h-5" />
          )}
          <span className="sr-only">View mode</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>View mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "grid" | "list")}
        >
          <DropdownMenuRadioItem value="grid">Grid</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="list">List</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchBar() {
  const { searchQuery, setSearchQuery } = usePlaylistStore();

  return (
    <div className="relative flex-1 w-full md:max-w-md flex-grow">
      <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
        <Search className="w-4 h-4" />
      </div>
      <Input
        type="search"
        placeholder="Search songs..."
        className="w-full pl-8 rounded-lg bg-muted"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}

function Main({ viewMode }: { viewMode: "grid" | "list" }) {
  const { filteredSongs, isLoading } = usePlaylistStore();

  if (isLoading) {
    return (
      <main className="flex-1 overflow-auto p-4">
        {viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <SongCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <SongListItemSkeleton key={index} />
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto p-4">
      {viewMode === "grid" ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredSongs().map((song, index) => (
            <SongCard key={index} {...song} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredSongs().map((song, index) => (
            <SongListItem key={index} {...song} />
          ))}
        </div>
      )}
    </main>
  );
}

function SongCard({ id, title, artist, duration, cover, url }: Song) {
  const { currentSong, setCurrentSong, togglePlay, isPlaying, deleteSong } =
    usePlaylistStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCurrentSong = currentSong?.id === id;

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      setCurrentSong({ id, title, artist, duration, cover, url });
      if (!isPlaying) {
        togglePlay();
      }
    }
  };

  const handleDelete = async () => {
    await deleteSong(id);
    setShowDeleteDialog(false);
  };

  return (
    <Card
      className={`p-0 ${
        isCurrentSong ? "bg-accent/30 border-foreground/20 border" : ""
      }`}
    >
      <CardHeader className="p-0">
        <div className="relative">
          {cover ? (
            <Image
              src={cover}
              alt={`Cover for ${title}`}
              width={300}
              height={300}
              className="aspect-square object-cover"
            />
          ) : (
            <div className="aspect-square bg-muted rounded-lg" />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium truncate">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
          <p className="text-sm text-muted-foreground">{duration}</p>
        </div>
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-500 hover:bg-destructive/35"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePlay}>
            {isCurrentSong && isPlaying ? (
              <Pause className="w-5 h-5 mr-2" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            {isCurrentSong && isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
      </CardContent>
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        songTitle={title}
      />
    </Card>
  );
}

function SongListItem({ id, title, artist, duration, cover, url }: Song) {
  const { currentSong, setCurrentSong, togglePlay, isPlaying, deleteSong } =
    usePlaylistStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCurrentSong = currentSong?.id === id;

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      setCurrentSong({ id, title, artist, duration, cover, url });
      if (!isPlaying) {
        togglePlay();
      }
    }
  };

  const handleDelete = async () => {
    await deleteSong(id);
    setShowDeleteDialog(false);
  };

  return (
    <div
      className={`flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg ${
        isCurrentSong ? "bg-green-500/10 border border-green-500/35" : ""
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {cover ? (
          <Image
            src={cover}
            alt={`${title} cover`}
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <p className="text-sm text-muted-foreground hidden sm:block">
          {duration}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-500 hover:bg-destructive/35"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handlePlay}>
          {isCurrentSong && isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span className="sr-only">
            {isCurrentSong && isPlaying ? "Pause" : "Play"}
          </span>
        </Button>
      </div>
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        songTitle={title}
      />
    </div>
  );
}

function SongCardSkeleton() {
  return (
    <Card className="p-4">
      <CardContent className="flex flex-col gap-3 relative p-0">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </CardContent>
    </Card>
  );
}

function SongListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <Skeleton className="w-8 h-4 hidden sm:block" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}

function PlayerControls() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    loopMode,
    setLoopMode,
    playNext,
    playPrevious,
    volume,
    setVolume,
    toggleMute,
    shuffleAndPlay,
    currentTime,
    duration,
    setCurrentTime,
    setDuration,
  } = usePlaylistStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleEnded = () => {
    playNext();
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="sticky bottom-0 z-10 bg-background p-4 border-t">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col gap-4">
          {currentSong && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentSong.cover ? (
                  <Image
                    src={currentSong.cover}
                    alt={`Cover for ${currentSong.title}`}
                    width={60}
                    height={60}
                    className="aspect-square object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0"></div>
                )}
                <div>
                  <div className="font-medium truncate">
                    {currentSong.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {currentSong.artist}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ControlButton
                  icon={volume === 0 ? VolumeX : Volume2}
                  label={volume === 0 ? "Unmute" : "Mute"}
                  onClick={toggleMute}
                />
                <Slider
                  className="w-24 sm:w-32 [&>span:first-child]:h-1 [&>span:first-child]:bg-muted-foreground [&_[role=slider]]:bg-foreground [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-foreground [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:focus-visible]:scale-105 [&_[role=slider]:focus-visible]:transition-transform"
                  value={[volume * 100]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                className="flex-grow [&>span:first-child]:h-1 [&>span:first-child]:bg-muted-foreground [&_[role=slider]]:bg-foreground [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-foreground [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:focus-visible]:scale-105 [&_[role=slider]:focus-visible]:transition-transform"
                value={[currentTime]}
                min={0}
                max={duration}
                step={1}
                onValueChange={handleSeek}
              />
              <span className="text-xs w-10">{formatTime(duration)}</span>
            </div>
            <div className="flex justify-center items-center gap-2">
              <ControlButton
                icon={Shuffle}
                label="Shuffle"
                onClick={shuffleAndPlay}
              />
              <ControlButton
                icon={SkipBack}
                label="Previous"
                onClick={playPrevious}
              />
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
              <ControlButton
                icon={SkipForward}
                label="Next"
                onClick={playNext}
              />
              <LoopButton loopMode={loopMode} setLoopMode={setLoopMode} />
            </div>
          </div>
        </div>
      </div>
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.url}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          loop={false}
        />
      )}
    </div>
  );
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-muted/50"
      onClick={onClick}
    >
      <Icon className="w-5 h-5" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function LoopButton({
  loopMode,
  setLoopMode,
}: {
  loopMode: LoopMode;
  setLoopMode: (mode: LoopMode) => void;
}) {
  const handleClick = () => {
    setLoopMode(loopMode === "none" ? "playlist" : "none");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-muted/50"
      onClick={handleClick}
    >
      <Repeat
        className={`w-5 h-5 ${loopMode === "playlist" ? "text-green-500" : ""}`}
      />
      <span className="sr-only">Loop {loopMode}</span>
    </Button>
  );
}

function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  songTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  songTitle: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the song
            &quot;{songTitle}&quot; and remove the data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive/25 border border-destructive/45 hover:bg-destructive/65 hover:border-destructive/85 text-red-500"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

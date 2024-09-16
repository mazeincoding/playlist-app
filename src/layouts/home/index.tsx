"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Play,
  Repeat,
  Shuffle,
  SkipForward,
  Volume2,
  VolumeX,
  LucideIcon,
  Repeat1,
  SkipBack,
  Pause,
  MoreHorizontal,
  Info,
  Download,
  DownloadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { usePlaylistStore, LoopMode } from "@/stores/playlist-store";
import { Song } from "@/types/song";
import { AddSongsDialog } from "@/components/add-songs-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlaylistInfoDialog } from "@/components/playlist-info-dialog";
import { Badge } from "@/components/ui/badge";

export default function HomeLayout() {
  const {
    fetchSongs,
    resetPlayingState,
    filteredSongs,
    getTotalDuration,
    currentSong,
  } = usePlaylistStore();
  const [isCurrentSongVisible, setIsCurrentSongVisible] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSongs();
    resetPlayingState();
  }, [fetchSongs, resetPlayingState]);

  useEffect(() => {
    console.log("Current song visibility changed:", isCurrentSongVisible);
  }, [isCurrentSongVisible]);

  useEffect(() => {
    console.log("Current song changed:", currentSong);
  }, [currentSong]);

  const scrollToCurrentSong = () => {
    console.log("Attempting to scroll to current song");
    const currentSongElement = document.getElementById(
      `song-${currentSong?.id}`
    );
    const scrollContainer = scrollContainerRef.current;

    if (currentSongElement && scrollContainer) {
      console.log("Scrolling to song:", currentSong?.title);

      const containerRect = scrollContainer.getBoundingClientRect();
      const songRect = currentSongElement.getBoundingClientRect();
      const songHeight = songRect.height;
      const containerHeight = containerRect.height;

      let targetScrollTop =
        currentSongElement.offsetTop -
        containerRect.top -
        scrollContainer.offsetTop;

      // Adjust scroll position to center the song if there's enough space
      if (songHeight < containerHeight) {
        targetScrollTop -= (containerHeight - songHeight) / 2;
      }

      // Ensure we don't scroll past the bottom of the container
      const maxScrollTop = scrollContainer.scrollHeight - containerHeight;
      targetScrollTop = Math.min(targetScrollTop, maxScrollTop);

      // Ensure we don't scroll above the top of the container
      targetScrollTop = Math.max(targetScrollTop, 0);

      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    } else {
      console.log("Failed to scroll: Element or container not found");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div
        className="flex-grow overflow-auto relative"
        ref={scrollContainerRef}
      >
        <Header />
        <Main setIsCurrentSongVisible={setIsCurrentSongVisible} />
        {!isCurrentSongVisible && currentSong && (
          <Badge
            onClick={scrollToCurrentSong}
            className="bottom-2 left-1/2 transform sticky -translate-x-1/2 z-50 bg-background text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-foreground/25 cursor-pointer border border-border backdrop-blur-md"
          >
            Jump to playing song
          </Badge>
        )}
      </div>
      <PlayerControls />
    </div>
  );
}

function Header() {
  const [showInfo, setShowInfo] = useState(false);
  const { filteredSongs, getTotalDuration } = usePlaylistStore();

  return (
    <header className="sticky top-0 z-10 flex flex-col sm:flex-row items-center border-b justify-between px-4 py-3 bg-background/50 backdrop-blur-md sm:px-6 gap-4">
      <div className="flex items-center w-full sm:w-auto justify-between">
        <div className="space-x-4">
          <Link href="#" className="text-2xl font-bold" prefetch={false}>
            Playlist
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setShowInfo(true)}>
            <Info className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </div>
        {showInfo && (
          <PlaylistInfoDialog
            open={showInfo}
            onOpenChange={setShowInfo}
            songCount={filteredSongs().length}
            totalDuration={getTotalDuration()}
          />
        )}
        <div className="block sm:hidden">
          <AddSongsDialog />
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto flex-grow justify-end">
        <SearchBar />
        <div className="hidden sm:block">
          <AddSongsDialog />
        </div>
      </div>
      <PlaylistInfoDialog
        open={showInfo}
        onOpenChange={setShowInfo}
        songCount={filteredSongs().length}
        totalDuration={getTotalDuration()}
      />
    </header>
  );
}

function SearchBar() {
  const { searchQuery, setSearchQuery } = usePlaylistStore();

  return (
    <div className="relative flex-1 w-full sm:max-w-md flex-grow">
      <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
        <Search className="w-4 h-4" />
      </div>
      <Input
        type="search"
        placeholder="Search songs..."
        className="w-full pl-8 rounded-lg bg-muted/35 focus-visible:bg-muted/50 focus-visible:border-foreground/15"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}

function Main({
  setIsCurrentSongVisible,
}: {
  setIsCurrentSongVisible: (visible: boolean) => void;
}) {
  const { filteredSongs, isLoading, getTotalDuration, currentSong } =
    usePlaylistStore();

  return (
    <main className="flex-1 overflow-auto p-4">
      <div className="flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 10 }).map((_, index) => (
              <SongListItemSkeleton key={index} />
            ))
          : filteredSongs().map((song, index) => (
              <SongListItem
                key={index}
                {...song}
                isCurrentSong={song.id === currentSong?.id}
                setIsCurrentSongVisible={setIsCurrentSongVisible}
              />
            ))}
      </div>
    </main>
  );
}

function SongControls({
  song,
  isCurrentSong,
  isPlaying,
  onPlay,
  onDelete,
  onIgnore,
  onUnignore,
  isIgnored,
}: {
  song: Song;
  isCurrentSong: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onIgnore: () => void;
  onUnignore: () => void;
  isIgnored: boolean;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSongOptions, setShowSongOptions] = useState(false);
  const { downloadSong, undownloadSong, isDownloaded, downloadingSongs } =
    usePlaylistStore();

  const handleDownload = async () => {
    await downloadSong(song.id);
  };

  const handleUndownload = async () => {
    await undownloadSong(song.id);
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onPlay}>
          {isCurrentSong && isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <DropdownMenu open={showSongOptions} onOpenChange={setShowSongOptions}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {isDownloaded(song.id) ? (
              <DropdownMenuItem onClick={handleUndownload}>
                Undownload
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleDownload}>
                Download
              </DropdownMenuItem>
            )}
            {isIgnored ? (
              <DropdownMenuItem onClick={onUnignore}>Unignore</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onIgnore}>Ignore</DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete}
        songTitle={song.title}
      />
    </div>
  );
}
function SongListItem({
  id,
  title,
  artist,
  duration,
  cover,
  url,
  isCurrentSong,
  setIsCurrentSongVisible,
  coverDownloaded,
}: Song & {
  isCurrentSong: boolean;
  setIsCurrentSongVisible: (visible: boolean) => void;
}) {
  const {
    currentSong,
    setCurrentSong,
    togglePlay,
    isPlaying,
    deleteSong,
    ignoreSong,
    unignoreSong,
    isIgnored,
    isDownloaded,
    downloadSong,
    undownloadSong,
    downloadingSongs,
    getDownloadedCoverBlob,
    isOnline,
  } = usePlaylistStore();

  const songRef = useRef<HTMLDivElement>(null);
  const songIsIgnored = isIgnored(id);
  const [coverSrc, setCoverSrc] = useState(cover);

  useEffect(() => {
    async function loadCachedCover() {
      if (!isOnline && coverDownloaded) {
        const blob = await getDownloadedCoverBlob(id);
        if (blob) {
          setCoverSrc(URL.createObjectURL(blob));
        }
      } else {
        setCoverSrc(cover);
      }
    }
    loadCachedCover();
  }, [isOnline, coverDownloaded, id, cover, getDownloadedCoverBlob]);

  useEffect(() => {
    if (isCurrentSong) {
      console.log("Setting up Intersection Observer for song:", title);
      const observer = new IntersectionObserver(
        ([entry]) => {
          console.log(
            "Intersection changed for song:",
            title,
            "Is intersecting:",
            entry.isIntersecting
          );
          setIsCurrentSongVisible(entry.isIntersecting);
        },
        { threshold: 0.5 }
      );

      if (songRef.current) {
        observer.observe(songRef.current);
      }

      return () => {
        if (songRef.current) {
          console.log("Cleaning up Intersection Observer for song:", title);
          observer.unobserve(songRef.current);
        }
      };
    }
  }, [isCurrentSong, setIsCurrentSongVisible, title]);

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      setCurrentSong({
        id,
        title,
        artist,
        duration,
        cover,
        url,
        downloaded: isDownloaded(id),
      });
      if (!isPlaying) {
        togglePlay();
      }
    }
  };

  const handleDelete = async () => {
    await deleteSong(id);
  };

  const handleIgnore = () => {
    ignoreSong(id);
  };

  const handleUnignore = () => {
    unignoreSong(id);
  };

  return (
    <div
      ref={songRef}
      id={`song-${id}`}
      className={`flex items-center justify-between p-1.5 px-4 hover:bg-muted/50 rounded-lg ${
        isCurrentSong ? "bg-accent/30 border-foreground/20 border" : ""
      } ${songIsIgnored ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={`${title} cover`}
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{title}</h3>
            <div className="hidden sm:block">
              {isDownloaded(id) ? (
                <Download className="w-4 h-4 text-green-500" />
              ) : downloadingSongs.includes(id) ? (
                <DownloadAnimation />
              ) : null}
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
          <p className="text-sm text-muted-foreground truncate">{duration}</p>
        </div>
      </div>
      <div className="flex items-center flex-shrink-0">
        <SongControls
          song={{
            id,
            title,
            artist,
            duration,
            cover,
            url,
            downloaded: isDownloaded(id),
          }}
          isCurrentSong={isCurrentSong}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onDelete={handleDelete}
          onIgnore={handleIgnore}
          onUnignore={handleUnignore}
          isIgnored={songIsIgnored}
        />
      </div>
    </div>
  );
}

function DownloadAnimation() {
  return (
    <DownloadIcon className="w-4 h-4 text-muted-foreground animate-pulse" />
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
    getDownloadedCoverBlob,
    isOnline
  } = usePlaylistStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [coverSrc, setCoverSrc] = useState(currentSong?.cover);

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

  useEffect(() => {
    async function loadCachedCover() {
      if (currentSong) {
        if (!isOnline && currentSong.coverDownloaded) {
          const blob = await getDownloadedCoverBlob(currentSong.id);
          if (blob) {
            setCoverSrc(URL.createObjectURL(blob));
          }
        } else {
          setCoverSrc(currentSong.cover);
        }
      }
    }
    loadCachedCover();
  }, [isOnline, currentSong, getDownloadedCoverBlob]);

  const handleEnded = () => {
    if (loopMode === "single" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      playNext();
    }
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

  if (!currentSong) return null;

  return (
    <div className="sticky bottom-0 z-10 bg-background p-4 border-t">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col gap-4">
          {currentSong && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {coverSrc ? (
                  <Image
                    src={coverSrc}
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
                  className="w-24 hidden md:flex sm:w-32 [&>span:first-child]:h-1 [&>span:first-child]:bg-muted-foreground [&_[role=slider]]:bg-foreground [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-foreground [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:focus-visible]:scale-105 [&_[role=slider]:focus-visible]:transition-transform"
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
              <LoopButton
                loopMode={loopMode}
                setLoopMode={setLoopMode}
                disabled={!currentSong}
              />
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
          loop={false} // We're handling looping manually now
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
  disabled,
}: {
  loopMode: LoopMode;
  setLoopMode: (mode: LoopMode) => void;
  disabled: boolean;
}) {
  const handleClick = () => {
    if (disabled) return;
    setLoopMode(
      loopMode === "none"
        ? "single"
        : loopMode === "single"
        ? "playlist"
        : "none"
    );
  };

  const getIcon = () => {
    switch (loopMode) {
      case "single":
        return <Repeat1 className="w-5 h-5 text-green-500" />;
      case "playlist":
        return <Repeat className="w-5 h-5 text-green-500" />;
      default:
        return <Repeat className="w-5 h-5" />;
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleClick}>
      {getIcon()}
      <span className="sr-only">Loop {disabled ? "disabled" : loopMode}</span>
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

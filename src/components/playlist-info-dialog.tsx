import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Music,
  Clock,
  LucideIcon,
  Download,
  X,
  Loader2,
  HardDrive,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { formatTime } from "@/utils/format-time";
import { Button } from "@/components/ui/button";
import { usePlaylistStore } from "@/stores/playlist-store";
import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Song } from "@/types/song";

// Types
interface PlaylistInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songCount: number;
  totalDuration: string;
}

interface InfoItemProps {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  action?: React.ReactNode;
  onClick?: () => void;
}

interface PlaylistInfoContentProps {
  songCount: number;
  formattedDuration: string;
  downloadedSongsCount: number;
  isDownloading: boolean;
  isCanceling: boolean;
  progress: number;
  allSongsDownloaded: boolean;
  handleViewDownloadedSongs: () => void;
  handleCancel: () => void;
  handleDownloadAll: () => void;
}

interface DownloadProgressProps {
  progress: number;
  isCanceling: boolean;
  handleCancel: () => void;
}

interface DownloadAllButtonProps {
  handleDownloadAll: () => void;
  allSongsDownloaded: boolean;
}

interface DownloadedSongsContentProps {
  downloadedSongs: Song[];
  deletingSongs: number[];
  setShowDownloadedSongs: (show: boolean) => void;
  handleRemoveDownload: (songId: number) => void;
}

interface DownloadedSongItemProps {
  song: Song;
  deletingSongs: number[];
  handleRemoveDownload: (songId: number) => void;
}

// Helper Components
function InfoItem({ Icon, label, value, action, onClick }: InfoItemProps) {
  return (
    <div 
      className={`flex items-center justify-between p-4 bg-muted/25 border rounded-lg ${onClick ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <Icon className="h-6 w-6 text-primary" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-base font-bold">{value}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

// Helper Functions
function parseMMSS(time: string): number {
  const [minutes, seconds] = time.split(":").map(Number);
  return minutes * 60 + seconds;
}

// Main Component
export function PlaylistInfoDialog({
  open,
  onOpenChange,
  songCount,
  totalDuration,
}: PlaylistInfoDialogProps) {
  // State
  const { songs, downloadSong, undownloadSong } = usePlaylistStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDownloadedSongs, setShowDownloadedSongs] = useState(false);
  const [deletingSongs, setDeletingSongs] = useState<number[]>([]);
  const cancelRef = useRef<boolean>(false);

  // Derived State
  const totalSeconds = parseMMSS(totalDuration);
  const formattedDuration = formatTime(totalSeconds);
  const downloadedSongs = useMemo(
    () => songs.filter((song) => song.downloaded),
    [songs]
  );
  const downloadedSongsCount = downloadedSongs.length;
  const allSongsDownloaded = useMemo(
    () => downloadedSongsCount === songCount,
    [downloadedSongsCount, songCount]
  );

  // Handlers
  const handleDownloadAll = async () => {
    setIsDownloading(true);
    cancelRef.current = false;
    const totalSongs = songs.filter((song) => !song.downloaded).length;
    let downloadedCount = 0;

    for (const song of songs) {
      if (cancelRef.current) break;
      if (!song.downloaded) {
        await downloadSong(song.id);
        downloadedCount++;
        setProgress(Math.round((downloadedCount / totalSongs) * 100));
      }
    }

    setIsDownloading(false);
    setIsCanceling(false);
    setProgress(0);
  };

  const handleCancel = () => {
    setIsCanceling(true);
    cancelRef.current = true;
  };

  const handleViewDownloadedSongs = () => setShowDownloadedSongs(true);

  const handleRemoveDownload = async (songId: number) => {
    setDeletingSongs((prev) => [...prev, songId]);
    await undownloadSong(songId);
    setDeletingSongs((prev) => prev.filter((id) => id !== songId));
  };

  // Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {!showDownloadedSongs && (
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Playlist Information
            </DialogTitle>
            <DialogDescription>
              Details about your current playlist
            </DialogDescription>
          </DialogHeader>
        )}
        <AnimatePresence mode="wait">
          {!showDownloadedSongs ? (
            <PlaylistInfoContent
              songCount={songCount}
              formattedDuration={formattedDuration}
              downloadedSongsCount={downloadedSongsCount}
              isDownloading={isDownloading}
              isCanceling={isCanceling}
              progress={progress}
              allSongsDownloaded={allSongsDownloaded}
              handleViewDownloadedSongs={handleViewDownloadedSongs}
              handleCancel={handleCancel}
              handleDownloadAll={handleDownloadAll}
            />
          ) : (
            <DownloadedSongsContent
              downloadedSongs={downloadedSongs}
              deletingSongs={deletingSongs}
              setShowDownloadedSongs={setShowDownloadedSongs}
              handleRemoveDownload={handleRemoveDownload}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Sub-components
function PlaylistInfoContent({
  songCount,
  formattedDuration,
  downloadedSongsCount,
  isDownloading,
  isCanceling,
  progress,
  allSongsDownloaded,
  handleViewDownloadedSongs,
  handleCancel,
  handleDownloadAll,
}: PlaylistInfoContentProps) {
  return (
    <motion.div
      key="info"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <InfoItem Icon={Music} label="Number of songs" value={songCount} />
      <InfoItem Icon={Clock} label="Total duration" value={formattedDuration} />
      <InfoItem
        Icon={HardDrive}
        label="Downloaded songs"
        value={`${downloadedSongsCount} / ${songCount}`}
        action={
          <ChevronRight className="h-4 w-4" />
        }
        onClick={handleViewDownloadedSongs}
      />
      {isDownloading ? (
        <DownloadProgress
          progress={progress}
          isCanceling={isCanceling}
          handleCancel={handleCancel}
        />
      ) : (
        <DownloadAllButton
          handleDownloadAll={handleDownloadAll}
          allSongsDownloaded={allSongsDownloaded}
        />
      )}
    </motion.div>
  );
}

function DownloadProgress({
  progress,
  isCanceling,
  handleCancel,
}: DownloadProgressProps) {
  return (
    <div className="space-y-2">
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {isCanceling ? "Canceling..." : `Downloading... ${progress}%`}
        </span>
        <Button
          onClick={handleCancel}
          variant="outline"
          size="sm"
          disabled={isCanceling}
        >
          {isCanceling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Canceling
            </>
          ) : (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function DownloadAllButton({
  handleDownloadAll,
  allSongsDownloaded,
}: DownloadAllButtonProps) {
  return (
    <Button
      onClick={handleDownloadAll}
      className="w-full"
      disabled={allSongsDownloaded}
    >
      <Download className="mr-2 h-4 w-4" />
      {allSongsDownloaded ? "All Songs Downloaded" : "Download All Songs"}
    </Button>
  );
}

function DownloadedSongsContent({
  downloadedSongs,
  deletingSongs,
  setShowDownloadedSongs,
  handleRemoveDownload,
}: DownloadedSongsContentProps) {
  return (
    <motion.div
      key="downloaded-songs"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-2"
    >
      <Button
        variant="outline"
        onClick={() => setShowDownloadedSongs(false)}
        className="mb-4"
      >
        <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
        Back
      </Button>
      <h3 className="text-lg font-semibold">Downloaded Songs</h3>
      {downloadedSongs.length > 0 && (
        <div className="h-[300px] rounded-md border p-4 overflow-y-auto space-y-2">
          {downloadedSongs.map((song) => (
            <DownloadedSongItem
              key={song.id}
              song={song}
              deletingSongs={deletingSongs}
              handleRemoveDownload={handleRemoveDownload}
            />
          ))}
        </div>
      )}
      {downloadedSongs.length === 0 && (
        <p className="text-muted-foreground">No downloaded songs yet.</p>
      )}
    </motion.div>
  );
}

function DownloadedSongItem({
  song,
  deletingSongs,
  handleRemoveDownload,
}: DownloadedSongItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between"
    >
      <div>
        <p className="font-medium">{song.title}</p>
        <p className="text-sm text-muted-foreground">{song.artist}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRemoveDownload(song.id)}
        disabled={deletingSongs.includes(song.id)}
      >
        {deletingSongs.includes(song.id) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </motion.div>
  );
}

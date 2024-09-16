import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { usePlaylistStore, Song } from "@/stores/playlist-store";
import { PlusCircle, UploadIcon, Loader2, ImageIcon, X } from "lucide-react";
import { Label } from "./ui/label";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { createClient } from "@/utils/supabase/client";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Image from "next/image";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="p-4 bg-destructive/10 border border-destructive rounded"
    >
      <h2 className="text-lg font-semibold text-destructive">
        Something went wrong:
      </h2>
      <pre className="mt-2 text-sm text-destructive">{error.message}</pre>
      <Button onClick={resetErrorBoundary} className="mt-4">
        Try again
      </Button>
    </div>
  );
}

function SongDetailsForm({
  onSubmit,
  initialSongs,
  files,
}: {
  onSubmit: (songs: Omit<Song, "id">[], covers: (File | null)[]) => void;
  initialSongs: Omit<Song, "id">[];
  files: File[];
}) {
  const [songs, setSongs] = useState<Omit<Song, "id">[]>(initialSongs);
  const [covers, setCovers] = useState<(File | null)[]>(
    new Array(files.length).fill(null)
  );
  const [coverPreviews, setCoverPreviews] = useState<(string | null)[]>(
    new Array(files.length).fill(null)
  );
  const [crops, setCrops] = useState<(Crop | null)[]>(
    new Array(files.length).fill(null)
  );

  useEffect(() => {
    const detectDurations = async () => {
      const updatedSongs = await Promise.all(
        files.map(async (file, index) => {
          const duration = await getAudioDuration(file);
          return {
            ...songs[index],
            duration: formatDuration(duration),
          };
        })
      );
      setSongs(updatedSongs);
    };

    detectDurations();
  }, [files]);

  const handleInputChange = (
    index: number,
    field: keyof Omit<Song, "id">,
    value: string
  ) => {
    setSongs((prevSongs) =>
      prevSongs.map((song, i) =>
        i === index ? { ...song, [field]: value } : song
      )
    );
  };

  const handleCoverChange = (index: number, file: File | null) => {
    setCovers((prevCovers) =>
      prevCovers.map((cover, i) => (i === index ? file : cover))
    );
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreviews((prevPreviews) =>
          prevPreviews.map((preview, i) =>
            i === index ? (e.target?.result as string) : preview
          )
        );
      };
      reader.readAsDataURL(file);
    } else {
      setCoverPreviews((prevPreviews) =>
        prevPreviews.map((preview, i) => (i === index ? null : preview))
      );
    }
    setCrops((prevCrops) =>
      prevCrops.map((crop, i) => (i === index ? null : crop))
    );
  };

  const handleCropComplete = (index: number, crop: Crop) => {
    setCrops((prevCrops) =>
      prevCrops.map((prevCrop, i) => (i === index ? crop : prevCrop))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(songs, covers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {songs.map((song, index) => (
        <div key={index} className="space-y-2 rounded-lg">
          <Label>Song {index + 1}</Label>
          <Input
            value={song.title}
            onChange={(e) => handleInputChange(index, "title", e.target.value)}
            placeholder="Song title"
          />
          <Input
            value={song.artist}
            onChange={(e) => handleInputChange(index, "artist", e.target.value)}
            placeholder="Artist name"
          />
          <Input
            value={song.duration}
            readOnly
            placeholder="Duration (e.g., 3:45)"
          />
          <div>
            <div className="flex flex-col items-center space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleCoverChange(index, e.target.files?.[0] || null)
                }
                className="hidden"
                id={`cover-${index}`}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  document.getElementById(`cover-${index}`)?.click()
                }
                type="button"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {covers[index] ? "Change Cover" : "Add Cover"}
              </Button>
              {coverPreviews[index] && (
                <div className="relative">
                  <ReactCrop
                    crop={crops[index] || undefined}
                    onChange={(_, percentCrop) =>
                      handleCropComplete(index, percentCrop)
                    }
                  >
                    <Image
                      src={coverPreviews[index] || ""}
                      alt="Cover preview"
                      className="max-w-full h-auto"
                      width={300}
                      height={300}
                    />
                  </ReactCrop>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 bg-background rounded-full p-1"
                    onClick={() => handleCoverChange(index, null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {covers[index] && (
                <span className="text-sm text-muted-foreground truncate max-w-full">
                  {covers[index]?.name}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button type="submit" className="w-full">
        <UploadIcon className="w-4 h-4 mr-2" />
        Upload Songs
      </Button>
    </form>
  );
}

export function AddSongsDialog() {
  const [open, setOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [songs, setSongs] = useState<Omit<Song, "id">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [covers, setCovers] = useState<(File | null)[]>([]);
  const { addSong, fetchSongs } = usePlaylistStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsLoading(true);
    setUploadedFiles(acceptedFiles);

    const newSongs: Omit<Song, "id">[] = acceptedFiles.map((file) => ({
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Unknown Artist",
      duration: "0:00",
    }));

    setSongs(newSongs);
    setIsLoading(false);
  }, []);

  const handleAddSongs = async (
    songsData: Omit<Song, "id">[],
    coverFiles: (File | null)[]
  ) => {
    setIsLoading(true);
    const supabase = createClient();

    for (let i = 0; i < songsData.length; i++) {
      const song = songsData[i];
      const file = uploadedFiles[i];
      const cover = coverFiles[i];

      // Upload song file
      const { data: songData, error: songError } = await supabase.storage
        .from("songs")
        .upload(`${Date.now()}-${file.name}`, file);

      if (songError) {
        console.error("Error uploading song:", songError);
        continue;
      }

      // Get public URL for the song
      const {
        data: { publicUrl: songUrl },
      } = supabase.storage.from("songs").getPublicUrl(songData.path);

      let coverUrl = null;
      if (cover) {
        // Upload cover image
        const { data: coverData, error: coverError } = await supabase.storage
          .from("covers")
          .upload(`${Date.now()}-${cover.name}`, cover);

        if (coverError) {
          console.error("Error uploading cover:", coverError);
        } else {
          // Get public URL for the cover
          const {
            data: { publicUrl },
          } = supabase.storage.from("covers").getPublicUrl(coverData.path);
          coverUrl = publicUrl;
        }
      }

      // Add song to the database
      await addSong({ ...song, url: songUrl, cover: coverUrl });
    }

    setIsLoading(false);
    setOpen(false);
    setUploadedFiles([]);
    setSongs([]);
    setCovers([]);
    fetchSongs(); // Refresh the song list
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add songs
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[calc(100vh-20rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Songs</DialogTitle>
            <DialogDescription>
              Add songs to your playlist. You can add multiple songs at once.
            </DialogDescription>
          </DialogHeader>
          {uploadedFiles.length === 0 ? (
            <FileDropzone onDrop={onDrop} />
          ) : isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Processing files...</span>
            </div>
          ) : (
            <SongDetailsForm
              onSubmit={handleAddSongs}
              initialSongs={songs}
              files={uploadedFiles}
            />
          )}
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration);
    });
    audio.src = URL.createObjectURL(file);
  });
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

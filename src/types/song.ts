export type Song = {
  id: number;
  title: string;
  artist: string;
  duration: string;
  cover?: string | null;
  url?: string;
  downloaded: boolean;
  coverDownloaded?: boolean;
};

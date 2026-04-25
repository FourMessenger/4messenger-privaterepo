import { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store';
import { deriveCacheKey, getCachedFile, storeFileInCache } from '../utils/fileCache';

interface MiniAudioPlayerProps {
  fileName: string;
  src: string;
  fileUrl: string;
  onClose: () => void;
}

export const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({ fileName, src, fileUrl, onClose }) => {
  const { serverUrl, authToken } = useStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time <= 0) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const loadAudio = async () => {
      setStatus('loading');
      setError(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);

      const cacheKey = deriveCacheKey(src, fileName);

      try {
        const cached = await getCachedFile(cacheKey);
        if (cached) {
          objectUrl = URL.createObjectURL(cached.blob);
          if (!active) return;
          setBlobUrl(objectUrl);
          setStatus('ready');
          return;
        }

        let fetchUrl = src;
        if (src.startsWith('/api/files/') || src.startsWith('/uploads/')) {
          const baseUrl = serverUrl.replace(/\/$/, '');
          fetchUrl = `${baseUrl}${src}`;
        }

        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const typedBlob = new Blob([blob], { type: blob.type || 'audio/mpeg' });
        objectUrl = URL.createObjectURL(typedBlob);

        try {
          await storeFileInCache(cacheKey, typedBlob, fileName, typedBlob.type);
        } catch (cacheError) {
          console.warn('Failed to cache audio file:', cacheError);
        }

        if (!active) return;
        setBlobUrl(objectUrl);
        setStatus('ready');
      } catch (err) {
        console.error('Audio player failed to load:', err);
        if (!active) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to load audio');
      }
    };

    loadAudio();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, fileName, serverUrl, authToken]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (blobUrl && status === 'ready') {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [blobUrl, status]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
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

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const toggleMute = () => {
    setMuted(prev => !prev);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3 text-white">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{fileName}</div>
              <div className="text-xs text-gray-300">
                {status === 'loading' && 'Загрузка аудио...'}
                {status === 'ready' && 'Проигрывается из хранилища сайта'}
                {status === 'error' && error}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition"
              aria-label="Close audio player"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              disabled={status !== 'ready'}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <div className="flex-1 min-w-0">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={e => handleSeek(Number(e.target.value))}
                className="w-full accent-indigo-400"
                disabled={status !== 'ready'}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 transition"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={e => {
              setVolume(Number(e.target.value));
              if (muted && Number(e.target.value) > 0) setMuted(false);
            }}
            className="w-24 accent-indigo-400"
            aria-label="Volume"
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={blobUrl || undefined}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default MiniAudioPlayer;

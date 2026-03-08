import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Plus, 
  X, 
  Settings, 
  RefreshCw,
  ExternalLink,
  LayoutGrid,
  MonitorPlay
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaItem } from './types';
import { fetchSubredditMedia } from './services/redditService';

const DEFAULT_SUBREDDITS = ['aww', 'pics', 'earthporn', 'space'];
const SLIDE_DURATION = 5000;

export default function App() {
  const [subreddits, setSubreddits] = useState<string[]>(() => {
    const saved = localStorage.getItem('reddit-slideshow-subs');
    return saved ? JSON.parse(saved) : DEFAULT_SUBREDDITS;
  });
  const [slideDuration, setSlideDuration] = useState<number>(() => {
    const saved = localStorage.getItem('reddit-slideshow-duration');
    return saved ? parseInt(saved, 10) : 5000;
  });
  const [newSub, setNewSub] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'slideshow' | 'grid'>('slideshow');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings to local storage
  useEffect(() => {
    localStorage.setItem('reddit-slideshow-subs', JSON.stringify(subreddits));
  }, [subreddits]);

  useEffect(() => {
    localStorage.setItem('reddit-slideshow-duration', slideDuration.toString());
  }, [slideDuration]);

  const fetchAllMedia = useCallback(async () => {
    setIsLoading(true);
    const allItems: MediaItem[] = [];
    
    for (const sub of subreddits) {
      const { items } = await fetchSubredditMedia(sub);
      allItems.push(...items);
    }
    
    // Shuffle items
    const shuffled = allItems.sort(() => Math.random() - 0.5);
    setMedia(shuffled);
    setCurrentIndex(0);
    setIsLoading(false);
  }, [subreddits]);

  useEffect(() => {
    fetchAllMedia();
  }, [fetchAllMedia]);

  const [imageLoading, setImageLoading] = useState(true);

  const nextSlide = useCallback(() => {
    setImageLoading(true);
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const prevSlide = useCallback(() => {
    setImageLoading(true);
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  // Autoplay logic
  useEffect(() => {
    if (isPlaying && media.length > 0 && viewMode === 'slideshow') {
      timerRef.current = setInterval(nextSlide, slideDuration);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, media.length, nextSlide, viewMode, slideDuration]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (viewMode === 'slideshow') {
        if (e.key === 'ArrowRight') {
          nextSlide();
        } else if (e.key === 'ArrowLeft') {
          prevSlide();
        } else if (e.key === ' ') {
          e.preventDefault(); // Prevent scrolling
          setIsPlaying(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, nextSlide, prevSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const addSubreddit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSub = newSub.trim().toLowerCase();
    if (cleanSub && !subreddits.includes(cleanSub)) {
      setSubreddits([...subreddits, cleanSub]);
      setNewSub('');
    }
  };

  const removeSubreddit = (sub: string) => {
    setSubreddits(subreddits.filter(s => s !== sub));
  };

  const currentMedia = media[currentIndex];

  return (
    <div ref={containerRef} className="h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      {/* Header / Controls */}
      <header className={`z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${isFullscreen && isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <MonitorPlay className="text-red-500" />
            REDDIT SLIDESHOW
          </h1>
          <div className="hidden md:flex items-center gap-2 text-xs text-white/60 uppercase tracking-widest">
            {subreddits.map(sub => (
              <span key={sub} className="px-2 py-1 bg-white/10 rounded-full">r/{sub}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'slideshow' ? 'grid' : 'slideshow')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title={viewMode === 'slideshow' ? 'Grid View' : 'Slideshow View'}
          >
            {viewMode === 'slideshow' ? <LayoutGrid size={20} /> : <MonitorPlay size={20} />}
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={fetchAllMedia}
            className={`p-2 hover:bg-white/10 rounded-full transition-colors ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <RefreshCw size={48} className="animate-spin text-white/20" />
            <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Loading Media...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-white/40 mb-4">No media found in the selected subreddits.</p>
            <button 
              onClick={() => setShowSettings(true)}
              className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-colors"
            >
              Add Subreddits
            </button>
          </div>
        ) : viewMode === 'slideshow' ? (
          <div className="w-full h-full relative group">
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
              {currentMedia.isEmbed ? (
                <iframe 
                  src={currentMedia.url} 
                  className="w-full h-full border-0 rounded-lg shadow-2xl"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : currentMedia.type === 'video' ? (
                <video 
                  src={currentMedia.url} 
                  autoPlay 
                  loop 
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                  onEnded={nextSlide}
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw size={32} className="animate-spin text-white/10" />
                    </div>
                  )}
                  <img 
                    src={currentMedia.url} 
                    alt={currentMedia.title}
                    onLoad={() => setImageLoading(false)}
                    className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Slide Info */}
            <div className={`absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${isFullscreen && isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              <div className="max-w-4xl mx-auto">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-red-500 font-mono text-xs uppercase tracking-widest mb-1">r/{currentMedia.subreddit}</p>
                    <h2 className="text-xl md:text-2xl font-bold leading-tight mb-2">{currentMedia.title}</h2>
                    <p className="text-white/40 text-sm">by u/{currentMedia.author}</p>
                  </div>
                  <a 
                    href={currentMedia.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className={`absolute bottom-8 right-8 flex items-center gap-4 z-20 transition-opacity duration-300 ${isFullscreen && isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              <button onClick={prevSlide} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md">
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="p-4 bg-white text-black hover:scale-105 transition-transform rounded-full shadow-xl"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
              </button>
              <button onClick={nextSlide} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto p-4 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {media.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => {
                    setCurrentIndex(index);
                    setViewMode('slideshow');
                  }}
                  className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg bg-white/5"
                >
                  <img 
                    src={item.thumbnail.startsWith('http') ? item.thumbnail : item.url} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-[10px] text-red-500 font-mono uppercase">r/{item.subreddit}</p>
                    <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 w-full max-w-md rounded-2xl p-8 border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">Subreddits</label>
                  <form onSubmit={addSubreddit} className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={newSub}
                      onChange={(e) => setNewSub(e.target.value)}
                      placeholder="e.g. earthporn"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                    />
                    <button type="submit" className="p-2 bg-white text-black rounded-lg hover:bg-white/90">
                      <Plus size={24} />
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {subreddits.map(sub => (
                      <div key={sub} className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm">
                        <span>r/{sub}</span>
                        <button onClick={() => removeSubreddit(sub)} className="hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                    Slide Duration: {slideDuration / 1000}s
                  </label>
                  <input 
                    type="range" 
                    min="2000" 
                    max="30000" 
                    step="1000"
                    value={slideDuration}
                    onChange={(e) => setSlideDuration(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="flex justify-between text-[10px] text-white/20 mt-2 font-mono">
                    <span>2s</span>
                    <span>30s</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button 
                    onClick={() => {
                      fetchAllMedia();
                      setShowSettings(false);
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    Refresh Feed
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {viewMode === 'slideshow' && isPlaying && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div 
            key={currentIndex}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: slideDuration / 1000, ease: "linear" }}
            className="h-full bg-red-600"
          />
        </div>
      )}
    </div>
  );
}

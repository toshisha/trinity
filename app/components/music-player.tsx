'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1Icon as RepeatOne, Music, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { PlaylistSidebar } from './playlist-sidebar'

export interface Track {
  id: number
  title: string
  artist: string
  album: string
  year: string
  duration: number
  url: string
  coverArt: string | null
}

export interface Playlist {
  name: string
  tracks: Track[]
  coverArt: string
}

export default function MusicPlayer() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tracks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlaylists(data)
          if (data.length > 0) {
            setCurrentPlaylist(data[0])
            setFilteredTracks(data[0].tracks)
          }
        }
      })
      .catch(error => console.error('Error:', error))
  }, [])

  useEffect(() => {
    if (currentPlaylist) {
      const filtered = currentPlaylist.tracks.filter(track => 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredTracks(filtered)
    }
  }, [searchQuery, currentPlaylist])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const shuffleArray = useCallback((array: Track[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => !prev)
    if (!isShuffled) {
      setFilteredTracks(shuffleArray(filteredTracks))
    } else {
      setFilteredTracks([...currentPlaylist!.tracks])
    }
  }, [isShuffled, filteredTracks, currentPlaylist, shuffleArray])

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }, [])

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    if (audioRef.current) {
      audioRef.current.src = track.url
      audioRef.current.play()
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (!currentTrack) return
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play()
    }
    setIsPlaying(!isPlaying)
  }, [currentTrack, isPlaying])

  const playNext = useCallback(() => {
    if (!currentTrack || filteredTracks.length === 0) return
    const currentIndex = filteredTracks.findIndex(track => track.id === currentTrack.id)
    let nextTrack: Track

    if (repeatMode === 'one') {
      nextTrack = currentTrack
    } else {
      const nextIndex = (currentIndex + 1) % filteredTracks.length
      nextTrack = filteredTracks[nextIndex]
    }

    playTrack(nextTrack)
  }, [currentTrack, filteredTracks, repeatMode, playTrack])

  const playPrevious = useCallback(() => {
    if (!currentTrack || filteredTracks.length === 0) return
    const currentIndex = filteredTracks.findIndex(track => track.id === currentTrack.id)
    let previousTrack: Track

    if (repeatMode === 'one') {
      previousTrack = currentTrack
    } else {
      const previousIndex = (currentIndex - 1 + filteredTracks.length) % filteredTracks.length
      previousTrack = filteredTracks[previousIndex]
    }

    playTrack(previousTrack)
  }, [currentTrack, filteredTracks, repeatMode, playTrack])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentTrack || !audioRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const percentage = x / width
    const newTime = percentage * (currentTrack.duration || 0)
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [currentTrack])

  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
    } else if (repeatMode === 'all' || isShuffled) {
      playNext()
    } else {
      const currentIndex = filteredTracks.findIndex(track => track.id === currentTrack?.id)
      if (currentIndex < filteredTracks.length - 1) {
        playNext()
      } else {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }
  }, [repeatMode, isShuffled, playNext, filteredTracks, currentTrack])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }, [])

  const toggleMute = useCallback(() => {
    setVolume(prev => prev === 0 ? 1 : 0)
  }, [])

  const handleSelectPlaylist = useCallback((playlist: Playlist) => {
    setCurrentPlaylist(playlist)
    setFilteredTracks(playlist.tracks)
    setSearchQuery('')
  }, [])

  return (
    <div className="flex h-screen bg-black text-white">
      <PlaylistSidebar
        playlists={playlists}
        currentPlaylist={currentPlaylist}
        onSelectPlaylist={handleSelectPlaylist}
      />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between px-4 h-20 border-b border-white/10">
          <div className="py-2">
            <Image
              src="/logo.svg"
              alt="mafwbh logo"
              width={120}
              height={40}
              priority
            />
          </div>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Explore music..."
              className="w-full pl-10 py-2 bg-black border border-white/10 text-white text-sm placeholder:text-white/60 focus:outline-none rounded-md"
            />
          </div>
        </header>

        <div className="flex-1 p-4 overflow-hidden">
          <div className="border border-white/10 rounded-md h-full flex flex-col">
            <div className="grid grid-cols-[48px_48px_1fr_1fr_80px] gap-3 text-sm opacity-60 px-4 py-2 border-b border-white/10">
              <div className="text-center">#</div>
              <div></div>
              <div>Title</div>
              <div>Artist</div>
              <div className="text-right pr-2">Duration</div>
            </div>

            {filteredTracks.length === 0 ? (
              <div className="text-center py-8 opacity-60">
                {searchQuery ? (
                  <p className="text-sm">No matching songs found</p>
                ) : (
                  <>
                    <p className="text-sm">No songs found</p>
                    <p className="text-xs mt-1">Add audio files to the playlist folders to get started</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                {filteredTracks.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className={`w-full grid grid-cols-[48px_48px_1fr_1fr_80px] gap-3 text-sm px-4 py-2 hover:bg-white/5 transition-colors items-center ${
                      currentTrack?.id === track.id ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="text-center opacity-60">{index + 1}</div>
                    <div className="relative w-8 h-8">
                      {track.coverArt ? (
                        <Image
                          src={track.coverArt}
                          alt={`${track.title} cover`}
                          fill
                          className="object-cover rounded-sm"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 rounded-sm flex items-center justify-center">
                          <Music className="w-4 h-4 opacity-60" />
                        </div>
                      )}
                    </div>
                    <div className="text-left truncate">{track.title}</div>
                    <div className="text-left opacity-60 truncate">{track.artist}</div>
                    <div className="text-right opacity-60 pr-2">
                      {formatTime(track.duration)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black p-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
            <div 
              ref={progressRef}
              onClick={handleProgressClick}
              className="w-full bg-white/10 h-1 rounded-full overflow-hidden cursor-pointer"
            >
              <div 
                className="bg-white h-full transition-all" 
                style={{ width: `${(currentTime / (currentTrack?.duration || 1)) * 100}%` }}
              />
            </div>

            <div className="w-full flex items-center justify-between">
              <div className="w-1/3 flex items-center">
                <div className="text-sm opacity-60 mr-4">
                  {formatTime(currentTime)} / {currentTrack ? formatTime(currentTrack.duration) : '0:00'}
                </div>
                {currentTrack && (
                  <div className="truncate">
                    <div className="font-medium truncate">{currentTrack.title}</div>
                    <div className="text-sm opacity-60 truncate">{currentTrack.artist}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleShuffle}
                  className={`p-2 transition-opacity ${isShuffled ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button 
                  onClick={playPrevious}
                  className="p-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
                <button 
                  onClick={playNext}
                  className="p-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <button 
                  onClick={toggleRepeat}
                  className={`p-2 transition-opacity ${repeatMode !== 'off' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  {repeatMode === 'one' ? (
                    <RepeatOne className="w-5 h-5" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="w-1/3 flex items-center justify-end gap-2">
                <button onClick={toggleMute} className="p-2 opacity-60 hover:opacity-100 transition-opacity">
                  {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-2 bg-white/10 rounded-full overflow-hidden appearance-none"
                  style={{
                    background: `linear-gradient(to right, white ${volume * 100}%, rgba(255, 255, 255, 0.1) ${volume * 100}%)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={handleTrackEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={currentTrack?.url} type="audio/mpeg" />
          <source src={currentTrack?.url} type="audio/flac" />
          <source src={currentTrack?.url} type="audio/wav" />
          <source src={currentTrack?.url} type="audio/aac" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  )
}

const scrollbarCSS = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    border: transparent;
  }
`

const ScrollbarStyle = () => (
  <style jsx global>{scrollbarCSS}</style>
)


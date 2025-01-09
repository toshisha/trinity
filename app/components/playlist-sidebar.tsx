import Image from 'next/image'
import { Playlist } from './music-player'

interface PlaylistSidebarProps {
  playlists: Playlist[]
  currentPlaylist: Playlist | null
  onSelectPlaylist: (playlist: Playlist) => void
}

export function PlaylistSidebar({ playlists, currentPlaylist, onSelectPlaylist }: PlaylistSidebarProps) {
  return (
    <div className="w-64 h-full bg-black border-r border-white/10 overflow-y-auto">
      <h2 className="text-xl font-bold px-4 py-4">Playlists</h2>
      <div className="space-y-2">
        {playlists.map((playlist) => (
          <button
            key={playlist.name}
            onClick={() => onSelectPlaylist(playlist)}
            className={`w-full flex items-center space-x-3 px-4 py-2 hover:bg-white/5 transition-colors ${
              currentPlaylist?.name === playlist.name ? 'bg-white/10' : ''
            }`}
          >
            <Image
              src={playlist.coverArt}
              alt={`${playlist.name} cover`}
              width={40}
              height={40}
              className="rounded-sm"
            />
            <span className="truncate">{playlist.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}


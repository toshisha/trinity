import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import * as mm from 'music-metadata'
import { NextResponse } from 'next/server'

interface Playlist {
  name: string
  tracks: Track[]
  coverArt: string
}

interface Track {
  id: number
  title: string
  artist: string
  album: string
  year: string
  duration: number
  url: string
  coverArt: string | null
}

export async function GET() {
  try {
    const musicDir = join(process.cwd(), 'public')
    const playlistsDir = join(musicDir, 'playlists')
    const coverArtDir = join(musicDir, 'playlistprofilepicture')

    try {
      await stat(playlistsDir)
      await stat(coverArtDir)
    } catch (error) {
      console.log('Playlists or cover art directory not found')
      return NextResponse.json([])
    }

    const playlistFolders = await readdir(playlistsDir)
    const playlists: Playlist[] = await Promise.all(
      playlistFolders.map(async (folder) => {
        const playlistDir = join(playlistsDir, folder)
        const files = await readdir(playlistDir)
        const musicFiles = files.filter(file => 
          /\.(mp3|flac|wav|aac)$/i.test(file)
        )

        const tracks = await Promise.all(
          musicFiles.map(async (file, index) => {
            const filePath = join(playlistDir, file)
            try {
              const metadata = await mm.parseFile(filePath)
              let coverArt = null
              
              if (metadata.common.picture && metadata.common.picture.length > 0) {
                const picture = metadata.common.picture[0]
                const buffer = picture.data
                coverArt = `data:${picture.format};base64,${buffer.toString('base64')}`
              }

              return {
                id: index + 1,
                title: metadata.common.title || file.replace(/\.(mp3|flac|wav|aac)$/i, ''),
                artist: metadata.common.artist || 'Unknown Artist',
                album: metadata.common.album || 'Unknown Album',
                year: metadata.common.year?.toString() || 'Unknown Year',
                duration: Math.floor(metadata.format.duration || 0),
                url: `/playlists/${folder}/${file}`,
                coverArt
              }
            } catch (error) {
              console.error(`Error parsing metadata for ${file}:`, error)
              return {
                id: index + 1,
                title: file.replace(/\.(mp3|flac|wav|aac)$/i, ''),
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                year: 'Unknown Year',
                duration: 0,
                url: `/playlists/${folder}/${file}`,
                coverArt: null
              }
            }
          })
        )

        const coverArtPath = join(coverArtDir, `${folder}.png`)
        let coverArt = `/playlistprofilepicture/${folder}.png`
        try {
          await stat(coverArtPath)
        } catch (error) {
          coverArt = '/placeholder.svg?height=300&width=300'
        }

        return {
          name: folder,
          tracks,
          coverArt
        }
      })
    )
    
    return NextResponse.json(playlists)
  } catch (error) {
    console.error('Error reading playlists:', error)
    return NextResponse.json([])
  }
}


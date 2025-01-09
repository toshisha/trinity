import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

// Simple metadata parser that reads the first few bytes of the file
async function getBasicMetadata(filePath: string) {
  try {
    const stats = await stat(filePath)
    const fileName = filePath.split('/').pop() || ''
    const nameWithoutExt = fileName.replace(/\.(mp3|flac|wav|aac)$/i, '')
    
    // Parse artist - title format if present
    const [artist, title] = nameWithoutExt.includes(' - ') 
      ? nameWithoutExt.split(' - ')
      : ['Unknown Artist', nameWithoutExt]

    return {
      title: title.trim(),
      artist: artist.trim(),
      size: stats.size,
      // Estimate duration based on file size (rough approximation)
      duration: Math.floor(stats.size / 16000) // Very rough estimate
    }
  } catch (error) {
    console.error(`Error reading metadata for ${filePath}:`, error)
    return {
      title: filePath.split('/').pop()?.replace(/\.(mp3|flac|wav|aac)$/i, '') || 'Unknown',
      artist: 'Unknown Artist',
      size: 0,
      duration: 0
    }
  }
}

export async function GET() {
  try {
    const musicDir = join(process.cwd(), 'public')
    const playlistsDir = join(musicDir, 'playlists')
    const coverArtDir = join(musicDir, 'playlistprofilepicture')

    // Verify directories exist
    try {
      await stat(playlistsDir)
      await stat(coverArtDir)
    } catch {
      return NextResponse.json({ playlists: [] })
    }

    // Read playlists
    const playlistFolders = await readdir(playlistsDir)
    const playlists = await Promise.all(
      playlistFolders.map(async (folder) => {
        const playlistDir = join(playlistsDir, folder)
        const files = await readdir(playlistDir)
        const musicFiles = files.filter(file => /\.(mp3|flac|wav|aac)$/i.test(file))

        // Process tracks
        const tracks = await Promise.all(
          musicFiles.map(async (file, index) => {
            const filePath = join(playlistDir, file)
            const metadata = await getBasicMetadata(filePath)

            return {
              id: index + 1,
              title: metadata.title,
              artist: metadata.artist,
              duration: metadata.duration,
              url: `/playlists/${folder}/${file}`,
              coverArt: null
            }
          })
        )

        // Check for playlist cover art
        const coverArtPath = join(coverArtDir, `${folder}.png`)
        let coverArt = `/playlistprofilepicture/${folder}.png`
        try {
          await stat(coverArtPath)
        } catch {
          coverArt = '/placeholder.svg?height=300&width=300'
        }

        return {
          name: folder,
          tracks,
          coverArt
        }
      })
    )
    
    return NextResponse.json({ playlists })
  } catch (error) {
    console.error('Error reading playlists:', error)
    return NextResponse.json({ playlists: [], error: 'Failed to load playlists' })
  }
}


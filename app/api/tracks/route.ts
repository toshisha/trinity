import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

// Remove the music-metadata import and implement a simpler metadata extraction
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    // Return a default duration since we can't get actual duration without music-metadata
    return 0
  } catch (error) {
    console.error(`Error getting duration for ${filePath}:`, error)
    return 0
  }
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
    const playlists = await Promise.all(
      playlistFolders.map(async (folder) => {
        const playlistDir = join(playlistsDir, folder)
        const files = await readdir(playlistDir)
        const musicFiles = files.filter(file => 
          /\.(mp3|flac|wav|aac)$/i.test(file)
        )

        const tracks = await Promise.all(
          musicFiles.map(async (file, index) => {
            const filePath = join(playlistDir, file)
            const duration = await getAudioDuration(filePath)

            return {
              id: index + 1,
              title: file.replace(/\.(mp3|flac|wav|aac)$/i, ''),
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              year: 'Unknown Year',
              duration,
              url: `/playlists/${folder}/${file}`,
              coverArt: null
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


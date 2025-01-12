import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import { getAudioDurationInSeconds } from 'get-audio-duration'

async function getAudioMetadata(filePath: string, fileName: string) {
  try {
    // Get duration using get-audio-duration
    const duration = await getAudioDurationInSeconds(filePath)
    
    // Parse filename for metadata
    // Expected format: "Artist Name - Song Title.mp3"
    const nameWithoutExt = fileName.replace(/\.(mp3|flac|wav|aac)$/i, '')
    
    if (nameWithoutExt.includes(' - ')) {
      const [artist, title] = nameWithoutExt.split(' - ')
      return {
        title: title.trim(),
        artist: artist.trim(),
        duration: Math.round(duration)
      }
    } else {
      // If filename doesn't follow the format, use the whole name as title
      return {
        title: nameWithoutExt.trim(),
        artist: 'Unknown Artist',
        duration: Math.round(duration)
      }
    }
  } catch (error) {
    console.error('Error getting audio metadata:', error)
    return {
      title: fileName,
      artist: 'Unknown Artist',
      duration: 0
    }
  }
}

export async function GET() {
  try {
    const musicDir = join(process.cwd(), 'public', 'music')
    
    try {
      await stat(musicDir)
    } catch {
      return NextResponse.json([])
    }

    const files = await readdir(musicDir)
    const musicFiles = files.filter(file => /\.(mp3|flac|wav|aac)$/i.test(file))

    if (musicFiles.length === 0) {
      return NextResponse.json([])
    }

    const tracks = await Promise.all(
      musicFiles.map(async (file, index) => {
        const filePath = join(musicDir, file)
        const metadata = await getAudioMetadata(filePath, file)

        return {
          id: index + 1,
          title: metadata.title,
          artist: metadata.artist,
          duration: metadata.duration,
          url: `/music/${file}`
        }
      })
    )

    return NextResponse.json(tracks)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json([])
  }
}


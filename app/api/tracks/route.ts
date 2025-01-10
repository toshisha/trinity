import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

async function getBasicMetadata(filePath: string) {
  try {
    const stats = await stat(filePath)
    const fileName = filePath.split('/').pop() || ''
    const nameWithoutExt = fileName.replace(/\.(mp3|flac|wav|aac)$/i, '')
    
    const [artist, title] = nameWithoutExt.includes(' - ') 
      ? nameWithoutExt.split(' - ')
      : ['Unknown Artist', nameWithoutExt]

    return {
      title: title.trim(),
      artist: artist.trim(),
      size: stats.size,
      duration: Math.floor(stats.size / 16000)
    }
  } catch (error) {
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
    const musicDir = join(process.cwd(), 'public', 'music')
    const files = await readdir(musicDir)
    const musicFiles = files.filter(file => /\.(mp3|flac|wav|aac)$/i.test(file))

    const tracks = await Promise.all(
      musicFiles.map(async (file, index) => {
        const filePath = join(musicDir, file)
        const metadata = await getBasicMetadata(filePath)

        return {
          id: index + 1,
          title: metadata.title,
          artist: metadata.artist,
          duration: metadata.duration,
          url: `/music/${file}`,
          coverArt: null
        }
      })
    )

    return NextResponse.json(tracks)
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json([])
  }
}


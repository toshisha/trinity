import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import * as mm from 'music-metadata'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const musicDir = join(process.cwd(), 'public', 'music')
    
    try {
      await stat(musicDir)
    } catch (error) {
      console.log('Music directory not found')
      return NextResponse.json([])
    }

    const files = await readdir(musicDir)
    const musicFiles = files.filter(file => 
      /\.(mp3|flac|wav|aac)$/i.test(file)
    )

    if (musicFiles.length === 0) {
      console.log('No supported audio files found')
      return NextResponse.json([])
    }

    const tracks = await Promise.all(
      musicFiles.map(async (file, index) => {
        const filePath = join(musicDir, file)
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
            year: metadata.common.year || 'Unknown Year',
            duration: Math.floor(metadata.format.duration || 0),
            url: `/music/${file}`,
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
            url: `/music/${file}`,
            coverArt: null
          }
        }
      })
    )
    
    return NextResponse.json(tracks)
  } catch (error) {
    console.error('Error reading tracks:', error)
    return NextResponse.json([])
  }
}


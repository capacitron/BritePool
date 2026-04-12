'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AudioPlayerProps {
  src: string
  title?: string
}

export function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const visualizerActiveRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const initAudioContext = useCallback(() => {
    if (contextRef.current || !audioRef.current) return

    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.8

      const source = ctx.createMediaElementSource(audioRef.current)
      source.connect(analyser)
      analyser.connect(ctx.destination)

      contextRef.current = ctx
      analyserRef.current = analyser
      visualizerActiveRef.current = true
    } catch {
      // CORS or browser restriction — visualizer won't work but audio still plays
      visualizerActiveRef.current = false
    }
  }, [])

  const drawBars = useCallback((dataArray: Uint8Array | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const barCount = 48
    const gap = 2
    const barWidth = (width - gap * (barCount - 1)) / barCount
    const centerY = height / 2

    for (let i = 0; i < barCount; i++) {
      const value = dataArray ? (dataArray[i] ?? 0) / 255 : 0
      const barHeight = Math.max(2, value * centerY * 0.9)

      const hue = 140 + i * (40 / barCount)
      const lightness = dataArray ? 35 + value * 25 : 40
      const saturation = dataArray ? 50 : 30
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`

      const x = i * (barWidth + gap)

      ctx.beginPath()
      ctx.roundRect(x, centerY - barHeight, barWidth, barHeight, 1)
      ctx.fill()

      ctx.beginPath()
      ctx.roundRect(x, centerY, barWidth, barHeight, 1)
      ctx.fill()
    }
  }, [])

  const drawSimulatedBars = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const barCount = 48
    const fakeData = new Uint8Array(barCount)

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      const time = Date.now() / 1000

      for (let i = 0; i < barCount; i++) {
        const wave1 = Math.sin(time * 2 + i * 0.3) * 0.3
        const wave2 = Math.sin(time * 3.7 + i * 0.5) * 0.2
        const wave3 = Math.sin(time * 1.3 + i * 0.15) * 0.15
        const base = 0.15 + Math.sin((i / barCount) * Math.PI) * 0.2
        fakeData[i] = Math.max(0, Math.min(255, (base + wave1 + wave2 + wave3) * 255))
      }

      drawBars(fakeData)
    }

    draw()
  }, [drawBars])

  const drawVisualizer = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)
      drawBars(dataArray)
    }

    draw()
  }, [drawBars])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1)
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1)
      if (!isPlaying) drawBars(null)
    })

    resizeObserver.observe(canvas)
    return () => resizeObserver.disconnect()
  }, [isPlaying, drawBars])

  useEffect(() => {
    if (isPlaying) {
      if (visualizerActiveRef.current && analyserRef.current) {
        drawVisualizer()
      } else {
        drawSimulatedBars()
      }
    } else {
      cancelAnimationFrame(animFrameRef.current)
      drawBars(null)
    }

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isPlaying, drawVisualizer, drawSimulatedBars, drawBars])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (!isPlaying) {
      initAudioContext()
      if (contextRef.current?.state === 'suspended') {
        await contextRef.current.resume()
      }
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Playback failed:', err)
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Visualizer */}
      <canvas
        ref={canvasRef}
        className="w-full h-32 rounded-lg"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className="text-white hover:bg-white/10 h-10 w-10 p-0"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        <span className="text-white/60 text-xs font-mono min-w-[40px]">
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 accent-forest-400 cursor-pointer"
        />

        <span className="text-white/60 text-xs font-mono min-w-[40px] text-right">
          {formatTime(duration)}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="text-white hover:bg-white/10 h-10 w-10 p-0"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      {title && <p className="text-white/40 text-xs text-center font-body">{title}</p>}
    </div>
  )
}

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Volume2, VolumeX, Play, Pause, Maximize2, Minimize2, RotateCcw } from 'lucide-react'

interface MacBookVideoPlayerProps {
  src?: string
}

export const MacBookVideoPlayer: React.FC<MacBookVideoPlayerProps> = ({
  src = '/videos/whatbreaks-demo.mp4'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [progress, setProgress] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(53)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [showControls, setShowControls] = useState<boolean>(false)
  const [clickFeedback, setClickFeedback] = useState<'play' | 'pause' | null>(null)

  // Ensure autoplay on mount (muted by default to satisfy browser autoplay policy)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false)
        })
    }
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Format time (mm:ss)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00'
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  // Toggle Mute / Unmute
  const toggleMute = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    const video = videoRef.current
    if (!video) return

    const nextMuted = !video.muted
    video.muted = nextMuted
    setIsMuted(nextMuted)

    // If unmuting while paused, resume playback
    if (!nextMuted && video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(console.error)
    }
  }, [])

  // Toggle Play / Pause
  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true)
        setClickFeedback('play')
        setTimeout(() => setClickFeedback(null), 500)
      }).catch(console.error)
    } else {
      video.pause()
      setIsPlaying(false)
      setClickFeedback('pause')
      setTimeout(() => setClickFeedback(null), 500)
    }
  }, [])

  // Restart video from beginning
  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play().then(() => setIsPlaying(true)).catch(console.error)
  }

  // Toggle Fullscreen
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(console.error)
    } else {
      document.exitFullscreen?.().catch(console.error)
    }
  }

  // Progress update
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const cur = video.currentTime
    const dur = video.duration || duration || 53
    setCurrentTime(cur)
    setProgress((cur / dur) * 100)
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (video && video.duration && !isNaN(video.duration)) {
      setDuration(video.duration)
    }
  }

  // Scrubbing on progress bar
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const video = videoRef.current
    const target = e.currentTarget
    if (!video || !target) return

    const rect = target.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    const newTime = percent * (video.duration || duration)
    video.currentTime = newTime
    setCurrentTime(newTime)
    setProgress(percent * 100)
  }

  // Mouse move / hover controls visibility
  const handleMouseMove = () => {
    setShowControls(true)
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current)
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false)
    }, 2800)
  }

  const handleMouseLeave = () => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current)
    }
    setShowControls(false)
  }

  return (
    <div
      ref={containerRef}
      className={`macbook-video-container ${showControls ? 'controls-active' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={togglePlay}
      tabIndex={0}
      role="region"
      aria-label="WhatBreaks Product Demo Video"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="macbook-screen-video"
        playsInline
        autoPlay
        muted
        loop
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Primary Floating Mute Toggle Badge (Always Visible and Intuitive) */}
      <button
        type="button"
        className={`macbook-floating-mute-btn ${isMuted ? 'is-muted' : 'is-unmuted'}`}
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
        title={isMuted ? 'Click to enable voiceover audio' : 'Click to mute audio'}
      >
        <span className="mute-icon-wrapper">
          {isMuted ? (
            <VolumeX size={15} className="mute-icon text-muted" />
          ) : (
            <Volume2 size={15} className="mute-icon text-active" />
          )}
        </span>
        <span className="mute-label mono">
          {isMuted ? 'UNMUTE AUDIO' : 'AUDIO ON'}
        </span>
        {isMuted ? (
          <span className="mute-pulse-dot" />
        ) : (
          <span className="audio-equalizer-dots" aria-hidden="true">
            <span className="dot dot-1" />
            <span className="dot dot-2" />
            <span className="dot dot-3" />
          </span>
        )}
      </button>

      {/* Transient Center Play/Pause Ripple Feedback */}
      {clickFeedback && (
        <div className="video-click-ripple" aria-hidden="true">
          <div className="ripple-circle">
            {clickFeedback === 'play' ? <Play size={32} fill="white" /> : <Pause size={32} fill="white" />}
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar (Shows on Hover / Tap) */}
      <div
        className={`macbook-video-control-bar ${showControls || !isPlaying ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Play / Pause Button */}
        <button
          type="button"
          className="video-ctrl-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>

        {/* Restart Button */}
        <button
          type="button"
          className="video-ctrl-btn"
          onClick={handleRestart}
          aria-label="Restart video"
          title="Restart from beginning"
        >
          <RotateCcw size={13} />
        </button>

        {/* Interactive Scrubber / Progress Bar */}
        <div
          className="video-scrubber-track"
          onClick={handleScrub}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Video scrubber"
        >
          <div className="video-scrubber-buffered" />
          <div className="video-scrubber-fill" style={{ width: `${progress}%` }}>
            <span className="video-scrubber-handle" />
          </div>
        </div>

        {/* Time Stamp */}
        <div className="video-timestamp mono">
          <span>{formatTime(currentTime)}</span>
          <span className="timestamp-divider">/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Control Bar Mute Button */}
        <button
          type="button"
          className={`video-ctrl-btn ${!isMuted ? 'active-audio' : ''}`}
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          className="video-ctrl-btn"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  )
}

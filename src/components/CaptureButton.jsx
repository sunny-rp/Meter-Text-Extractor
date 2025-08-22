"use client"

import { useState } from "react"

function CaptureButton({ onCapture, disabled = false }) {
  const [isCapturing, setIsCapturing] = useState(false)

  const handleCapture = async () => {
    if (disabled || isCapturing) return

    setIsCapturing(true)
    try {
      await onCapture()
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <button
      onClick={handleCapture}
      disabled={disabled || isCapturing}
      className={`
        relative w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm
        transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/50
        ${disabled || isCapturing ? "opacity-50 cursor-not-allowed" : "hover:bg-white/30 active:scale-95"}
      `}
      aria-label={isCapturing ? "Capturing image..." : "Capture image"}
    >
      <div
        className={`
        absolute inset-2 rounded-full bg-white transition-all duration-200
        ${isCapturing ? "scale-75" : "scale-100"}
      `}
      >
        {isCapturing && (
          <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        )}
      </div>

      {/* Pulse animation when ready */}
      {!disabled && !isCapturing && (
        <div className="absolute inset-0 rounded-full border-4 border-white animate-pulse opacity-50" />
      )}
    </button>
  )
}

export default CaptureButton

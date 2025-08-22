"use client"

import { useRef, useState, useCallback } from "react"
import { downscaleImage } from "../utils/canvas.js"

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setIsStreaming(false)

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true)
        }
      }
    } catch (err) {
      console.error("Camera access error:", err)
      let errorMessage = "Failed to access camera"

      if (err.name === "NotAllowedError") {
        errorMessage = "Permission denied. Please allow camera access."
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device."
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Camera not supported in this browser."
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application."
      }

      setError(errorMessage)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !isStreaming) {
      throw new Error("Camera not ready")
    }

    const video = videoRef.current
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error("Failed to capture image"))
            return
          }

          try {
            // Downscale if too large for better OCR performance
            const processedImage = await downscaleImage(blob, { maxSize: 1920 })
            resolve(processedImage)
          } catch (err) {
            reject(err)
          }
        },
        "image/jpeg",
        0.9,
      )
    })
  }, [isStreaming])

  return {
    videoRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureImage,
  }
}

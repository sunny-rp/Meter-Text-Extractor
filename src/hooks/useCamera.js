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
      console.log("[v0] Starting camera initialization")
      setError(null)
      setIsStreaming(false)

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser")
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          if (track.readyState !== "ended") {
            track.stop()
          }
        })
        streamRef.current = null
      }

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
        },
      }

      console.log("[v0] Requesting camera access with constraints:", constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] Camera stream obtained successfully")

      streamRef.current = stream

      if (videoRef.current) {
        const video = videoRef.current
        video.srcObject = stream

        const handleVideoReady = () => {
          console.log("[v0] Video ready, setting streaming to true")
          setIsStreaming(true)
        }

        const handleVideoError = (e) => {
          console.error("[v0] Video error:", e)
          setError("Failed to display video stream")
        }

        // Set up event listeners
        video.addEventListener("loadedmetadata", handleVideoReady, { once: true })
        video.addEventListener("canplay", handleVideoReady, { once: true })
        video.addEventListener("error", handleVideoError, { once: true })

        // Try to play the video
        try {
          await video.play()
          console.log("[v0] Video play started successfully")

          if (video.readyState >= 2) {
            // HAVE_CURRENT_DATA
            console.log("[v0] Video ready immediately, readyState:", video.readyState)
            handleVideoReady()
          }
        } catch (playError) {
          console.log("[v0] Video autoplay failed (normal on some browsers):", playError.message)
          // Still set streaming true since we have the stream
          handleVideoReady()
        }

        const timeoutId = setTimeout(() => {
          if (video.readyState >= 1) {
            // HAVE_METADATA
            console.log("[v0] Fallback: Setting streaming true after timeout, readyState:", video.readyState)
            handleVideoReady()
          }
        }, 3000) // Reduced timeout to 3 seconds

        // Cleanup timeout when component unmounts
        return () => {
          clearTimeout(timeoutId)
          video.removeEventListener("loadedmetadata", handleVideoReady)
          video.removeEventListener("canplay", handleVideoReady)
          video.removeEventListener("error", handleVideoError)
        }
      }
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      let errorMessage = "Failed to access camera"

      if (err.name === "NotAllowedError") {
        errorMessage = "Permission denied. Please allow camera access and refresh the page."
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device."
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Camera not supported in this browser."
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application."
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera constraints not supported. Trying with basic settings..."
        try {
          console.log("[v0] Trying fallback camera settings")
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true })
          streamRef.current = basicStream
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream
            setIsStreaming(true)
            setError(null)
            return
          }
        } catch (fallbackErr) {
          console.error("[v0] Fallback camera access failed:", fallbackErr)
          errorMessage = "Camera access failed with basic settings"
        }
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setIsStreaming(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        if (track.readyState !== "ended") {
          track.stop()
        }
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      // Remove any lingering event listeners
      videoRef.current.removeEventListener("loadedmetadata", () => {})
      videoRef.current.removeEventListener("canplay", () => {})
      videoRef.current.removeEventListener("error", () => {})
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

// useCamera.js
"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { downscaleImage } from "../utils/canvas.js"

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const listenersRef = useRef({}) // keep original handlers so we can remove them
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)

  const removeVideoListeners = useCallback(() => {
    const video = videoRef.current
    const L = listenersRef.current
    if (!video) return
    if (L.loadedmetadata) video.removeEventListener("loadedmetadata", L.loadedmetadata)
    if (L.canplay) video.removeEventListener("canplay", L.canplay)
    if (L.error) video.removeEventListener("error", L.error)
    listenersRef.current = {}
  }, [])

  const attachStreamToVideo = useCallback(async () => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return

    removeVideoListeners()

    // ensure proper attributes for mobile Safari / autoplay
    video.setAttribute("playsinline", "")
    video.muted = true
    video.controls = false

    const onReady = () => setIsStreaming(true)
    const onError = (e) => {
      console.error("[v0] Video error:", e)
      setError("Failed to display video stream")
    }

    listenersRef.current.loadedmetadata = onReady
    listenersRef.current.canplay = onReady
    listenersRef.current.error = onError

    video.addEventListener("loadedmetadata", onReady, { once: true })
    video.addEventListener("canplay", onReady, { once: true })
    video.addEventListener("error", onError, { once: true })

    video.srcObject = stream

    // Wait for metadata then try to play
    if (video.readyState < 1) {
      await new Promise((res) => video.addEventListener("loadedmetadata", res, { once: true }))
    }
    try {
      await video.play()
    } catch (e) {
      // Some browsers require user gesture; we still mark ready if we have data
      console.log("[v0] video.play() rejected (may need user gesture):", e?.message)
    }

    if (video.readyState >= 2) onReady()
    else setTimeout(() => video.readyState >= 1 && onReady(), 1500)
  }, [removeVideoListeners])

  // Ref callback: when the <video> mounts later, we immediately attach the stream
  const setVideoEl = useCallback(
    (node) => {
      videoRef.current = node
      if (node && streamRef.current) {
        attachStreamToVideo()
      }
    },
    [attachStreamToVideo],
  )

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.readyState !== "ended" && t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      removeVideoListeners()
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [removeVideoListeners])

  const startCamera = useCallback(async () => {
    try {
      console.log("[v0] Starting camera initialization")
      setError(null)
      setIsStreaming(false)

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser")
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.readyState !== "ended" && t.stop())
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
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        if (err?.name === "OverconstrainedError") {
          console.log("[v0] Fallback to basic camera settings")
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        } else {
          throw err
        }
      }

      console.log("[v0] Camera stream obtained successfully")
      streamRef.current = stream

      // If the video is already mounted, attach now; otherwise the ref-callback will handle it
      if (videoRef.current) {
        await attachStreamToVideo()
      }
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      let msg = "Failed to access camera"
      if (err?.name === "NotAllowedError") {
        msg = "Permission denied. Please allow camera access and refresh the page."
      } else if (err?.name === "NotFoundError") {
        msg = "No camera found on this device."
      } else if (err?.name === "NotSupportedError") {
        msg = "Camera not supported in this browser."
      } else if (err?.name === "NotReadableError") {
        msg = "Camera is already in use by another application."
      } else if (err?.message) {
        msg = err.message
      }
      setError(msg)
      setIsStreaming(false)
    }
  }, [attachStreamToVideo])

  // Safety: stop camera when unmounting the hook user
  useEffect(() => stopCamera, [stopCamera])

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !isStreaming) {
      throw new Error("Camera not ready")
    }

    const video = videoRef.current
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) return reject(new Error("Failed to capture image"))
          try {
            const processed = await downscaleImage(blob, { maxSize: 1920 })
            resolve(processed)
          } catch (e) {
            reject(e)
          }
        },
        "image/jpeg",
        0.9,
      )
    })
  }, [isStreaming])

  return {
    // use this as the ref on <video>
    setVideoEl,
    // also expose the raw ref in case you need it elsewhere
    videoRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureImage,
  }
}

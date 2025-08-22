"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import CameraPreview from "../components/CameraPreview.jsx"
import CaptureButton from "../components/CaptureButton.jsx"
import TopBar from "../components/TopBar.jsx"
import Toast from "../components/Toast.jsx"
import { useCamera } from "../hooks/useCamera.js"

function Capture() {
  const navigate = useNavigate()
  const { videoRef, isStreaming, error, startCamera, stopCamera, captureImage } = useCamera()
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let mounted = true

    const initCamera = async () => {
      try {
        if (mounted) {
          console.log("[v0] Initializing camera from Capture component")
          await startCamera()
        }
      } catch (err) {
        if (mounted) {
          console.error("[v0] Camera initialization error in Capture:", err)
        }
      }
    }

    initCamera()

    return () => {
      console.log("[v0] Capture component unmounting, stopping camera")
      mounted = false
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const handleCapture = async () => {
    try {
      const imageData = await captureImage()
      if (imageData) {
        navigate("/result", {
          state: {
            imageData,
            timestamp: new Date().toISOString(),
          },
        })
      }
    } catch (err) {
      console.error("Capture error:", err)
      setToast({
        type: "error",
        message: "Failed to capture image. Please try again.",
      })
    }
  }

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      <TopBar title="Camera to Text" showHistory />

      <div className="flex-1 relative">
        <CameraPreview videoRef={videoRef} isStreaming={isStreaming} error={error} onRetry={startCamera} />

        {isStreaming && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <CaptureButton onCapture={handleCapture} />
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Capture

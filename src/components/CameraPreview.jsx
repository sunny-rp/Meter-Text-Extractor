"use client"

import { useEffect, useState } from "react"

function CameraPreview({ videoRef, isStreaming, error, onRetry }) {
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    if (error && error.includes("Permission denied")) {
      setPermissionDenied(true)
    }
  }, [error])

  useEffect(() => {
    console.log("[v0] CameraPreview state:", { isStreaming, error, permissionDenied })
  }, [isStreaming, error, permissionDenied])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              {permissionDenied ? "Camera Permission Needed" : "Camera Error"}
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              {permissionDenied
                ? "Please allow camera access to capture images. You may need to refresh the page and grant permission."
                : error}
            </p>
          </div>

          <div className="space-y-2">
            <button onClick={onRetry} className="btn-primary w-full" aria-label="Try accessing camera again">
              Try Again
            </button>

            {permissionDenied && (
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary w-full"
                aria-label="Refresh page to reset permissions"
              >
                Refresh Page
              </button>
            )}
          </div>

          {permissionDenied && (
            <div className="text-xs text-gray-400 mt-4">
              <p className="mb-2">If the camera still doesn't work:</p>
              <ul className="text-left space-y-1">
                <li>• Check your browser settings</li>
                <li>• Ensure you're using HTTPS</li>
                <li>• Try a different browser</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-sm" aria-live="polite">
          Starting camera...
        </p>
        <p className="text-xs text-gray-400 mt-2">If this takes too long, check browser permissions</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        controls={false}
        className="absolute inset-0 w-full h-full object-cover"
        aria-label="Camera preview"
        style={{ transform: "scaleX(-1)" }} // Mirror the video for better UX
      />

      {/* Overlay guide */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
          <div className="absolute top-2 left-2 right-2">
            <p className="text-white text-sm text-center bg-black/50 rounded px-2 py-1">
              Position text within the frame
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraPreview

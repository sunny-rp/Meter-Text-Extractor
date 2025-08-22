"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import TopBar from "../components/TopBar.jsx"
import ProgressBar from "../components/ProgressBar.jsx"
import Toast from "../components/Toast.jsx"
import { useOcr } from "../hooks/useOcr.js"
import { saveToHistory } from "../utils/storage.js"

function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const { imageData, timestamp, preloadedText } = location.state || {}
  const { text, progress, status, error, isProcessing, confidence, runOcr } = useOcr()
  const [toast, setToast] = useState(null)

  const displayText = preloadedText || text

  useEffect(() => {
    if (!imageData) {
      navigate("/capture")
      return
    }

    if (!preloadedText) {
      runOcr(imageData)
    }
  }, [imageData, navigate, runOcr, preloadedText])

  useEffect(() => {
    if (text && !isProcessing && !preloadedText) {
      const historyItem = {
        id: Date.now(),
        text,
        thumbnail: imageData,
        timestamp,
        createdAt: new Date().toISOString(),
        confidence,
      }
      saveToHistory(historyItem)
    }
  }, [text, isProcessing, imageData, timestamp, confidence, preloadedText])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText)
      setToast({ type: "success", message: "Text copied to clipboard!" })
    } catch (err) {
      setToast({ type: "error", message: "Failed to copy text" })
    }
  }

  const handleDownload = () => {
    try {
      const blob = new Blob([displayText], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `extracted-text-${new Date().toISOString().slice(0, 10)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToast({ type: "success", message: "Text downloaded!" })
    } catch (err) {
      setToast({ type: "error", message: "Failed to download text" })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Extracted Text",
          text: displayText,
        })
      } catch (err) {
        if (err.name !== "AbortError") {
          setToast({ type: "error", message: "Failed to share text" })
        }
      }
    }
  }

  const handleRetake = () => {
    navigate("/capture")
  }

  if (!imageData) {
    return null
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar title="Extracted Text" showBack />

      <div className="flex-1 p-4 overflow-hidden">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-32 h-32 rounded-lg overflow-hidden shadow-lg">
              <img src={imageData || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
            </div>
            <ProgressBar progress={progress} status={status} />
            <button
              onClick={() => navigate("/capture")}
              className="btn-secondary text-sm"
              aria-label="Cancel and return to camera"
            >
              Cancel
            </button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden">
              <img src={imageData || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
            </div>
            <div className="error-banner max-w-md text-center">
              <p className="font-medium">OCR Processing Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => runOcr(imageData)} className="btn-primary">
                Try Again
              </button>
              <button onClick={handleRetake} className="btn-secondary">
                Take New Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col space-y-4">
            {confidence > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Confidence: {confidence}%
                  {confidence < 50 && <span className="text-orange-600 ml-2">(Try retaking with better lighting)</span>}
                </p>
              </div>
            )}
            <div className="flex-1 border border-gray-200 rounded-lg p-4 overflow-auto">
              <textarea
                value={displayText}
                readOnly
                className="w-full h-full resize-none border-none outline-none text-gray-800 leading-relaxed"
                placeholder="Extracted text will appear here..."
                aria-label="Extracted text"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="btn-primary"
                aria-label="Copy text to clipboard"
                disabled={!displayText}
              >
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="btn-secondary"
                aria-label="Download text as file"
                disabled={!displayText}
              >
                Download
              </button>
              {navigator.share && (
                <button onClick={handleShare} className="btn-secondary" aria-label="Share text" disabled={!displayText}>
                  Share
                </button>
              )}
              <button onClick={handleRetake} className="btn-secondary" aria-label="Take another photo">
                Retake
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Result

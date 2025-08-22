"use client"

import { useState, useCallback, useRef } from "react"
import ocrService from "../services/ocr.js"

export function useOcr() {
  const [text, setText] = useState("")
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const abortControllerRef = useRef(null)

  const progressCallback = useCallback((progressValue, statusMessage) => {
    setProgress(progressValue)
    setStatus(statusMessage)
  }, [])

  const runOcr = useCallback(
    async (imageData) => {
      // Cancel any existing OCR process
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      setIsProcessing(true)
      setError(null)
      setText("")
      setProgress(0)
      setStatus("Preparing...")
      setConfidence(0)

      try {
        const result = await ocrService.recognize(imageData, progressCallback)

        // Check if the operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        setText(result.text)
        setConfidence(result.confidence)
        setStatus("Text extraction complete!")

        // If no text was found, show a helpful message
        if (!result.text || result.text.trim().length === 0) {
          setError("No text detected in the image. Try capturing a clearer image with better lighting.")
        } else if (result.confidence < 30) {
          setStatus("Text extracted (low confidence - image may be unclear)")
        }
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        console.error("OCR processing error:", err)
        setError(err.message || "Failed to process image")
        setStatus("Processing failed")
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsProcessing(false)
        }
      }
    },
    [progressCallback],
  )

  const cancelOcr = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsProcessing(false)
      setStatus("Cancelled")
    }
  }, [])

  const reset = useCallback(() => {
    cancelOcr()
    setText("")
    setProgress(0)
    setStatus("")
    setError(null)
    setConfidence(0)
  }, [cancelOcr])

  return {
    text,
    progress,
    status,
    error,
    isProcessing,
    confidence,
    runOcr,
    cancelOcr,
    reset,
  }
}

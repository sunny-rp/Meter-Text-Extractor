class OCRService {
  constructor() {
    this.worker = null
    this.isInitialized = false
  }

  async initialize(progressCallback) {
    if (this.isInitialized && this.worker) {
      return this.worker
    }

    try {
      progressCallback?.(0, "Initializing OCR...")

      this.worker = new Worker("/ocr-worker.js")

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("OCR initialization timeout"))
        }, 30000)

        this.worker.onmessage = (e) => {
          const { type, progress, status, error } = e.data

          if (type === "progress") {
            progressCallback?.(progress, status)
          } else if (type === "initialized") {
            clearTimeout(timeout)
            this.isInitialized = true
            progressCallback?.(100, "Ready!")
            resolve(this.worker)
          } else if (type === "error") {
            clearTimeout(timeout)
            reject(new Error(error))
          }
        }

        this.worker.onerror = (error) => {
          clearTimeout(timeout)
          reject(new Error(`Worker error: ${error.message}`))
        }

        // Initialize the worker
        this.worker.postMessage({ type: "initialize" })
      })
    } catch (error) {
      console.error("OCR initialization failed:", error)
      throw new Error(`Failed to initialize OCR: ${error.message}`)
    }
  }

  async recognize(imageData, progressCallback) {
    try {
      if (!this.worker || !this.isInitialized) {
        await this.initialize(progressCallback)
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("OCR recognition timeout"))
        }, 60000)

        const handleMessage = (e) => {
          const { type, progress, status, result, error } = e.data

          if (type === "progress") {
            progressCallback?.(progress, status)
          } else if (type === "result") {
            clearTimeout(timeout)
            this.worker.removeEventListener("message", handleMessage)
            progressCallback?.(100, "Complete!")
            resolve(result)
          } else if (type === "error") {
            clearTimeout(timeout)
            this.worker.removeEventListener("message", handleMessage)
            reject(new Error(error))
          }
        }

        this.worker.addEventListener("message", handleMessage)

        // Send image data to worker
        this.worker.postMessage({
          type: "recognize",
          imageData: imageData,
        })
      })
    } catch (error) {
      console.error("OCR recognition failed:", error)
      throw new Error(`Text recognition failed: ${error.message}`)
    }
  }

  async terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }
}

// Singleton instance
const ocrService = new OCRService()

export default ocrService

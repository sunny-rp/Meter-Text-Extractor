import { createWorker } from "tesseract.js"

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

      this.worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const progress = Math.round(m.progress * 100)
            progressCallback?.(progress, "Recognizing text...")
          } else if (m.status === "loading tesseract core") {
            const progress = Math.round(m.progress * 30) // First 30% for core loading
            progressCallback?.(progress, "Loading OCR engine...")
          } else if (m.status === "initializing tesseract") {
            const progress = 30 + Math.round(m.progress * 20) // Next 20% for initialization
            progressCallback?.(progress, "Initializing...")
          } else if (m.status === "loading language traineddata") {
            const progress = 50 + Math.round(m.progress * 30) // Next 30% for language data
            progressCallback?.(progress, "Loading language data...")
          } else if (m.status === "initializing api") {
            const progress = 80 + Math.round(m.progress * 20) // Final 20% for API
            progressCallback?.(progress, "Preparing OCR...")
          }
        },
      })

      // Configure OCR parameters for better text recognition
      await this.worker.setParameters({
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?/~` \"'",
        tessedit_pageseg_mode: "1", // Automatic page segmentation with OSD
        preserve_interword_spaces: "1",
      })

      this.isInitialized = true
      progressCallback?.(100, "Ready!")

      return this.worker
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

      progressCallback?.(0, "Starting recognition...")

      const {
        data: { text, confidence },
      } = await this.worker.recognize(imageData, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const progress = Math.round(m.progress * 100)
            progressCallback?.(progress, "Recognizing text...")
          }
        },
      })

      progressCallback?.(100, "Complete!")

      return {
        text: text.trim(),
        confidence: Math.round(confidence),
      }
    } catch (error) {
      console.error("OCR recognition failed:", error)
      throw new Error(`Text recognition failed: ${error.message}`)
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }

  // Method to add additional languages (for future enhancement)
  async addLanguage(langCode, progressCallback) {
    try {
      if (!this.worker) {
        throw new Error("OCR not initialized")
      }

      progressCallback?.(0, `Loading ${langCode} language...`)

      await this.worker.loadLanguage(langCode)
      await this.worker.initialize(langCode)

      progressCallback?.(100, `${langCode} language ready!`)
    } catch (error) {
      console.error(`Failed to add language ${langCode}:`, error)
      throw new Error(`Failed to add language: ${error.message}`)
    }
  }
}

// Singleton instance
const ocrService = new OCRService()

export default ocrService

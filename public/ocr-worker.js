importScripts("https://unpkg.com/tesseract.js@5/dist/tesseract.min.js")

const Tesseract = window.Tesseract // Declare the Tesseract variable

let worker = null
let isInitializing = false

self.onmessage = async (e) => {
  const { type, imageData, options = {} } = e.data

  try {
    switch (type) {
      case "initialize":
        if (isInitializing) {
          return // Prevent multiple initialization attempts
        }

        if (!worker) {
          isInitializing = true

          worker = await Tesseract.createWorker("eng", 1, {
            logger: (m) => {
              let progress = 0
              let status = "Initializing..."

              if (m.status === "loading tesseract core") {
                progress = Math.round(m.progress * 30)
                status = "Loading OCR engine..."
              } else if (m.status === "initializing tesseract") {
                progress = 30 + Math.round(m.progress * 20)
                status = "Initializing..."
              } else if (m.status === "loading language traineddata") {
                progress = 50 + Math.round(m.progress * 30)
                status = "Loading language data..."
              } else if (m.status === "initializing api") {
                progress = 80 + Math.round(m.progress * 20)
                status = "Preparing OCR..."
              }

              self.postMessage({
                type: "progress",
                progress,
                status,
              })
            },
          })

          await worker.setParameters({
            tessedit_char_whitelist:
              options.whitelist ||
              "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?/~` \"'",
            tessedit_pageseg_mode: options.pageSegMode || "1",
            preserve_interword_spaces: "1",
          })

          isInitializing = false
        }

        self.postMessage({
          type: "initialized",
        })
        break

      case "recognize":
        if (!worker) {
          throw new Error("Worker not initialized")
        }

        const {
          data: { text, confidence },
        } = await worker.recognize(imageData, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              self.postMessage({
                type: "progress",
                progress: Math.round(m.progress * 100),
                status: "Recognizing text...",
              })
            }
          },
        })

        self.postMessage({
          type: "result",
          result: {
            text: text.trim(),
            confidence: Math.round(confidence),
          },
        })
        break

      case "terminate":
        if (worker) {
          await worker.terminate()
          worker = null
          isInitializing = false
        }
        self.postMessage({ type: "terminated" })
        break

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    console.error("OCR Worker Error:", error)
    self.postMessage({
      type: "error",
      error: error.message,
    })
  }
}

self.onerror = (error) => {
  console.error("OCR Worker Global Error:", error)
  self.postMessage({
    type: "error",
    error: `Worker error: ${error.message || "Unknown error"}`,
  })
}

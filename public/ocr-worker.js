// Web Worker for OCR processing (optional enhancement)
// This file can be used for even better performance isolation

const Tesseract = self.Tesseract
let worker = null

self.onmessage = async (e) => {
  const { type, imageData, options = {} } = e.data

  try {
    switch (type) {
      case "initialize":
        if (!worker) {
          worker = await Tesseract.createWorker("eng", 1, {
            logger: (m) => {
              self.postMessage({
                type: "progress",
                progress: m.progress * 100,
                status: m.status,
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
                progress: m.progress * 100,
                status: "Recognizing text...",
              })
            }
          },
        })

        self.postMessage({
          type: "result",
          text: text.trim(),
          confidence: Math.round(confidence),
        })
        break

      case "terminate":
        if (worker) {
          await worker.terminate()
          worker = null
        }
        self.postMessage({ type: "terminated" })
        break

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error.message,
    })
  }
}

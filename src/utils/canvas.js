/**
 * Downscale an image if it's larger than maxSize
 * @param {Blob|string} imageInput - Image blob or data URL
 * @param {Object} options - Options object
 * @param {number} options.maxSize - Maximum size for the longest side
 * @returns {Promise<string>} - Data URL of the processed image
 */
export async function downscaleImage(imageInput, { maxSize = 1920 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      // Calculate new dimensions
      let { width, height } = img
      const longestSide = Math.max(width, height)

      if (longestSide > maxSize) {
        const scale = maxSize / longestSide
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      // Set canvas size
      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
      resolve(dataUrl)
    }

    img.onerror = () => reject(new Error("Failed to load image"))

    // Handle both Blob and data URL inputs
    if (imageInput instanceof Blob) {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error("Failed to read image file"))
      reader.readAsDataURL(imageInput)
    } else {
      img.src = imageInput
    }
  })
}

/**
 * Rotate an image by the specified degrees
 * @param {string} dataUrl - Image data URL
 * @param {number} degrees - Rotation degrees (90, 180, 270)
 * @returns {Promise<string>} - Rotated image data URL
 */
export async function rotateImage(dataUrl, degrees) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      // Set canvas dimensions based on rotation
      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height
        canvas.height = img.width
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((degrees * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      const rotatedDataUrl = canvas.toDataURL("image/jpeg", 0.9)
      resolve(rotatedDataUrl)
    }

    img.onerror = () => reject(new Error("Failed to load image for rotation"))
    img.src = dataUrl
  })
}

const HISTORY_KEY = "camera-text-history"
const MAX_HISTORY_ITEMS = 5

/**
 * Get history from localStorage
 * @returns {Array} Array of history items
 */
export function getHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (err) {
    console.error("Failed to load history:", err)
    return []
  }
}

/**
 * Save an item to history
 * @param {Object} item - History item to save
 */
export function saveToHistory(item) {
  try {
    const history = getHistory()

    // Add new item to the beginning
    history.unshift(item)

    // Keep only the latest MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS)

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory))
  } catch (err) {
    console.error("Failed to save to history:", err)
  }
}

/**
 * Clear all history
 */
export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (err) {
    console.error("Failed to clear history:", err)
  }
}

/**
 * Remove a specific item from history
 * @param {string|number} itemId - ID of the item to remove
 */
export function removeFromHistory(itemId) {
  try {
    const history = getHistory()
    const filtered = history.filter((item) => item.id !== itemId)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
  } catch (err) {
    console.error("Failed to remove from history:", err)
  }
}

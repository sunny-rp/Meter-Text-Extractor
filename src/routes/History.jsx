"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../components/TopBar.jsx"
import { getHistory, clearHistory } from "../utils/storage.js"

function History() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleOpenItem = (item) => {
    navigate("/result", {
      state: {
        imageData: item.thumbnail,
        timestamp: item.timestamp,
        preloadedText: item.text,
      },
    })
  }

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      clearHistory()
      setHistory([])
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar title="History" showBack />

      <div className="flex-1 p-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg font-medium">No history yet</p>
            <p className="text-sm mt-2">Captured text will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">{history.length} items</p>
              <button onClick={handleClearHistory} className="text-sm text-red-600 hover:text-red-700">
                Clear All
              </button>
            </div>

            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleOpenItem(item)}
                >
                  <div className="flex space-x-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.thumbnail || "/placeholder.svg"}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1">{formatDate(item.createdAt)}</p>
                      <p className="text-gray-800 line-clamp-3 text-sm leading-relaxed">
                        {item.text.substring(0, 150)}
                        {item.text.length > 150 && "..."}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default History

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Capture from "./routes/Capture.jsx"
import Result from "./routes/Result.jsx"
import History from "./routes/History.jsx"
import InstallPrompt from "./components/InstallPrompt.jsx"

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/capture" replace />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/result" element={<Result />} />
          <Route path="/history" element={<History />} />
        </Routes>
        <InstallPrompt />
      </div>
    </Router>
  )
}

export default App

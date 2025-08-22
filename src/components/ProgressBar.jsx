function ProgressBar({ progress, status }) {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-800" aria-live="polite">
          {status || "Processing..."}
        </p>
        <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}%</p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Processing progress: ${Math.round(progress)}%`}
        />
      </div>

      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    </div>
  )
}

export default ProgressBar

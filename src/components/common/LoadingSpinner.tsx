export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-lol-gold/30 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-lol-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
}

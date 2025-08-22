'use client'

export function BoardCard({ board, onBoardClick, onDeleteBoard }) {
  return (
    <div className="group cursor-pointer">
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-blue-100/50 hover:scale-[1.02] transition-all duration-300 relative group"
        onClick={() => onBoardClick(board.id)}
      >
        <div className="relative h-24 w-full overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ backgroundColor: board.background_color || '#3a72ee' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10" />
          
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="font-bold text-lg text-white drop-shadow-sm truncate">
              {board.title}
            </h3>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {board.visibility}
                </span>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteBoard(board)
              }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 hover:bg-red-50 rounded-lg cursor-pointer hover:scale-110"
              title="Delete board"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

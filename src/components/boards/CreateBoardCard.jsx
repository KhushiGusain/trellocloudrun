'use client'

export function CreateBoardCard({ onClick }) {
  return (
    <div onClick={onClick} className="group cursor-pointer">
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 h-full min-h-[140px] flex flex-col items-center justify-center p-6 relative overflow-hidden">

        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-blue-100" />
        </div>
        
        <div className="relative z-10 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>


        <p className="relative z-10 text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-200">
          Create new board
        </p>
      
        <p className="relative z-10 text-xs text-gray-500 mt-1 group-hover:text-blue-600 transition-colors duration-200">
          Start organizing
        </p>
      </div>
    </div>
  )
}

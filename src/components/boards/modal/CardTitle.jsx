'use client'

export default function CardTitle({ title, isEditingTitle, onTitleChange, onSaveTitle, onStartEditTitle }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveTitle()
              if (e.key === 'Escape') onStartEditTitle(false)
            }}
            onBlur={onSaveTitle}
            className="w-full text-2xl font-bold text-gray-900 border-none outline-none bg-transparent"
            autoFocus
          />
        ) : (
          <h1 
            className="text-2xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
            onClick={() => onStartEditTitle(true)}
          >
            {title}
          </h1>
        )}
      </div>
    </div>
  )
}

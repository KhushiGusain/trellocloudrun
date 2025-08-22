'use client'

export default function DescriptionSection({
  description,
  isEditingDescription,
  onDescriptionChange,
  onSaveDescription,
  onStartEditDescription,
  onCancelEditDescription,
  originalDescription,
  isSavingDescription
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Description</h3>
      </div>
      
      {isEditingDescription ? (
        <div className="space-y-3">
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Add a more detailed description..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="4"
            autoFocus
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={onSaveDescription}
              disabled={isSavingDescription}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                isSavingDescription
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSavingDescription ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                onCancelEditDescription()
                onDescriptionChange(originalDescription || '')
              }}
              disabled={isSavingDescription}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                isSavingDescription
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="bg-gray-50 rounded-lg p-4 min-h-[80px] cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => onStartEditDescription(true)}
        >
          {description ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
          ) : (
            <p className="text-sm text-gray-500">Add a more detailed description...</p>
          )}
        </div>
      )}
    </div>
  )
}

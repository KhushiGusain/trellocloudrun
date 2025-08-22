'use client'

export default function LabelsDropdown({
  isOpen,
  onToggle,
  labelTitle,
  onLabelTitleChange,
  selectedColor,
  onColorSelect,
  predefinedColors,
  boardLabels,
  cardLabels,
  onRemoveLabel,
  onCreateLabel,
  isCreatingLabel,
  onCancel
}) {
  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[280px]">
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Enter label name..."
          value={labelTitle}
          onChange={(e) => onLabelTitleChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (selectedColor && !isCreatingLabel) {
                onCreateLabel()
              }
            } else if (e.key === 'Escape') {
              onCancel()
            }
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        
        <div className="grid grid-cols-4 gap-1">
          {predefinedColors.map(colorOption => {
            const boardLabel = boardLabels.find(label => label.color_hex === colorOption.color)
            const isApplied = cardLabels.some(cardLabel => cardLabel.color_hex === colorOption.color)
            const isSelected = selectedColor?.color === colorOption.color
            
            return (
              <div 
                key={colorOption.color} 
                className={`flex items-center justify-center p-2 rounded cursor-pointer transition-colors relative ${
                  isApplied ? 'bg-blue-50 border border-blue-200' : 
                  isSelected ? 'bg-gray-100 border-2 border-blue-400' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (isApplied) {
                    const labelToRemove = cardLabels.find(cardLabel => cardLabel.color_hex === colorOption.color)
                    if (labelToRemove) {
                      onRemoveLabel(labelToRemove.id)
                    }
                  } else {
                    onColorSelect(colorOption)
                  }
                }}
              >
                <div className={`w-6 h-6 rounded`} style={{ backgroundColor: colorOption.color }}></div>
              </div>
            )
          })}
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={onCreateLabel}
            disabled={!selectedColor || isCreatingLabel}
            className={`px-3 py-1.5 text-sm rounded transition-colors cursor-pointer ${
              selectedColor && !isCreatingLabel
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isCreatingLabel ? 'Creating...' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-gray-600 text-sm rounded hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

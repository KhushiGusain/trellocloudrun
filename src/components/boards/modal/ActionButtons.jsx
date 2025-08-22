'use client'

import LabelsDropdown from './LabelsDropdown'
import MembersDropdown from './MembersDropdown'

export default function ActionButtons({
  activeDropdown,
  onToggleDropdown,
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
  onCancelLabels,
  boardMembers,
  cardAssignees,
  onAddAssignee,
  onRemoveAssignee,
  dueDate,
  onSaveDueDate,
  labelsDropdownRef,
  membersDropdownRef
}) {
  const handleDateSelect = (selectedDate) => {
    if (selectedDate) {
      onSaveDueDate(selectedDate)
      onToggleDropdown(null)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <button 
          onClick={() => onToggleDropdown('labels')}
          data-dropdown="labels"
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>Labels</span>
        </button>
        <div ref={labelsDropdownRef}>
          <LabelsDropdown
            isOpen={activeDropdown === 'labels'}
            labelTitle={labelTitle}
            onLabelTitleChange={onLabelTitleChange}
            selectedColor={selectedColor}
            onColorSelect={onColorSelect}
            predefinedColors={predefinedColors}
            boardLabels={boardLabels}
            cardLabels={cardLabels}
            onRemoveLabel={onRemoveLabel}
            onCreateLabel={onCreateLabel}
            isCreatingLabel={isCreatingLabel}
            onCancel={onCancelLabels}
          />
        </div>
      </div>
      
      <button 
        onClick={() => onToggleDropdown('dates')}
        data-dropdown="dates"
        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center space-x-2 transition-colors relative cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Dates</span>
        {activeDropdown === 'dates' && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[250px]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Set due date:</label>
              <input
                id="due-date-input"
                type="date"
                value={dueDate ? dueDate.split('T')[0] : ''}
                onChange={(e) => handleDateSelect(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}
      </button>
      
      <button 
        onClick={() => onToggleDropdown('members')}
        data-dropdown="members"
        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center space-x-2 transition-colors relative cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Members</span>
        <div ref={membersDropdownRef}>
          <MembersDropdown
            isOpen={activeDropdown === 'members'}
            boardMembers={boardMembers}
            cardAssignees={cardAssignees}
            onAddAssignee={onAddAssignee}
            onRemoveAssignee={onRemoveAssignee}
          />
        </div>
      </button>
    </div>
  )
}

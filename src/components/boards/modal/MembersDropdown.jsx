'use client'

export default function MembersDropdown({
  isOpen,
  boardMembers,
  cardAssignees,
  onAddAssignee,
  onRemoveAssignee
}) {
  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[250px]">
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Board members</h4>
        <div className="space-y-1">
          {boardMembers.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No members found</p>
          ) : (
            boardMembers.map(member => {
              const isAssigned = cardAssignees.some(assignee => assignee.id === member.id)
              return (
                <div 
                  key={member.id} 
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                    isAssigned 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => isAssigned ? onRemoveAssignee(member.id) : onAddAssignee(member.id)}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm text-white font-medium">
                      {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{member.display_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAssigned && (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className="text-xs text-gray-500">
                      {isAssigned ? 'Assigned' : 'Click to assign'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

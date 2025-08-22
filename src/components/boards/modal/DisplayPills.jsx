'use client'

export default function DisplayPills({
  cardLabels,
  onRemoveLabel,
  cardAssignees,
  onRemoveAssignee,
  dueDate,
  onRemoveDueDate
}) {
  const getDueDateStatus = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return {
        bgClass: 'bg-red-50 hover:bg-red-100 border-red-200',
        iconClass: 'text-red-600',
        textClass: 'text-red-800',
        badgeClass: 'bg-red-200 text-red-700',
        status: 'Overdue'
      }
    } else if (diffDays <= 1) {
      return {
        bgClass: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
        iconClass: 'text-orange-600',
        textClass: 'text-orange-800',
        badgeClass: 'bg-orange-200 text-orange-700',
        status: diffDays === 0 ? 'Due today' : 'Due tomorrow'
      }
    } else if (diffDays <= 7) {
      return {
        bgClass: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
        iconClass: 'text-yellow-600',
        textClass: 'text-yellow-800',
        badgeClass: 'bg-yellow-200 text-yellow-700',
        status: 'Due soon'
      }
    } else {
      return {
        bgClass: 'bg-green-50 hover:bg-green-100 border-green-200',
        iconClass: 'text-green-600',
        textClass: 'text-green-800',
        badgeClass: 'bg-green-200 text-green-700',
        status: 'Upcoming'
      }
    }
  }

  return (
    <div className="space-y-4">
      {cardLabels.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Labels</h4>
          <div className="flex flex-wrap gap-1">
            {cardLabels.map(label => (
              <div 
                key={label.id}
                className="group relative flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: label.color_hex }}
              >
                <span>{label.name || label.color_hex}</span>
                <button 
                  onClick={() => onRemoveLabel(label.id)}
                  className="ml-2 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black hover:bg-opacity-20 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <span className="text-xs">×</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {cardAssignees.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Members</h4>
          <div className="flex flex-wrap gap-2">
            {cardAssignees.map(assignee => (
              <div 
                key={assignee.id}
                className="group relative flex items-center space-x-2 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {assignee.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{assignee.display_name}</span>
                <button 
                  onClick={() => onRemoveAssignee(assignee.id)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <span className="text-xs text-red-600">×</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {dueDate && (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Due date</h4>
          <div className={`group relative inline-flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${getDueDateStatus(dueDate).bgClass}`}>
            <svg className={`w-4 h-4 ${getDueDateStatus(dueDate).iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-medium ${getDueDateStatus(dueDate).textClass}`}>
              {new Date(dueDate).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDueDateStatus(dueDate).badgeClass}`}>
              {getDueDateStatus(dueDate).status}
            </span>
            <button 
              onClick={onRemoveDueDate}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <span className="text-xs text-red-600">×</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

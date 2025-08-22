'use client'

import { Modal, Input, Button } from '@/components/ui'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export function CreateBoardModal({ 
  isOpen, 
  onClose, 
  boardData, 
  onBoardDataChange, 
  onCreateBoard, 
  isCreating 
}) {
  const { currentWorkspace } = useWorkspace()
  const colorOptions = [
    '#3a72ee', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', 
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84'
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create new board">
      <div className="space-y-4">
        {currentWorkspace && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {currentWorkspace.name[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-blue-800">
                Creating board in <span className="font-medium">{currentWorkspace.name}</span> workspace
              </span>
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
            Board title *
          </label>
          <Input
            type="text"
            placeholder="Enter board title..."
            value={boardData.title}
            onChange={(e) => onBoardDataChange({ ...boardData, title: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
            Visibility
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="visibility"
                value="workspace"
                checked={boardData.visibility === 'workspace'}
                onChange={(e) => onBoardDataChange({ ...boardData, visibility: e.target.value })}
                className="mr-2"
              />
              <span className="text-sm" style={{ color: 'var(--color-navy)' }}>
                Workspace (visible to workspace members)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={boardData.visibility === 'private'}
                onChange={(e) => onBoardDataChange({ ...boardData, visibility: e.target.value })}
                className="mr-2"
              />
              <span className="text-sm" style={{ color: 'var(--color-navy)' }}>
                Private (only you can see)
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
            Background color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onBoardDataChange({ ...boardData, backgroundColor: color })}
                className={`w-8 h-8 rounded border-2 transition-all cursor-pointer ${
                  boardData.backgroundColor === color 
                    ? 'border-[var(--color-navy)] scale-110' 
                    : 'border-[var(--color-border)] hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={onCreateBoard}
            disabled={!boardData.title.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create board'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

'use client'

import { Modal, Button } from '@/components/ui'

export function DeleteBoardModal({
  isOpen,
  onClose,
  boardToDelete,
  onConfirmDelete,
  isDeleting
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Board">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 px-4 break-words">
            Delete "{boardToDelete?.title}"?
          </h3>
          
          <p className="text-sm text-gray-600 px-4">
            This action cannot be undone. The board and all its content will be permanently removed.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={isDeleting}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          
          <Button
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete Board'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

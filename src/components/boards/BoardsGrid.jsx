'use client'

import { BoardCard } from './BoardCard'
import { CreateBoardCard } from './CreateBoardCard'

export function BoardsGrid({ boards, onBoardClick, onDeleteBoard, onCreateBoard }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {boards.map((board) => (
        <BoardCard
          key={board.id}
          board={board}
          onBoardClick={onBoardClick}
          onDeleteBoard={onDeleteBoard}
        />
      ))}
      <CreateBoardCard onClick={onCreateBoard} />
    </div>
  )
}

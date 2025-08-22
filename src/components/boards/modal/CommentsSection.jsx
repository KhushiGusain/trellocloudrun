'use client'

export default function CommentsSection({
  commentText,
  onCommentTextChange,
  onAddComment,
  comments,
  formatTimeAgo,
  isAddingComment
}) {
  return (
    <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Comments and activity</h3>
        </div>

        <div className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => onCommentTextChange(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="2"
            disabled={isAddingComment}
          />
          <button
            onClick={onAddComment}
            disabled={!commentText.trim() || isAddingComment}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              commentText.trim() && !isAddingComment
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAddingComment ? 'Adding...' : 'Save'}
          </button>
        </div>

        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No comments yet</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-white font-medium">
                    {comment.author?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{comment.author?.display_name || 'Unknown'}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{comment.body}</p>
                  <button className="text-xs text-gray-500 hover:text-gray-700 mt-1 cursor-pointer">
                    {formatTimeAgo(comment.created_at)}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

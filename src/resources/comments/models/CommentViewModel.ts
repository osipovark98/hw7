type CommentatorInfo = {
  userId: string;
  userLogin: string;
};

export type CommentViewModel = {
  id: string;
  // postId: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
};

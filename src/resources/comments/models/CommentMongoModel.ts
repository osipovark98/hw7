type CommentatorInfo = {
  userId: string;
  userLogin: string;
};

export type CommentMongoModel = {
  id: string;
  postId: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
};

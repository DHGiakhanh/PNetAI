import { useEffect, useState } from "react";
import apiClient from "@/utils/api.service";

type Author = { _id: string; name: string; role: string; partnerType?: string; isVerified?: boolean };
type Comment = { _id: string; user: Author; content: string; createdAt: string };
type Post = { _id: string; author: Author; content: string; createdAt: string; isRemoved: boolean };

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);

  const [followUserId, setFollowUserId] = useState("");

  async function refreshFeed() {
    setLoading(true);
    try {
      const res = await apiClient.get("/feed/posts");
      setPosts(res.data?.posts || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadPost(id: string) {
    const res = await apiClient.get(`/feed/posts/${id}`);
    setSelectedPost(res.data.post);
    setComments(res.data.comments || []);
    setLikesCount(res.data.likesCount || 0);
    setLikedByMe(!!res.data.likedByMe);
    setSelectedPostId(id);
  }

  useEffect(() => {
    refreshFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPostId && posts.length) {
      loadPost(posts[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  const createPost = async () => {
    if (!content.trim()) return;
    await apiClient.post("/feed/posts", { content });
    setContent("");
    await refreshFeed();
  };

  const toggleLike = async () => {
    if (!selectedPostId) return;
    if (likedByMe) {
      await apiClient.delete(`/feed/posts/${selectedPostId}/like`);
    } else {
      await apiClient.post(`/feed/posts/${selectedPostId}/like`);
    }
    await loadPost(selectedPostId);
  };

  const addComment = async (text: string) => {
    if (!selectedPostId || !text.trim()) return;
    await apiClient.post(`/feed/posts/${selectedPostId}/comments`, { content: text });
    await loadPost(selectedPostId);
  };

  const followVet = async () => {
    if (!followUserId.trim()) return;
    await apiClient.post(`/feed/follow/${followUserId}`);
    alert("Followed (if allowed)");
    await refreshFeed();
  };

  const unfollowVet = async () => {
    if (!followUserId.trim()) return;
    await apiClient.delete(`/feed/follow/${followUserId}`);
    alert("Unfollowed");
    await refreshFeed();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Community Feed</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-pink-100 p-4">
            <h2 className="font-semibold mb-3">Create post</h2>
            <textarea
              className="w-full rounded-xl border border-pink-100 p-2"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share pet health tips, experiences..."
            />
            <button
              onClick={createPost}
              className="mt-3 w-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold"
            >
              Post
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-pink-100 p-4 mt-6">
            <h2 className="font-semibold mb-3">Follow a Vet</h2>
            <p className="text-sm text-gray-500 mb-3">Enter vet userId (partnerType=vet, verified).</p>
            <input
              className="w-full rounded-xl border border-pink-100 p-2 mb-3"
              placeholder="Vet userId"
              value={followUserId}
              onChange={(e) => setFollowUserId(e.target.value)}
            />
            <button
              onClick={followVet}
              className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold"
            >
              Follow
            </button>
            <button
              onClick={unfollowVet}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold mt-2"
            >
              Unfollow
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-pink-100 p-4">
            <h2 className="font-semibold mb-3">Timeline</h2>
            {loading ? (
              <div>Loading...</div>
            ) : posts.length === 0 ? (
              <div>No posts yet.</div>
            ) : (
              <div className="space-y-3">
                {posts.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => loadPost(p._id)}
                    className={`w-full text-left border rounded-xl p-3 ${
                      selectedPostId === p._id ? "border-pink-300 bg-pink-50/40" : "border-pink-100 hover:bg-pink-50/20"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">{p.author?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-700 line-clamp-3">{p.content}</div>
                    {p.author?.partnerType === "vet" ? (
                      <div className="text-xs text-cyan-600 mt-2">Vet</div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedPost ? (
            <PostDetail
              post={selectedPost}
              comments={comments}
              likesCount={likesCount}
              likedByMe={likedByMe}
              onToggleLike={toggleLike}
              onAddComment={addComment}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-pink-100 p-4">Select a post.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostDetail({
  post,
  comments,
  likesCount,
  likedByMe,
  onToggleLike,
  onAddComment
}: {
  post: Post;
  comments: Comment[];
  likesCount: number;
  likedByMe: boolean;
  onToggleLike: () => Promise<void>;
  onAddComment: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  return (
    <div className="bg-white rounded-2xl border border-pink-100 p-4">
      <h2 className="font-semibold mb-2">{post.author?.name}</h2>
      <div className="text-sm text-gray-700 mb-3">{post.content}</div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onToggleLike}
          className={`px-4 py-2 rounded-xl font-semibold ${
            likedByMe ? "bg-pink-500 text-white hover:bg-pink-600" : "bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100"
          }`}
        >
          {likedByMe ? "Liked" : "Like"} ({likesCount})
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {comments.map((c) => (
          <div key={c._id} className="border border-pink-100 rounded-xl p-3">
            <div className="text-sm font-medium">{c.user?.name}</div>
            <div className="text-sm text-gray-700">{c.content}</div>
            <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {comments.length === 0 ? <div className="text-sm text-gray-500">No comments yet.</div> : null}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-pink-100 p-2"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={async () => {
            const t = text;
            setText("");
            await onAddComment(t);
          }}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}


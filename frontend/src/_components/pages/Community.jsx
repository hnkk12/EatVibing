import React, { useState, useEffect } from "react";
import axios from "axios";
import { Heart, MessageCircle, User } from "lucide-react";
import { supabase } from "../../supabaseClient";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const Avatar = ({ src, name }) =>
  src ? (
    <img src={src} alt={name || "user"} className="w-9 h-9 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
      <User size={16} className="text-zinc-400" />
    </div>
  );

const ReplyItem = ({ reply, onToggleLike }) => (
  <div className="flex gap-3 py-3 pl-12">
    <Avatar src={reply.author_avatar} name={reply.author_name} />
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-sm">{reply.author_name || "EatVibing user"}</span>
        <span className="text-xs text-zinc-400">{timeAgo(reply.created_at)}</span>
      </div>
      <p className="text-sm text-zinc-800 whitespace-pre-wrap break-words">{reply.content}</p>
      <button
        onClick={() => onToggleLike(reply.id)}
        className={`flex items-center gap-1 mt-1 text-xs ${
          reply.likedByMe ? "text-red-500" : "text-zinc-400 hover:text-red-400"
        }`}
      >
        <Heart size={13} fill={reply.likedByMe ? "currentColor" : "none"} />
        {reply.likeCount || ""}
      </button>
    </div>
  </div>
);

const PostCard = ({ post, user, onToggleLike, onReplySubmit }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const loadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    setLoadingReplies(true);
    try {
      const res = await axios.get(`${API}/api/community/posts/${post.id}/replies`, {
        params: { userId: user?.id },
      });
      setReplies(res.data);
      setShowReplies(true);
    } catch (error) {
      console.error("Error loading replies", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim() || !user) return;
    const newReply = await onReplySubmit(post.id, replyText);
    if (newReply) {
      setReplies((prev) => [...prev, { ...newReply, likeCount: 0, likedByMe: false }]);
      setReplyText("");
      setReplying(false);
      setShowReplies(true);
    }
  };

  return (
    <div className="border-b border-zinc-100 py-4">
      <div className="flex gap-3">
        <Avatar src={post.author_avatar} name={post.author_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm">{post.author_name || "EatVibing user"}</span>
            <span className="text-xs text-zinc-400">{timeAgo(post.created_at)}</span>
          </div>
          <p className="text-sm text-zinc-800 whitespace-pre-wrap break-words mt-0.5">
            {post.content}
          </p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt="post"
              className="mt-2 rounded-xl max-h-80 object-cover border border-zinc-100"
            />
          )}

          <div className="flex items-center gap-5 mt-2 text-zinc-400">
            <button
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1 text-xs ${
                post.likedByMe ? "text-red-500" : "hover:text-red-400"
              }`}
            >
              <Heart size={15} fill={post.likedByMe ? "currentColor" : "none"} />
              {post.likeCount || ""}
            </button>
            <button
              onClick={() => user && setReplying((v) => !v)}
              className="flex items-center gap-1 text-xs hover:text-zinc-700"
            >
              <MessageCircle size={15} />
              {post.replyCount || ""}
            </button>
            {post.replyCount > 0 && (
              <button onClick={loadReplies} className="text-xs hover:text-zinc-700">
                {loadingReplies ? "Loading..." : showReplies ? "Hide replies" : "View replies"}
              </button>
            )}
          </div>

          {replying && (
            <div className="flex gap-2 mt-3">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitReply()}
                placeholder="Reply..."
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2 text-sm focus:outline-none"
              />
              <button
                onClick={submitReply}
                className="px-4 py-2 bg-black text-white rounded-full text-xs font-semibold"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {showReplies && (
        <div className="mt-1">
          {replies.map((r) => (
            <ReplyItem key={r.id} reply={r} onToggleLike={onToggleLike} />
          ))}
        </div>
      )}
    </div>
  );
};

const Community = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [composeText, setComposeText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      await loadPosts(user?.id);
    };
    init();
  }, []);

  const loadPosts = async (userId) => {
    try {
      const res = await axios.get(`${API}/api/community/posts`, { params: { userId } });
      if (Array.isArray(res.data)) {
        setPosts(res.data);
        setStatus("ok");
      } else {
        console.error("Posts response is not an array:", res.data);
        setStatus("error");
      }
    } catch (error) {
      console.error("Error loading community posts", error);
      setStatus("error");
    }
  };

  const handleToggleLike = async (postId) => {
    if (!user) return;
    try {
      await axios.post(`${API}/api/community/posts/${postId}/like`, { userId: user.id });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
            : p,
        ),
      );
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  const handleReplySubmit = async (parentPostId, content) => {
    try {
      const res = await axios.post(`${API}/api/community/posts`, {
        userId: user.id,
        authorName: user.user_metadata?.full_name,
        authorAvatar: user.user_metadata?.avatar_url,
        content,
        parentPostId,
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === parentPostId ? { ...p, replyCount: p.replyCount + 1 } : p)),
      );
      return res.data;
    } catch (error) {
      console.error("Error posting reply", error);
      return null;
    }
  };

  const handleComposeSubmit = async () => {
    if (!composeText.trim() || !user) return;
    setPosting(true);
    try {
      const res = await axios.post(`${API}/api/community/posts`, {
        userId: user.id,
        authorName: user.user_metadata?.full_name,
        authorAvatar: user.user_metadata?.avatar_url,
        content: composeText,
      });
      setPosts((prev) => [{ ...res.data, likeCount: 0, likedByMe: false, replyCount: 0 }, ...prev]);
      setComposeText("");
    } catch (error) {
      console.error("Error posting", error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-light tracking-tight mb-6">Community</h1>

        {user ? (
          <div className="flex gap-3 border-b border-zinc-100 pb-6 mb-2">
            <Avatar src={user.user_metadata?.avatar_url} name={user.user_metadata?.full_name} />
            <div className="flex-1">
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="Chia sẻ món bạn vừa nấu..."
                rows={2}
                className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder-zinc-400"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleComposeSubmit}
                  disabled={posting || !composeText.trim()}
                  className="px-5 py-2 bg-black text-white rounded-full text-xs font-semibold disabled:opacity-30"
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 border-b border-zinc-100 pb-6 mb-2">
            Đăng nhập để đăng bài và tương tác với cộng đồng.
          </p>
        )}

        {status === "loading" && <p className="text-sm text-zinc-400 mt-6">Loading...</p>}
        {status === "error" && <p className="text-sm text-red-400 mt-6">Could not load posts.</p>}
        {status === "ok" && posts.length === 0 && (
          <p className="text-sm text-zinc-400 mt-6">Chưa có bài đăng nào. Hãy là người đầu tiên!</p>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            onToggleLike={handleToggleLike}
            onReplySubmit={handleReplySubmit}
          />
        ))}
      </div>
    </div>
  );
};

export default Community;

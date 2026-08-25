import React, { useState, useEffect } from "react";
import axios from "axios";
import { Heart, MessageCircle, User, Image, X, ChefHat } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";

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

const ReplyItem = ({ reply, onToggleLike, onAvatarClick }) => (
  <div className="flex gap-3 py-3 pl-12">
    <div 
      className="cursor-pointer hover:opacity-85 transition-opacity"
      onClick={() => onAvatarClick(reply.user_id, reply.author_name, reply.author_avatar)}
    >
      <Avatar src={reply.author_avatar} name={reply.author_name} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2">
        <span 
          className="font-semibold text-sm cursor-pointer hover:underline text-zinc-900"
          onClick={() => onAvatarClick(reply.user_id, reply.author_name, reply.author_avatar)}
        >
          {reply.author_name || "EatVibing user"}
        </span>
        <span className="text-xs text-zinc-400">{timeAgo(reply.created_at)}</span>
      </div>
      <p className="text-sm text-zinc-800 whitespace-pre-wrap break-words">{reply.content}</p>
      <button
        onClick={() => onToggleLike(reply.id)}
        className={`flex items-center gap-1 mt-1 text-xs transition-colors ${
          reply.likedByMe ? "text-red-500" : "text-zinc-400 hover:text-red-400"
        }`}
      >
        <Heart size={13} fill={reply.likedByMe ? "currentColor" : "none"} />
        <span className="ml-0.5">{reply.likeCount > 0 ? `${reply.likeCount} ${reply.likeCount === 1 ? 'like' : 'likes'}` : '0 likes'}</span>
      </button>
    </div>
  </div>
);

const PostCard = ({ post, user, onToggleLike, onReplySubmit, onAvatarClick }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="border-b border-zinc-100 py-5 transition-all hover:bg-zinc-50/30 px-2 rounded-2xl mb-2">
      <div className="flex gap-3">
        <div 
          className="cursor-pointer hover:opacity-85 transition-opacity"
          onClick={() => onAvatarClick(post.user_id, post.author_name, post.author_avatar)}
        >
          <Avatar src={post.author_avatar} name={post.author_name} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span 
              className="font-semibold text-sm cursor-pointer hover:underline text-zinc-900"
              onClick={() => onAvatarClick(post.user_id, post.author_name, post.author_avatar)}
            >
              {post.author_name || "EatVibing user"}
            </span>
            <span className="text-xs text-zinc-400">{timeAgo(post.created_at)}</span>
          </div>
          <p className="text-sm text-zinc-800 whitespace-pre-wrap break-words mt-1 leading-relaxed">
            {post.content.length > 240 && !isExpanded ? (
              <>
                {post.content.slice(0, 240)}
                {"... "}
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-black font-semibold hover:underline ml-1 text-xs"
                >
                  Đọc thêm
                </button>
              </>
            ) : (
              <>
                {post.content}
                {post.content.length > 240 && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-zinc-500 font-semibold hover:underline ml-2 text-xs"
                  >
                    Thu gọn
                  </button>
                )}
              </>
            )}
          </p>

          {/* Tagged Recipe Badge */}
          {post.meal && (
            <div className="mt-2">
              <Link
                to={`/recipe/${post.meal.id}`}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 transition-colors shadow-2xs"
              >
                <ChefHat size={12} className="text-emerald-600" />
                <span>Nấu món: {post.meal.name}</span>
              </Link>
            </div>
          )}

          {post.image_url && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-100 max-h-80 flex items-center justify-center bg-zinc-50">
              <img
                src={post.image_url}
                alt="post"
                className="w-full h-full object-cover max-h-80"
              />
            </div>
          )}

          <div className="flex items-center gap-5 mt-3 text-zinc-400">
            <button
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                post.likedByMe ? "text-red-500 font-medium" : "hover:text-red-400"
              }`}
            >
              <Heart size={15} fill={post.likedByMe ? "currentColor" : "none"} />
              <span>{post.likeCount > 0 ? `${post.likeCount} ${post.likeCount === 1 ? 'like' : 'likes'}` : '0 likes'}</span>
            </button>
            <button
              onClick={() => user && setReplying((v) => !v)}
              className="flex items-center gap-1 text-xs hover:text-zinc-700 transition-colors"
            >
              <MessageCircle size={15} />
              <span>{post.replyCount > 0 ? `${post.replyCount} ${post.replyCount === 1 ? 'reply' : 'replies'}` : '0 replies'}</span>
            </button>
            {post.replyCount > 0 && (
              <button onClick={loadReplies} className="text-xs hover:text-zinc-700 underline underline-offset-2 transition-colors ml-auto">
                {loadingReplies ? "Loading..." : showReplies ? "Hide replies" : `View ${post.replyCount} ${post.replyCount === 1 ? 'reply' : 'replies'}`}
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
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black/5"
              />
              <button
                onClick={submitReply}
                className="px-4 py-2 bg-black text-white rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {showReplies && (
        <div className="mt-2 border-l border-zinc-100 ml-4 animate-in slide-in-from-left duration-250">
          {replies.map((r) => (
            <ReplyItem key={r.id} reply={r} onToggleLike={onToggleLike} onAvatarClick={onAvatarClick} />
          ))}
        </div>
      )}
    </div>
  );
};

const PostSkeleton = () => (
  <div className="border-b border-zinc-100 py-5 animate-pulse flex gap-3">
    <div className="w-9 h-9 rounded-full bg-zinc-100 shrink-0" />
    <div className="flex-1 space-y-3">
      <div className="flex gap-2 items-center">
        <div className="h-4 w-28 bg-zinc-100 rounded" />
        <div className="h-3 w-10 bg-zinc-50 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-zinc-100 rounded" />
        <div className="h-4 w-3/4 bg-zinc-100 rounded" />
      </div>
      <div className="flex gap-4 pt-1">
        <div className="h-4 w-12 bg-zinc-100 rounded" />
        <div className="h-4 w-12 bg-zinc-100 rounded" />
      </div>
    </div>
  </div>
);

const Community = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [composeText, setComposeText] = useState("");
  const [posting, setPosting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [meals, setMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [mealSearchQuery, setMealSearchQuery] = useState("");

  // States for Profile Modal
  const [activeProfileUserId, setActiveProfileUserId] = useState(null);
  const [activeProfileAuthorName, setActiveProfileAuthorName] = useState(null);
  const [activeProfileAvatar, setActiveProfileAvatar] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      await loadPosts(user?.id);
      await loadMeals();
    };
    init();
  }, []);

  const loadMeals = async () => {
    try {
      const res = await axios.get(`${API}/api/meals`);
      if (Array.isArray(res.data)) {
        setMeals(res.data);
      }
    } catch (error) {
      console.error("Error loading meals for tag", error);
    }
  };

  const handleOpenProfileModal = async (postUser_id, authorName, authorAvatar) => {
    setActiveProfileUserId(postUser_id);
    setActiveProfileAuthorName(authorName);
    setActiveProfileAvatar(authorAvatar);
    setLoadingProfile(true);
    setProfileData(null);
    try {
      const res = await axios.get(`${API}/api/profile/${postUser_id}`);
      if (res.data) {
        setProfileData(res.data);
      }
    } catch (error) {
      console.error("Error loading user profile indicators", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCloseProfileModal = () => {
    setActiveProfileUserId(null);
    setActiveProfileAuthorName(null);
    setActiveProfileAvatar(null);
    setProfileData(null);
  };

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
    if ((!composeText.trim() && !imageFile) || !user) return;
    setPosting(true);
    let imageUrl = null;

    try {
      if (imageFile) {
        setUploadingImage(true);
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const res = await axios.post(`${API}/api/community/posts`, {
        userId: user.id,
        authorName: user.user_metadata?.full_name,
        authorAvatar: user.user_metadata?.avatar_url,
        content: composeText,
        imageUrl: imageUrl,
        mealId: selectedMeal?.id || null,
      });
      const newPost = {
        ...res.data,
        likeCount: 0,
        likedByMe: false,
        replyCount: 0,
        meal: selectedMeal,
      };
      setPosts((prev) => [newPost, ...prev]);
      setComposeText("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedMeal(null);
    } catch (error) {
      console.error("Error posting", error);
      alert("Đăng bài thất bại. Vui lòng kiểm tra lại cấu hình storage!");
    } finally {
      setUploadingImage(false);
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans relative">
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
                className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder-zinc-400 text-zinc-900"
              />
              {imagePreview && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={imagePreview}
                    alt="upload preview"
                    className="max-h-40 rounded-xl border border-zinc-100 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex justify-between items-center mt-4 border-t border-zinc-50 pt-3">
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1">
                    <Image size={18} />
                    <span className="text-[11px] font-medium">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* Tag Recipe Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMealSelector(!showMealSelector)}
                      className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border transition-colors ${
                        selectedMeal
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <ChefHat size={13} className={selectedMeal ? "text-emerald-600" : "text-zinc-400"} />
                      <span>{selectedMeal ? selectedMeal.name : "Tag Recipe"}</span>
                      {selectedMeal && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMeal(null);
                          }}
                          className="ml-1 hover:text-red-500 font-bold px-1"
                        >
                          ×
                        </span>
                      )}
                    </button>

                    {showMealSelector && (
                      <div className="absolute left-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl p-3 z-30 animate-in fade-in duration-200">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Tag a recipe</p>
                        <input
                          type="text"
                          placeholder="Search meals..."
                          value={mealSearchQuery}
                          onChange={(e) => setMealSearchQuery(e.target.value)}
                          className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none mb-2"
                        />
                        <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
                          {meals
                            .filter((m) =>
                              m.name.toLowerCase().includes(mealSearchQuery.toLowerCase())
                            )
                            .map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMeal(m);
                                  setShowMealSelector(false);
                                  setMealSearchQuery("");
                                }}
                                className="w-full text-left p-2 rounded-lg text-xs hover:bg-zinc-50 font-medium text-zinc-700 transition-colors truncate"
                              >
                                {m.name}
                              </button>
                            ))}
                          {meals.filter((m) =>
                            m.name.toLowerCase().includes(mealSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <p className="text-[11px] text-zinc-400 text-center py-2">No meals found.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleComposeSubmit}
                  disabled={posting || uploadingImage || (!composeText.trim() && !imageFile)}
                  className="px-5 py-2 bg-black text-white rounded-full text-xs font-semibold disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                >
                  {posting ? "Posting..." : uploadingImage ? "Uploading..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 border-b border-zinc-100 pb-6 mb-2">
            Đăng nhập để đăng bài và tương tác với cộng đồng.
          </p>
        )}

        {status === "loading" && (
          <div className="space-y-4 mt-6">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}
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
            onAvatarClick={handleOpenProfileModal}
          />
        ))}
      </div>

      {/* Profile Modal */}
      {activeProfileUserId && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={handleCloseProfileModal}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-zinc-200 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseProfileModal}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-zinc-50 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <Avatar src={activeProfileAvatar} name={activeProfileAuthorName} />
              <h2 className="font-bold text-lg mt-3 text-zinc-900">{activeProfileAuthorName || "EatVibing Chef"}</h2>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-0.5">Chef Profile</p>
              
              <div className="w-full border-t border-zinc-100 my-4" />

              {loadingProfile ? (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-900 border-t-transparent" />
                </div>
              ) : profileData ? (
                <div className="w-full space-y-4 text-left text-sm">
                  {profileData.goal && (
                    <div className="flex justify-between border-b border-zinc-50 pb-2">
                      <span className="text-zinc-400 font-medium">Mục tiêu:</span>
                      <span className="font-bold text-zinc-900 uppercase text-xs tracking-wider">
                        {profileData.goal === "loss" ? "Weight Loss" : profileData.goal === "gain" ? "Bulking" : "Balanced"}
                      </span>
                    </div>
                  )}

                  {profileData.height_cm && profileData.weight_kg && (
                    <div className="flex justify-between border-b border-zinc-50 pb-2">
                      <span className="text-zinc-400 font-medium">Thể hình:</span>
                      <span className="font-semibold text-zinc-800">
                        {profileData.height_cm}cm | {profileData.weight_kg}kg 
                        <span className="text-xs text-zinc-400 ml-1">
                          (BMI: {(profileData.weight_kg / (profileData.height_cm / 100) ** 2).toFixed(1)})
                        </span>
                      </span>
                    </div>
                  )}

                  {profileData.diet_tags && profileData.diet_tags.length > 0 && (
                    <div className="border-b border-zinc-50 pb-2">
                      <span className="text-zinc-400 font-medium block mb-1">Chế độ ăn:</span>
                      <div className="flex flex-wrap gap-1">
                        {profileData.diet_tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600 font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileData.allergies && profileData.allergies.length > 0 && (
                    <div>
                      <span className="text-zinc-400 font-medium block mb-1">Dị ứng:</span>
                      <div className="flex flex-wrap gap-1">
                        {profileData.allergies.map(alg => (
                          <span key={alg} className="text-[10px] bg-red-50 px-2 py-0.5 rounded-full text-red-600 font-medium">
                            {alg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!profileData.goal && !profileData.height_cm && (!profileData.diet_tags || profileData.diet_tags.length === 0) && (
                    <p className="text-center text-zinc-400 text-xs py-4">Chưa cập nhật chỉ số dinh dưỡng công khai.</p>
                  )}
                </div>
              ) : (
                <p className="text-center text-zinc-400 text-xs py-4">Người dùng này chưa thiết lập hồ sơ dinh dưỡng.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;

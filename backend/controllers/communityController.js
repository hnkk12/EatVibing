const { supabase } = require("../config/supabase");

// Gắn likeCount/likedByMe cho 1 danh sách post
const attachLikes = async (posts, userId) => {
  const ids = posts.map((p) => p.id);
  if (!ids.length) return posts;
  const { data: likes, error } = await supabase
    .from("community_likes")
    .select("post_id, user_id")
    .in("post_id", ids);
  if (error) throw error;
  return posts.map((p) => {
    const postLikes = likes.filter((l) => l.post_id === p.id);
    return {
      ...p,
      likeCount: postLikes.length,
      likedByMe: userId ? postLikes.some((l) => l.user_id === userId) : false,
    };
  });
};

// [GET] Danh sách post gốc (kiểu Threads), kèm số reply + số like
exports.getPosts = async (req, res) => {
  try {
    const { userId } = req.query;
    const { data: posts, error } = await supabase
      .from("community_posts")
      .select("*")
      .is("parent_post_id", null)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ids = posts.map((p) => p.id);
    let replyCounts = {};
    if (ids.length) {
      const { data: replies, error: repErr } = await supabase
        .from("community_posts")
        .select("parent_post_id")
        .in("parent_post_id", ids);
      if (repErr) throw repErr;
      replies.forEach((r) => {
        replyCounts[r.parent_post_id] = (replyCounts[r.parent_post_id] || 0) + 1;
      });
    }

    const withLikes = await attachLikes(posts, userId);
    const result = withLikes.map((p) => ({ ...p, replyCount: replyCounts[p.id] || 0 }));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [GET] Reply (1 cấp) của 1 post
exports.getReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const { data: replies, error } = await supabase
      .from("community_posts")
      .select("*")
      .eq("parent_post_id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const withLikes = await attachLikes(replies, userId);
    res.status(200).json(withLikes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [POST] Tạo post mới hoặc reply (reply chỉ 1 cấp: parentPostId phải là post gốc)
exports.createPost = async (req, res) => {
  try {
    const { userId, authorName, authorAvatar, content, imageUrl, parentPostId } = req.body;
    if (!userId || !content?.trim()) {
      return res.status(400).json({ error: "userId and content are required" });
    }
    const { data, error } = await supabase
      .from("community_posts")
      .insert([
        {
          user_id: userId,
          author_name: authorName || null,
          author_avatar: authorAvatar || null,
          content,
          image_url: imageUrl || null,
          parent_post_id: parentPostId || null,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [POST] Toggle like/unlike
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const { data: existing, error: findErr } = await supabase
      .from("community_likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      const { error } = await supabase.from("community_likes").delete().eq("id", existing.id);
      if (error) throw error;
      return res.status(200).json({ liked: false });
    }
    const { error } = await supabase
      .from("community_likes")
      .insert([{ post_id: id, user_id: userId }]);
    if (error) throw error;
    res.status(200).json({ liked: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

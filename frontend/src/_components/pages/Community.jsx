import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bookmark, ChefHat, Check, Heart, MessageCircle, Plus, Search, Send, X } from 'lucide-react';
import { demoPosts, groups, topics } from './communityData';
import './community.css';

const STORAGE_KEY = 'eatvibing-community-demo-en-v2';
const freshDemo = () => ({ posts: demoPosts, liked: [], saved: [], joined: [], challenge: false });
function readDemo() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (value && ['posts', 'liked', 'saved', 'joined'].every(key => Array.isArray(value[key]))) return value;
  } catch { /* The demo also works when storage is unavailable. */ }
  return freshDemo();
}
function Avatar({ initials = 'Y' }) {
  return <span className="cm-avatar">{initials}</span>;
}
function DemoImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className="cm-image-fallback"><ChefHat size={28} /><span>{alt}</span></div> : <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
export default function Community() {
  const [data, setData] = useState(readDemo);
  const [view, setView] = useState('feed');
  const [topic, setTopic] = useState('All posts');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('new');
  const [modal, setModal] = useState(false);
  const [expanded, setExpanded] = useState([]);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState({ title: '', text: '', topic: 'Recipes', image: '' });
  const [commentDrafts, setCommentDrafts] = useState({});
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Keep interactions in memory. */ }
  }, [data]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (modal) dialogRef.current?.showModal();
    else if (dialogRef.current?.open) dialogRef.current.close();
  }, [modal]);
  function openComposer() { openerRef.current = document.activeElement; setModal(true); }
  function closeComposer() { setModal(false); openerRef.current?.focus(); }
  function toggle(field, id) {
    setData(current => ({ ...current, [field]: current[field].includes(id) ? current[field].filter(item => item !== id) : [...current[field], id] }));
  }
  function selectView(nextView) { setView(nextView); setTopic('All posts'); setQuery(''); }
  function resetDemo() {
    setData(freshDemo()); selectView('feed'); setExpanded([]); setCommentDrafts({});
    setNotice('Starting posts restored.');
  }
  function publish(event) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.text.trim()) return;
    const post = { ...draft, title: draft.title.trim(), text: draft.text.trim(), id: crypto.randomUUID(), name: 'You', initials: 'Y', role: 'Community member', time: 'Just now', likes: 0, comments: [], tags: ['homecooking'], imageAlt: draft.title.trim() };
    setData(current => ({ ...current, posts: [post, ...current.posts] }));
    selectView('feed'); setSort('new'); closeComposer();
    setDraft({ title: '', text: '', topic: 'Recipes', image: '' }); setNotice('Your post has been shared.');
  }
  function comment(event, id) {
    event.preventDefault();
    const text = (commentDrafts[id] || '').trim();
    if (!text) return;
    setData(current => ({ ...current, posts: current.posts.map(post => post.id === id ? { ...post, comments: [...post.comments, { name: 'You', text }] } : post) }));
    setCommentDrafts(current => ({ ...current, [id]: '' }));
  }
  const normalized = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const visiblePosts = data.posts.filter(post => (view !== 'saved' || data.saved.includes(post.id)) && (topic === 'All posts' || topic === post.topic) && normalized(`${post.title} ${post.text} ${post.name} ${post.tags.join(' ')}`).includes(normalized(query)));
  if (sort === 'popular') visiblePosts.sort((a, b) => (b.likes + Number(data.liked.includes(b.id))) - (a.likes + Number(data.liked.includes(a.id))));
  return (
    <div className="community-demo min-h-screen bg-white text-gray-800 font-sans selection:bg-black selection:text-white">
      <div className="cm-shell max-w-[1440px] mx-auto px-6 py-12">
        <aside className="cm-sidebar" aria-label="Community navigation">
          <h2 className="cm-section-label">EatVibing Navigation</h2>
          <nav className="cm-side-nav">
            {[['feed', 'Community feed'], ['saved', `Saved posts (${data.saved.length})`], ['groups', 'Community groups']].map(([id, label]) => <button key={id} className={view === id ? 'active' : ''} aria-pressed={view === id} onClick={() => selectView(id)}>{label}</button>)}
          </nav>
          <div className="cm-side-divider" />
          <h2 className="cm-section-label">Explore topics</h2>
          <div className="cm-topic-links">{topics.map(item => <button key={item} className={view !== 'groups' && topic === item ? 'active' : ''} aria-pressed={view !== 'groups' && topic === item} onClick={() => { setView('feed'); setTopic(item); setQuery(''); }}>{item}</button>)}</div>
          <div className="cm-side-divider" />
          <section className="cm-challenge">
            <h2 className="cm-section-label">Weekly challenge</h2>
            <h3>Seven days of greens</h3>
            <p>Share one meal with more greens this week.</p>
            <button onClick={() => setData(current => ({ ...current, challenge: !current.challenge }))}>{data.challenge ? <><Check size={14} /> Joined · Leave</> : <>Join challenge <ArrowRight size={14} /></>}</button>
          </section>
          <p className="cm-demo-note">Your community activity is saved in this browser.</p>
        </aside>
        <section className="cm-main" aria-label="Community content">
          <header className="cm-heading">
            <div><p className="cm-section-label">Cook. Share. Connect.</p><h1>{view === 'saved' ? 'Saved posts' : view === 'groups' ? 'Community groups' : 'Community'}</h1><p className="cm-description">{view === 'saved' ? 'Recipes and stories to come back to.' : view === 'groups' ? 'Find people who share your taste.' : 'Good food tastes even better when shared.'}</p></div>
            <button className="cm-primary" onClick={openComposer}><Plus size={16} /> Share a post</button>
          </header>
          {view === 'groups' ? <div className="cm-group-directory">{groups.map(group => <article key={group.id} className="cm-group"><h2>{group.name}</h2><p>{group.description}</p><button className="cm-outline" onClick={() => toggle('joined', group.id)}>{data.joined.includes(group.id) ? <><Check size={15} /> Joined · Leave group</> : <><Plus size={15} /> Join group</>}</button></article>)}</div> : <>
            <div className="cm-controls"><p>{view === 'saved' ? 'Saved posts' : topic} · {visiblePosts.length}</p><div className="cm-search-row"><label className="cm-search"><Search size={14} /><input aria-label="Search community posts" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search dishes, stories or cooks…" /></label><select aria-label="Sort posts" value={sort} onChange={event => setSort(event.target.value)}><option value="new">Newest</option><option value="popular">Popular</option></select></div></div>
            <div className="cm-post-list">{visiblePosts.map(post => <article className="cm-post" key={post.id}>
              {post.image && <div className="cm-post-image"><DemoImage src={post.image} alt={post.imageAlt} /></div>}
              <div className="cm-post-header"><Avatar initials={post.initials} /><div><h3>{post.name}</h3><p>{post.role} · {post.time}</p></div><span className="cm-post-topic">{post.topic}</span></div>
              <h2>{post.title}</h2><p className="cm-post-text">{post.text}</p>
              <div className="cm-tags">{post.tags.map(tag => <button key={tag} onClick={() => { setTopic('All posts'); setQuery(tag); }}>#{tag}</button>)}</div>
              <div className="cm-post-actions">
                <button aria-pressed={data.liked.includes(post.id)} className={data.liked.includes(post.id) ? 'active' : ''} onClick={() => toggle('liked', post.id)}><Heart size={16} fill={data.liked.includes(post.id) ? 'currentColor' : 'none'} />{post.likes + Number(data.liked.includes(post.id))} likes</button>
                <button aria-expanded={expanded.includes(post.id)} onClick={() => setExpanded(current => current.includes(post.id) ? current.filter(id => id !== post.id) : [...current, post.id])}><MessageCircle size={16} />{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</button>
                <button aria-pressed={data.saved.includes(post.id)} className={`cm-save ${data.saved.includes(post.id) ? 'active' : ''}`} onClick={() => toggle('saved', post.id)}><Bookmark size={16} fill={data.saved.includes(post.id) ? 'currentColor' : 'none'} />{data.saved.includes(post.id) ? 'Saved' : 'Save'}</button>
              </div>
              {expanded.includes(post.id) && <div className="cm-comments">{post.comments.length === 0 && <p>Be the first to join the conversation.</p>}{post.comments.map((item, index) => <div className="cm-comment" key={index}><strong>{item.name}</strong><p>{item.text}</p></div>)}<form onSubmit={event => comment(event, post.id)}><input aria-label={`Comment on ${post.title}`} placeholder="Write a comment…" maxLength={1000} value={commentDrafts[post.id] || ''} onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))} /><button aria-label="Send comment" disabled={!(commentDrafts[post.id] || '').trim()}><Send size={16} /></button></form></div>}
            </article>)}</div>
            {visiblePosts.length === 0 && <div className="cm-empty"><h2>{view === 'saved' ? 'No saved posts match your filters.' : 'No matching posts.'}</h2><p>{view === 'saved' ? 'Save a post from the community feed to keep it here.' : 'Try another search or explore all topics.'}</p><button onClick={() => selectView('feed')}>Explore all posts <ArrowRight size={14} /></button></div>}
          </>}
          <div className="cm-demo-controls"><span>Your activity is saved in this browser.</span><button onClick={resetDemo}>Restore starting posts</button></div>
        </section>
      </div>
      <dialog ref={dialogRef} aria-labelledby="cm-compose-title" className="cm-dialog" onCancel={closeComposer} onClose={() => setModal(false)} onClick={event => { if (event.target === event.currentTarget) closeComposer(); }}>
        <div className="cm-dialog-content"><div className="cm-dialog-heading"><h2 id="cm-compose-title">Share a post</h2><button type="button" aria-label="Close post composer" onClick={closeComposer}><X size={20} /></button></div><p className="cm-description">Posts are saved in this browser.</p>
          <form onSubmit={publish}>
            <label>Title<input autoFocus required maxLength={140} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="What did you cook today?" /></label>
            <label>Topic<select value={draft.topic} onChange={event => setDraft({ ...draft, topic: event.target.value })}>{topics.slice(1).map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Your story<textarea required rows={5} maxLength={4000} value={draft.text} onChange={event => setDraft({ ...draft, text: event.target.value })} placeholder="Share a recipe, a kitchen tip, or a story…" /></label>
            <label>Photo (optional)<select value={draft.image} onChange={event => setDraft({ ...draft, image: event.target.value })}><option value="">No photo</option>{demoPosts.filter(post => post.image).map(post => <option key={post.id} value={post.image}>{post.imageAlt}</option>)}</select></label>
            {draft.image && <div className="cm-draft-image"><DemoImage key={draft.image} src={draft.image} alt="Selected photo" /></div>}
            <button className="cm-primary" disabled={!draft.title.trim() || !draft.text.trim()}><Send size={15} /> Publish post</button>
          </form>
        </div>
      </dialog>
      {notice && <div className="cm-toast" role="status"><Check size={16} />{notice}</div>}
    </div>
  );
}

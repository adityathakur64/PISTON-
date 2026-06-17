import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Award,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gauge,
  Heart,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  Video,
  X,
} from 'lucide-react';
import { authService, dbService } from '../services/firebase';
import type { CarData, StoryData, UserProfile } from '../services/reputationService';
import { BADGES, getGarageRank } from '../services/reputationService';
import BadgeEmblem from '../components/BadgeEmblem';
import UserAvatar from '../components/UserAvatar';

type FeedPost = CarData & { owner: UserProfile };
type FeedStory = StoryData & { owner: UserProfile };

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);
  const [selectedStoryOwnerUid, setSelectedStoryOwnerUid] = useState<string | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async (uid: string) => {
    try {
      const [userProfile, cars, stories] = await Promise.all([
        dbService.getUserProfile(uid),
        dbService.getAllCars(),
        dbService.getAllStories(),
      ]);
      setProfile(userProfile);
      setFeedPosts(cars);
      setFeedStories(stories);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      if (user) {
        loadDashboardData(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-brand-orange"></div>
        <span className="mt-3 font-display text-sm uppercase tracking-widest text-zinc-500">
          Loading Platform Feed
        </span>
      </div>
    );
  }

  if (!profile) return null;

  const rankInfo = getGarageRank(profile.garageReputation);
  const storyCreators = feedStories.filter(
    (story, index, stories) => stories.findIndex((item) => item.owner.uid === story.owner.uid) === index
  );
  const selectedStoryPosts = selectedStoryOwnerUid
    ? feedStories.filter((story) => story.owner.uid === selectedStoryOwnerUid)
    : [];
  const selectedStory = selectedStoryPosts[selectedStoryIndex] || selectedStoryPosts[0];
  const reelPosts = feedPosts.slice(0, 5);
  const trendingTags = [
    ['#pistonlife', '12.4K posts'],
    ['#jdm', '8.7K posts'],
    ['#tracklife', '6.1K posts'],
    ['#supercars', '5.4K posts'],
    ['#builtnotbought', '3.2K posts'],
  ];

  const openStory = (ownerUid: string) => {
    setSelectedStoryOwnerUid(ownerUid);
    setSelectedStoryIndex(0);
  };

  const closeStory = () => {
    setSelectedStoryOwnerUid(null);
    setSelectedStoryIndex(0);
  };

  const showPreviousStory = () => {
    setSelectedStoryIndex((index) => Math.max(0, index - 1));
  };

  const showNextStory = () => {
    setSelectedStoryIndex((index) => Math.min(selectedStoryPosts.length - 1, index + 1));
  };

  return (
    <div className="grid gap-6 animate-fadeIn xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 space-y-5">
        <div className="rounded-xl border hairline bg-black/40 p-4">
          <div className="flex gap-5 overflow-x-auto pb-1">
            <Link to="/upload-story" className="w-20 shrink-0 text-center" title="Create story">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-dashed border-brand-orange/70 bg-black text-brand-orange transition hover:bg-brand-orange/10">
                <Plus size={22} />
              </div>
              <div className="mt-2 truncate text-[11px] font-semibold text-zinc-400">Your Story</div>
            </Link>

            {storyCreators.slice(0, 10).map((story) => (
              <button
                key={story.owner.uid}
                type="button"
                onClick={() => openStory(story.owner.uid)}
                className="w-20 shrink-0 text-center"
              >
                <div className="mx-auto h-16 w-16 rounded-full border-2 border-brand-orange p-0.5 shadow-[0_0_20px_rgba(232,93,4,0.12)]">
                  <UserAvatar
                    src={story.owner.profileImage}
                    name={story.owner.displayName}
                    className="h-full w-full rounded-full object-cover text-xs"
                    iconSize={16}
                  />
                </div>
                <div className="mt-2 truncate text-[11px] font-semibold text-zinc-400">
                  {story.owner.username}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedStory && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 backdrop-blur-md">
            <div className="relative flex h-[92vh] max-h-[760px] min-h-[420px] w-full max-w-md flex-col overflow-hidden rounded-xl border hairline bg-zinc-950 shadow-2xl">
              <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
                {selectedStoryPosts.map((story, index) => (
                  <div key={`story-progress-${story.id}`} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className={`h-full rounded-full ${
                        index <= selectedStoryIndex ? 'bg-brand-orange' : 'bg-transparent'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="absolute left-0 right-0 top-5 z-20 flex items-center justify-between px-4 py-3">
                <Link to={`/profile/${selectedStory.owner.uid}`} onClick={closeStory} className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    src={selectedStory.owner.profileImage}
                    name={selectedStory.owner.displayName}
                    className="h-10 w-10 rounded-full border border-brand-orange/60 object-cover text-xs"
                    iconSize={16}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">@{selectedStory.owner.username}</div>
                    <div className="truncate text-[11px] text-zinc-300">
                      Story
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={closeStory}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-black/55 text-zinc-200 transition hover:bg-white/10"
                  title="Close story"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedStory.mediaType === 'video' ? (
                <video
                  src={selectedStory.mediaUrl}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  controls
                />
              ) : (
                <img
                  src={selectedStory.mediaUrl}
                  alt={selectedStory.caption || 'Story media'}
                  className="h-full w-full object-cover"
                />
              )}

              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/72 to-transparent p-5 pt-20">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-orange px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
                    Story
                  </span>
                </div>
                <h2 className="font-display text-3xl leading-none tracking-wide text-white">
                  @{selectedStory.owner.username}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-300">
                  {selectedStory.caption || 'Creator uploaded a story.'}
                </p>
                <div className="mt-4 text-xs font-bold text-zinc-300">
                  {new Date(selectedStory.createdAt).toLocaleDateString()}
                </div>
              </div>

              <button
                type="button"
                onClick={showPreviousStory}
                disabled={selectedStoryIndex === 0}
                className="absolute left-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition hover:bg-black/70 disabled:opacity-25"
                title="Previous story"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={showNextStory}
                disabled={selectedStoryIndex >= selectedStoryPosts.length - 1}
                className="absolute right-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition hover:bg-black/70 disabled:opacity-25"
                title="Next story"
              >
                <ChevronRight size={22} />
              </button>

              <Link
                to={`/profile/${selectedStory.owner.uid}`}
                onClick={closeStory}
                className="absolute bottom-5 right-5 z-20 grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-black/55 text-zinc-200 transition hover:border-brand-orange/50 hover:text-brand-orange"
                title="Open creator profile"
              >
                <User size={18} />
              </Link>
            </div>
          </div>,
          document.body
        )}

        {reelPosts.length > 0 && (
          <div className="glass-panel rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video size={17} className="text-brand-orange" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Creator Reels</h2>
              </div>
              <span className="text-[10px] font-semibold text-zinc-600">Featured builds</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {reelPosts.map((post) => {
                const postImage = post.photos?.[0] || post.imageUrl || post.mediaUrl || '';

                return (
                <div key={`reel-${post.id}`} className="relative aspect-[9/14] overflow-hidden rounded-xl bg-black">
                  {postImage ? (
                    <img
                      src={postImage}
                      alt={`${post.make} ${post.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-zinc-950 px-2 text-center text-[10px] font-display font-bold uppercase tracking-widest text-zinc-600">
                      No Image
                    </div>
                  )}
                  <Link to={`/profile/${post.owner.uid}`} className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-2">
                    <div className="truncate text-[10px] font-bold text-white">@{post.owner.username}</div>
                    <div className="truncate text-[9px] text-zinc-400">{post.model}</div>
                  </Link>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {feedPosts.length === 0 ? (
          <div className="glass-panel rounded-xl p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border hairline bg-bg-input text-brand-orange">
              <Gauge size={24} />
            </div>
            <h2 className="mt-4 font-display text-3xl tracking-wide text-white">No Feed Posts Yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Upload the first build and start the platform feed.
            </p>
            <Link
              to="/upload"
              className="mt-5 inline-flex rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-extrabold text-black transition hover:bg-brand-orange-hover"
            >
              Upload Car
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {feedPosts.map((post) => {
              const postImage = post.photos?.[0] || post.imageUrl || post.mediaUrl || '';

              return (
              <article key={post.id} className="glass-panel overflow-hidden rounded-xl">
                <header className="flex items-center justify-between border-b hairline px-4 py-3">
                  <Link to={`/profile/${post.owner.uid}`} className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      src={post.owner.profileImage}
                      name={post.owner.displayName}
                      className="h-10 w-10 rounded-full border border-brand-orange/45 object-cover text-xs"
                      iconSize={16}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{post.owner.username}</div>
                      <div className="truncate text-[11px] text-zinc-500">
                        {post.year} {post.make} {post.model}
                      </div>
                    </div>
                  </Link>
                  <div className="rounded-full border border-brand-orange/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-orange">
                    {post.owner.rank}
                  </div>
                </header>

                <div className="relative aspect-[4/3] bg-black sm:aspect-[16/10]">
                  {postImage ? (
                    <img
                      src={postImage}
                      alt={`${post.year} ${post.make} ${post.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-zinc-950 text-xs font-display font-bold uppercase tracking-widest text-zinc-600">
                      No Image
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-black/72 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-orange backdrop-blur">
                    {post.rarity}
                  </div>
                  {post.isVerified && (
                    <div className="absolute right-4 top-4 rounded-full bg-brand-orange p-2 text-black" title="Verified Ride">
                      <ShieldCheck size={16} />
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-zinc-200">
                      <button className="transition hover:text-brand-orange" title="Like">
                        <Heart size={21} />
                      </button>
                      <button className="transition hover:text-brand-orange" title="Comment">
                        <MessageCircle size={21} />
                      </button>
                      <button className="transition hover:text-brand-orange" title="Share">
                        <Send size={21} />
                      </button>
                    </div>
                    <button className="text-zinc-300 transition hover:text-brand-orange" title="Save">
                      <Bookmark size={21} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-zinc-300">
                    <span>{post.upvotes.toLocaleString()} likes</span>
                    <span className="text-brand-orange">+{post.calculatedScore?.toLocaleString()} GR</span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Star size={12} className="fill-brand-orange stroke-brand-orange" />
                      {post.buildQuality}/10 build
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    <Link to={`/profile/${post.owner.uid}`} className="font-bold text-white hover:text-brand-orange">
                      {post.owner.username}
                    </Link>{' '}
                    {post.description || 'Built for night runs, clean lines, and real garage reputation.'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span className="text-brand-orange">#pistonlife</span>
                    <span className="text-brand-orange">#garagebuilt</span>
                    <span className="text-brand-orange">#{post.make.toLowerCase()}</span>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Your Garage Reputation
              </div>
              <div className="mt-2 font-display text-5xl leading-none tracking-wide text-brand-orange">
                {profile.garageReputation.toLocaleString()}
                <span className="ml-1 text-xl text-white">GR</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-orange">
                <TrendingUp size={13} />
                <span>{feedPosts.length.toLocaleString()} live feed posts</span>
              </div>
            </div>
            <svg viewBox="0 0 120 70" className="h-20 w-28 text-brand-orange">
              <polyline
                points="4,62 20,50 35,55 50,38 66,43 82,24 96,28 116,8"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M4 62 L20 50 L35 55 L50 38 L66 43 L82 24 L96 28 L116 8 V70 H4 Z" fill="currentColor" opacity="0.12" />
            </svg>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Your Rank</div>
              <div className="mt-2 text-2xl font-bold text-white">{rankInfo.current.title}</div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-xl border border-brand-orange/45 bg-brand-orange/10 text-brand-orange">
              <Crown size={25} />
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black">
            <div className="h-full rounded-full bg-brand-orange" style={{ width: `${rankInfo.progress}%` }} />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Award size={17} className="text-brand-orange" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Your Badges</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {BADGES.map((badge) => {
              const isEarned = profile.badges.includes(badge.id);
              return (
                <div key={badge.id} title={badge.name} className="flex justify-center">
                  <BadgeEmblem badgeId={badge.id} label={badge.name} earned={isEarned} size="sm" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Trending</div>
          <div className="space-y-3">
            {trendingTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">{tag}</span>
                <span className="text-zinc-500">{count}</span>
              </div>
            ))}
          </div>
          <button className="mt-5 text-xs font-bold text-brand-orange">See more</button>
        </div>
      </aside>
    </div>
  );
}

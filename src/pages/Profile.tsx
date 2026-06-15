import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { Award, ShieldCheck, Edit3, Save, Star, Calendar, Trash2, ChevronLeft, ChevronRight, Plus, X, ImagePlus } from 'lucide-react';
import { authService, dbService } from '../services/firebase';
import type { UserProfile, CarData, StoryData } from '../services/reputationService';
import { BADGES } from '../services/reputationService';
import BadgeEmblem from '../components/BadgeEmblem';
import RankBadge from '../components/RankBadge';
import UserAvatar from '../components/UserAvatar';

const MAX_PROFILE_PHOTO_SIZE_MB = 0.75;
const MAX_PROFILE_PHOTO_SIZE_BYTES = MAX_PROFILE_PHOTO_SIZE_MB * 1024 * 1024;

export default function Profile() {
  const { uid: routeUid } = useParams<{ uid: string }>();
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cars, setCars] = useState<CarData[]>([]);
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  const loadProfile = async (uid: string) => {
    try {
      setLoading(true);
      const userProfile = await dbService.getUserProfile(uid);
      const [carsResult, storiesResult] = await Promise.allSettled([
        dbService.getUserCars(uid),
        dbService.getUserStories(uid),
      ]);

      const userCars = carsResult.status === 'fulfilled' ? carsResult.value : [];
      const userStories = storiesResult.status === 'fulfilled' ? storiesResult.value : [];

      setProfile(userProfile);
      setCars(userCars);
      setStories(userStories);
      setIsEditing(false);
      setError(carsResult.status === 'rejected' ? 'Vehicle lineup could not be loaded. Refresh and try again.' : '');
      setSelectedStoryIndex(null);
      
      if (userProfile) {
        setEditDisplayName(userProfile.displayName);
        setEditBio(userProfile.bio);
        setEditProfileImage(userProfile.profileImage);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setProfile(null);
      setCars([]);
      setStories([]);
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        loadProfile(routeUid || user.uid);
      } else {
        setCurrentUserUid(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [routeUid]);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (profile.uid !== currentUserUid) return;
    if (!editDisplayName.trim()) {
      return setError('Display name cannot be empty.');
    }

    try {
      setSaveLoading(true);
      setError('');
      
      const updates = {
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        profileImage: editProfileImage.trim(),
      };

      await dbService.updateUserProfile(profile.uid, updates);
      
      setProfile({
        ...profile,
        ...updates
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return setError('Please choose an image file for your profile photo.');
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
      e.target.value = '';
      return setError(`Profile photo must be ${MAX_PROFILE_PHOTO_SIZE_MB}MB or smaller.`);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProfileImage(reader.result as string);
      setError('');
    };
    reader.onerror = () => setError('Could not read this image. Try a different photo.');
    reader.readAsDataURL(file);
  };

  const handleDeleteCar = async (carId: string) => {
    if (!profile) return;
    if (profile.uid !== currentUserUid) return;

    const confirmed = window.confirm('Delete this car post from your garage? This cannot be undone.');
    if (!confirmed) return;

    try {
      setError('');
      setDeletingCarId(carId);
      await dbService.deleteCar(profile.uid, carId);
      await loadProfile(profile.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete this post.');
    } finally {
      setDeletingCarId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-brand-orange rounded-full animate-spin"></div>
        <span className="mt-3 text-xs text-zinc-500 font-display uppercase tracking-widest">
          Loading Profile Details...
        </span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-panel mx-auto max-w-xl rounded-xl p-6 text-center">
        <h1 className="font-display text-lg font-black uppercase tracking-wider text-white">
          Profile unavailable
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {error || 'This garage profile could not be found.'}
        </p>
      </div>
    );
  }

  const isOwnProfile = profile.uid === currentUserUid;
  const selectedStory = selectedStoryIndex !== null ? stories[selectedStoryIndex] : null;
  const profileImage = profile.profileImage || '';
  const badges = profile.badges || [];
  const garageReputation = profile.garageReputation || 0;

  const openStory = (index: number) => {
    setSelectedStoryIndex(index);
  };

  const closeStory = () => {
    setSelectedStoryIndex(null);
  };

  const showPreviousStory = () => {
    setSelectedStoryIndex((index) => (index === null ? null : Math.max(0, index - 1)));
  };

  const showNextStory = () => {
    setSelectedStoryIndex((index) => (index === null ? null : Math.min(stories.length - 1, index + 1)));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Profile Card */}
      <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px accent-rail"></div>

        {isEditing && isOwnProfile ? (
          // EDIT PROFILE FORM
          <form onSubmit={handleSave} className="space-y-4 relative z-10">
            <h2 className="text-sm font-display font-black text-white uppercase tracking-wider border-b hairline pb-2">
              Edit Garage Profile
            </h2>

            {error && (
              <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Profile Photo
                </label>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={editProfileImage}
                    name={editDisplayName}
                    className="h-16 w-16 rounded-full border border-brand-orange/40 object-cover text-sm"
                    iconSize={20}
                  />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border hairline px-3 py-2 text-xs font-display font-bold text-zinc-300 transition hover:border-brand-orange/45 hover:text-brand-orange">
                    <ImagePlus size={15} />
                    <span>UPLOAD</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Crew Racer"
                  className="block w-full px-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Bio / Status Description
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Share your driving background, track history, tuning garage details..."
                rows={3}
                className="block w-full px-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 px-4 py-2 rounded-lg font-display text-xs font-bold transition-all"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="bg-brand-orange hover:bg-brand-orange-hover text-black px-4 py-2 rounded-lg font-display text-xs font-black transition-all flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </form>
        ) : (
          // READ PROFILE VIEW
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <UserAvatar
                src={profileImage}
                name={profile.displayName}
                className="w-[72px] h-[72px] md:w-24 md:h-24 rounded-full object-cover border-2 border-zinc-800 shadow text-lg"
                iconSize={24}
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-display font-black text-white m-0 uppercase tracking-tight">
                    {profile.displayName}
                  </h1>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-zinc-500 hover:text-brand-orange bg-zinc-950 hover:bg-zinc-900 rounded-lg border border-zinc-800/80 transition-all"
                      title="Edit Profile"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500">@{profile.username}</p>
                <div className="pt-1">
                  <RankBadge rank={profile.rank} size="md" />
                </div>
                
                {/* Crew / bio status */}
                <p className="text-zinc-300 text-sm italic mt-2.5 max-w-lg leading-relaxed">
                  "{profile.bio || 'Garage built, track ready.'}"
                </p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-4 bg-black/28 border hairline p-4 rounded-xl w-full md:w-auto min-w-[240px]">
              <div>
                <span className="block text-[9px] text-zinc-500 font-display font-extrabold uppercase tracking-widest">
                  TOTAL REPUTATION
                </span>
                <span className="text-lg font-display font-black text-brand-orange tracking-wider">
                  {garageReputation.toLocaleString()} GR
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-500 font-display font-extrabold uppercase tracking-widest">
                  GARAGE BUILDS
                </span>
                <span className="text-lg font-display font-black text-white">
                  {cars.length} Active
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-zinc-900 flex items-center gap-1.5 text-[9px] text-zinc-500 font-display font-bold uppercase tracking-widest">
                <Calendar size={12} className="text-brand-orange" />
                <span>Joined PISTON: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stories */}
      {(isOwnProfile || stories.length > 0) && (
        <div className="glass-panel rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between border-b hairline pb-3">
            <div>
              <h2 className="text-xs font-display font-black text-white uppercase tracking-wider">
                Stories
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                Tap a story to preview this creator's latest updates.
              </p>
            </div>
            <span className="rounded-full border border-brand-orange/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-orange">
              {stories.length} live
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-1">
            {isOwnProfile && (
              <Link to="/upload-story" className="w-24 shrink-0 text-left" title="Create story">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-brand-orange/70 bg-black text-brand-orange transition hover:bg-brand-orange/10">
                  <Plus size={22} />
                </div>
                <div className="mt-2 truncate text-center text-[11px] font-semibold text-zinc-400">
                  Your Story
                </div>
              </Link>
            )}

            {stories.map((story, index) => (
              <button
                key={`profile-story-${story.id}`}
                type="button"
                onClick={() => openStory(index)}
                className="w-24 shrink-0 text-left"
              >
                <div className="relative mx-auto h-20 w-20 rounded-full border-2 border-brand-orange p-0.5 shadow-[0_0_20px_rgba(232,93,4,0.12)]">
                  <img
                    src={story.mediaUrl}
                    alt={story.caption || 'Story media'}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div className="mt-2 truncate text-center text-[11px] font-semibold text-zinc-400">
                  {story.caption || 'Story'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedStory && selectedStoryIndex !== null && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 backdrop-blur-md">
          <div className="relative flex h-[92vh] max-h-[760px] min-h-[420px] w-full max-w-md flex-col overflow-hidden rounded-xl border hairline bg-zinc-950 shadow-2xl">
            <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
              {stories.map((story, index) => (
                <div key={`profile-story-progress-${story.id}`} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className={`h-full rounded-full ${
                      index <= selectedStoryIndex ? 'bg-brand-orange' : 'bg-transparent'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="absolute left-0 right-0 top-5 z-20 flex items-center justify-between px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  src={profileImage}
                  name={profile.displayName}
                  className="h-10 w-10 rounded-full border border-brand-orange/60 object-cover text-xs"
                  iconSize={16}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">@{profile.username}</div>
                  <div className="truncate text-[11px] text-zinc-300">
                    Story
                  </div>
                </div>
              </div>
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
                @{profile.username}
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
              disabled={selectedStoryIndex >= stories.length - 1}
              className="absolute right-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition hover:bg-black/70 disabled:opacity-25"
              title="Next story"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Badges Panel */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b hairline pb-3">
          <Award size={18} className="text-brand-orange" />
          <h2 className="text-xs font-display font-black text-white uppercase tracking-wider">
            Achievements & Badges
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {BADGES.map((badge) => {
            const isEarned = badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`group relative overflow-hidden p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                  isEarned
                    ? 'bg-black/35 border-brand-orange/20 text-zinc-100 hover:-translate-y-1 hover:border-brand-orange/45'
                    : 'bg-zinc-950/20 border-zinc-900/80 text-zinc-600'
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-px accent-rail opacity-60" />
                <BadgeEmblem badgeId={badge.id} label={badge.name} earned={isEarned} size="lg" />
                <h3 className="mt-3 text-lg leading-none font-display tracking-wide text-white truncate w-full">
                  {badge.name}
                </h3>
                <p className="text-[9px] text-zinc-500 leading-tight mt-1">{badge.description}</p>
                {!isEarned && (
                  <span className="mt-3 rounded-full border border-zinc-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                    Locked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cars Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-display font-black text-white uppercase tracking-wider border-b hairline pb-2">
          Vehicle Lineup
        </h2>

        {error && !isEditing && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {cars.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No cars in lineup yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cars.map((car) => {
              const carImage = car.photos?.[0] || car.imageUrl || car.mediaUrl || '';
              return (
              <div
                key={car.id}
                className="glass-panel rounded-xl overflow-hidden flex"
              >
                {/* Photo (fixed square thumb) */}
                <div className="w-1/3 min-w-[120px] bg-zinc-950 relative">
                  {carImage ? (
                    <img
                      src={carImage}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[150px] w-full items-center justify-center bg-zinc-950 text-[10px] font-display font-bold uppercase tracking-widest text-zinc-600">
                      No Image
                    </div>
                  )}
                  {car.isVerified && (
                    <div className="absolute top-1.5 right-1.5 bg-brand-orange text-black p-0.5 rounded-full border border-black">
                      <ShieldCheck size={12} className="stroke-[2.5]" />
                    </div>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDeleteCar(car.id)}
                      disabled={deletingCarId === car.id}
                      className="absolute bottom-1.5 right-1.5 grid h-8 w-8 place-items-center rounded-lg bg-black/75 text-zinc-300 backdrop-blur transition hover:bg-red-950/85 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete post"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-display font-extrabold uppercase tracking-widest text-brand-orange bg-orange-950/40 border border-brand-orange/20 px-2 py-0.5 rounded-full">
                      {car.rarity}
                    </span>
                    <h3 className="font-display font-extrabold text-white text-xs uppercase mt-1">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                      {car.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t hairline mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Star size={10} className="fill-brand-orange stroke-brand-orange" />
                      <span>{car.buildQuality}/10 Build</span>
                    </div>
                    <span className="font-display font-black text-[10px] text-brand-orange">
                      +{car.calculatedScore?.toLocaleString()} GR
                    </span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

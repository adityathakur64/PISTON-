import { useEffect, useState } from 'react';
import { Award, ShieldCheck, Edit3, Save, Star, Calendar } from 'lucide-react';
import { authService, dbService } from '../services/firebase';
import type { UserProfile, CarData } from '../services/reputationService';
import { BADGES } from '../services/reputationService';
import BadgeEmblem from '../components/BadgeEmblem';
import RankBadge from '../components/RankBadge';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = async (uid: string) => {
    try {
      const userProfile = await dbService.getUserProfile(uid);
      const userCars = await dbService.getUserCars(uid);
      setProfile(userProfile);
      setCars(userCars);
      
      if (userProfile) {
        setEditDisplayName(userProfile.displayName);
        setEditBio(userProfile.bio);
        setEditProfileImage(userProfile.profileImage);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      if (user) {
        loadProfile(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
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

  if (!profile) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Profile Card */}
      <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px accent-rail"></div>

        {isEditing ? (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Avatar / Profile Photo URL
                </label>
                <input
                  type="text"
                  value={editProfileImage}
                  onChange={(e) => setEditProfileImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="block w-full px-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none font-mono"
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
              <img
                src={profile.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400'}
                alt={profile.displayName}
                className="w-[72px] h-[72px] md:w-24 md:h-24 rounded-full object-cover border-2 border-zinc-800 shadow"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-display font-black text-white m-0 uppercase tracking-tight">
                    {profile.displayName}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-zinc-500 hover:text-brand-orange bg-zinc-950 hover:bg-zinc-900 rounded-lg border border-zinc-800/80 transition-all"
                    title="Edit Profile"
                  >
                    <Edit3 size={14} />
                  </button>
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
                  {profile.garageReputation.toLocaleString()} GR
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
                <span>Joined PISTON: {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

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
            const isEarned = profile.badges.includes(badge.id);
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

        {cars.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No cars in lineup yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cars.map((car) => (
              <div
                key={car.id}
                className="glass-panel rounded-xl overflow-hidden flex"
              >
                {/* Photo (fixed square thumb) */}
                <div className="w-1/3 min-w-[120px] bg-zinc-950 relative">
                  <img
                    src={car.photos[0]}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                  {car.isVerified && (
                    <div className="absolute top-1.5 right-1.5 bg-brand-orange text-black p-0.5 rounded-full border border-black">
                      <ShieldCheck size={12} className="stroke-[2.5]" />
                    </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

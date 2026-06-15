import { useEffect, useState } from 'react';
import { Crown, Trophy, MapPin } from 'lucide-react';
import { authService, dbService } from '../services/firebase';
import type { UserProfile, CarData } from '../services/reputationService';
import RankBadge from '../components/RankBadge';
import UserAvatar from '../components/UserAvatar';


type CategoryFilter = 'all' | 'jdm' | 'euro' | 'muscle' | 'exotic';
type RegionFilter = 'global' | 'north_america' | 'japan' | 'europe';

export default function Leaderboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [allCars, setAllCars] = useState<(CarData & { owner: UserProfile })[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });

    const loadData = async () => {
      try {
        const board = await dbService.getLeaderboard();
        const cars = await dbService.getAllCars();
        setLeaderboard(board);
        setAllCars(cars);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-brand-orange rounded-full animate-spin"></div>
        <span className="mt-3 text-xs text-zinc-500 font-display uppercase tracking-widest">
          Loading Leaderboard...
        </span>
      </div>
    );
  }

  // Filter logic simulating local and category leaderboards
  // In Phase 1, we filter profiles based on their car types or names
  const getFilteredProfiles = () => {
    let list = [...leaderboard];

    // Filter by Region
    if (selectedRegion !== 'global') {
      list = list.filter(profile => {
        if (selectedRegion === 'japan') return ['drift_shogun'].includes(profile.username);
        if (selectedRegion === 'europe') return ['carbon_porsche'].includes(profile.username);
        if (selectedRegion === 'north_america') return ['muscle_chef', 'miata_matt'].includes(profile.username);
        return true;
      });
    }

    // Filter by Car Category
    if (selectedCategory !== 'all') {
      list = list.filter(profile => {
        // Find if user has a car in that category
        const userCars = allCars.filter(c => c.owner.uid === profile.uid);
        if (selectedCategory === 'jdm') {
          return profile.username === 'drift_shogun' || profile.username === 'miata_matt' || userCars.some(c => ['mazda', 'nissan', 'honda', 'toyota', 'subaru', 'mitsubishi'].includes(c.make.toLowerCase()));
        }
        if (selectedCategory === 'euro') {
          return profile.username === 'carbon_porsche' || userCars.some(c => ['porsche', 'bmw', 'audi', 'mercedes', 'vw'].includes(c.make.toLowerCase()));
        }
        if (selectedCategory === 'muscle') {
          return profile.username === 'muscle_chef' || userCars.some(c => ['dodge', 'ford', 'chevrolet', 'pontiac', 'plymouth'].includes(c.make.toLowerCase()));
        }
        if (selectedCategory === 'exotic') {
          return profile.username === 'piston_legend_real' || userCars.some(c => c.rarity === 'exotic' || c.rarity === 'hypercar');
        }
        return true;
      });
    }

    // Sort list based on GR score
    return list.sort((a, b) => b.garageReputation - a.garageReputation);
  };

  const filteredList = getFilteredProfiles();
  
  // Podium slots (Top 3)
  const podiumUsers = filteredList.slice(0, 3);
  // Table slots (Ranks 4+)
  const tableUsers = filteredList.slice(3);

  // Helper to count user cars
  const getUserCarCount = (uid: string) => {
    return allCars.filter(c => c.owner.uid === uid).length;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Trophy className="text-brand-orange" />
            <span>Leaderboard</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Browse the top garages globally or filter by categories and region structures.
          </p>
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {(['all', 'jdm', 'euro', 'muscle', 'exotic'] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg font-display uppercase tracking-wider transition-all font-semibold ${
                selectedCategory === cat
                  ? 'bg-brand-orange text-black font-black'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border hairline'
              }`}
            >
              {cat === 'all' ? 'All Classes' : cat}
            </button>
          ))}
        </div>

        {/* Region Dropdown Structure */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <MapPin size={14} className="text-zinc-500" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as RegionFilter)}
            className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-display p-2 focus:outline-none focus:border-brand-orange uppercase tracking-wider"
          >
            <option value="global">Global Region</option>
            <option value="north_america">North America</option>
            <option value="japan">Japan / East Asia</option>
            <option value="europe">Europe</option>
          </select>
        </div>

      </div>

      {filteredList.length === 0 ? (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
          No builds match the current class or regional filter.
        </div>
      ) : (
        <>
          {/* Podium Display (Top 3 Users) */}
          {podiumUsers.length > 0 && (
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-4 pt-12 pb-6 max-w-4xl mx-auto">
              
              {/* 2nd Place */}
              {podiumUsers[1] && (
                <div className="w-full md:w-1/3 flex flex-col items-center order-2 md:order-1">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-zinc-500/10 rounded-full transition-all"></div>
                    <UserAvatar
                      src={podiumUsers[1].profileImage}
                      name={podiumUsers[1].displayName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-zinc-400 relative z-10 text-sm"
                      iconSize={22}
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-400 text-black font-display font-extrabold text-[10px] px-2 py-0.5 rounded-full z-20">
                      2ND
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <h3 className="text-sm font-display font-bold text-white uppercase truncate max-w-[150px]">
                      {podiumUsers[1].displayName}
                    </h3>
                    <p className="text-[10px] text-zinc-500">@{podiumUsers[1].username}</p>
                    <div className="mt-1">
                      <RankBadge rank={podiumUsers[1].rank} size="sm" />
                    </div>
                    <p className="text-zinc-300 font-display font-extrabold text-xs tracking-wider mt-1">
                      {podiumUsers[1].garageReputation.toLocaleString()} GR
                    </p>
                  </div>
                </div>
              )}

              {/* 1st Place (Center / Main Podium) */}
              {podiumUsers[0] && (
                <div className="w-full md:w-1/3 flex flex-col items-center order-1 md:order-2 -mt-6">
                  <div className="relative group">
                    {/* Crown Icon */}
                    <Crown className="absolute -top-7 left-1/2 -translate-x-1/2 text-brand-orange z-20" size={24} />
                    <div className="absolute inset-0 bg-brand-orange/12 rounded-full transition-all"></div>
                    <UserAvatar
                      src={podiumUsers[0].profileImage}
                      name={podiumUsers[0].displayName}
                      className="w-24 h-24 rounded-full object-cover border-4 border-brand-orange relative z-10 text-base"
                      iconSize={24}
                    />
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-brand-orange text-black font-display font-black text-xs px-3 py-0.5 rounded-full z-20 shadow">
                      CHAMP
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <h3 className="text-base font-display font-black text-white uppercase truncate max-w-[180px] tracking-tight">
                      {podiumUsers[0].displayName}
                    </h3>
                    <p className="text-[10px] text-zinc-500">@{podiumUsers[0].username}</p>
                    <div className="mt-1">
                      <RankBadge rank={podiumUsers[0].rank} size="sm" />
                    </div>
                    <p className="text-brand-orange font-display font-black text-sm tracking-wider mt-1.5">
                      {podiumUsers[0].garageReputation.toLocaleString()} GR
                    </p>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {podiumUsers[2] && (
                <div className="w-full md:w-1/3 flex flex-col items-center order-3">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-amber-800/10 rounded-full transition-all"></div>
                    <UserAvatar
                      src={podiumUsers[2].profileImage}
                      name={podiumUsers[2].displayName}
                      className="w-[72px] h-[72px] rounded-full object-cover border-4 border-amber-700 relative z-10 text-xs"
                      iconSize={20}
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-black font-display font-extrabold text-[10px] px-2 py-0.5 rounded-full z-20">
                      3RD
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <h3 className="text-sm font-display font-bold text-white uppercase truncate max-w-[150px]">
                      {podiumUsers[2].displayName}
                    </h3>
                    <p className="text-[10px] text-zinc-500">@{podiumUsers[2].username}</p>
                    <div className="mt-1">
                      <RankBadge rank={podiumUsers[2].rank} size="sm" />
                    </div>
                    <p className="text-zinc-300 font-display font-extrabold text-xs tracking-wider mt-1">
                      {podiumUsers[2].garageReputation.toLocaleString()} GR
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Leaderboard Table (Ranks 4-100) */}
          {tableUsers.length > 0 && (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 font-display font-extrabold uppercase tracking-widest">
                      <th className="py-3.5 px-4 text-center w-12">POS</th>
                      <th className="py-3.5 px-4">ENTHUSIAST</th>
                      <th className="py-3.5 px-4">GARAGE STATUS</th>
                      <th className="py-3.5 px-4 text-center">BUILDS</th>
                      <th className="py-3.5 px-4 text-right pr-6">REPUTATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {tableUsers.map((user, idx) => {
                      const position = idx + 4;
                      const isCurrentUser = currentUser && currentUser.uid === user.uid;

                      return (
                        <tr
                          key={user.uid}
                          className={`hover:bg-zinc-950/40 transition-colors ${
                            isCurrentUser ? 'bg-orange-950/10 border-l border-l-brand-orange' : ''
                          }`}
                        >
                          {/* Position */}
                          <td className="py-3.5 px-4 text-center font-display font-black text-zinc-400 text-sm">
                            #{position}
                          </td>

                          {/* Profile details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                src={user.profileImage}
                                name={user.displayName}
                                className="w-9 h-9 rounded-full object-cover border border-zinc-800 text-[10px]"
                                iconSize={15}
                              />
                              <div>
                                <div className="font-display font-bold text-white uppercase text-xs leading-none">
                                  {user.displayName}
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">@{user.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Rank Status */}
                          <td className="py-3.5 px-4">
                            <RankBadge rank={user.rank} size="sm" />
                          </td>

                          {/* Cars Count */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-300">
                            {getUserCarCount(user.uid)}
                          </td>

                          {/* Rep Score */}
                          <td className="py-3.5 px-4 text-right pr-6 font-display font-extrabold text-brand-orange text-sm tracking-wider">
                            {user.garageReputation.toLocaleString()} GR
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

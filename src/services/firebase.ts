import { 
  signInWithEmailAndPassword as fbSignIn, 
  createUserWithEmailAndPassword as fbCreateUser, 
  signOut as fbSignOut, 
  onAuthStateChanged as fbOnAuthStateChanged, 
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase.js';
import type { CarData, StoryData, UserProfile } from './reputationService';
import { calculateCarGR, getGarageRank, evaluateBadges } from './reputationService';

const FIREBASE_UPLOAD_TIMEOUT_MS = 45000;
const MOCK_FILE_READ_TIMEOUT_MS = 15000;
const EMPTY_MEDIA_URL = '';
const STORAGE_UPLOADS_ENABLED = false;

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const readFileAsDataUrl = async (file: File): Promise<string> => {
  return withTimeout(
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Could not read ${file.name}. Try a different image.`));
      reader.readAsDataURL(file);
    }),
    MOCK_FILE_READ_TIMEOUT_MS,
    `Reading ${file.name} took too long. Try a smaller image.`
  );
};

const assertFirebaseServices = () => {
  if (!db) {
    throw new Error('Firebase is missing Firestore configuration. Check your .env values and restart the dev server.');
  }
};

const getUploadBuildPhotoUrls = async (_uid: string, _carId: string, _photoFiles: File[]): Promise<string[]> => {
  if (!STORAGE_UPLOADS_ENABLED) {
    return [];
  }

  // Firebase Storage integration will return download URLs here when Storage is enabled.
  return [];
};

// ----------------------------------------------------------------------------
// SEED DATA FOR MOCK MODE
// ----------------------------------------------------------------------------
const SEED_PROFILES: UserProfile[] = [
  {
    uid: 'seed_user_1',
    username: 'carbon_porsche',
    displayName: 'Marcus Vance',
    bio: 'Carbon fiber addict. Running a custom 992 GT3 RS and a restored 964. Track days are my weekends.',
    profileImage: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=400',
    garageReputation: 28400,
    rank: 'Exotic Owner',
    badges: ['first_build', 'heavy_modder', 'elite_tier', 'verified_ride'],
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    uid: 'seed_user_2',
    username: 'drift_shogun',
    displayName: 'Keiji Sato',
    bio: 'JDM enthusiast. FD RX-7 and AE86. Keep it sideways, keep it high RPM. 🇯🇵',
    profileImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=400',
    garageReputation: 14250,
    rank: 'Garage Elite',
    badges: ['first_build', 'heavy_modder', 'elite_tier'],
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000
  },
  {
    uid: 'seed_user_3',
    username: 'muscle_chef',
    displayName: 'Sarah Miller',
    bio: 'Restoring a 1969 Dodge Charger. Big block engines only. Grease is my perfume.',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    garageReputation: 8200,
    rank: 'Track Warrior',
    badges: ['first_build', 'heavy_modder', 'verified_ride'],
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  },
  {
    uid: 'seed_user_4',
    username: 'piston_legend_real',
    displayName: 'Alex Roy',
    bio: 'Apex hunter. Pagani Zonda R and custom McLaren P1 GTR. PISTON is my leaderboard.',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    garageReputation: 64200,
    rank: 'PISTON Legend',
    badges: ['first_build', 'heavy_modder', 'elite_tier', 'verified_ride', 'top_10'],
    createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000
  },
  {
    uid: 'seed_user_5',
    username: 'miata_matt',
    displayName: 'Matt Cooper',
    bio: 'Track day rookie. Spec Miata build on a budget. It\'s not about the HP, it\'s about the weight.',
    profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    garageReputation: 1850,
    rank: 'Enthusiast',
    badges: ['first_build'],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000
  }
];

const SEED_CARS: CarData[] = [
  {
    id: 'seed_car_1_1',
    make: 'Porsche',
    model: '911 GT3 RS (992)',
    year: 2023,
    description: 'Fully custom carbon build. Weissach package, Manthey Racing alignment setup, straight pipe titanium exhaust.',
    modifications: ['Manthey Suspension', 'Dundon Headers', 'Carbon Wing Endplates', 'BBS Magnesium Wheels', 'PFC Brake Pads'],
    rarity: 'exotic',
    value: 320000,
    buildQuality: 10,
    isVerified: true,
    upvotes: 242,
    photos: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800'],
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    calculatedScore: 28400
  },
  {
    id: 'seed_car_2_1',
    make: 'Mazda',
    model: 'RX-7 (FD3S)',
    year: 1997,
    description: 'Bridge-ported 13B twin-turbo JDM build. Custom bodykit, RE Amemiya carbon parts, tuned on Haltech.',
    modifications: ['Haltech Elite 2500', 'RE Amemiya Bodykit', 'HKS Coilovers', 'Greddy Intercooler', 'Advan Racing TC4'],
    rarity: 'rare',
    value: 65000,
    buildQuality: 9,
    isVerified: false,
    upvotes: 110,
    photos: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    calculatedScore: 14250
  },
  {
    id: 'seed_car_3_1',
    make: 'Dodge',
    model: 'Charger R/T',
    year: 1969,
    description: 'Pro-touring build. 440 Big Block V8, modern suspension, manual transmission swap, leather restomod interior.',
    modifications: ['440 Big Block V8', 'QA1 Suspension', 'Tremec 5-Speed Swap', 'Wilwood 6-Piston Brakes', 'Custom Intake'],
    rarity: 'rare',
    value: 95000,
    buildQuality: 8,
    isVerified: true,
    upvotes: 42,
    photos: ['https://images.unsplash.com/photo-1612462551868-f48d10a44b88?auto=format&fit=crop&q=80&w=800'],
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    calculatedScore: 8200
  },
  {
    id: 'seed_car_4_1',
    make: 'Pagani',
    model: 'Zonda Cinque Roadster',
    year: 2010,
    description: '1 of 5 globally. Carbon-titanium monocoque, AMG 7.3L V12 engine. Stock but legendary.',
    modifications: ['Titanium Inconel Exhaust', 'Bespoke Ohlins Suspension'],
    rarity: 'hypercar',
    value: 3500000,
    buildQuality: 10,
    isVerified: true,
    upvotes: 620,
    photos: ['https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&q=80&w=800'],
    createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
    calculatedScore: 64200
  },
  {
    id: 'seed_car_5_1',
    make: 'Mazda',
    model: 'MX-5 Miata (NA)',
    year: 1993,
    description: 'Purpose-built autocross machine. Stripped interior, roll cage, and sticky tires.',
    modifications: ['Coilovers', 'Roll Cage', 'Sparco Racing Seat', 'Short Shifter'],
    rarity: 'common',
    value: 8000,
    buildQuality: 6,
    isVerified: false,
    upvotes: 12,
    photos: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800'],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    calculatedScore: 1850
  }
];

const SEED_STORIES: StoryData[] = [
  {
    id: 'seed_story_1_1',
    userId: 'seed_user_1',
    username: 'carbon_porsche',
    userAvatar: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=400',
    caption: 'Morning warmup before the canyon run.',
    mediaUrl: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&q=80&w=800',
    mediaType: 'image',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    expiresAt: Date.now() + 22 * 60 * 60 * 1000,
    viewedBy: [],
    ownerUid: 'seed_user_1'
  },
  {
    id: 'seed_story_2_1',
    userId: 'seed_user_2',
    username: 'drift_shogun',
    userAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=400',
    caption: 'Dialing in boost after the latest tune.',
    mediaUrl: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&q=80&w=800',
    mediaType: 'image',
    createdAt: Date.now() - 4 * 60 * 60 * 1000,
    expiresAt: Date.now() + 20 * 60 * 60 * 1000,
    viewedBy: [],
    ownerUid: 'seed_user_2'
  },
  {
    id: 'seed_story_3_1',
    userId: 'seed_user_3',
    username: 'muscle_chef',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    caption: 'Fresh parts day in the garage.',
    mediaUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=800',
    mediaType: 'image',
    createdAt: Date.now() - 7 * 60 * 60 * 1000,
    expiresAt: Date.now() + 17 * 60 * 60 * 1000,
    viewedBy: [],
    ownerUid: 'seed_user_3'
  },
  {
    id: 'seed_story_4_1',
    userId: 'seed_user_4',
    username: 'piston_legend_real',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    caption: 'Track prep checklist is finally done.',
    mediaUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
    mediaType: 'image',
    createdAt: Date.now() - 11 * 60 * 60 * 1000,
    expiresAt: Date.now() + 13 * 60 * 60 * 1000,
    viewedBy: [],
    ownerUid: 'seed_user_4'
  }
];

// Helper to load/save mock database state from LocalStorage
const getMockDB = () => {
  const defaultDB = {
    users: SEED_PROFILES,
    cars: SEED_CARS,
    stories: SEED_STORIES,
    upvotes: {} as Record<string, string[]>
  };
  const data = localStorage.getItem('piston_mock_db');
  if (!data) {
    localStorage.setItem('piston_mock_db', JSON.stringify(defaultDB));
    return defaultDB;
  }
  const parsed = JSON.parse(data) as typeof defaultDB;
  if (!parsed.stories) {
    parsed.stories = SEED_STORIES;
    localStorage.setItem('piston_mock_db', JSON.stringify(parsed));
  }
  return parsed;
};

const saveMockDB = (state: ReturnType<typeof getMockDB>) => {
  localStorage.setItem('piston_mock_db', JSON.stringify(state));
};

const seedCarOwners: Record<string, string> = {
  seed_car_1_1: 'seed_user_1',
  seed_car_2_1: 'seed_user_2',
  seed_car_3_1: 'seed_user_3',
  seed_car_4_1: 'seed_user_4',
  seed_car_5_1: 'seed_user_5',
};

const getCarOwnerUid = (car: CarData): string | undefined => {
  return car.userId || car.ownerUid || seedCarOwners[car.id];
};

const getMockUserCars = (cars: CarData[], uid: string): CarData[] => {
  return cars.filter((car) => getCarOwnerUid(car) === uid);
};

const isActiveStory = (story: StoryData): boolean => {
  return getStoryExpiresAt(story) > Date.now();
};

const getStoryOwnerUid = (story: StoryData): string | undefined => {
  return story.userId || story.ownerUid;
};

const getStoryExpiresAt = (story: StoryData): number => {
  return story.expiresAt || story.createdAt + 24 * 60 * 60 * 1000;
};

const buildProfileStats = (profile: UserProfile, cars: CarData[]) => {
  const newTotalGR = cars.reduce((acc, car) => acc + (car.calculatedScore || 0), 0);
  const rankInfo = getGarageRank(newTotalGR);
  const updatedProfile = {
    ...profile,
    garageReputation: newTotalGR,
    rank: rankInfo.current.title,
  };

  return {
    garageReputation: newTotalGR,
    rank: rankInfo.current.title,
    badges: evaluateBadges(updatedProfile, cars),
  };
};

// Stateful mock auth listener & storage
let mockCurrentUser: any = null;
const mockAuthCallbacks: ((user: any) => void)[] = [];

// Helper to trigger mock auth changes
const triggerMockAuthChange = () => {
  mockAuthCallbacks.forEach(cb => cb(mockCurrentUser));
};

// ----------------------------------------------------------------------------
// AUTH SERVICE (DUL-MODE WRAPPER)
// ----------------------------------------------------------------------------
export const authService = {
  getCurrentUser() {
    if (isFirebaseConfigured) {
      return auth.currentUser;
    } else {
      const stored = localStorage.getItem('piston_mock_current_user');
      if (stored && !mockCurrentUser) {
        mockCurrentUser = JSON.parse(stored);
      }
      return mockCurrentUser;
    }
  },

  subscribeToAuthChanges(callback: (user: any) => void) {
    if (isFirebaseConfigured) {
      return fbOnAuthStateChanged(auth, callback);
    } else {
      mockAuthCallbacks.push(callback);
      // Immediately invoke with current state
      const stored = localStorage.getItem('piston_mock_current_user');
      if (stored) {
        mockCurrentUser = JSON.parse(stored);
      }
      callback(mockCurrentUser);
      return () => {
        const idx = mockAuthCallbacks.indexOf(callback);
        if (idx !== -1) mockAuthCallbacks.splice(idx, 1);
      };
    }
  },

  async login(email: string, password: string): Promise<any> {
    if (isFirebaseConfigured) {
      const credential = await fbSignIn(auth, email, password);
      return credential.user;
    } else {
      // Mock login: match email prefix to username, or fallback
      const prefix = email.split('@')[0];
      const dbState = getMockDB();
      let userProfile = dbState.users.find(u => u.username === prefix || u.displayName.toLowerCase().includes(prefix.toLowerCase()));
      
      if (!userProfile) {
        // Create a basic profile if email contains a valid string
        userProfile = {
          uid: 'mock_uid_' + Date.now(),
          username: prefix || 'driver',
          displayName: prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'New Driver',
          bio: 'Garage built, track ready.',
          profileImage: '',
          garageReputation: 0,
          rank: 'Street Rookie',
          badges: [],
          createdAt: Date.now()
        };
        dbState.users.push(userProfile);
        saveMockDB(dbState);
      }
      
      mockCurrentUser = {
        uid: userProfile.uid,
        email: email,
        displayName: userProfile.displayName,
        photoURL: userProfile.profileImage
      };
      
      localStorage.setItem('piston_mock_current_user', JSON.stringify(mockCurrentUser));
      triggerMockAuthChange();
      return mockCurrentUser;
    }
  },

  async signup(email: string, password: string, username: string, displayName: string): Promise<any> {
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    
    if (isFirebaseConfigured) {
      const credential = await fbCreateUser(auth, email, password);
      await fbUpdateProfile(credential.user, {
        displayName: displayName
      });
      
      // Initialize profile in Firestore
      const userProfile: UserProfile = {
        uid: credential.user.uid,
        username: cleanUsername,
        displayName: displayName,
        bio: '',
        profileImage: '',
        garageReputation: 0,
        rank: 'Street Rookie',
        badges: [],
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, 'users', credential.user.uid), userProfile);
      return credential.user;
    } else {
      const dbState = getMockDB();
      
      // Check username uniqueness in mock DB
      if (dbState.users.some(u => u.username === cleanUsername)) {
        throw new Error('Username already taken.');
      }
      
      const newUid = 'mock_uid_' + Date.now();
      const userProfile: UserProfile = {
        uid: newUid,
        username: cleanUsername,
        displayName: displayName,
        bio: 'Just joined the garage.',
        profileImage: '',
        garageReputation: 0,
        rank: 'Street Rookie',
        badges: [],
        createdAt: Date.now()
      };
      
      dbState.users.push(userProfile);
      saveMockDB(dbState);
      
      mockCurrentUser = {
        uid: newUid,
        email: email,
        displayName: displayName,
        photoURL: userProfile.profileImage
      };
      
      localStorage.setItem('piston_mock_current_user', JSON.stringify(mockCurrentUser));
      triggerMockAuthChange();
      return mockCurrentUser;
    }
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured) {
      await fbSignOut(auth);
    } else {
      mockCurrentUser = null;
      localStorage.removeItem('piston_mock_current_user');
      triggerMockAuthChange();
    }
  }
};

// ----------------------------------------------------------------------------
// DATABASE SERVICE (DUAL-MODE WRAPPER)
// ----------------------------------------------------------------------------
export const dbService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
    } else {
      const dbState = getMockDB();
      const user = dbState.users.find(u => u.uid === uid);
      return user || null;
    }
  },

  async updateUserProfile(uid: string, updateData: Partial<UserProfile>): Promise<void> {
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'users', uid), updateData);
    } else {
      const dbState = getMockDB();
      const index = dbState.users.findIndex(u => u.uid === uid);
      if (index !== -1) {
        dbState.users[index] = { ...dbState.users[index], ...updateData };
        saveMockDB(dbState);
        
        // Update mock current user cache if avatar or display name changes
        if (mockCurrentUser && mockCurrentUser.uid === uid) {
          if (updateData.displayName) mockCurrentUser.displayName = updateData.displayName;
          if (updateData.profileImage) mockCurrentUser.photoURL = updateData.profileImage;
          localStorage.setItem('piston_mock_current_user', JSON.stringify(mockCurrentUser));
        }
      }
    }
  },

  async getUserCars(uid: string): Promise<CarData[]> {
    if (isFirebaseConfigured) {
      const carsRef = collection(db, 'cars');
      const q = query(carsRef, where('userId', '==', uid));
      const snapshots = await getDocs(q);
      return snapshots.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as CarData))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else {
      const dbState = getMockDB();
      // Look up cars from seed/user array in mock db
      // We can mock cars storage by associating cars with creator uid.
      // Wait, we need an owner id. Let's add a owner uid or seed them mapping user index.
      // To keep it simple, let's map: seed_user_1 owns seed_car_1_1, etc.
      // For user uploads, we can match car ID beginning or explicitly add ownerUid to CarData.
      // Let's adapt our Mock database schema to store an `ownerUid` or map them.
      // Let's assume car objects in LocalStorage store `ownerUid` attribute. Let's write the mock to support it.
      // Let's get all cars and filter.
      return getMockUserCars(dbState.cars, uid);
    }
  },

  async getAllCars(): Promise<(CarData & { owner: UserProfile })[]> {
    const dbState = getMockDB();
    if (isFirebaseConfigured) {
      const carsList: (CarData & { owner: UserProfile })[] = [];
      const carsSnapshot = await getDocs(query(collection(db, 'cars'), orderBy('createdAt', 'desc')));
      
      for (const carDoc of carsSnapshot.docs) {
        const car = { id: carDoc.id, ...carDoc.data() } as CarData;
        const ownerUid = getCarOwnerUid(car);
        if (ownerUid) {
          const owner = await this.getUserProfile(ownerUid);
          if (owner) {
            carsList.push({
              ...car,
              owner
            });
          }
        }
      }
      return carsList;
    } else {
      return dbState.cars.map(car => {
        // Find owner
        const ownerUid = getCarOwnerUid(car);
        const owner = dbState.users.find(u => u.uid === ownerUid) || SEED_PROFILES[0];
        return {
          ...car,
          owner
        };
      }).sort((a, b) => b.createdAt - a.createdAt);
    }
  },

  async getUserStories(uid: string): Promise<StoryData[]> {
    if (isFirebaseConfigured) {
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, where('userId', '==', uid));
      const snapshots = await getDocs(q);
      return snapshots.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as StoryData))
        .filter(isActiveStory)
        .sort((a, b) => getStoryExpiresAt(a) - getStoryExpiresAt(b));
    } else {
      const dbState = getMockDB();
      return dbState.stories
        .filter((story) => getStoryOwnerUid(story) === uid && isActiveStory(story))
        .sort((a, b) => getStoryExpiresAt(a) - getStoryExpiresAt(b));
    }
  },

  async getAllStories(): Promise<(StoryData & { owner: UserProfile })[]> {
    const dbState = getMockDB();
    if (isFirebaseConfigured) {
      const storiesList: (StoryData & { owner: UserProfile })[] = [];
      const storiesSnap = await getDocs(query(
        collection(db, 'stories'),
        where('expiresAt', '>', Date.now()),
        orderBy('expiresAt', 'asc')
      ));

      for (const storyDoc of storiesSnap.docs) {
        const story = { id: storyDoc.id, ...storyDoc.data() } as StoryData;
        const ownerUid = getStoryOwnerUid(story);
        if (ownerUid) {
          const owner = await this.getUserProfile(ownerUid);
          if (owner) {
            storiesList.push({
              ...story,
              owner
            });
          }
        }
      }
      return storiesList;
    } else {
      return dbState.stories
        .filter(isActiveStory)
        .map(story => {
          const ownerUid = getStoryOwnerUid(story);
          const owner = dbState.users.find(u => u.uid === ownerUid) || SEED_PROFILES[0];
          return {
            ...story,
            owner
          };
        })
        .sort((a, b) => getStoryExpiresAt(a) - getStoryExpiresAt(b));
    }
  },

  async uploadStory(
    uid: string,
    storyData: { caption?: string; mediaType: 'image' | 'video' },
    mediaFile: File
  ): Promise<StoryData> {
    const storyId = 'story_' + Date.now();
    const createdAt = Date.now();
    const expiresAt = createdAt + 24 * 60 * 60 * 1000;
    let mediaUrl = '';
    const profile = await this.getUserProfile(uid);
    const username = profile?.username || 'driver';
    const userAvatar = profile?.profileImage || '';

    if (isFirebaseConfigured) {
      assertFirebaseServices();
      mediaUrl = EMPTY_MEDIA_URL;

      const fullStoryData: StoryData = {
        id: storyId,
        userId: uid,
        username,
        userAvatar,
        caption: storyData.caption || '',
        mediaUrl,
        mediaType: storyData.mediaType,
        createdAt,
        expiresAt,
        viewedBy: [],
        ownerUid: uid,
      };

      await withTimeout(
        setDoc(doc(db, 'stories', storyId), fullStoryData),
        FIREBASE_UPLOAD_TIMEOUT_MS,
        'Saving the story took too long. Check Firestore rules and try again.'
      );
      return fullStoryData;
    } else {
      mediaUrl = await readFileAsDataUrl(mediaFile);

      const fullStoryData: StoryData = {
        id: storyId,
        userId: uid,
        username,
        userAvatar,
        caption: storyData.caption || '',
        mediaUrl,
        mediaType: storyData.mediaType,
        createdAt,
        expiresAt,
        viewedBy: [],
        ownerUid: uid,
      };

      const dbState = getMockDB();
      dbState.stories.unshift(fullStoryData);
      saveMockDB(dbState);
      return fullStoryData;
    }
  },

  async getLeaderboard(): Promise<UserProfile[]> {
    if (isFirebaseConfigured) {
      const profilesRef = collection(db, 'users');
      // Order by reputation score descending
      const q = query(profilesRef, orderBy('garageReputation', 'desc'));
      const snapshots = await getDocs(q);
      const list = snapshots.docs.map(doc => doc.data() as UserProfile);
      
      // Update top_10 badges dynamically based on live rankings
      return list;
    } else {
      const dbState = getMockDB();
      // Sort users by garageReputation
      const sorted = [...dbState.users].sort((a, b) => b.garageReputation - a.garageReputation);
      
      // Dynamically add top 10 badges to top accounts
      return sorted.map((user, index) => {
        const badges = [...user.badges];
        if (index < 10 && !badges.includes('top_10')) {
          badges.push('top_10');
        } else if (index >= 10 && badges.includes('top_10')) {
          const idx = badges.indexOf('top_10');
          badges.splice(idx, 1);
        }
        return { ...user, badges };
      });
    }
  },

  async uploadPost(
    uid: string, 
    carData: Omit<CarData, 'id' | 'createdAt' | 'upvotes' | 'photos' | 'calculatedScore'>,
    photoFiles: File[]
  ): Promise<CarData> {
    const calculatedScore = calculateCarGR({ ...carData, upvotes: 0, photos: [] });
    const carId = 'car_' + Date.now();
    const profile = await this.getUserProfile(uid);
    const username = profile?.username || 'driver';

    const photoUrls = await getUploadBuildPhotoUrls(uid, carId, photoFiles);
    const primaryImageUrl = photoUrls[0] || EMPTY_MEDIA_URL;

    if (isFirebaseConfigured) {
      assertFirebaseServices();

      const fullCarData: CarData = {
        id: carId,
        ...carData,
        userId: uid,
        username,
        mediaUrl: primaryImageUrl,
        imageUrl: primaryImageUrl,
        mediaType: 'image',
        caption: carData.description,
        hashtags: ['pistonlife', 'garagebuilt', carData.make.toLowerCase()],
        carDetails: {
          make: carData.make,
          model: carData.model,
          year: carData.year,
        },
        likes: [],
        commentsCount: 0,
        photos: photoUrls,
        upvotes: 0,
        createdAt: Date.now(),
        calculatedScore,
        garageScore: calculatedScore,
        ownerUid: uid
      };

      await withTimeout(
        setDoc(doc(db, 'cars', carId), fullCarData),
        FIREBASE_UPLOAD_TIMEOUT_MS,
        'Saving the car post took too long. Check Firestore rules and try again.'
      );

      // Re-calculate user total score & badges
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await withTimeout(
        getDoc(userDocRef),
        FIREBASE_UPLOAD_TIMEOUT_MS,
        'Loading your profile took too long after upload. Refresh and check your garage.'
      );
      if (userSnap.exists()) {
        const currentProfile = userSnap.data() as UserProfile;
        const userCarsRef = collection(db, 'cars');
        const carsSnap = await withTimeout(
          getDocs(query(userCarsRef, where('userId', '==', uid))),
          FIREBASE_UPLOAD_TIMEOUT_MS,
          'Recalculating your garage score took too long. Refresh and check your garage.'
        );
        const cars = carsSnap.docs.map(doc => doc.data() as CarData);
        
        const newTotalGR = cars.reduce((acc, car) => acc + (car.calculatedScore || 0), 0);
        const rankInfo = getGarageRank(newTotalGR);
        const updatedProfile = {
          ...currentProfile,
          garageReputation: newTotalGR,
          rank: rankInfo.current.title
        };
        const newBadges = evaluateBadges(updatedProfile, cars);
        
        await withTimeout(
          updateDoc(userDocRef, {
            garageReputation: newTotalGR,
            rank: rankInfo.current.title,
            badges: newBadges
          }),
          FIREBASE_UPLOAD_TIMEOUT_MS,
          'Updating your garage score took too long. Refresh and check your garage.'
        );
      }

      return fullCarData;
    } else {
      const fullCarData: CarData = {
        id: carId,
        ...carData,
        userId: uid,
        username,
        mediaUrl: primaryImageUrl,
        imageUrl: primaryImageUrl,
        mediaType: 'image',
        caption: carData.description,
        hashtags: ['pistonlife', 'garagebuilt', carData.make.toLowerCase()],
        carDetails: {
          make: carData.make,
          model: carData.model,
          year: carData.year,
        },
        likes: [],
        commentsCount: 0,
        photos: photoUrls,
        upvotes: 0,
        createdAt: Date.now(),
        calculatedScore,
        garageScore: calculatedScore,
        ownerUid: uid
      };

      const dbState = getMockDB();
      dbState.cars.unshift(fullCarData);

      // Update User profile stats
      const userIndex = dbState.users.findIndex(u => u.uid === uid);
      if (userIndex !== -1) {
        const stats = buildProfileStats(dbState.users[userIndex], getMockUserCars(dbState.cars, uid));
        dbState.users[userIndex] = { ...dbState.users[userIndex], ...stats };
      }

      saveMockDB(dbState);
      return fullCarData;
    }
  },

  async uploadCar(
    uid: string,
    carData: Omit<CarData, 'id' | 'createdAt' | 'upvotes' | 'photos' | 'calculatedScore'>,
    photoFiles: File[]
  ): Promise<CarData> {
    return this.uploadPost(uid, carData, photoFiles);
  },

  async deleteCar(uid: string, carId: string): Promise<void> {
    if (isFirebaseConfigured) {
      await deleteDoc(doc(db, 'cars', carId));

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userCarsSnap = await getDocs(query(collection(db, 'cars'), where('userId', '==', uid)));
        const cars = userCarsSnap.docs.map(doc => doc.data() as CarData);
        const stats = buildProfileStats(userSnap.data() as UserProfile, cars);

        await updateDoc(userDocRef, stats);
      }
    } else {
      const dbState = getMockDB();
      const car = dbState.cars.find((item) => item.id === carId);
      if (!car) return;

      const ownerUid = getCarOwnerUid(car);
      if (ownerUid !== uid) {
        throw new Error('You can only delete posts from your own garage.');
      }

      dbState.cars = dbState.cars.filter((item) => item.id !== carId);
      if (dbState.upvotes) {
        delete dbState.upvotes[carId];
      }

      const userIndex = dbState.users.findIndex((user) => user.uid === uid);
      if (userIndex !== -1) {
        const stats = buildProfileStats(dbState.users[userIndex], getMockUserCars(dbState.cars, uid));
        dbState.users[userIndex] = { ...dbState.users[userIndex], ...stats };
      }

      saveMockDB(dbState);
    }
  },

  async upvoteCar(carId: string, userId: string): Promise<void> {
    if (isFirebaseConfigured) {
      const postDocRef = doc(db, 'cars', carId);
      const postSnap = await getDoc(postDocRef);
      if (postSnap.exists()) {
        const car = { id: postSnap.id, ...postSnap.data() } as CarData;
        const ownerUid = getCarOwnerUid(car);
        const upvotes = (car.upvotes || 0) + 1;
        const updatedScore = calculateCarGR({
          ...car,
          upvotes
        });

        await updateDoc(postDocRef, {
          upvotes,
          calculatedScore: updatedScore
        });

        if (ownerUid) {
          const ownerProfile = await this.getUserProfile(ownerUid);
          const userCarsSnap = await getDocs(query(collection(db, 'cars'), where('userId', '==', ownerUid)));
          const cars = userCarsSnap.docs.map(doc => doc.data() as CarData);
          const newTotalGR = cars.reduce((acc, c) => acc + (c.calculatedScore || 0), 0);
          const rankInfo = getGarageRank(newTotalGR);
          const newBadges = ownerProfile ? evaluateBadges(ownerProfile, cars) : [];

          await updateDoc(doc(db, 'users', ownerUid), {
            garageReputation: newTotalGR,
            rank: rankInfo.current.title,
            badges: newBadges
          });
        }
      }
    } else {
      const dbState = getMockDB();
      const carIndex = dbState.cars.findIndex(c => c.id === carId);
      if (carIndex !== -1) {
        const car = dbState.cars[carIndex];
        
        // Setup upvote registry if not existing
        if (!dbState.upvotes) {
          dbState.upvotes = {};
        }
        if (!dbState.upvotes[carId]) {
          dbState.upvotes[carId] = [];
        }

        // Toggle upvote
        const hasUpvoted = dbState.upvotes[carId].includes(userId);
        if (hasUpvoted) {
          // Remove upvote
          dbState.upvotes[carId] = dbState.upvotes[carId].filter(id => id !== userId);
          car.upvotes = Math.max(0, car.upvotes - 1);
        } else {
          // Add upvote
          dbState.upvotes[carId].push(userId);
          car.upvotes += 1;
        }

        // Recalculate car score with new upvotes count
        const updatedScore = calculateCarGR({
          make: car.make,
          model: car.model,
          year: car.year,
          description: car.description,
          modifications: car.modifications,
          rarity: car.rarity,
          value: car.value,
          buildQuality: car.buildQuality,
          isVerified: car.isVerified,
          upvotes: car.upvotes,
          photos: car.photos
        });
        car.calculatedScore = updatedScore;

        // Recalculate owner profile
        const ownerUid = getCarOwnerUid(car);

        const userIndex = ownerUid ? dbState.users.findIndex(u => u.uid === ownerUid) : -1;
        if (ownerUid && userIndex !== -1) {
          const stats = buildProfileStats(dbState.users[userIndex], getMockUserCars(dbState.cars, ownerUid));
          dbState.users[userIndex] = { ...dbState.users[userIndex], ...stats };
        }

        saveMockDB(dbState);
      }
    }
  },

  async hasUpvotedCar(carId: string, userId: string): Promise<boolean> {
    if (isFirebaseConfigured) {
      // In Firestore, we could query if this user is in an upvotes subcollection or array.
      // To keep Phase 1 simple, we return false or mock it.
      return false;
    } else {
      const dbState = getMockDB();
      if (!dbState.upvotes || !dbState.upvotes[carId]) return false;
      return dbState.upvotes[carId].includes(userId);
    }
  }
};

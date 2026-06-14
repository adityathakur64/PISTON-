import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignIn, 
  createUserWithEmailAndPassword as fbCreateUser, 
  signOut as fbSignOut, 
  onAuthStateChanged as fbOnAuthStateChanged, 
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  orderBy
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { CarData, StoryData, UserProfile } from './reputationService';
import { calculateCarGR, getGarageRank, evaluateBadges } from './reputationService';

// Firebase configuration structure
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase configs are provided
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId
);

let auth: any = null;
let db: any = null;
let storage: any = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Firebase initialization failed, falling back to Mock Mode:', error);
  }
} else {
  console.log('Firebase credentials not found. Running in stateful MOCK mode (LocalStorage).');
}

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
    caption: 'Morning warmup before the canyon run.',
    mediaUrl: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&q=80&w=800',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    ownerUid: 'seed_user_1'
  },
  {
    id: 'seed_story_2_1',
    caption: 'Dialing in boost after the latest tune.',
    mediaUrl: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&q=80&w=800',
    createdAt: Date.now() - 4 * 60 * 60 * 1000,
    ownerUid: 'seed_user_2'
  },
  {
    id: 'seed_story_3_1',
    caption: 'Fresh parts day in the garage.',
    mediaUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=800',
    createdAt: Date.now() - 7 * 60 * 60 * 1000,
    ownerUid: 'seed_user_3'
  },
  {
    id: 'seed_story_4_1',
    caption: 'Track prep checklist is finally done.',
    mediaUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
    createdAt: Date.now() - 11 * 60 * 60 * 1000,
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
  return car.ownerUid || seedCarOwners[car.id];
};

const getMockUserCars = (cars: CarData[], uid: string): CarData[] => {
  return cars.filter((car) => getCarOwnerUid(car) === uid);
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
          profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400',
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
        bio: 'Just joined the garage.',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400',
        garageReputation: 0,
        rank: 'Street Rookie',
        badges: [],
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, 'profiles', credential.user.uid), userProfile);
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
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400',
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
      const userDoc = await getDoc(doc(db, 'profiles', uid));
      return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
    } else {
      const dbState = getMockDB();
      const user = dbState.users.find(u => u.uid === uid);
      return user || null;
    }
  },

  async updateUserProfile(uid: string, updateData: Partial<UserProfile>): Promise<void> {
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'profiles', uid), updateData);
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
      const carsRef = collection(db, 'profiles', uid, 'cars');
      const q = query(carsRef, orderBy('createdAt', 'desc'));
      const snapshots = await getDocs(q);
      return snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarData));
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
      // In Firestore, we query all cars. A subcollection query / "collectionGroup" is cleanest.
      const carsList: (CarData & { owner: UserProfile })[] = [];
      const profilesSnapshot = await getDocs(collection(db, 'profiles'));
      
      for (const profileDoc of profilesSnapshot.docs) {
        const owner = profileDoc.data() as UserProfile;
        const carsRef = collection(db, 'profiles', owner.uid, 'cars');
        const carsSnap = await getDocs(carsRef);
        carsSnap.docs.forEach(carDoc => {
          carsList.push({
            ...(carDoc.data() as CarData),
            id: carDoc.id,
            owner
          });
        });
      }
      return carsList.sort((a, b) => b.createdAt - a.createdAt);
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
      const storiesRef = collection(db, 'profiles', uid, 'stories');
      const q = query(storiesRef, orderBy('createdAt', 'desc'));
      const snapshots = await getDocs(q);
      return snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoryData));
    } else {
      const dbState = getMockDB();
      return dbState.stories
        .filter((story) => story.ownerUid === uid)
        .sort((a, b) => b.createdAt - a.createdAt);
    }
  },

  async getAllStories(): Promise<(StoryData & { owner: UserProfile })[]> {
    const dbState = getMockDB();
    if (isFirebaseConfigured) {
      const storiesList: (StoryData & { owner: UserProfile })[] = [];
      const profilesSnapshot = await getDocs(collection(db, 'profiles'));

      for (const profileDoc of profilesSnapshot.docs) {
        const owner = profileDoc.data() as UserProfile;
        const storiesRef = collection(db, 'profiles', owner.uid, 'stories');
        const storiesSnap = await getDocs(storiesRef);
        storiesSnap.docs.forEach(storyDoc => {
          storiesList.push({
            ...(storyDoc.data() as StoryData),
            id: storyDoc.id,
            owner
          });
        });
      }
      return storiesList.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      return dbState.stories.map(story => {
        const owner = dbState.users.find(u => u.uid === story.ownerUid) || SEED_PROFILES[0];
        return {
          ...story,
          owner
        };
      }).sort((a, b) => b.createdAt - a.createdAt);
    }
  },

  async getLeaderboard(): Promise<UserProfile[]> {
    if (isFirebaseConfigured) {
      const profilesRef = collection(db, 'profiles');
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

  async uploadCar(
    uid: string, 
    carData: Omit<CarData, 'id' | 'createdAt' | 'upvotes' | 'photos' | 'calculatedScore'>,
    photoFiles: File[]
  ): Promise<CarData> {
    const calculatedScore = calculateCarGR({ ...carData, upvotes: 0, photos: [] });
    const carId = 'car_' + Date.now();
    const photoUrls: string[] = [];

    // Process images
    if (isFirebaseConfigured) {
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const storageRef = ref(storage, `profiles/${uid}/cars/${carId}_${i}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        photoUrls.push(downloadUrl);
      }

      // Default photo if none uploaded
      if (photoUrls.length === 0) {
        photoUrls.push('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800');
      }

      const fullCarData: CarData = {
        id: carId,
        ...carData,
        photos: photoUrls,
        upvotes: 0,
        createdAt: Date.now(),
        calculatedScore
      };

      // Write to Firestore under subcollection
      await setDoc(doc(db, 'profiles', uid, 'cars', carId), fullCarData);

      // Re-calculate user total score & badges
      const userDocRef = doc(db, 'profiles', uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const currentProfile = userSnap.data() as UserProfile;
        const userCarsRef = collection(db, 'profiles', uid, 'cars');
        const carsSnap = await getDocs(userCarsRef);
        const cars = carsSnap.docs.map(doc => doc.data() as CarData);
        
        const newTotalGR = cars.reduce((acc, car) => acc + (car.calculatedScore || 0), 0);
        const rankInfo = getGarageRank(newTotalGR);
        const updatedProfile = {
          ...currentProfile,
          garageReputation: newTotalGR,
          rank: rankInfo.current.title
        };
        const newBadges = evaluateBadges(updatedProfile, cars);
        
        await updateDoc(userDocRef, {
          garageReputation: newTotalGR,
          rank: rankInfo.current.title,
          badges: newBadges
        });
      }

      return fullCarData;
    } else {
      // Mock File Upload (Convert File to Base64 to persist in LocalStorage)
      for (const file of photoFiles) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        photoUrls.push(base64);
      }

      // Default mockup car photo from Unsplash if none provided
      if (photoUrls.length === 0) {
        photoUrls.push('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800');
      }

      const fullCarData: CarData = {
        id: carId,
        ...carData,
        photos: photoUrls,
        upvotes: 0,
        createdAt: Date.now(),
        calculatedScore,
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

  async deleteCar(uid: string, carId: string): Promise<void> {
    if (isFirebaseConfigured) {
      await deleteDoc(doc(db, 'profiles', uid, 'cars', carId));

      const userDocRef = doc(db, 'profiles', uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userCarsSnap = await getDocs(collection(db, 'profiles', uid, 'cars'));
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
      // Firestore transactions/updates can increment upvotes
      // To prevent multi-upvoting, we can keep an array of upvoting userIds on the car doc
      // Alternatively, let's find the car across all profiles and update it.
      // Since it's a subcollection, we need the owner's UID. Let's find owner and update.
      const profilesSnap = await getDocs(collection(db, 'profiles'));
      for (const profileDoc of profilesSnap.docs) {
        const ownerUid = profileDoc.id;
        const carDocRef = doc(db, 'profiles', ownerUid, 'cars', carId);
        const carSnap = await getDoc(carDocRef);
        if (carSnap.exists()) {
          const car = carSnap.data() as CarData;
          // Upvote logic
          const upvotes = (car.upvotes || 0) + 1;
          const updatedScore = calculateCarGR({
            ...car,
            upvotes
          });
          
          await updateDoc(carDocRef, {
            upvotes,
            calculatedScore: updatedScore
          });

          // Update owner's total reputation
          const userCarsSnap = await getDocs(collection(db, 'profiles', ownerUid, 'cars'));
          const cars = userCarsSnap.docs.map(doc => doc.data() as CarData);
          const newTotalGR = cars.reduce((acc, c) => acc + (c.calculatedScore || 0), 0);
          const rankInfo = getGarageRank(newTotalGR);
          const newBadges = evaluateBadges(profileDoc.data() as UserProfile, cars);

          await updateDoc(doc(db, 'profiles', ownerUid), {
            garageReputation: newTotalGR,
            rank: rankInfo.current.title,
            badges: newBadges
          });
          break;
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

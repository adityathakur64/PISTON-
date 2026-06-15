import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export const isFirebaseConfigured: boolean;
export const app: FirebaseApp;
export const auth: Auth;
export const db: Firestore;

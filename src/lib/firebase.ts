import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  Auth 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Debug: Log the configuration (exclude actual keys in production)
console.log('Firebase configuration check:', {
  apiKeyExists: !!firebaseConfig.apiKey,
  authDomainExists: !!firebaseConfig.authDomain,
  projectIdExists: !!firebaseConfig.projectId,
  storageBucketExists: !!firebaseConfig.storageBucket,
  messagingSenderIdExists: !!firebaseConfig.messagingSenderId,
  appIdExists: !!firebaseConfig.appId,
  measurementIdExists: !!firebaseConfig.measurementId
});

// Initialize Firebase
let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    
    // Set persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Firebase Auth persistence set to local.');
      })
      .catch((error) => {
        console.error('Error setting Firebase Auth persistence:', error);
      });

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Handle initialization error appropriately
    // For safety, assign default/null values or re-throw
    // @ts-expect-error - Initialize with placeholder if error occurs
    if (!firebaseApp) firebaseApp = {} as FirebaseApp;
    // @ts-expect-error 
    if (!auth) auth = {} as Auth;
    // @ts-expect-error
    if (!db) db = {} as Firestore;
  }
} else if (getApps().length) {
  firebaseApp = getApps()[0];
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  console.log('Using existing Firebase app');
} else {
  // Handle server-side rendering or environments without 'window'
  // Initialize with placeholder/null objects or throw an error
  console.warn('Firebase cannot be initialized - window is undefined (SSR?). Assigning placeholders.');
  firebaseApp = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { firebaseApp, auth, db };
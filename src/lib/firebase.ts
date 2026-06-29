import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ------------------------------------------------------------------ //
// Firebase init. Values come from .env (Vite exposes VITE_* to the    //
// client). The placeholder fallbacks let the app boot before you've   //
// added real keys — it simply won't sync until you do. See SETUP.md.  //
// ------------------------------------------------------------------ //

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'REPLACE_ME',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'REPLACE_ME.firebaseapp.com',
  // The Realtime Database URL is the one that actually matters for this app.
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ??
    'https://REPLACE_ME-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'REPLACE_ME',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'REPLACE_ME.appspot.com',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    '1:000000000000:web:0000000000000000000000',
};

/** True once a real Realtime Database URL has been supplied via .env. The UI
 *  uses this to show a friendly "add your Firebase keys" warning. */
export const firebaseConfigured =
  !!import.meta.env.VITE_FIREBASE_DATABASE_URL &&
  !import.meta.env.VITE_FIREBASE_DATABASE_URL.includes('REPLACE_ME');

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);

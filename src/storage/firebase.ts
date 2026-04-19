import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth } from 'firebase/auth'
import {
  getFirestore, doc, setDoc, getDoc, collection, getDocs,
  query, orderBy, limit, deleteDoc,
  type Firestore,
} from 'firebase/firestore'

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const FIREBASE_ENABLED = Boolean(
  FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('PASTE_')
)

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _fs: Firestore | null = null

export function initFirebase(): { auth: Auth; fs: Firestore } {
  if (!_app) _app = initializeApp(FIREBASE_CONFIG)
  if (!_auth) _auth = getAuth(_app)
  if (!_fs) _fs = getFirestore(_app)
  return { auth: _auth, fs: _fs }
}

export {
  getAuth, signInAnonymously, onAuthStateChanged,
  getFirestore, doc, setDoc, getDoc, collection, getDocs,
  query, orderBy, limit, deleteDoc,
}

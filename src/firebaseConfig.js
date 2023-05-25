import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  FacebookAuthProvider,
  getRedirectResult,
  EmailAuthProvider,
  linkWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth'

import {
  getDatabase,
  ref,
  get,
  set,
  child,
  update,
  remove,
  push,
  query,
  equalTo,
  serverTimestamp,
  orderByChild,
  onValue,
} from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyDc_0aSfmZpDdhoiLXj49OG_fdogNZ5CFY',
  authDomain: 'city-vet-monitoring-system.firebaseapp.com',
  projectId: 'city-vet-monitoring-system',
  storageBucket: 'city-vet-monitoring-system.appspot.com',
  messagingSenderId: '1087102826401',
  appId: '1:1087102826401:web:85ec0adf6b6dbf487cbde0',
  measurementId: 'G-YVQ6HCQE71',
}
// Initialize Firebase app
const app = initializeApp(firebaseConfig)

// Get the Firebase Realtime Database instance
const database = getDatabase(app)

const auth = getAuth(app)
const googleAuthProvider = new GoogleAuthProvider()

const facebookAuthProvider = new FacebookAuthProvider()

export {
  auth,
  googleAuthProvider,
  facebookAuthProvider,
  database,
  EmailAuthProvider,
  get,
  ref,
  child,
  set,
  signInWithPopup,
  update,
  remove,
  push,
  fetchSignInMethodsForEmail,
  query,
  equalTo,
  serverTimestamp,
  orderByChild,
  onValue,
  getRedirectResult,
  linkWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
}

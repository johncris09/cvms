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

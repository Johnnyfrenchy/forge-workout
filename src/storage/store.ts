import { STORAGE_KEY } from '../data/constants'
import { FIREBASE_ENABLED, initFirebase, signInAnonymously, onAuthStateChanged, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from './firebase'
import type { Session, Settings, AppData } from '../data/constants'
import type { Firestore } from 'firebase/firestore'

export class Store {
  private uid: string | null = null
  private fs: Firestore | null = null
  private _firebaseOn = false

  async init(): Promise<void> {
    if (!FIREBASE_ENABLED) return

    try {
      const { auth, fs } = initFirebase()
      this.fs = fs

      await new Promise<void>((res, rej) => {
        onAuthStateChanged(auth, user => {
          if (user) { this.uid = user.uid; res() }
        })
        signInAnonymously(auth).catch(rej)
      })

      this._firebaseOn = true
    } catch (e) {
      console.warn('Firebase init failed, using localStorage only:', e)
      this._firebaseOn = false
    }
  }

  private readLocal(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : { sessions: [], settings: null, currentSession: null }
    } catch {
      return { sessions: [], settings: null, currentSession: null }
    }
  }

  private writeLocal(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) { console.warn(e) }
  }

  async loadAll(): Promise<AppData> {
    const local = this.readLocal()
    if (!this._firebaseOn || !this.fs || !this.uid) return local

    try {
      const userDoc = doc(this.fs, `users/${this.uid}`)
      const snap = await getDoc(userDoc)
      const settings: Settings | null = snap.exists() ? (snap.data() as any).settings : null

      const sessionsCol = collection(this.fs, `users/${this.uid}/sessions`)
      const q = query(sessionsCol, orderBy('date', 'desc'), limit(500))
      const sessSnap = await getDocs(q)
      const sessions: Session[] = []
      sessSnap.forEach(d => sessions.push({ ...d.data(), _docId: d.id } as Session))

      const currentDoc = doc(this.fs, `users/${this.uid}/state/current`)
      const curSnap = await getDoc(currentDoc)
      const currentSession: Session | null = curSnap.exists() ? curSnap.data() as Session : null

      const merged: AppData = { sessions, settings: settings || local.settings, currentSession }
      this.writeLocal(merged)
      return merged
    } catch (e) {
      console.warn('Firestore load failed, using local:', e)
      return local
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    const local = this.readLocal()
    local.settings = settings
    this.writeLocal(local)
    if (!this._firebaseOn || !this.fs || !this.uid) return
    try {
      await setDoc(doc(this.fs, `users/${this.uid}`), { settings }, { merge: true })
    } catch (e) { console.warn(e) }
  }

  async saveSession(session: Session): Promise<void> {
    const local = this.readLocal()
    const idx = local.sessions.findIndex(s => s.id === session.id)
    if (idx >= 0) local.sessions[idx] = session
    else local.sessions.unshift(session)
    this.writeLocal(local)
    if (!this._firebaseOn || !this.fs || !this.uid) return
    try {
      await setDoc(doc(this.fs, `users/${this.uid}/sessions/${session.id}`), session)
    } catch (e) { console.warn(e) }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const local = this.readLocal()
    local.sessions = local.sessions.filter(s => s.id !== sessionId)
    this.writeLocal(local)
    if (!this._firebaseOn || !this.fs || !this.uid) return
    try {
      await deleteDoc(doc(this.fs, `users/${this.uid}/sessions/${sessionId}`))
    } catch (e) { console.warn(e) }
  }

  async saveCurrentSession(session: Session | null): Promise<void> {
    const local = this.readLocal()
    local.currentSession = session
    this.writeLocal(local)
    if (!this._firebaseOn || !this.fs || !this.uid) return
    try {
      if (session) {
        await setDoc(doc(this.fs, `users/${this.uid}/state/current`), session)
      } else {
        await deleteDoc(doc(this.fs, `users/${this.uid}/state/current`))
      }
    } catch (e) { console.warn(e) }
  }

  isFirebase(): boolean { return this._firebaseOn }
  getUid(): string | null { return this.uid }
}

export const store = new Store()

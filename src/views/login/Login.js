import React from 'react'
import { CCard, CCardBody, CCardGroup, CCol, CContainer, CForm, CImage, CRow } from '@coreui/react'
import { GoogleLoginButton } from 'react-social-login-buttons'
import logo from './../../assets/images/logo.png'
import {
  auth,
  database,
  get,
  googleAuthProvider,
  push,
  ref,
  serverTimestamp,
  set,
  signInWithPopup,
} from '../../firebaseConfig'
import TrackUserActivity from 'src/helper/TrackUserActivity'

const Login = () => {
  const timestamp = serverTimestamp()
  const checkUserExists = async (email) => {
    try {
      const usersRef = ref(database, 'users')
      const usersSnapshot = await get(usersRef)
      const users = usersSnapshot.val()
      if (!users) {
        return false
      }
      for (const userId in users) {
        if (users[userId].email === email) {
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error checking user existence:', error)
      throw error
    }
  }

  const saveUserData = async (user) => {
    try {
      const userData = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        status: 'Pending',
        roleType: 'User',
        timestamp: timestamp,
      }
      const usersRef = ref(database, 'users')
      const emailExists = await checkUserExists(user.email)
      if (!emailExists) {
        const newUserRef = push(usersRef)
        await set(newUserRef, userData)

        const fetchUsersRef = ref(database, 'users')
        const usersSnapshot = await get(fetchUsersRef)
        const users = usersSnapshot.val()
        const userId = Object.keys(users).find((key) => users[key].email === user.email)
        TrackUserActivity({
          userId: userId,
          reference: 'Users',
          referenceTable: 'users',
          activity: 'Login',
          value: { id: userId, email: user.email },
        })

        console.log('User data saved successfully')
      } else {
        console.log('User already exists')
      }
    } catch (error) {
      console.error('Error saving user data:', error)
      throw error
    }
  }

  // Set up the Google authentication handler
  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider)

      const { user } = result

      checkUserExists(user.email)
        .then(async (exists) => {
          if (exists) {
            // Perform actions for existing user
            console.log('User exists')

            const usersRef = ref(database, 'users')
            const usersSnapshot = await get(usersRef)
            const users = usersSnapshot.val()
            const userId = Object.keys(users).find((key) => users[key].email === user.email)
            TrackUserActivity({
              userId: userId,
              reference: 'Users',
              referenceTable: 'users',
              activity: 'Login',
              value: { id: userId, email: user.email },
            })
          } else {
            console.log('User does not exist')
            // Perform actions for non-existing user
            saveUserData(user)
          }
        })
        .catch((error) => {
          console.error('Error checking user existence:', error)
        })
    } catch (error) {
      console.error('Error authenticating with Google:', error)
    }
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol xs={12} sm={12} lg={6} xl={6}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <div className="text-center">
                    <CImage
                      rounded
                      src={logo}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxWidth: '150px',
                        maxHeight: '150px',
                      }}
                    />
                  </div>
                  <CForm>
                    <h3 className="text-center">
                      Office of the City Veterinarian <br /> Monitoring System
                    </h3>
                    <p className="text-medium-emphasis text-center">Sign In to your account</p>

                    <CRow>
                      <CCol xs={12}>
                        <div className="d-grid my-2 col-12 mx-auto">
                          <GoogleLoginButton onClick={handleGoogleAuth} />
                        </div>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login

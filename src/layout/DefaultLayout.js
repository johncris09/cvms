import React, { useState, useEffect, Component } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import Login from 'src/views/login/Login'
import { auth, ref, database, onValue, query, orderByChild, equalTo } from './../firebaseConfig'
const DefaultLayout = () => {
  const [visible, setVisible] = useState(false)
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(null)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        // User is authenticated
        setUser(currentUser)
        const userRef = ref(database, 'users')
        const queryRef = query(userRef, orderByChild('email'), equalTo(currentUser.email))
        onValue(queryRef, (snapshot) => {
          const userData = snapshot.val()
          if (userData) {
            const userId = Object.keys(userData)[0]
            setStatus(userData[userId].status)
          }
        })
      } else {
        // User is not authenticated
        setUser(null)
      }
    })

    // Clean up the listener when the component unmounts
    return () => unsubscribe()
  }, [])

  return (
    <div>
      {!user ? (
        <Login />
      ) : status === 'aPending' ? (
        <div>Pending Approval</div>
      ) : (
        <>
          <AppSidebar />
          <div className="wrapper d-flex flex-column min-vh-100 bg-light">
            <AppHeader />
            <div className="body flex-grow-1 px-3">
              <AppContent />
            </div>
            <AppFooter />
          </div>
        </>
      )}
    </div>
  )
}

export default DefaultLayout

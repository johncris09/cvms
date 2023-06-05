import React, { useState, useEffect } from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilUser, cilAccountLogout } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { auth } from './../../firebaseConfig'
import TrackUserActivity from 'src/helper/TrackUserActivity'

const AppHeaderDropdown = ({ userId }) => {
  const [currentUser, setCurrentUser] = useState(null)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user)
      } else {
        // User is signed out
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])
  const handleLogout = () => {
    TrackUserActivity({
      userId: userId,
      reference: 'Users',
      referenceTable: 'users',
      activity: 'Logout',
      value: { id: userId, email: currentUser.email, logout: new Date().toISOString() },
    })

    auth
      .signOut()
      .then(() => {
        // Logout successful
        console.log('User logged out successfully')
      })
      .catch((error) => {
        // An error occurred during logout
        console.error('Error logging out:', error)
      })
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0" caret={false}>
        {currentUser && <CAvatar src={currentUser.photoURL} size="md" alt="Profile Photo" />}
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-light fw-semibold py-2">Settings</CDropdownHeader>
        {currentUser && <CDropdownItem href="#">Welcome {currentUser.email}</CDropdownItem>}
        {/* <CDropdownItem href="#">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem> */}
        <CDropdownDivider />
        <CDropdownItem href="#" onClick={handleLogout}>
          <CIcon icon={cilAccountLogout} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown

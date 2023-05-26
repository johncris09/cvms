import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { CSidebar, CSidebarBrand, CSidebarNav, CSidebarToggler, CImage } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { AppSidebarNav } from './AppSidebarNav'
import { sygnet } from 'src/assets/brand/sygnet'
import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'
import { auth, ref, database, onValue, query, orderByChild, equalTo } from './../firebaseConfig'
// sidebar nav config
import navigation from '../_nav'
import logo from './../assets/images/logo.png'
const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  const [status, setStatus] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        const userRef = ref(database, 'users')
        const queryRef = query(userRef, orderByChild('email'), equalTo(user.email))
        onValue(queryRef, (snapshot) => {
          const userData = snapshot.val()
          if (userData) {
            const userId = Object.keys(userData)[0]
            setStatus(userData[userId].status)
          }
        })
      } else {
        // User is signed out
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <CSidebar
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarBrand className="d-md-flex" to="/">
        <div className="clearfix">
          <CImage align="center" className="m-2" rounded src={logo} width={120} height={120} />
        </div>
        <CIcon className="sidebar-brand-narrow" icon={sygnet} height={35} />
      </CSidebarBrand>
      <CSidebarNav>
        <SimpleBar>{status === 'Approved' ? <AppSidebarNav items={navigation} /> : ''}</SimpleBar>
      </CSidebarNav>
      <CSidebarToggler
        className="d-none d-lg-flex"
        onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
      />
    </CSidebar>
  )
}

export default React.memo(AppSidebar)

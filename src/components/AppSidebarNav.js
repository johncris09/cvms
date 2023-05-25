import React, { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import { get, database, ref, query, orderByChild, equalTo, onValue } from './../firebaseConfig'
import { CBadge } from '@coreui/react'
export const AppSidebarNav = ({ items }) => {
  const [totalPending, setTotalPending] = useState(null)
  const countPendingStatus = async () => {
    const userRef = ref(database, 'users')
    const queryRef = query(userRef, orderByChild('status'), equalTo('Pending'))
    onValue(queryRef, (snapshot) => {
      const userData = snapshot.val()
      const numPendingUsers = userData ? Object.keys(userData).length : ''
      setTotalPending(numPendingUsers)
    })
  }

  useEffect(() => {
    countPendingStatus()
  }, [])

  const location = useLocation()
  const navLink = (name, icon, badge) => {
    return (
      <>
        {icon && icon}
        {name && name}
        {name === 'User' && totalPending && (
          <span className="ms-auto">
            <CBadge color="warning">{totalPending}</CBadge>
          </span>
        )}
        {/* {badge && (
          <CBadge color={badge.color} className="ms-auto">
            {badge.text}
          </CBadge>
        )} */}
      </>
    )
  }

  const navItem = (item, index) => {
    const { component, name, badge, icon, ...rest } = item
    const Component = component
    return (
      <Component
        {...(rest.to &&
          !rest.items && {
            component: NavLink,
          })}
        key={index}
        {...rest}
      >
        {navLink(name, icon, badge)}
      </Component>
    )
  }
  const navGroup = (item, index) => {
    const { component, name, icon, to, ...rest } = item
    const Component = component
    return (
      <Component
        idx={String(index)}
        key={index}
        toggler={navLink(name, icon)}
        visible={location.pathname.startsWith(to)}
        {...rest}
      >
        {item.items?.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index),
        )}
      </Component>
    )
  }

  return (
    <React.Fragment>
      {items &&
        items.map((item, index) => (item.items ? navGroup(item, index) : navItem(item, index)))}
    </React.Fragment>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
}

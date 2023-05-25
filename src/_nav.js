import React from 'react'
import { cilDog, cilSpeedometer } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Pet Owner',
    to: '/pet_owner',
    icon: <CIcon icon={cilDog} customClassName="nav-icon" />,
  },
]

export default _nav

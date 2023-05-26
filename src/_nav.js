import React from 'react'
import { cilAnimal, cilDog, cilEyedropper, cilSpeedometer, cilTablet, cilUser } from '@coreui/icons'
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
  {
    component: CNavItem,
    name: 'Anti-Rabies Vaccination',
    to: '/anti_rabies_vaccination',
    icon: <CIcon icon={cilEyedropper} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Deworming',
    to: '/deworming',
    icon: <CIcon icon={cilAnimal} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'User',
    to: '/user',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
]

export default _nav

import React from 'react'
import {
  cilAnimal,
  cilBook,
  cilChart,
  cilDog,
  cilEyedropper,
  cilSpeedometer,
  cilTablet,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

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
    component: CNavGroup,
    name: 'Report',
    to: '/report',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Pet Owner',
        to: '/report/pet_owner',
      },
      {
        component: CNavItem,
        name: 'Anti-Rabies Vaccination',
        to: '/report/anti_rabies',
      },
      {
        component: CNavItem,
        name: 'Deworming',
        to: '/report/deworming',
      },
    ],
  },
  {
    component: CNavTitle,
    name: 'Utilities',
  },
  {
    component: CNavItem,
    name: 'User',
    to: '/user',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
]

export default _nav

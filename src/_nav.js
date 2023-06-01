import React from 'react'
import {
  cibDocker,
  cibFoursquare,
  cilAnimal,
  cilBook,
  cilChart,
  cilDog,
  cilEyedropper,
  cilListRich,
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
    name: 'Dog Pound',
    to: '/dog_pound',
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
    component: CNavGroup,
    name: 'Species',
    to: '/species',
    icon: <CIcon icon={cilListRich} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Anti Rabies',
        to: '/species/anti_rabies',
      },
      {
        component: CNavItem,
        name: 'Deworm',
        to: '/species/deworming',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Medication',
    to: '/medication',
    icon: <CIcon icon={cibFoursquare} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'User',
    to: '/user',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
]

export default _nav

import React from 'react'
import {
  cibDocker,
  cibFoursquare,
  cibTheMovieDatabase,
  cilAnimal,
  cilBook,
  cilCalendar,
  cilCalendarCheck,
  cilChart,
  cilDog,
  cilEyedropper,
  cilHistory,
  cilListRich,
  cilSpeedometer,
  cilStorage,
  cilTablet,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = (userRoleType) => {
  let items = [
    {
      component: CNavItem,
      name: 'Dashboard',
      to: '/dashboard',
      icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    },
    {
      component: CNavGroup,
      name: 'Manage Dog',
      to: '/manage_dog',
      icon: <CIcon icon={cilDog} customClassName="nav-icon" />,
      items: [
        {
          component: CNavItem,
          name: 'Dog Pound',
          to: '/manage_dog/dog_pound',
        },
        {
          component: CNavItem,
          name: 'Adopt/Claim',
          to: '/manage_dog/adopt_claim',
        },
        {
          component: CNavItem,
          name: 'Disposed Dogs',
          to: '/manage_dog/disposed',
        },
      ],
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
      name: 'Configuration',
      to: '/config',
      icon: <CIcon icon={cilCalendarCheck} customClassName="nav-icon" />,
    },
  ]

  if (userRoleType === 'SuperAdmin') {
    items.push(
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
        name: 'Activity Log',
        to: '/activity_log',
        icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'User',
        to: '/user',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Database Backup',
        to: '/database_backup',
        icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
      },
    )
  }

  return items
}

export default _nav

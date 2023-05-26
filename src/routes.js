import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Pet_owner = React.lazy(() => import('./views/pet_owner/Pet_owner'))
const Anti_rabies_vaccination = React.lazy(() =>
  import('./views/anti_rabies_vaccination/Anti_rabies_vaccination'),
)
const Deworming = React.lazy(() => import('./views/deworming/Deworming'))
const User = React.lazy(() => import('./views/user/User'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/pet_owner', name: 'Pet Owner', element: Pet_owner },
  {
    path: '/anti_rabies_vaccination',
    name: 'Anti Rabies Vaccination',
    element: Anti_rabies_vaccination,
  },
  { path: '/deworming', name: 'Deworming', element: Deworming },
  { path: '/user', name: 'user', element: User },
]

export default routes

import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Pet_owner = React.lazy(() => import('./views/pet_owner/Pet_owner'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/pet_owner', name: 'Pet Owner', element: Pet_owner },
]

export default routes

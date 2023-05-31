import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Dog_pound = React.lazy(() => import('./views/dog_pound/Dog_pound'))
const Anti_rabies_vaccination = React.lazy(() =>
  import('./views/anti_rabies_vaccination/Anti_rabies_vaccination'),
)
const Deworming = React.lazy(() => import('./views/deworming/Deworming'))
const User = React.lazy(() => import('./views/user/User'))

const PetOwnerReport = React.lazy(() => import('./views/report/PetOwnerReport'))
const AntiRabiesVaccinationReport = React.lazy(() =>
  import('./views/report/AntiRabiesVaccinationReport'),
)
const DewormingReport = React.lazy(() => import('./views/report/DewormingReport'))
const AntiRabiesSpecies = React.lazy(() => import('./views/species/AntiRabiesSpecies'))
const DewormSpecies = React.lazy(() => import('./views/species/DewormSpecies'))
const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/dog_pound', name: 'Dog Pound', element: Dog_pound },
  {
    path: '/anti_rabies_vaccination',
    name: 'Anti Rabies Vaccination',
    element: Anti_rabies_vaccination,
  },
  { path: '/deworming', name: 'Deworming', element: Deworming },
  { path: '/user', name: 'user', element: User },
  { path: '/report', name: 'Report', element: PetOwnerReport, exact: true },
  { path: '/report/pet_owner', name: 'Pet Owner Report', element: PetOwnerReport },
  {
    path: '/report/anti_rabies',
    name: 'Anti-Rabies Vaccination Report',
    element: AntiRabiesVaccinationReport,
  },
  { path: '/report/deworming', name: 'Deworming Report', element: DewormingReport },
  { path: '/species', name: 'Sepcies', element: AntiRabiesSpecies, exact: true },
  { path: '/species/anti_rabies', name: 'Anti Rabies Species', element: AntiRabiesSpecies },
  { path: '/species/deworming', name: 'Deworm Species', element: DewormSpecies },
]

export default routes

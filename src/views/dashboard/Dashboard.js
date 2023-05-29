import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CForm,
  CFormSelect,
  CProgress,
  CRow,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import {
  CChart,
  CChartBar,
  CChartDoughnut,
  CChartLine,
  CChartPie,
  CChartPolarArea,
  CChartRadar,
} from '@coreui/react-chartjs'
import {
  auth,
  equalTo,
  database,
  ref,
  get,
  push,
  update,
  set,
  serverTimestamp,
  query,
  orderByChild,
  child,
  onValue,
  remove,
} from '../../firebaseConfig'
import { cilCloudDownload } from '@coreui/icons'
import { getStyle, hexToRgba } from '@coreui/utils'
import { TimeScale } from 'chart.js'
const Dashboard = () => {
  const [status, setStatus] = useState(null)
  const [email, setEmail] = useState(null)
  const [petOwnerData, setPetOwnerData] = useState([])
  const [petOwnerTotalData, setPetOwnerTotalData] = useState([])
  const [selectedSpeciesAntiRabies, setSelectedSpeciesAntiRabies] = useState('C')
  const [selectedSpeciesAntiRabiesTotal, setSelectedSpeciesAntiRabiesTotal] = useState('C')
  const [antiRabiesData, setAntiRabiesData] = useState([])
  const [antiRabiesTotalData, setAntiRabiesTotalData] = useState([])
  const [selectedSpeciesDeworming, setSelectedSpeciesDeworming] = useState('Carabao')
  const [selectedSpeciesTotalDeworming, setSelectedSpeciesTotalDeworming] = useState('Carabao')
  const [dewormingData, setDewormingData] = useState([])
  const [dewormingTotalData, setDewormingTotalData] = useState([])
  useEffect(() => {
    fetchPetOwnerData()
    fetchPetOwnerTotalData()
    fetchAntiRabiesData(selectedSpeciesAntiRabies)
    fetchAntiRabiesTotalData(selectedSpeciesAntiRabiesTotal)
    fetchDewormingData(selectedSpeciesDeworming)
    fetchDewormingTotalData(selectedSpeciesTotalDeworming)
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setEmail(user.email)
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
  }, [petOwnerData])
  const fetchPetOwnerData = async () => {
    try {
      const barangayRef = ref(database, 'barangay')
      const barangaySnapshot = await get(barangayRef)
      const barangays = Object.values(barangaySnapshot.val()).map((barangay) => barangay.barangay)

      const petOwnersRef = ref(database, 'pet_owner')
      const petOwnersSnapshot = await get(petOwnersRef)
      const petOwners = Object.values(petOwnersSnapshot.val())

      const maleCounts = []
      const femaleCounts = []
      const currentYear = new Date().getFullYear()
      // Loop through each pet owner
      for (const petOwner of petOwners) {
        const { address, sex, timestamp } = petOwner
        if (currentYear == new Date(timestamp).getFullYear()) {
          // Find the corresponding barangay for the current pet owner
          const index = barangays.indexOf(address)
          if (index !== -1) {
            if (sex === 'Male') {
              maleCounts[index] = (maleCounts[index] || 0) + 1
            } else if (sex === 'Female') {
              femaleCounts[index] = (femaleCounts[index] || 0) + 1
            }
          }
        }
      }

      const petOwnerData = {
        labels: barangays,
        datasets: [
          {
            label: 'Male',
            backgroundColor: '#f87979',
            data: maleCounts,
          },
          {
            label: 'Female',
            backgroundColor: '#799ff8',
            data: femaleCounts,
          },
        ],
      }

      setPetOwnerData(petOwnerData)
    } catch (error) {
      console.error('Error fetching pet owner data:', error)
    }
  }

  const fetchPetOwnerTotalData = async () => {
    try {
      const petOwnersRef = ref(database, 'pet_owner')
      const petOwnersSnapshot = await get(petOwnersRef)
      const petOwners = Object.values(petOwnersSnapshot.val())

      let totalMaleCount = 0
      let totalFemaleCount = 0
      const currentYear = new Date().getFullYear()

      // Loop through each pet owner
      for (const petOwner of petOwners) {
        const { sex, timestamp } = petOwner
        if (currentYear == new Date(timestamp).getFullYear()) {
          if (sex === 'Male') {
            totalMaleCount++
          } else if (sex === 'Female') {
            totalFemaleCount++
          }
        }
      }

      const petOwnerTotalData = {
        labels: ['Male', 'Female'],
        datasets: [
          {
            backgroundColor: ['#f87979', '#799ff8'],
            data: [totalMaleCount, totalFemaleCount],
          },
        ],
      }
      setPetOwnerTotalData(petOwnerTotalData)
    } catch (error) {
      console.error('Error fetching pet owner data:', error)
    }
  }

  const fetchAntiRabiesData = async (_species) => {
    try {
      const barangayRef = ref(database, 'barangay')
      const barangaySnapshot = await get(barangayRef)
      const barangays = Object.values(barangaySnapshot.val()).map((barangay) => barangay.barangay)

      const antiRabiesRef = ref(database, 'anti_rabies_vaccination')
      const antiRabiesSnapshot = await get(antiRabiesRef)
      const antiRabies = Object.values(antiRabiesSnapshot.val())

      const maleCounts = []
      const femaleCounts = []
      const currentYear = new Date().getFullYear()
      // Loop through each anti rabies
      for (const anti_rabies of antiRabies) {
        const { address, sex, timestamp, species } = anti_rabies
        if (currentYear == new Date(timestamp).getFullYear()) {
          if (species == _species) {
            // Find the corresponding barangay for the current anti rabies
            const index = barangays.indexOf(address)
            if (index !== -1) {
              if (sex === 'Male') {
                maleCounts[index] = (maleCounts[index] || 0) + 1
              } else if (sex === 'Female') {
                femaleCounts[index] = (femaleCounts[index] || 0) + 1
              }
            }
          }
        }
      }

      const _antiRabiesData = {
        labels: barangays,
        datasets: [
          {
            label: 'Male',
            backgroundColor: '#f87979',
            data: maleCounts,
          },
          {
            label: 'Female',
            backgroundColor: '#799ff8',
            data: femaleCounts,
          },
        ],
      }

      setAntiRabiesData(_antiRabiesData)
    } catch (error) {
      console.error('Error fetching pet owner data:', error)
    }
  }

  const fetchAntiRabiesTotalData = async (_species) => {
    try {
      const antiRabiesRef = ref(database, 'anti_rabies_vaccination')
      const antiRabiesSnapshot = await get(antiRabiesRef)
      const antiRabies = Object.values(antiRabiesSnapshot.val())

      let totalMaleCount = 0
      let totalFemaleCount = 0
      const currentYear = new Date().getFullYear()

      // Loop through each anti rabies
      for (const antiRabiesData of antiRabies) {
        const { sex, timestamp, species } = antiRabiesData
        if (currentYear == new Date(timestamp).getFullYear() && species == _species) {
          if (sex === 'Male') {
            totalMaleCount++
          } else if (sex === 'Female') {
            totalFemaleCount++
          }
        }
      }

      const _antiRabiesDataTotal = {
        labels: ['Male', 'Female'],
        datasets: [
          {
            backgroundColor: ['#f87979', '#799ff8'],
            data: [totalMaleCount, totalFemaleCount],
          },
        ],
      }
      setAntiRabiesTotalData(_antiRabiesDataTotal)
    } catch (error) {
      console.error('Error fetching pet owner data:', error)
    }
  }

  const fetchDewormingData = async (_species) => {
    try {
      const barangayRef = ref(database, 'barangay')
      const barangaySnapshot = await get(barangayRef)
      const barangays = Object.values(barangaySnapshot.val()).map((barangay) => barangay.barangay)

      const dewormingRef = ref(database, 'deworming')
      const dewormingSnapshot = await get(dewormingRef)
      const deworming = Object.values(dewormingSnapshot.val())

      const maleCounts = []
      const femaleCounts = []
      const currentYear = new Date().getFullYear()
      // Loop through each deworming
      for (const deworm of deworming) {
        const { address, female, male, timestamp, species } = deworm
        if (currentYear == new Date(timestamp).getFullYear()) {
          if (species === _species) {
            // Find the corresponding barangay for the current deworming
            const index = barangays.indexOf(address)
            if (index !== -1) {
              const femaleCount = parseInt(female) || 0
              const maleCount = parseInt(male) || 0

              femaleCounts[index] = (femaleCounts[index] || 0) + femaleCount
              maleCounts[index] = (maleCounts[index] || 0) + maleCount
            }
          }
        }
      }

      const _dewormingData = {
        labels: barangays,
        datasets: [
          {
            label: 'Male',
            backgroundColor: '#f87979',
            data: maleCounts,
          },
          {
            label: 'Female',
            backgroundColor: '#799ff8',
            data: femaleCounts,
          },
        ],
      }

      setDewormingData(_dewormingData)
    } catch (error) {
      console.error('Error fetching pet owner data:', error)
    }
  }

  const fetchDewormingTotalData = async (_species) => {
    try {
      const dewormingRef = ref(database, 'deworming')
      const dewormingSnapshot = await get(dewormingRef)
      const deworming = Object.values(dewormingSnapshot.val())

      let totalMaleCount = 0
      let totalFemaleCount = 0
      const currentYear = new Date().getFullYear()

      // Loop through each deworming
      for (const deworm of deworming) {
        const { female, male, timestamp, species } = deworm
        if (currentYear == new Date(timestamp).getFullYear() && species === _species) {
          const femaleCount = parseInt(female) || 0
          const maleCount = parseInt(male) || 0

          totalFemaleCount += femaleCount
          totalMaleCount += maleCount
        }
      }

      const _dewormingTotalData = {
        labels: ['Male', 'Female'],
        datasets: [
          {
            backgroundColor: ['#f87979', '#799ff8'],
            data: [totalMaleCount, totalFemaleCount],
          },
        ],
      }

      setDewormingTotalData(_dewormingTotalData)
    } catch (error) {
      console.error('Error fetching pet owner data:', error)
    }
  }
  const handleAntiRabiesChange = (e) => {
    const { value } = e.target
    setSelectedSpeciesAntiRabies(value)
  }

  const handleAntiRabiesTotalChange = (e) => {
    const { value } = e.target
    setSelectedSpeciesAntiRabiesTotal(value)
  }

  const handleDewormChange = (e) => {
    const { value } = e.target
    setSelectedSpeciesDeworming(value)
  }

  const handleDewormTotalChange = (e) => {
    const { value } = e.target
    setSelectedSpeciesTotalDeworming(value)
  }

  return (
    <>
      {status === 'Approved' ? (
        <CRow>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol md={12}>
                    <h4 id="pet-owner" className="card-title mb-0">
                      Pet
                    </h4>
                  </CCol>
                </CRow>
                <CChartBar height={150} data={petOwnerData} labels="pet_owner" />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol md={12}>
                    <h4 id="pet-owner" className="card-title mb-0">
                      Total Pet
                    </h4>
                  </CCol>
                </CRow>
                <CChart
                  type="doughnut"
                  height="400px"
                  width="200px"
                  options={{ maintainAspectRatio: false }}
                  data={petOwnerTotalData}
                />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol xs={5}>
                    <h4 id="anti-rabies" className="card-title mb-0">
                      Anti-Rabies
                    </h4>
                  </CCol>
                  <CCol xs={7} className="d-md-block">
                    <CForm className="float-end">
                      <CFormSelect size="sm" name="species" onChange={handleAntiRabiesChange}>
                        <option disabled>Choose...</option>
                        <option value="C">C - Iro</option>
                        <option value="F">F - Iring</option>
                      </CFormSelect>
                    </CForm>
                  </CCol>
                </CRow>
                <CChartBar data={antiRabiesData} height={150} labels="anti_tabies" />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol md={5}>
                    <h4 id="pet-owner" className="card-title mb-0">
                      Total Anti-Rabies
                    </h4>
                  </CCol>
                  <CCol xs={7} className="d-md-block">
                    <CForm className="float-end">
                      <CFormSelect size="sm" name="species" onChange={handleAntiRabiesTotalChange}>
                        <option disabled>Choose...</option>
                        <option value="C">C - Iro</option>
                        <option value="F">F - Iring</option>
                      </CFormSelect>
                    </CForm>
                  </CCol>
                </CRow>
                <CChart
                  type="doughnut"
                  height="400px"
                  width="200px"
                  options={{ maintainAspectRatio: false }}
                  data={antiRabiesTotalData}
                />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol xs={5}>
                    <h4 id="deworming" className="card-title mb-0">
                      Deworming
                    </h4>
                  </CCol>
                  <CCol xs={7} className="d-md-block">
                    <CForm className="float-end">
                      <CFormSelect size="sm" name="species" onChange={handleDewormChange}>
                        <option disabled>Choose...</option>
                        <option value="Carabao">Carabao</option>
                        <option value="Chicken">Chicken</option>
                        <option value="Cow">Cow</option>
                      </CFormSelect>
                    </CForm>
                  </CCol>
                </CRow>
                <CChartBar data={dewormingData} height={150} labels="anti_tabies" />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol xs={5}>
                    <h4 id="deworming" className="card-title mb-0">
                      Total Deworming
                    </h4>
                  </CCol>
                  <CCol xs={7} className="d-md-block">
                    <CForm className="float-end">
                      <CFormSelect size="sm" name="species" onChange={handleDewormTotalChange}>
                        <option disabled>Choose...</option>
                        <option value="Carabao">Carabao</option>
                        <option value="Chicken">Chicken</option>
                        <option value="Cow">Cow</option>
                      </CFormSelect>
                    </CForm>
                  </CCol>
                </CRow>
                <CChart
                  type="doughnut"
                  height="400px"
                  width="200px"
                  options={{ maintainAspectRatio: false }}
                  data={dewormingTotalData}
                />
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      ) : (
        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader>
                {status === 'Approved' ? <strong>Dashboard</strong> : <strong>Message</strong>}
              </CCardHeader>
              <CCardBody>
                <CAlert color="info" className="d-flex align-items-center">
                  <p>
                    Dear <strong>{email}</strong> , <br />
                    <br />
                    Thank you for logging into our system. We would like to inform you that your
                    account is currently pending approval from the system administrator. We
                    appreciate your patience during this process.
                    <br />
                    <br /> Once your account is approved, you will have full access to all the
                    features and functionalities of our system. We strive to review and process
                    account approvals as quickly as possible.
                    <br />
                    <br />
                    If you have any urgent questions or require further assistance, please
                    don&apos;t hesitate to reach out to our support team. We will be happy to assist
                    you. <br />
                    <br />
                    Thank you for your understanding. <br />
                    <br />
                    Best regards, <br />
                    The System Adminstrator
                  </p>
                </CAlert>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default Dashboard

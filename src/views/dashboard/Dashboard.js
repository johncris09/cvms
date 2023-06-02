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
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
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
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { cilCalendar, cilCalendarCheck, cilCloudDownload, cilOptions } from '@coreui/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'

const Dashboard = () => {
  const [status, setStatus] = useState(null)
  const [email, setEmail] = useState(null)
  const [dogPoundData, setDogPoundData] = useState([])
  const [dogPoundTotalData, setDogPoundTotalData] = useState([])
  const [speciesOptions, setSpeciesOptions] = useState([])
  const [selectedSpeciesAntiRabies, setSelectedSpeciesAntiRabies] = useState('-NWjlZLSfWsrJgtMS0j7')
  const [antiRabiesData, setAntiRabiesData] = useState([])
  const [antiRabiesTotalData, setAntiRabiesTotalData] = useState([])
  const [selectedSpeciesDeworming, setSelectedSpeciesDeworming] = useState('Carabao')
  const [dewormingData, setDewormingData] = useState([])
  const [dewormingTotalData, setDewormingTotalData] = useState([])
  const [startDate, setStartDate] = useState(new Date('2014/02/08'))
  const [endDate, setEndDate] = useState(new Date('2014/02/10'))
  const [dogPoundFormModalVisible, setDogPoundFormModalVisible] = useState(false)
  const [validated, setValidated] = useState(false)

  const [formDogPoundData, setFormDogPoundData] = useState({
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    fetchDogPoundData()
    // Anti Rabies data
    fetchAntiTabiesSpecies()
    fetchAntiRabiesData(selectedSpeciesAntiRabies)
    // Deworming data
    fetchDewormingData(selectedSpeciesDeworming)
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
  }, [dogPoundData])
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { month: 'long', day: 'numeric', year: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }
  const fetchDogPoundData = async () => {
    try {
      const barangayRef = ref(database, 'barangay')
      const barangaySnapshot = await get(barangayRef)
      const barangays = Object.values(barangaySnapshot.val()).map((barangay) => barangay.barangay)

      const dogPoundsRef = ref(database, 'dog_pound')
      const dogPoundsSnapshot = await get(dogPoundsRef)
      const dogPounds = Object.values(dogPoundsSnapshot.val())

      const maleCounts = []
      const femaleCounts = []
      let totalMaleCount = 0
      let totalFemaleCount = 0
      const currentYear = new Date().getFullYear()
      // Loop through each dog pound
      for (const dogPound of dogPounds) {
        const { address, sex, date } = dogPound
        const dogPoundDate = new Date(date).getFullYear()
        const startDate = formDogPoundData.start_date ? new Date(formDogPoundData.start_date) : null
        const endDate = formDogPoundData.end_date ? new Date(formDogPoundData.end_date) : null
        // console.info({ startDate, endDate })
        if (
          currentYear === dogPoundDate &&
          (startDate === null || endDate === null
            ? true
            : new Date(date) >= startDate && new Date(date) < endDate)
        ) {
          let _date = new Date(date)
          console.info({ startDate, endDate, _date })
          // Find the corresponding barangay for the current dog pound
          const index = barangays.indexOf(address)
          if (index !== -1) {
            if (sex === 'Male') {
              totalMaleCount++
              maleCounts[index] = (maleCounts[index] || 0) + 1
            } else if (sex === 'Female') {
              totalFemaleCount++
              femaleCounts[index] = (femaleCounts[index] || 0) + 1
            }
          }
        }
      }

      const dogPoundData = {
        labels: barangays,
        datasets: [
          {
            label: 'Male',
            backgroundColor: '#799ff8',
            data: maleCounts,
          },
          {
            label: 'Female',
            backgroundColor: '#f87979',
            data: femaleCounts,
          },
        ],
      }

      setDogPoundData(dogPoundData)
      setDogPoundTotalData({
        male: totalMaleCount.toLocaleString(),
        female: totalFemaleCount.toLocaleString(),
      })
    } catch (error) {
      console.error('Error fetching dog owner data:', error)
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
      let totalMaleCount = 0
      let totalFemaleCount = 0
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
                totalMaleCount++
                maleCounts[index] = (maleCounts[index] || 0) + 1
              } else if (sex === 'Female') {
                totalFemaleCount++
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
            backgroundColor: '#799ff8',
            data: maleCounts,
          },
          {
            label: 'Female',
            backgroundColor: '#f87979',
            data: femaleCounts,
          },
        ],
      }

      setAntiRabiesData(_antiRabiesData)
      setAntiRabiesTotalData({
        male: totalMaleCount.toLocaleString(),
        female: totalFemaleCount.toLocaleString(),
      })
    } catch (error) {
      console.error('Error fetching anti rabies data:', error)
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
      let totalMaleCount = 0
      let totalFemaleCount = 0
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

              totalFemaleCount += femaleCount
              totalMaleCount += maleCount
            }
          }
        }
      }

      const _dewormingData = {
        labels: barangays,
        datasets: [
          {
            label: 'Male',
            backgroundColor: '#799ff8',
            data: maleCounts,
          },
          {
            label: 'Female',
            backgroundColor: '#f87979',
            data: femaleCounts,
          },
        ],
      }

      setDewormingData(_dewormingData)
      setDewormingTotalData({
        male: totalMaleCount.toLocaleString(),
        female: totalFemaleCount.toLocaleString(),
      })
    } catch (error) {
      console.error('Error fetching deworming data:', error)
    }
  }

  const handleAntiRabiesChange = (e) => {
    const { value } = e.target
    setSelectedSpeciesAntiRabies(value)
  }

  const fetchAntiTabiesSpecies = async () => {
    try {
      const databaseRef = ref(database, 'anti_rabies_species')
      const snapshot = await get(databaseRef)
      if (snapshot.exists()) {
        const species = Object.values(snapshot.val()).sort((a, b) => a.name.localeCompare(b.name))
        setSpeciesOptions(species)
      }
    } catch (error) {
      console.error('Error fetching species data:', error)
    }
  }

  const handleDewormChange = (e) => {
    const { value } = e.target
    setSelectedSpeciesDeworming(value)
  }

  const handleDisplayDogPoundModal = () => {
    setDogPoundFormModalVisible(true)
  }

  const handleDogPoundChange = (e) => {
    const { name, value } = e.target
    setFormDogPoundData({ ...formDogPoundData, [name]: value })
  }

  return (
    <>
      {status === 'Approved' ? (
        <CRow>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol sm={5}>
                    <h4 id="dog-pound" className="card-title mb-0">
                      Dog Pound
                    </h4>
                    <div className="small text-medium-emphasis">
                      <strong>Male:</strong> {dogPoundTotalData.male} <br />
                      <strong>Female:</strong> {dogPoundTotalData.female}
                    </div>
                  </CCol>
                  <CCol sm={7} className="d-md-block">
                    <CButton
                      color="primary"
                      variant="outline"
                      className="float-end"
                      onClick={handleDisplayDogPoundModal}
                    >
                      <CIcon icon={cilCalendar} />
                    </CButton>
                  </CCol>
                </CRow>
                <CChartBar height={150} data={dogPoundData} labels="dog-pound" />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol xs={4}>
                    <h4 id="anti-rabies" className="card-title mb-0">
                      Anti-Rabies
                    </h4>
                    <div className="small text-medium-emphasis">
                      <strong>Male:</strong> {antiRabiesTotalData.male} <br />
                      <strong>Female:</strong> {antiRabiesTotalData.female}
                    </div>
                  </CCol>
                  <CCol xs={8} className="text-end">
                    <CForm className="float-end">
                      <CFormSelect size="sm" name="species" onChange={handleAntiRabiesChange}>
                        <option disabled>Choose...</option>
                        {speciesOptions.map((species) => (
                          <option key={species.id} value={species.id}>
                            {species.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </CForm>
                  </CCol>
                </CRow>
                <CChartBar data={antiRabiesData} height={150} labels="anti_tabies" />
              </CCardBody>
            </CCard>
          </CCol>
          {/* <CCol md={12}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol xs={5}>
                    <h4 id="deworming" className="card-title mb-0">
                      Deworming
                    </h4>
                    <div className="small text-medium-emphasis">
                      <strong>Male:</strong> {dewormingTotalData.male} <br />
                      <strong>Female:</strong> {dewormingTotalData.female}
                    </div>
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
          </CCol> */}

          {/* Dog Pound Date Range */}
          <CModal
            alignment="center"
            visible={dogPoundFormModalVisible}
            onClose={() => setDogPoundFormModalVisible(false)}
            backdrop="static"
            keyboard={false}
            size="md"
          >
            <CModalHeader>
              <CModalTitle>
                <FontAwesomeIcon icon={faFilter} /> Filter by Date
              </CModalTitle>
            </CModalHeader>
            <CModalBody>
              <p className="text-small-emphasis">
                Note:{' '}
                <strong>
                  <span className="text-danger">*</span> is required
                </strong>
              </p>
              <CForm className="row g-3 needs-validation" noValidate validated={validated}>
                <CCol md={6}>
                  <label htmlFor="startDate">
                    {
                      <>
                        Start Date
                        <span className="text-warning">
                          <strong>*</strong>
                        </span>
                      </>
                    }
                  </label>
                  <DatePicker
                    selected={formDogPoundData.start_date}
                    className="form-control"
                    onChange={(date) =>
                      handleDogPoundChange({ target: { name: 'start_date', value: date } })
                    }
                    selectsStart
                    startDate={formDogPoundData.start_date}
                    endDate={formDogPoundData.end_date}
                    name="start_date"
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <label htmlFor="endDate">
                    {
                      <>
                        End Date
                        <span className="text-warning">
                          <strong>*</strong>
                        </span>
                      </>
                    }
                  </label>
                  <DatePicker
                    className="form-control"
                    selected={formDogPoundData.end_date}
                    onChange={(date) =>
                      handleDogPoundChange({ target: { name: 'end_date', value: date } })
                    }
                    selectsEnd
                    startDate={formDogPoundData.start_date}
                    endDate={formDogPoundData.end_date}
                    minDate={formDogPoundData.start_date}
                    name="end_date"
                    required
                  />
                </CCol>
                {/* <CCol xs={12}>
                  <CButton color="primary" type="submit" className="float-end">
                    Generate
                  </CButton>
                </CCol> */}
              </CForm>
            </CModalBody>
          </CModal>
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

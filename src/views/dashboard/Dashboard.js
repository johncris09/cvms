import React, { useEffect, useState } from 'react'
import { cilFilter } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormSelect,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
} from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'
import { faCancel } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Draggable from 'react-draggable'
import {
  auth,
  database,
  equalTo,
  get,
  onValue,
  orderByChild,
  query,
  ref,
  child,
} from '../../firebaseConfig'
import RequiredNote from 'src/helper/RequiredNote'

const Dashboard = ({ roleType }) => {
  const [status, setStatus] = useState(null)
  const [email, setEmail] = useState(null)
  const [dogPoundData, setDogPoundData] = useState([])
  const [dogPoundTotalData, setDogPoundTotalData] = useState([])
  const [antiRabiesSpeciesOptions, setAntiRabiesSpeciesOptions] = useState([])
  const [dewormingSpeciesOptions, setDewormingOptions] = useState([])
  const [medicationOptions, setMedicationOptions] = useState([])
  const [selectedSpeciesAntiRabies, setSelectedSpeciesAntiRabies] = useState('-NX8KtCPVhgFEDDv0l0v')
  const [antiRabiesDefaultLabel, setAntiRabiesDefaultLabel] = useState('Cat')
  const [antiRabiesData, setAntiRabiesData] = useState([])
  const [antiRabiesTotalData, setAntiRabiesTotalData] = useState([])
  const [selectedSpeciesDeworming, setSelectedSpeciesDeworming] = useState('-NWjm_MQYI0XlG55JJ4P')
  const [dewormingDefaultLabel, setDewormingDefaultLabel] = useState('Carabao')
  const [dewormingData, setDewormingData] = useState([])
  const [dewormingTotalData, setDewormingTotalData] = useState([])
  const [dogPoundFormModalVisible, setDogPoundFormModalVisible] = useState(false)
  const [antiRabiesFormModalVisible, setAntiRabiesFormModalVisible] = useState(false)
  const [dewormingFormModalVisible, setDewormingFormModalVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [selectedYear, setSelectedYear] = useState(null)
  const [formDogPoundData, setFormDogPoundData] = useState({
    start_date: '',
    end_date: '',
  })
  const [formAntiRabiesData, setFormAntiRabiesData] = useState({
    species: selectedSpeciesAntiRabies,
    neutered: '',
    start_date: '',
    end_date: '',
  })
  const [formDewormingData, setFormDewormingData] = useState({
    species: selectedSpeciesDeworming,
    medication: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    fetchDogPoundData()
    // Anti Rabies data
    fetchAntiTabiesSpecies()
    fetchAntiRabiesData()
    // Deworming data
    fetchDewormingSpecies()
    fetchDewormingData()
    fetchMedication()
    fetchSelectedYear()
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

  const fetchSelectedYear = async () => {
    try {
      const yearRef = ref(database, 'config')
      const yearSnapshot = await get(child(yearRef, '-NYLG8JAhoqBoLkdZJML'))
      if (yearSnapshot.exists()) {
        // Year data found
        const yearData = yearSnapshot.val()
        setSelectedYear(yearData.year)
      } else {
        // Year data not found
        setSelectedYear(new Date().getFullYear())
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setSelectedYear(new Date().getFullYear())
    }
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
        if (
          selectedYear == dogPoundDate &&
          (startDate === null || endDate === null
            ? true
            : new Date(date) >= startDate && new Date(date) <= endDate)
        ) {
          let _date = new Date(date)
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
      const barangayRef = ref(database, 'barangay')
      const barangaySnapshot = await get(barangayRef)
      const barangays = Object.values(barangaySnapshot.val()).map((barangay) => barangay.barangay)

      const dogPoundData = {
        labels: barangays,
        datasets: [
          {
            label: 'Male',
            backgroundColor: '#799ff8',
            data: 0,
          },
          {
            label: 'Female',
            backgroundColor: '#f87979',
            data: 0,
          },
        ],
      }

      setDogPoundData(dogPoundData)
      setDogPoundTotalData({
        male: 0,
        female: 0,
      })
      // console.error('Error fetching dog owner data:', error)
    }
  }
  const fetchAntiRabiesData = async () => {
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
      // Loop through each anti rabies
      for (const anti_rabies of antiRabies) {
        const { address, sex, timestamp, species, date_vaccinated, neutered } = anti_rabies

        // const dateVaccinatedDate = new Date(date_vaccinated).getFullYear()
        const startDate = formAntiRabiesData.start_date
          ? new Date(formAntiRabiesData.start_date)
          : null
        const endDate = formAntiRabiesData.end_date ? new Date(formAntiRabiesData.end_date) : null
        const antiRabiesSpecies = formAntiRabiesData.species ? formAntiRabiesData.species : null
        const speciesNeutered = formAntiRabiesData.neutered ? formAntiRabiesData.neutered : null
        if (
          selectedYear == new Date(date_vaccinated).getFullYear() &&
          (startDate === null || endDate === null
            ? true
            : new Date(date_vaccinated) >= startDate && new Date(date_vaccinated) < endDate) &&
          (speciesNeutered === null ? true : speciesNeutered === neutered)
        ) {
          if (species == antiRabiesSpecies) {
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
      const barangayRef = ref(database, 'barangay')
      const barangaySnapshot = await get(barangayRef)
      const barangays = Object.values(barangaySnapshot.val()).map((barangay) => barangay.barangay)
      const _antiRabiesData = {
        labels: barangays,
        datasets: [
          {
            label: 'Male',
            backgroundColor: '#799ff8',
            data: 0,
          },
          {
            label: 'Female',
            backgroundColor: '#f87979',
            data: 0,
          },
        ],
      }

      setAntiRabiesData(_antiRabiesData)
      setAntiRabiesTotalData({
        male: 0,
        female: 0,
      })

      // console.error('Error fetching anti rabies data:', error)
    }
  }

  const fetchDewormingData = async () => {
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
      // Loop through each deworming
      for (const deworm of deworming) {
        const { address, female, male, timestamp, species, date_deworming, treatment } = deworm

        const startDate = formDewormingData.start_date
          ? new Date(formDewormingData.start_date)
          : null
        const endDate = formDewormingData.end_date ? new Date(formDewormingData.end_date) : null
        const medication = formDewormingData.medication ? formDewormingData.medication : null

        // console.info(species)
        if (
          selectedYear == new Date(date_deworming).getFullYear() &&
          (startDate === null || endDate === null
            ? true
            : new Date(date_deworming) >= startDate && new Date(date_deworming) < endDate) &&
          (medication === null ? true : medication == treatment)
        ) {
          if (species === formDewormingData.species) {
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
      const barangayRef = ref(database, 'barangay')
      const barangaySnapshot = await get(barangayRef)
      const barangays = Object.values(barangaySnapshot.val()).map((barangay) => barangay.barangay)

      const _dewormingData = {
        labels: barangays,
        datasets: [
          {
            label: 'Male',
            backgroundColor: '#799ff8',
            data: 0,
          },
          {
            label: 'Female',
            backgroundColor: '#f87979',
            data: 0,
          },
        ],
      }

      setDewormingData(_dewormingData)
      setDewormingTotalData({
        male: 0,
        female: 0,
      })

      // console.error('Error fetching deworming data:', error)
    }
  }

  const fetchAntiTabiesSpecies = async () => {
    try {
      const databaseRef = ref(database, 'anti_rabies_species')
      const snapshot = await get(databaseRef)
      if (snapshot.exists()) {
        const species = Object.values(snapshot.val()).sort((a, b) => a.name.localeCompare(b.name))
        setAntiRabiesSpeciesOptions(species)
      }
    } catch (error) {
      console.error('Error fetching species data:', error)
    }
  }

  const fetchDewormingSpecies = async () => {
    try {
      const databaseRef = ref(database, 'deworm_species')
      const snapshot = await get(databaseRef)
      if (snapshot.exists()) {
        const species = Object.values(snapshot.val()).sort((a, b) => a.name.localeCompare(b.name))
        setDewormingOptions(species)
      }
    } catch (error) {
      console.error('Error fetching species data:', error)
    }
  }

  const fetchMedication = async () => {
    try {
      const databaseRef = ref(database, 'medication')
      const snapshot = await get(databaseRef)
      if (snapshot.exists()) {
        const medication = Object.values(snapshot.val()).sort((a, b) =>
          a.medication.localeCompare(b.medication),
        )
        setMedicationOptions(medication)
      }
    } catch (error) {
      console.error('Error fetching medication data:', error)
    }
  }

  const handleDisplayDogPoundModal = () => {
    setDogPoundFormModalVisible(true)
  }

  const handleDogPoundChange = (e) => {
    const { name, value } = e.target
    setFormDogPoundData({ ...formDogPoundData, [name]: value })
  }

  const handleDogPoundResetFilter = () => {
    setFormDogPoundData({ ...formDogPoundData, start_date: '', end_date: '' })
  }
  const handleDisplayAntiRabiesModal = () => {
    setAntiRabiesFormModalVisible(true)
  }

  const handleAntiRabiesChange = (e) => {
    const { name, value } = e.target
    if (name === 'species') {
      const species = e.target.options[e.target.selectedIndex].text
      setAntiRabiesDefaultLabel(species)
    }

    setFormAntiRabiesData({ ...formAntiRabiesData, [name]: value })
  }
  const handleAntiRabiesResetFilter = () => {
    setFormAntiRabiesData({
      ...formAntiRabiesData,
      species: '-NWjlZLSfWsrJgtMS0j7',
      neutered: '',
      start_date: '',
      end_date: '',
    })
  }

  const handleDisplayDewormingModal = () => {
    setDewormingFormModalVisible(true)
  }

  const handleDewormingChange = (e) => {
    const { name, value } = e.target
    if (name === 'species') {
      const species = e.target.options[e.target.selectedIndex].text
      setDewormingDefaultLabel(species)
    }
    setFormDewormingData({ ...formDewormingData, [name]: value })
  }
  const handleDewormingResetFilter = () => {
    setFormDewormingData({
      ...formDewormingData,
      species: '-NWjm_MQYI0XlG55JJ4P',
      start_date: '',
      end_date: '',
    })
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
                      <CIcon icon={cilFilter} />
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
                  <CCol sm={5}>
                    <h4 id="anti-rabies" className="card-title mb-0">
                      Anti-Rabies ({antiRabiesDefaultLabel})
                    </h4>
                    <div className="small text-medium-emphasis">
                      <strong>Male:</strong> {antiRabiesTotalData.male} <br />
                      <strong>Female:</strong> {antiRabiesTotalData.female}
                    </div>
                  </CCol>
                  <CCol sm={7} className="d-md-block">
                    <CButton
                      color="primary"
                      variant="outline"
                      className="float-end"
                      onClick={handleDisplayAntiRabiesModal}
                    >
                      <CIcon icon={cilFilter} />
                    </CButton>
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
                  <CCol sm={5}>
                    <h4 id="deworming" className="card-title mb-0">
                      Deworming({dewormingDefaultLabel})
                    </h4>
                    <div className="small text-medium-emphasis">
                      <strong>Male:</strong> {dewormingTotalData.male} <br />
                      <strong>Female:</strong> {dewormingTotalData.female}
                    </div>
                  </CCol>
                  <CCol sm={7} className="d-md-block">
                    <CButton
                      color="primary"
                      variant="outline"
                      className="float-end"
                      onClick={handleDisplayDewormingModal}
                    >
                      <CIcon icon={cilFilter} />
                    </CButton>
                  </CCol>
                </CRow>
                <CChartBar data={dewormingData} height={150} labels="anti_tabies" />
              </CCardBody>
            </CCard>
          </CCol>

          {/* Dog Pound Date Range */}
          <Draggable
            handle=".modal-header"
            position={modalPosition}
            onStop={(e, data) => {
              setModalPosition({ x: data.x, y: data.y })
            }}
          >
            <CModal
              alignment="center"
              visible={dogPoundFormModalVisible}
              onClose={() => setDogPoundFormModalVisible(false)}
              backdrop="static"
              keyboard={false}
              size="md"
            >
              <CModalHeader>
                <CModalTitle>Filter</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <RequiredNote />
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <CButton color="danger" variant="outline" onClick={handleDogPoundResetFilter}>
                    <FontAwesomeIcon icon={faCancel} /> Reset Filter
                  </CButton>
                </div>
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
                </CForm>
              </CModalBody>
            </CModal>
          </Draggable>

          {/* Anti-Rabies Date Range */}
          <Draggable
            handle=".modal-header"
            position={modalPosition}
            onStop={(e, data) => {
              setModalPosition({ x: data.x, y: data.y })
            }}
          >
            <CModal
              alignment="center"
              visible={antiRabiesFormModalVisible}
              onClose={() => setAntiRabiesFormModalVisible(false)}
              backdrop="static"
              keyboard={false}
              size="md"
            >
              <CModalHeader>
                <CModalTitle>Filter</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <RequiredNote />
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <CButton color="danger" variant="outline" onClick={handleAntiRabiesResetFilter}>
                    <FontAwesomeIcon icon={faCancel} /> Reset Filter
                  </CButton>
                </div>
                <CForm className="row g-3 needs-validation" noValidate validated={validated}>
                  <CCol md={12}>
                    <CFormSelect
                      size="xs"
                      label="Species"
                      name="species"
                      onChange={handleAntiRabiesChange}
                    >
                      <option disabled>Choose...</option>
                      {antiRabiesSpeciesOptions.map((species) => (
                        <option key={species.id} value={species.id}>
                          {species.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={12}>
                    <CFormSelect
                      size="xs"
                      label="Neutered"
                      name="neutered"
                      onChange={handleAntiRabiesChange}
                    >
                      <option value="">Choose...</option>
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </CFormSelect>
                  </CCol>
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
                      selected={formAntiRabiesData.start_date}
                      className="form-control"
                      onChange={(date) =>
                        handleAntiRabiesChange({ target: { name: 'start_date', value: date } })
                      }
                      selectsStart
                      startDate={formAntiRabiesData.start_date}
                      endDate={formAntiRabiesData.end_date}
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
                      selected={formAntiRabiesData.end_date}
                      onChange={(date) =>
                        handleAntiRabiesChange({ target: { name: 'end_date', value: date } })
                      }
                      selectsEnd
                      startDate={formAntiRabiesData.start_date}
                      endDate={formAntiRabiesData.end_date}
                      minDate={formAntiRabiesData.start_date}
                      name="end_date"
                      required
                    />
                  </CCol>
                </CForm>
              </CModalBody>
            </CModal>
          </Draggable>

          {/* Deworming Date Range */}
          <Draggable
            handle=".modal-header"
            position={modalPosition}
            onStop={(e, data) => {
              setModalPosition({ x: data.x, y: data.y })
            }}
          >
            <CModal
              alignment="center"
              visible={dewormingFormModalVisible}
              onClose={() => setDewormingFormModalVisible(false)}
              backdrop="static"
              keyboard={false}
              size="md"
            >
              <CModalHeader>
                <CModalTitle>Filter</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <RequiredNote />
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <CButton color="danger" variant="outline" onClick={handleDewormingResetFilter}>
                    <FontAwesomeIcon icon={faCancel} /> Reset Filter
                  </CButton>
                </div>
                <CForm className="row g-3 needs-validation" noValidate validated={validated}>
                  <CCol md={12}>
                    <CFormSelect
                      size="xs"
                      label="Species"
                      name="species"
                      onChange={handleDewormingChange}
                    >
                      <option disabled>Choose...</option>
                      {dewormingSpeciesOptions.map((species) => (
                        <option key={species.id} value={species.id}>
                          {species.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={12}>
                    <CFormSelect
                      size="xs"
                      label="Medication"
                      name="medication"
                      onChange={handleDewormingChange}
                    >
                      <option value="">Choose...</option>
                      {medicationOptions.map((species) => (
                        <option key={species.id} value={species.id}>
                          {species.medication}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
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
                      selected={formDewormingData.start_date}
                      className="form-control"
                      onChange={(date) =>
                        handleDewormingChange({ target: { name: 'start_date', value: date } })
                      }
                      selectsStart
                      startDate={formDewormingData.start_date}
                      endDate={formDewormingData.end_date}
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
                      selected={formDewormingData.end_date}
                      onChange={(date) =>
                        handleDewormingChange({ target: { name: 'end_date', value: date } })
                      }
                      selectsEnd
                      startDate={formDewormingData.start_date}
                      endDate={formDewormingData.end_date}
                      minDate={formDewormingData.start_date}
                      name="end_date"
                      required
                    />
                  </CCol>
                </CForm>
              </CModalBody>
            </CModal>
          </Draggable>
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

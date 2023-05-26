import React, { useEffect, useState, useMemo } from 'react'
import MaterialReactTable from 'material-react-table'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CForm,
  CFormInput,
  CFormSelect,
} from '@coreui/react'
import { MenuItem, ListItemIcon } from '@mui/material'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
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
import { DeleteOutline, EditSharp } from '@mui/icons-material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import Table from 'src/constant/Table'
const MySwal = withReactContent(Swal)

const Anti_rabies_vaccination = () => {
  const _table = 'anti_rabies_vaccination'

  const timestamp = serverTimestamp()
  const [data, setData] = useState([])
  const [visible, setVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [barangayOptions, setBarangayOptions] = useState([])
  const [currentYear, setCurrentYear] = useState()
  const [formData, setFormData] = useState({
    date_vaccinated: '',
    vaccine_type: '',
    owner_name: '',
    pet_name: '',
    address: '',
    pet_birthdate: '',
    color: '',
    sex: '',
    species: '',
    neutered: '',
  })
  const [selectedItemId, setSelectedItemId] = useState(null)
  useEffect(() => {
    // fetchData()
    fetchBarangay()

    const currentYear = new Date().getFullYear() // Get the current year
    setCurrentYear(currentYear)

    fetchData(_table, currentYear)
  }, [])

  const fetchData = async (table, currentYear) => {
    try {
      const dataRef = ref(database, table)
      const dataQuery = query(dataRef, orderByChild('timestamp'))

      onValue(dataQuery, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const dataArray = Object.values(data)
          // Filter the data based on the desired year and semester
          const filteredData = dataArray.filter((item) => {
            const date = new Date(item.timestamp)
            const year = date.getFullYear()
            return year === currentYear
          })

          // // Sort the filtered data by spNo
          filteredData.sort((a, b) => new Date(b.date_vaccinated) - new Date(a.date_vaccinated))

          const processedData = filteredData.map((item) => {
            const date = new Date(item.timestamp)
            const formattedDate = date.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            })

            const formattedTime = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
            const _date = formattedDate === 'Invalid Date' ? '' : formattedDate
            const _time = formattedTime === 'Invalid Date' ? '' : formattedTime

            const today = new Date()
            const birthdate = new Date(item.pet_birthdate)
            const ageTime = today - birthdate
            const age = Math.floor(ageTime / (1000 * 60 * 60 * 24 * 365)) // Calculating age in years

            return {
              id: item.id,
              owner_name: item.owner_name,
              pet_name: item.pet_name,
              color: item.color,
              sex: item.sex,
              address: item.address,
              created_at: _date + ' ' + _time,
              age:
                age === 1
                  ? age.toString() + ' year old'
                  : age === 0
                  ? 'Less than 1 year old'
                  : age.toString() + ' years old',
              birthdate: item.pet_birthdate,
              neutered: item.neutered,
              species: item.species,
              vaccination_date: item.date_vaccinated,
              vaccine_type: item.vaccine_type,
            }
          })
          // console.info(processedData)

          setData(processedData)
        } else {
          setData({})
        }
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchBarangay = async () => {
    try {
      const databaseRef = ref(database, 'barangay')
      const snapshot = await get(databaseRef)
      if (snapshot.exists()) {
        const barangays = Object.values(snapshot.val())
        setBarangayOptions(barangays)
      }
    } catch (error) {
      console.error('Error fetching barangay data:', error)
    }
  }

  const handleAdd = () => {
    setFormData({
      date_vaccinated: '',
      vaccine_type: '',
      owner_name: '',
      pet_name: '',
      address: '',
      pet_birthdate: '',
      color: '',
      sex: '',
      species: '',
      neutered: '',
    })
    setEditMode(false)
    setVisible(true)
    setValidated(false)
    setSelectedItemId(null)
  }

  const handleSubmit = (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      event.preventDefault()
      const formData = new FormData(form)

      // for (let entry of formData.entries()) {
      //   const [key, value] = entry
      //   console.log(`${key}: ${value}`)
      // }

      const date_vaccinated = formData.get('date_vaccinated')
      const vaccine_type = formData.get('vaccine_type')
      const address = formData.get('address')
      const owner_name = formData.get('owner_name')
      const pet_name = formData.get('pet_name')
      const pet_birthdate = formData.get('pet_birthdate')
      const color = formData.get('color')
      const sex = formData.get('sex')
      const species = formData.get('species')
      const neutered = formData.get('neutered')
      const timestamp = serverTimestamp()
      if (selectedItemId) {
        // Update operation
        const itemRef = ref(database, `${_table}/${selectedItemId}`)
        update(itemRef, {
          date_vaccinated,
          vaccine_type,
          address,
          owner_name,
          pet_name,
          pet_birthdate,
          color,
          sex,
          species,
          neutered,
        })
          .then(() => {
            MySwal.fire({
              title: <strong>Success!</strong>,
              html: <i>Record Successfully Updated!</i>,
              icon: 'success',
            })
          })
          .catch((error) => {
            console.error('Error updating data:', error)
          })
      } else {
        // Add operation
        const newItemRef = push(ref(database, _table))
        const id = newItemRef.key
        set(newItemRef, {
          id,
          date_vaccinated,
          vaccine_type,
          address,
          owner_name,
          pet_name,
          pet_birthdate,
          color,
          sex,
          species,
          neutered,
          timestamp,
        })
          .then(() => {
            MySwal.fire({
              title: <strong>Success!</strong>,
              html: <i>New Record Successfully Added!</i>,
              icon: 'success',
            })
          })
          .catch((error) => {
            console.error('Error adding data:', error)
          })
      }
      setValidated(false)
      // setVisible(false)
    }
    // form.reset()
    setValidated(true)
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target

    setFormData({ ...formData, [name]: value })
  }

  const columns = useMemo(
    () => [
      {
        id: 'pet_owner',
        columns: [
          {
            accessorKey: 'vaccination_date',
            header: 'Vaccination Date',
          },
          {
            accessorKey: 'address',
            header: 'Address',
          },
          {
            accessorKey: 'owner_name',
            header: 'Owner Name',
          },
          {
            accessorKey: 'pet_name',
            header: 'Pet Name',
          },
          {
            accessorKey: 'age',
            header: 'Age (Years)',
          },
          {
            accessorKey: 'sex',
            header: 'Sex',
          },
          {
            accessorKey: 'color',
            header: 'Color',
          },
          {
            accessorKey: 'species',
            header: 'Species',
          },
          {
            accessorKey: 'neutered',
            header: 'Neutered',
          },
          {
            accessorKey: 'vaccine_type',
            header: 'Vaccine Type',
          },
          {
            accessorKey: 'created_at',
            header: 'Created At',
          },
        ],
      },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Anti Rabies Vaccination</strong>
            <CButton color="primary" className="float-end" onClick={handleAdd}>
              <FontAwesomeIcon icon={faPlusCircle} /> Add New Data
            </CButton>
          </CCardHeader>
          <CCardBody>
            <>
              <MaterialReactTable
                columns={columns}
                data={data}
                enableColumnFilterModes
                enableColumnOrdering
                enableGrouping
                enablePinning
                enableRowActions
                enableColumnResizing
                initialState={{ density: 'compact' }}
                positionToolbarAlertBanner="bottom"
                renderRowActionMenuItems={({ closeMenu, row }) => [
                  <MenuItem
                    key={0}
                    onClick={async () => {
                      closeMenu()

                      const petOwnersRef = ref(database, _table)
                      const petOwnerSnapshot = await get(child(petOwnersRef, row.original.id))

                      if (petOwnerSnapshot.exists()) {
                        // Pet owner data found
                        const petOwnerData = petOwnerSnapshot.val()
                        console.info(petOwnerData)

                        setFormData({
                          date_vaccinated: petOwnerData.date_vaccinated,
                          vaccine_type: petOwnerData.vaccine_type,
                          owner_name: petOwnerData.owner_name,
                          pet_name: petOwnerData.pet_name,
                          color: petOwnerData.color,
                          sex: petOwnerData.sex,
                          species: petOwnerData.species,
                          address: petOwnerData.address,
                          neutered: petOwnerData.neutered,
                          pet_birthdate: petOwnerData.pet_birthdate,
                        })

                        setSelectedItemId(row.original.id) // Set the selected item ID
                        setVisible(true)
                        setEditMode(true)
                      } else {
                        // Pet owner data not found
                        console.log('Pet owner not found')
                      }
                    }}
                    sx={{ m: 0 }}
                  >
                    <ListItemIcon>
                      <EditSharp />
                    </ListItemIcon>
                    Edit
                  </MenuItem>,
                  <MenuItem
                    key={1}
                    onClick={() => {
                      closeMenu()
                      Swal.fire({
                        title: 'Are you sure?',
                        text: "You won't be able to revert this!",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, delete it!',
                      }).then((result) => {
                        if (result.isConfirmed) {
                          const itemRef = ref(database, `${_table}/${row.original.id}`)
                          remove(itemRef)
                          Swal.fire('Deleted!', 'Data has been deleted.', 'success')
                        }
                      })
                    }}
                    sx={{ m: 0 }}
                  >
                    <ListItemIcon>
                      <DeleteOutline />
                    </ListItemIcon>
                    Delete
                  </MenuItem>,
                ]}
              />
            </>
          </CCardBody>
        </CCard>
      </CCol>

      <CModal
        alignment="center"
        visible={visible}
        onClose={() => setVisible(false)}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>{editMode ? 'Edit Data' : 'Add New Data'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-small-emphasis">
            Note:{' '}
            <strong>
              <span className="text-danger">*</span> is required
            </strong>
          </p>
          <CForm
            className="row g-3 needs-validation"
            noValidate
            validated={validated}
            onSubmit={handleSubmit}
          >
            <CCol md={6}>
              <CFormInput
                type="date"
                feedbackInvalid="Date of Vaccination is required"
                id="owner-number"
                label={
                  <>
                    Date of Vaccination
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="date_vaccinated"
                value={formData.date_vaccinated}
                onChange={handleChange}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                type="text"
                feedbackInvalid="Vaccine Type is required"
                id="pet-name"
                label={
                  <>
                    Vaccine Type
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="vaccine_type"
                value={formData.vaccine_type}
                onChange={handleChange}
                required
              />
            </CCol>

            <CCol md={12}>
              <CFormSelect
                feedbackInvalid="Address is required"
                id="address"
                label={
                  <>
                    Address
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              >
                <option value="">Choose...</option>
                {barangayOptions.map((barangay) => (
                  <option key={barangay.barangay} value={barangay.barangay}>
                    {barangay.barangay}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormInput
                type="text"
                feedbackInvalid="Name of the Owner is required"
                id="owner-name"
                label={
                  <>
                    Name of the Owner
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormInput
                type="text"
                feedbackInvalid="Pet's Name is required"
                id="pet-name"
                label={
                  <>
                    Pet&apos;s Name
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="pet_name"
                value={formData.pet_name}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                type="date"
                feedbackInvalid="Pet's Birthdate is required"
                id="pet-birthdate"
                label={
                  <>
                    Pet&apos;s Birthdate
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="pet_birthdate"
                value={formData.pet_birthdate}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={4}>
              <CFormSelect
                feedbackInvalid="Sex is required"
                id="sex"
                label={
                  <>
                    Sex
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                required
              >
                <option value="">Choose...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </CFormSelect>
            </CCol>
            <CCol md={4}>
              <CFormInput
                type="text"
                feedbackInvalid="Color is required"
                id="color"
                label={
                  <>
                    Color
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormSelect
                feedbackInvalid="Species is required"
                id="species"
                label={
                  <>
                    Species
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="species"
                value={formData.species}
                onChange={handleChange}
                required
              >
                <option value="">Choose...</option>
                <option value="C">C - Iro</option>
                <option value="F">F -iring</option>
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormSelect
                feedbackInvalid="Neutered is required"
                id="neutered"
                label={
                  <>
                    Neutered
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="neutered"
                value={formData.neutered}
                onChange={handleChange}
                required
              >
                <option value="">Choose...</option>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </CFormSelect>
            </CCol>
            <hr />
            <CCol xs={12}>
              <CButton color="primary" type="submit" className="float-end">
                {editMode ? 'Update' : 'Submit form'}
              </CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>
    </CRow>
  )
}

export default Anti_rabies_vaccination

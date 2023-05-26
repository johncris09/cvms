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

const Deworming = () => {
  const _table = 'deworming'
  const timestamp = serverTimestamp()
  const [data, setData] = useState([])
  const [visible, setVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [barangayOptions, setBarangayOptions] = useState([])
  const [currentYear, setCurrentYear] = useState()
  const [formData, setFormData] = useState({
    date_deworming: '',
    address: '',
    farmer_name: '',
    species: '',
    head_number: '9',
    treatment_and_amount: '',
    female: '',
    male: '',
  })
  const [selectedItemId, setSelectedItemId] = useState(null)
  useEffect(() => {
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
          filteredData.sort((a, b) => new Date(b.date_deworming) - new Date(a.date_deworming))

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

            let sexText =
              (item.female != 0 ? item.female + ' F' : '') +
              (item.female > 0 && item.male > 0 ? ' and ' : '') +
              (item.male != 0 ? item.male + ' M' : '')

            return {
              id: item.id,
              address: item.address,
              date_deworming: item.date_deworming,
              farmer_name: item.farmer_name,
              created_at: _date + ' ' + _time,
              species: item.species,
              head_number: item.head_number,
              sex: sexText,
              treatment_and_amount: item.treatment_and_amount,
            }
          })
          console.info(processedData)

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
      date_deworming: '',
      address: '',
      farmer_name: '',
      species: '',
      head_number: '',
      treatment_and_amount: '',
      female: '',
      male: '',
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
      const date_deworming = formData.get('date_deworming')
      const address = formData.get('address')
      const farmer_name = formData.get('farmer_name')
      const species = formData.get('species')
      const head_number = formData.get('head_number')
      const treatment_and_amount = formData.get('treatment_and_amount')
      const female = formData.get('female')
      const male = formData.get('male')

      if (selectedItemId) {
        // Update operation
        const itemRef = ref(database, `${_table}/${selectedItemId}`)
        update(itemRef, {
          date_deworming,
          address,
          farmer_name,
          species,
          head_number,
          treatment_and_amount,
          female,
          male,
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
          date_deworming,
          address,
          farmer_name,
          species,
          head_number,
          treatment_and_amount,
          female,
          male,
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
        id: 'deworming',
        columns: [
          // sex: item.female,
          {
            accessorKey: 'date_deworming',
            header: 'Date of Deworming',
          },
          {
            accessorKey: 'address',
            header: 'Address',
          },
          {
            accessorKey: 'farmer_name',
            header: 'Name of Farmer',
          },
          {
            accessorKey: 'species',
            header: 'Species',
          },
          {
            accessorKey: 'head_number',
            header: 'Head(s)',
          },
          {
            accessorKey: 'treatment_and_amount',
            header: 'Treament and Amount',
          },
          {
            accessorKey: 'sex',
            header: 'Sex',
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

                      const dewormingRef = ref(database, _table)
                      const dewormingSnapshot = await get(child(dewormingRef, row.original.id))
                      if (dewormingSnapshot.exists()) {
                        // Deworming data found
                        const dewormingData = dewormingSnapshot.val()
                        console.info(dewormingData)

                        setFormData({
                          date_deworming: dewormingData.date_deworming,
                          address: dewormingData.address,
                          farmer_name: dewormingData.farmer_name,
                          species: dewormingData.species,
                          female: dewormingData.female,
                          male: dewormingData.male,
                          head_number: dewormingData.head_number,
                          treatment_and_amount: dewormingData.treatment_and_amount,
                        })

                        setSelectedItemId(row.original.id) // Set the selected item ID
                        setVisible(true)
                        setEditMode(true)
                      } else {
                        // Deworming data not found
                        console.log('Deworming not found')
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
            <CCol md={7}>
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
            <CCol md={5}>
              <CFormInput
                type="date"
                feedbackInvalid="Date of Deworming is required"
                id="date-deworming"
                label={
                  <>
                    Date of Deworming
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="date_deworming"
                value={formData.date_deworming}
                onChange={handleChange}
                required
              />
            </CCol>

            <CCol md={12}>
              <CFormInput
                type="text"
                feedbackInvalid="Name of Farmer is required"
                id="farmer-name"
                label={
                  <>
                    Name of Farmer
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="farmer_name"
                value={formData.farmer_name}
                onChange={handleChange}
                required
              />
            </CCol>

            <CCol md={7}>
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
                <option value="Carabao">Carabao</option>
                <option value="Chicken">Chicken</option>
                <option value="Cow">Cow</option>
              </CFormSelect>
            </CCol>
            <CCol md={5}>
              <CFormInput
                type="number"
                feedbackInvalid="Number of Heads is required"
                id="head-number"
                label={
                  <>
                    Number of Heads
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="head_number"
                value={formData.head_number}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={12}>
              <CFormInput
                type="text"
                feedbackInvalid="Treatment and Amount is required"
                id="treatment-amount"
                label={
                  <>
                    Treatment and Amount
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="treatment_and_amount"
                value={formData.treatment_and_amount}
                onChange={handleChange}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                type="number"
                min="1"
                feedbackInvalid="Number of Female is required"
                id="female-number"
                label="Number of Female"
                name="female"
                value={formData.female}
                onChange={handleChange}
              />
            </CCol>
            <CCol md={6}>
              <CFormInput
                type="number"
                min="1"
                feedbackInvalid="Number of Male is required"
                id="male-number"
                label="Number of Male"
                name="male"
                value={formData.male}
                onChange={handleChange}
              />
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

export default Deworming

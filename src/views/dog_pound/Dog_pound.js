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
import ConvertToTitleCase from '../../helper/ConvertToTitleCase'
import Table from 'src/constant/Table'
const MySwal = withReactContent(Swal)

const Pet_owner = () => {
  const _table = 'pet_owner'

  const timestamp = serverTimestamp()
  const [data, setData] = useState([])
  const [visible, setVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [barangayOptions, setBarangayOptions] = useState([])
  const [currentYear, setCurrentYear] = useState()
  const [controlNumber, setControlNumber] = useState()
  const [controlNumberDisplay, setControlNumberDisplay] = useState()
  const [formData, setFormData] = useState({
    control_number: '',
    or_number: '',
    date: '',
    owner_name: '',
    pet_name: '',
    color: '',
    sex: '',
    size: '',
    address: '',
  })
  const [selectedItemId, setSelectedItemId] = useState(null)
  useEffect(() => {
    fetchBarangay()
    fetchControlNumber(_table)

    const currentYear = new Date().getFullYear() // Get the current year
    setCurrentYear(currentYear)

    setFormData((prevFormData) => ({
      ...prevFormData,
      control_number: controlNumber,
    }))

    fetchData(_table, currentYear)
  }, [controlNumber])

  const fetchControlNumber = async (_table) => {
    try {
      const dataRef = query(ref(database, _table), orderByChild('control_number'))

      onValue(dataRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = []
          snapshot.forEach((childSnapshot) => {
            const childData = childSnapshot.val()
            data.push(childData)
          })

          // Filter the data based on the desired year
          const filteredData = data.filter((item) => {
            const date = new Date(item.timestamp)
            const year = date.getFullYear()
            return year === currentYear
          })

          const maxControlNumber = filteredData.reduce((max, item) => {
            return item.control_number > max ? item.control_number : max
          }, 0)

          const parsedMaxControlNumhber = parseInt(maxControlNumber, 10)
          const nextControlNumhber = isNaN(parsedMaxControlNumhber)
            ? 1
            : parsedMaxControlNumhber + 1
          setControlNumber(nextControlNumhber)
        } else {
          setControlNumber(1)
        }
      })

      // Fetch the initial data
      const snapshot = await get(dataRef)
      if (snapshot.exists()) {
        const data = []
        snapshot.forEach((childSnapshot) => {
          const childData = childSnapshot.val()
          data.push(childData)
        })

        // Filter the data based on the desired year
        const filteredData = data.filter((item) => {
          const date = new Date(item.timestamp)
          const year = date.getFullYear()
          return year === currentYear
        })

        const maxControlNumber = filteredData.reduce((max, item) => {
          return item.control_number > max ? item.control_number : max
        }, 0)

        const parsedMaxControlNumhber = parseInt(maxControlNumber, 10)
        const nextControlNumhber = isNaN(parsedMaxControlNumhber) ? 1 : parsedMaxControlNumhber + 1
        setControlNumber(nextControlNumhber)
      } else {
        setControlNumber(1)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchData = async (table, currentYear) => {
    try {
      const seniorHighRef = ref(database, table)
      const seniorHighQuery = query(seniorHighRef, orderByChild('control_number'))

      onValue(seniorHighQuery, (snapshot) => {
        if (snapshot.exists()) {
          const seniorHighData = snapshot.val()
          const seniorHighArray = Object.values(seniorHighData)
          // Filter the data based on the desired year and semester
          const filteredData = seniorHighArray.filter((item) => {
            const date = new Date(item.timestamp)
            const year = date.getFullYear()
            return year === currentYear
          })
          // // Sort the filtered data by spNo
          filteredData.sort((a, b) => b.control_number - a.control_number)
          // // Process the relationships with other tables (course, address, school)
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
            const _date = formattedDate == 'Invalid Date' ? '' : formattedDate
            const _time = formattedTime == 'Invalid Date' ? '' : formattedTime
            let _controlNumber =
              new Date(item.timestamp).getFullYear() +
              '-' +
              item.control_number.toString().padStart(5, '0')
            return {
              id: item.id,
              date: item.date,
              control_number: _controlNumber,
              or_number: item.or_number,
              owner_name: item.owner_name,
              pet_name: item.pet_name,
              color: item.color,
              sex: item.sex,
              size: item.size,
              address: item.address,
              created_at: _date + ' ' + _time,
            }
          })

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
      control_number: controlNumber,
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
      const control_number = formData.get('control_number')
      const date = formData.get('date')
      const or_number = formData.get('or_number')
      const owner_name = formData.get('owner_name')
      const pet_name = formData.get('pet_name')
      const color = formData.get('color')
      const sex = formData.get('sex')
      const size = formData.get('size')
      const address = formData.get('address')
      const timestamp = serverTimestamp()
      if (selectedItemId) {
        // Update operation
        const itemRef = ref(database, `${_table}/${selectedItemId}`)
        update(itemRef, {
          control_number,
          date,
          or_number,
          owner_name,
          pet_name,
          color,
          sex,
          size,
          address,
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
          control_number,
          date,
          or_number,
          owner_name,
          pet_name,
          color,
          sex,
          size,
          address,
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
      setVisible(false)
    }
    // form.reset()
    setValidated(true)
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    let updatedValue = value

    // Convert text inputs to title case
    if (type === 'text') {
      updatedValue = ConvertToTitleCase(value)
    }
    setFormData({ ...formData, [name]: updatedValue })
  }

  const columns = useMemo(
    () => [
      {
        id: 'pet_owner',
        columns: [
          {
            accessorKey: 'control_number',
            header: 'Control #',
          },
          {
            accessorKey: 'or_number',
            header: 'Or #',
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
            accessorKey: 'color',
            header: 'Color',
          },
          {
            accessorKey: 'sex',
            header: 'Sex',
          },
          {
            accessorKey: 'size',
            header: 'Size',
          },
          {
            accessorKey: 'address',
            header: 'Address',
          },
          {
            accessorKey: 'date',
            header: 'Date',
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
            <strong>Dog Pound</strong>
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

                      const dogPoundsRef = ref(database, _table)
                      const dogPoundSnapshot = await get(child(dogPoundsRef, row.original.id))

                      if (dogPoundSnapshot.exists()) {
                        // Dog Pound data found
                        const dogPoundData = dogPoundSnapshot.val()
                        setFormData({
                          control_number: dogPoundData.control_number,
                          or_number: dogPoundData.or_number,
                          owner_name: dogPoundData.owner_name,
                          pet_name: dogPoundData.pet_name,
                          color: dogPoundData.color,
                          sex: dogPoundData.sex,
                          size: dogPoundData.size,
                          address: dogPoundData.address,
                        })

                        let _controlNumber =
                          new Date(dogPoundData.timestamp).getFullYear() +
                          '-' +
                          dogPoundData.control_number.toString().padStart(5, '0')
                        setControlNumberDisplay(_controlNumber)

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
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <h3 className="text-danger text-right">
                <u>
                  {editMode
                    ? controlNumberDisplay
                    : currentYear && controlNumber
                    ? currentYear.toString() + '-' + controlNumber.toString().padStart(5, '0')
                    : ''}
                </u>
              </h3>
            </div>
            <CCol md={12}>
              <CFormInput
                type="hidden"
                feedbackInvalid="Control # is required"
                id="owner-number"
                name="control_number"
                value={formData.control_number}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormInput
                type="text"
                feedbackInvalid="OR # is required"
                id="or-number"
                label={
                  <>
                    OR #
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="or_number"
                value={formData.or_number}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormInput
                type="date"
                feedbackInvalid="OR # is required"
                id="date"
                label={
                  <>
                    Date
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={12}>
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
            <CCol md={12}>
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
              <CFormSelect
                feedbackInvalid="Size is required"
                id="size"
                label={
                  <>
                    Size
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="size"
                value={formData.size}
                onChange={handleChange}
                required
              >
                <option value="">Choose...</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
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

export default Pet_owner

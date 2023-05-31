import React, { useEffect, useState, useMemo } from 'react'
import MaterialReactTable from 'material-react-table'
import { ExportToCsv } from 'export-to-csv'
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
import { MenuItem, ListItemIcon, Box } from '@mui/material'
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
import { OroquietaCityLogo, cityVetLogo } from 'src/helper/LogoReport'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExcel, faFilePdf, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import ConvertToTitleCase from '../../helper/ConvertToTitleCase'

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

import Table from 'src/constant/Table'
const MySwal = withReactContent(Swal)

pdfMake.vfs = pdfFonts.pdfMake.vfs
const DewormSpecies = () => {
  const _table = 'deworm_species'
  const [data, setData] = useState([])
  const [newDadtaFormModalVisible, setNewDataFormModalVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentYear, setCurrentYear] = useState()
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
  })

  useEffect(() => {
    const currentYear = new Date().getFullYear() // Get the current year
    setCurrentYear(currentYear)

    fetchData(_table, currentYear)
  }, [])

  const fetchData = async (table, currentYear) => {
    try {
      const speciesRef = ref(database, table)
      const speciesQuery = query(speciesRef, orderByChild('name'))

      onValue(speciesQuery, (snapshot) => {
        if (snapshot.exists()) {
          const speciesData = snapshot.val()
          const speciesArray = Object.values(speciesData)

          const filteredData = speciesArray.filter((item) => {
            const date = new Date(item.timestamp)
            const year = date.getFullYear()
            return year === currentYear
          })
          // Sort the filtered data by name
          filteredData.sort((a, b) => a.name.localeCompare(b.name))
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
            const _date = formattedDate == '' ? '' : formattedDate
            const _time = formattedTime == '' ? '' : formattedTime
            return {
              id: item.id,
              name: item.name,
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

  const handleAdd = () => {
    setEditMode(false)
    setNewDataFormModalVisible(true)
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
      const name = formData.get('name')
      const timestamp = serverTimestamp()
      if (selectedItemId) {
        // Update operation
        const itemRef = ref(database, `${_table}/${selectedItemId}`)
        update(itemRef, {
          name,
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
          name,
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
      setNewDataFormModalVisible(false)
    }
    form.reset()
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
        accessorKey: 'name',
        header: 'Species',
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
      },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Anti Rabies Species</strong>
            <CButton
              color="primary"
              variant="outline"
              className="float-end mx-1"
              onClick={handleAdd}
            >
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

                      const speciesRef = ref(database, _table)
                      const speciesSnapshot = await get(child(speciesRef, row.original.id))

                      if (speciesSnapshot.exists()) {
                        // Species data found
                        const speciesData = speciesSnapshot.val()
                        setFormData({
                          name: speciesData.name,
                        })

                        setSelectedItemId(row.original.id) // Set the selected item ID
                        setNewDataFormModalVisible(true)
                        setEditMode(true)
                      } else {
                        // Species data not found
                        console.log('Species not found')
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

      {/* Add New Data */}
      <CModal
        alignment="center"
        visible={newDadtaFormModalVisible}
        onClose={() => setNewDataFormModalVisible(false)}
        backdrop="static"
        keyboard={false}
        size="md"
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
            <CCol md={12}>
              <CFormInput
                type="text"
                feedbackInvalid="Date is required"
                id="date"
                label={
                  <>
                    Name of Species
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
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

export default DewormSpecies

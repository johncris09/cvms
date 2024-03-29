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
import TrackUserActivity from 'src/helper/TrackUserActivity'
import Draggable from 'react-draggable'
import FormatDateTime from 'src/helper/FormatDateTime'
import RequiredNote from 'src/helper/RequiredNote'
const MySwal = withReactContent(Swal)

pdfMake.vfs = pdfFonts.pdfMake.vfs
const DewormSpecies = ({ userId }) => {
  const _table = 'deworm_species'
  const [data, setData] = useState([])
  const [newDadtaFormModalVisible, setNewDataFormModalVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentYear, setCurrentYear] = useState()
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
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
            return {
              id: item.id,
              name: item.name,
              created_at: FormatDateTime(item.timestamp),
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
      const _formData = new FormData(form)
      const name = _formData.get('name')
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

        TrackUserActivity({
          userId: userId,
          reference: 'Deworming Species',
          referenceTable: _table,
          activity: 'Updated a record',
          value: { id: selectedItemId, species: name },
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
            setFormData({ ...formData, name: '' })
            setValidated(false)

            MySwal.fire({
              title: <strong>Success!</strong>,
              html: <i>New Record Successfully Added!</i>,
              icon: 'success',
            })
          })
          .catch((error) => {
            console.error('Error adding data:', error)
          })

        TrackUserActivity({
          userId: userId,
          reference: 'Deworming Species',
          referenceTable: _table,
          activity: 'Created a new record',
          value: { id, species: name },
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
            <strong>Deworm Species</strong>
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
                          let itemId = row.original.id
                          let name = row.original.name
                          TrackUserActivity({
                            userId: userId,
                            reference: 'Deworming Species',
                            referenceTable: _table,
                            activity: 'Deleted a record',
                            value: { id: itemId, species: name },
                          })

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

      <Draggable
        handle=".modal-header"
        position={modalPosition}
        onStop={(e, data) => {
          setModalPosition({ x: data.x, y: data.y })
        }}
      >
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
            <RequiredNote />
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
      </Draggable>
    </CRow>
  )
}

export default DewormSpecies

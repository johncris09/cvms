import React, { useEffect, useState, useMemo } from 'react'
import {
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
import { Box, ListItemIcon, MenuItem } from '@mui/material'
import MaterialReactTable from 'material-react-table'
import { faUserCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Check, CheckBox, Close, PendingActions } from '@mui/icons-material'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { child, database, get, onValue, ref, update } from '../../firebaseConfig'
import RequiredNote from 'src/helper/RequiredNote'
const MySwal = withReactContent(Swal)

const User = () => {
  const _table = 'users'
  const [data, setData] = useState([])
  const [newDataFormModalVisible, setNewDataFormModalVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [validated, setValidated] = useState(false)
  const [formData, setFormData] = useState({
    role_type: '',
  })
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    const databaseRef = ref(database, _table)

    onValue(databaseRef, (snapshot) => {
      const firebaseData = snapshot.val()
      const transformedData = Object.entries(firebaseData || {}).map(([key, item]) => ({
        id: key,
        ...item,
      }))

      setData(transformedData)
    })
  }

  const columns = useMemo(
    () => [
      {
        id: 'user',
        columns: [
          {
            accessorFn: (row) => `${row.displayName}`,
            id: 'name',
            header: 'Name',
            size: 250,
            Cell: ({ renderedCellValue, row }) => (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <img
                    alt="avatar"
                    height={30}
                    src={row.original.photoURL}
                    loading="lazy"
                    style={{ borderRadius: '50%' }}
                  />
                  {/* using renderedCellValue instead of cell.getValue() preserves filter match highlighting */}
                  <span>{renderedCellValue}</span>
                </Box>
              </>
            ),
          },
          {
            accessorKey: 'email',
            enableClickToCopy: true,
            header: 'Email',
            size: 300,
          },
          {
            accessorKey: 'status',
            header: 'Status',
            size: 200,
            //custom conditional format and styling
            Cell: ({ cell }) => (
              <>
                <Box
                  component="span"
                  sx={(theme) => ({
                    backgroundColor:
                      cell.getValue() === 'Pending'
                        ? theme.palette.warning.dark
                        : cell.getValue() === 'Disapproved'
                        ? theme.palette.error.dark
                        : theme.palette.primary.dark,
                    borderRadius: '0.25rem',
                    color: '#fff',
                    maxWidth: '9ch',
                    p: '0.25rem',
                  })}
                >
                  {cell.getValue() === 'Pending' && <PendingActions />}
                  {cell.getValue() === 'Approved' && <Check />}
                  {cell.getValue() === 'Disapproved' && <Close />}
                  {cell.getValue()}
                </Box>
              </>
            ),
          },
          {
            accessorKey: 'roleType',
            enableClickToCopy: true,
            header: 'Role Type',
          },
          {
            accessorKey: 'timestamp',
            header: 'Created At',
            size: 200,
            Cell: ({ cell }) => {
              // console.info(cell.getValue())
              const date = new Date(cell.getValue())
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

              return <>{_date + ' ' + _time}</>
            },
          },
        ],
      },
    ],
    [],
  )
  const handleSetUserType = (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      event.preventDefault()
      const formData = new FormData(form)
      const role_type = formData.get('role_type')
      if (selectedItemId) {
        // Update operation
        const itemRef = ref(database, `${_table}/${selectedItemId}`)
        update(itemRef, {
          roleType: role_type,
        })
          .then(() => {
            MySwal.fire({
              title: <strong>Success!</strong>,
              html: <i>Role Type Successfully Updated!</i>,
              icon: 'success',
            })
          })
          .catch((error) => {
            console.error('Error updating data:', error)
          })
      }
      setValidated(false)
      setNewDataFormModalVisible(false)
    }
    // form.reset()
    setValidated(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    console.info({ name, value })

    setFormData({ ...formData, [name]: value })
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>User</strong>
            {/* <CButton color="primary" className="float-end" onClick={handleAdd}>
              <FontAwesomeIcon icon={faPlusCircle} /> Add New User
            </CButton> */}
          </CCardHeader>
          <CCardBody>
            <MaterialReactTable
              columns={columns}
              data={data}
              enableColumnFilterModes
              enableColumnOrdering
              enableGrouping
              enablePinning
              enableRowActions
              initialState={{ density: 'compact' }}
              positionToolbarAlertBanner="bottom"
              renderRowActionMenuItems={({ row, closeMenu }) => [
                row.original.roleType === 'SuperAdmin' ? null : row.original.status ===
                  'Pending' ? (
                  <MenuItem
                    key={0}
                    onClick={() => {
                      console.info(row.original)
                      closeMenu()
                      MySwal.fire({
                        title: 'Confirm Approval',
                        text: 'Are you sure you want to approve the user?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, approved it!',
                      }).then((result) => {
                        if (result.isConfirmed) {
                          // Update operation
                          const itemRef = ref(database, `${_table}/${row.original.id}`)
                          update(itemRef, {
                            status: 'Approved',
                          })
                            .then(() => {
                              MySwal.fire(
                                'User Approved!',
                                'The user has been successfully approved.',
                                'success',
                              )
                            })
                            .catch((error) => {
                              MySwal.fire('User Approved!', 'Error updating user status.', 'error')
                            })
                          fetchData()
                        }
                      })
                    }}
                    sx={{ m: 0 }}
                  >
                    <ListItemIcon>
                      <CheckBox />
                    </ListItemIcon>
                    Approved
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem
                      key={0}
                      onClick={() => {
                        closeMenu()
                        MySwal.fire({
                          title: 'Confirm Disapproval',
                          text: 'Are you sure you want to disapprove the user?',
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#3085d6',
                          cancelButtonColor: '#d33',
                          confirmButtonText: 'Yes, disapproved it!',
                        }).then((result) => {
                          if (result.isConfirmed) {
                            // Update operation
                            const itemRef = ref(database, `${_table}/${row.original.id}`)
                            update(itemRef, {
                              status: 'Disapproved',
                            })
                              .then(() => {
                                MySwal.fire(
                                  'User Dispproved!',
                                  'The user has been successfully disapproved.',
                                  'success',
                                )
                              })
                              .catch((error) => {
                                MySwal.fire(
                                  'User Disapproved!',
                                  'Error updating user status.',
                                  'error',
                                )
                              })
                            fetchData()
                          }
                        })
                      }}
                      sx={{ m: 0 }}
                    >
                      <ListItemIcon>
                        <Close />
                      </ListItemIcon>
                      Disapproved
                    </MenuItem>
                    <MenuItem
                      key={0}
                      onClick={async () => {
                        closeMenu()

                        const userRef = ref(database, 'users')
                        const usernapshot = await get(child(userRef, row.original.id))

                        if (usernapshot.exists()) {
                          // Pet owner data found
                          const userData = usernapshot.val()

                          setFormData({
                            role_type: userData.roleType,
                          })

                          setSelectedItemId(row.original.id) // Set the selected item ID
                          setNewDataFormModalVisible(true)
                          setEditMode(true)
                        } else {
                          // Pet owner data not found
                          console.log('Pet owner not found')
                        }
                      }}
                      sx={{ m: 0 }}
                    >
                      <ListItemIcon>
                        <FontAwesomeIcon icon={faUserCheck} />
                      </ListItemIcon>
                      Set User Type
                    </MenuItem>
                  </>
                ),
              ]}
            />
          </CCardBody>
        </CCard>
      </CCol>

      {/* Add new Data */}
      <CModal
        alignment="center"
        visible={newDataFormModalVisible}
        onClose={() => setNewDataFormModalVisible(false)}
        backdrop="static"
        keyboard={false}
        size="md"
      >
        <CModalHeader>
          <CModalTitle>Set User Role Type</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <RequiredNote />
          <CForm
            className="row g-3 needs-validation"
            noValidate
            validated={validated}
            onSubmit={handleSetUserType}
          >
            <CCol md={12}>
              <CFormSelect
                feedbackInvalid="User's Role Type is required"
                id="role-type"
                label={
                  <>
                    User&apos;s Role Type
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="role_type"
                value={formData.role_type}
                onChange={handleChange}
                required
              >
                <option value="">Choose...</option>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">Super Admin</option>
              </CFormSelect>
            </CCol>
            <hr />
            <CCol xs={12}>
              <CButton color="primary" type="submit" className="float-end">
                Submit
              </CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>
    </CRow>
  )
}
export default User

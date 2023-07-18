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
import { MenuItem, ListItemIcon, Box, darken } from '@mui/material'
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
} from '../../../firebaseConfig'
import {
  DeleteOutline,
  EditSharp,
  Handshake,
  HandshakeOutlined,
  HandshakeRounded,
  HandshakeSharp,
  MedicationLiquid,
  TimerSharp,
} from '@mui/icons-material'
import { OroquietaCityLogo, cityVetLogo } from 'src/helper/LogoReport'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExcel, faFilePdf, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import ConvertToTitleCase from '../../../helper/ConvertToTitleCase'

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import TrackUserActivity from 'src/helper/TrackUserActivity'
import CurrentYear from 'src/helper/CurrentYear'
import FormatDate from 'src/helper/FormatDate'
import FormatDateTime from 'src/helper/FormatDateTime'
import Draggable from 'react-draggable'
import RequiredNote from 'src/helper/RequiredNote'
const MySwal = withReactContent(Swal)

pdfMake.vfs = pdfFonts.pdfMake.vfs
const Pet_owner = ({ roleType, userId }) => {
  const _table = 'dog_pound'
  const [data, setData] = useState([])
  const [newDataFormModalVisible, setNewDataFormModalVisible] = useState(false)
  const [reportFormModalVisible, setReportFormModalVisible] = useState(false)
  const [adoptFormModalVisible, setAdoptFormModalVisible] = useState(false)
  const [disposedFormModalVisible, setDisposedFormModalVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [barangayOptions, setBarangayOptions] = useState([])
  const [currentYear, setCurrentYear] = useState()
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [selectedYear, setSelectedYear] = useState(null)
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
  const [formReportData, setFormReportData] = useState({
    start_date: '',
    end_date: '',
    address: '',
  })
  const [formAdoptData, setFormAdoptData] = useState({
    dogPoundId: '',
    date: '',
    owner_name: '',
    address: '',
    status: '',
  })
  const [formDisposedData, setFormDisposedData] = useState({
    dogPoundId: '',
    date: '',
    medicine: '',
  })
  useEffect(() => {
    fetchBarangay()
    setCurrentYear(CurrentYear)
    fetchData(_table)
    fetchSelectedYear()
  }, [selectedYear])

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

  const fetchData = async (table) => {
    try {
      const dogPoundRef = ref(database, table)
      const dogPoundQuery = query(dogPoundRef, orderByChild('date'))

      onValue(dogPoundQuery, (snapshot) => {
        if (snapshot.exists()) {
          const dogPoundData = snapshot.val()
          const dogPoundArray = Object.values(dogPoundData)

          const filteredData = dogPoundArray.filter((item) => {
            const date = new Date(item.date)
            const year = date.getFullYear()
            return year == selectedYear
          })
          // Sort the filtered data by date
          filteredData.sort((a, b) => new Date(b.date) - new Date(a.date))
          const processedData = filteredData.map((item) => {
            return {
              id: item.id,
              date: item.date,
              or_number: item.or_number,
              owner_name: item.owner_name,
              pet_name: item.pet_name,
              color: item.color,
              sex: item.sex,
              size: item.size,
              address: item.address,
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
    setEditMode(false)
    setNewDataFormModalVisible(true)
    setValidated(false)
    setSelectedItemId(null)
  }
  const handleReport = () => {
    setReportFormModalVisible(true)
  }

  const handleReportSubmit = (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      event.preventDefault()
      const formData = new FormData(form)
      const start_date = formData.get('start_date')
      const end_date = formData.get('end_date')
      const address = formData.get('address')
      generateReport(_table, 2023, start_date, end_date, address)
      setValidated(false)
    }
    setValidated(true)
  }

  const generateReport = async (table, currentYear, start_date, end_date, addressFilter) => {
    try {
      const petOwnerRef = ref(database, table)
      const petOwnerQuery = query(petOwnerRef, orderByChild('date'))

      onValue(petOwnerQuery, (snapshot) => {
        if (snapshot.exists()) {
          const petOwnerData = snapshot.val()
          const petOwnerArray = Object.values(petOwnerData)
          // Filter the data based on the desired year and semester
          const filteredData = petOwnerArray.filter((item) => {
            const date = new Date(item.date)
            const year = date.getFullYear()
            const startDate = new Date(start_date)
            const endDate = new Date(end_date)

            if (addressFilter === '') {
              return date >= startDate && date <= endDate && year === currentYear
            } else {
              return (
                date >= startDate &&
                date <= endDate &&
                year === currentYear &&
                addressFilter === item.address
              )
            }
          })
          // Sort the filtered data by date
          filteredData.sort((a, b) => new Date(b.date) - new Date(a.date))

          const processedData = filteredData.map((item) => {
            return {
              id: item.id,
              date: item.date,
              or_number: item.or_number,
              owner_name: item.owner_name,
              pet_name: item.pet_name,
              color: ConvertToTitleCase(item.color),
              sex: item.sex,
              size: item.size,
              address: item.address,
            }
          })

          if (processedData.length > 0) {
            const content = []
            // Add table header
            const tableHeader = [
              { text: 'Date', style: 'tableHeader', bold: true },
              { text: 'OR Number', style: 'tableHeader', bold: true },
              { text: 'Owner Name', style: 'tableHeader', bold: true },
              { text: 'Pet Name', style: 'tableHeader', bold: true },
              { text: 'Color', style: 'tableHeader', bold: true },
              { text: 'Sex', style: 'tableHeader', bold: true },
              { text: 'Size', style: 'tableHeader', bold: true },
              { text: 'Address', style: 'tableHeader', bold: true },
            ]
            content.push(tableHeader)
            // Add table rows
            for (const item of processedData) {
              const tableRow = [
                item.date,
                item.or_number,
                item.owner_name,
                item.pet_name,
                item.color,
                item.sex,
                item.size,
                item.address,
              ]
              content.push(tableRow)
            }
            const currentDateTime = new Date().toLocaleString('en-US')
            const documentDefinition = {
              background: [
                {
                  text: 'Sample Print',
                  color: 'gray',
                  opacity: 0.5,
                  fontSize: 60,
                  bold: true,
                  italics: true,
                  rotation: 135,
                  alignment: 'center',
                  margin: [0, 200],
                },
              ],
              footer: function (currentPage, pageCount) {
                return {
                  columns: [
                    {
                      text: `Date Printed: ${currentDateTime}`,
                      alignment: 'left',
                      fontSize: 8,
                      margin: [20, 0],
                    },
                    {
                      text: `Page ${currentPage} of ${pageCount}`,
                      alignment: 'right',
                      fontSize: 8,
                      margin: [0, 0, 20, 0],
                    },
                  ],
                  margin: [20, 10],
                }
              },
              content: [
                {
                  columns: [
                    {
                      width: 'auto',
                      image: cityVetLogo,
                      fit: [50, 50],
                    },
                    {
                      text: [
                        'Republic of the Philippines\n',
                        'OFFICE OF THE VETERINARIAN\n',
                        'Oroquieta City\n\n',
                        {
                          text: 'City of Good Life',
                          style: 'subheaderText',
                          alignment: 'center',
                          italics: true,
                          bold: true,
                        },
                      ],
                      style: 'headerText',
                      bold: false,
                      alignment: 'center',
                    },
                    {
                      width: 'auto',
                      image: OroquietaCityLogo,
                      fit: [50, 50],
                      alignment: 'right',
                    },
                  ],
                },
                {
                  text: '\n\n', // Add some spacing between the header and the table
                },
                {
                  columns: [
                    {
                      width: 'auto',
                      text:
                        'Barangay: ' + (formReportData.address ? formReportData.address : 'All'),
                      text: [
                        'Barangay: ',
                        {
                          text: formReportData.address ? formReportData.address : 'All',
                          bold: true,
                          decoration: 'underline',
                        },
                      ],
                      fit: [200, 200],
                    },
                    {
                      text: [' '],
                      style: 'headerText',
                      bold: false,
                      alignment: 'center',
                    },
                    {
                      text: [
                        'Date: ',
                        {
                          text:
                            FormatDate(formReportData.start_date) +
                            ' - ' +
                            FormatDate(formReportData.end_date),
                          bold: true,
                          decoration: 'underline',
                        },
                      ],
                      fit: [200, 200],
                      alignment: 'right',
                    },
                  ],
                },
                {
                  style: 'tableDesign',
                  table: {
                    body: content,
                  },
                  alignment: 'center',
                },
              ],
              styles: {
                tableDesign: {
                  margin: [0, 5, 0, 15],
                  fontSize: 10,
                },
                footer: {
                  fontSize: 8,
                },
              },
            }
            const pdfDoc = pdfMake.createPdf(documentDefinition)
            pdfDoc.open()

            TrackUserActivity({
              userId: userId,
              reference: 'Dog Pound',
              referenceTable: _table,
              activity: 'Generated Automated Report',
              value: {
                address: addressFilter,
                start_date: start_date,
                end_date: end_date,
              },
            })
          } else {
            MySwal.fire({
              title: <strong>No record found</strong>,
              html: <i>There are no records matching your search criteria.</i>,
              icon: 'info',
            })
          }
        } else {
          setData({})
        }
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      event.preventDefault()
      const _formData = new FormData(form)
      const control_number = _formData.get('control_number')
      const date = _formData.get('date')
      const or_number = _formData.get('or_number')
      const owner_name = _formData.get('owner_name')
      const pet_name = _formData.get('pet_name')
      const color = _formData.get('color')
      const sex = _formData.get('sex')
      const size = _formData.get('size')
      const address = _formData.get('address')
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
        TrackUserActivity({
          userId: userId,
          reference: 'Dog Pound',
          referenceTable: _table,
          activity: 'Updated a record',
          value: {
            id: selectedItemId,
            owner: owner_name,
            or_number: or_number,
            address: address,
            pet_name: pet_name,
          },
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
            setFormData({
              ...formData,
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
          reference: 'Dog Pound',
          referenceTable: _table,
          activity: 'Created a new record',
          value: {
            id: id,
            owner: owner_name,
            or_number: or_number,
            address: address,
            pet_name: pet_name,
          },
        })
      }
      setValidated(false)
      setNewDataFormModalVisible(false)
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

  const handleReportChange = (e) => {
    const { name, value } = e.target
    setFormReportData({ ...formReportData, [name]: value })
  }

  const handleAdoptClaimSubmit = async (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      event.preventDefault()
      const _formData = new FormData(form)
      const timestamp = serverTimestamp()

      try {
        let dogId = formAdoptData.dogPoundId
        console.info(dogId)
        const dogSnapshot = await get(ref(database, `dog_pound/${dogId}`))
        if (dogSnapshot.exists()) {
          const dogData = dogSnapshot.val()

          const adoptData = {
            ...dogData,
            adopt_date: _formData.get('date'),
            adopt_owner_name: _formData.get('owner_name'),
            adopt_address: _formData.get('address'),
            status: _formData.get('status'),
            timestamp,
          }
          // console.info(adoptData)

          await set(ref(database, `adopt/${dogId}`), adoptData)
          await remove(ref(database, `dog_pound/${dogId}`))

          setFormAdoptData({
            ...formAdoptData,
            date: '',
            owner_name: '',
            address: '',
            status: '',
          })
          setValidated(false)

          MySwal.fire({
            title: <strong>Success!</strong>,
            html: <i>New Record Successfully Added!</i>,
            icon: 'success',
          })

          setAdoptFormModalVisible(false)
        } else {
          console.log('Dog data not found')
        }
      } catch (error) {
        console.error('Error moving data:', error)
      }
    }
    setValidated(true)
  }

  const handleDisposedSubmit = async (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      event.preventDefault()
      const _formData = new FormData(form)
      const timestamp = serverTimestamp()

      try {
        let dogId = formDisposedData.dogPoundId
        const dogSnapshot = await get(ref(database, `dog_pound/${dogId}`))
        if (dogSnapshot.exists()) {
          const dogData = dogSnapshot.val()

          const disposedDogData = {
            ...dogData,
            disposed_date: _formData.get('date'),
            medicine: _formData.get('medicine'),
            timestamp,
          }

          await set(ref(database, `disposed_dog/${dogId}`), disposedDogData)
          await remove(ref(database, `dog_pound/${dogId}`))

          setFormDisposedData({
            ...formDisposedData,
            date: '',
            medicine: '',
          })
          setValidated(false)

          MySwal.fire({
            title: <strong>Success!</strong>,
            html: <i>New Record Successfully Added!</i>,
            icon: 'success',
          })

          setDisposedFormModalVisible(false)
        } else {
          console.log('Dog data not found')
        }
      } catch (error) {
        console.error('Error moving data:', error)
      }
    }
    setValidated(true)
  }

  const handleAdoptChange = (e) => {
    const { name, value, type } = e.target
    let updatedValue = value

    // Convert text inputs to title case
    if (type === 'text') {
      updatedValue = ConvertToTitleCase(value)
    }
    setFormAdoptData({ ...formAdoptData, [name]: updatedValue })
  }

  const handleDisposedChange = (e) => {
    const { name, value, type } = e.target
    let updatedValue = value

    // Convert text inputs to title case
    if (type === 'text') {
      updatedValue = ConvertToTitleCase(value)
    }
    setFormDisposedData({ ...formDisposedData, [name]: updatedValue })
  }

  const columns = [
    {
      accessorKey: 'date',
      header: 'Date',
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
      accessorKey: 'created_at',
      header: 'Created At',
    },
  ]

  const csvOptions = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: false,
    headers: columns.map((c) => c.header),
  }

  const csvExporter = new ExportToCsv(csvOptions)

  const handleExportRows = (rows) => {
    TrackUserActivity({
      userId: userId,
      reference: 'Dog Pound',
      referenceTable: _table,
      activity: 'Exporting selected data to Excel',
      value: { description: 'Generating selected row to Excel file' },
    })
    const exportedData = rows
      .map((row) => row.original)
      .map((item) => {
        return {
          date: item.date,
          or_number: item.or_number,
          owner_name: item.owner_name,
          pet_name: item.pet_name,
          color: item.color,
          sex: item.sex,
          size: item.size,
          address: item.address,
          created_at: item.created_at,
        }
      })

    csvExporter.generateCsv(exportedData)
  }
  const handleExportData = () => {
    TrackUserActivity({
      userId: userId,
      reference: 'Dog Pound',
      referenceTable: _table,
      activity: 'Exporting data to Excel',
      value: { description: 'Generating Excel file' },
    })

    const exportedData = data.map((item) => {
      return {
        date: item.date,
        or_number: item.or_number,
        owner_name: item.owner_name,
        pet_name: item.pet_name,
        color: item.color,
        sex: item.sex,
        size: item.size,
        address: item.address,
        created_at: item.created_at,
      }
    })
    csvExporter.generateCsv(exportedData)
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Dog Pound</strong>
            {roleType !== 'User' && (
              <>
                <CButton
                  color="success"
                  variant="outline"
                  className="float-end"
                  onClick={handleReport}
                >
                  <FontAwesomeIcon icon={faFilePdf} /> Generate Report
                </CButton>
                <CButton
                  color="primary"
                  variant="outline"
                  className="float-end mx-1"
                  onClick={handleAdd}
                >
                  <FontAwesomeIcon icon={faPlusCircle} /> Add New Data
                </CButton>
              </>
            )}
          </CCardHeader>
          <CCardBody>
            <>
              {roleType !== 'User' && (
                <MaterialReactTable
                  columns={columns}
                  data={data}
                  muiTablePaperProps={{
                    elevation: 0,
                    sx: {
                      borderRadius: '0',
                      border: '1px dashed #e0e0e0',
                    },
                  }}
                  muiTableBodyProps={{
                    sx: (theme) => ({
                      '& tr:nth-of-type(odd)': {
                        backgroundColor: darken(theme.palette.background.default, 0.05),
                      },
                    }),
                  }}
                  enableColumnFilterModes
                  enableColumnOrdering
                  enableGrouping
                  enablePinning
                  enableRowActions
                  enableColumnResizing
                  initialState={{ density: 'compact' }}
                  positionToolbarAlertBanner="bottom"
                  enableRowSelection
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
                            or_number: dogPoundData.or_number,
                            date: dogPoundData.date,
                            owner_name: dogPoundData.owner_name,
                            pet_name: dogPoundData.pet_name,
                            color: dogPoundData.color,
                            sex: dogPoundData.sex,
                            size: dogPoundData.size,
                            address: dogPoundData.address,
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
                          let id = row.original.id
                          let owner_name = row.original.owner_name
                          let address = row.original.address
                          let or_number = row.original.or_number
                          let pet_name = row.original.pet_name

                          TrackUserActivity({
                            userId: userId,
                            reference: 'Dog Pound',
                            referenceTable: _table,
                            activity: 'Deleted a record',
                            value: {
                              id: selectedItemId,
                              owner: owner_name,
                              or_number: or_number,
                              address: address,
                              pet_name: pet_name,
                            },
                          })

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
                    <MenuItem
                      key={1}
                      onClick={async () => {
                        closeMenu()
                        let dogId = row.original.id
                        setFormAdoptData({
                          ...formAdoptData,
                          dogPoundId: dogId,
                          date: '',
                          owner_name: '',
                          address: '',
                          status: '',
                        })
                        setAdoptFormModalVisible(true)
                      }}
                      sx={{ m: 0 }}
                    >
                      <ListItemIcon>
                        <Handshake />
                      </ListItemIcon>
                      Adopt/Claim
                    </MenuItem>,
                    <MenuItem
                      key={1}
                      onClick={() => {
                        closeMenu()
                        let dogId = row.original.id
                        setFormDisposedData({
                          ...formDisposedData,
                          dogPoundId: dogId,
                          date: '',
                          medicine: '',
                        })
                        setDisposedFormModalVisible(true)
                      }}
                      sx={{ m: 0 }}
                    >
                      <ListItemIcon>
                        <MedicationLiquid />
                      </ListItemIcon>
                      Disposed
                    </MenuItem>,
                  ]}
                  renderTopToolbarCustomActions={({ table }) => (
                    <Box sx={{ display: 'flex', gap: '1rem', p: '0.5rem', flexWrap: 'wrap' }}>
                      <CButton size="md" className="btn-info text-white" onClick={handleExportData}>
                        <FontAwesomeIcon icon={faFileExcel} /> Export to Excel
                      </CButton>
                      <CButton
                        disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
                        //only export selected rows
                        onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
                        variant="outline"
                      >
                        <FontAwesomeIcon icon={faFileExcel} /> Export Selected Rows
                      </CButton>
                    </Box>
                  )}
                />
              )}
              {roleType === 'User' && (
                <MaterialReactTable
                  columns={columns}
                  data={data}
                  muiTablePaperProps={{
                    elevation: 0,
                    sx: {
                      borderRadius: '0',
                      border: '1px dashed #e0e0e0',
                    },
                  }}
                  muiTableBodyProps={{
                    sx: (theme) => ({
                      '& tr:nth-of-type(odd)': {
                        backgroundColor: darken(theme.palette.background.default, 0.05),
                      },
                    }),
                  }}
                  enableColumnFilterModes
                  enableColumnOrdering
                  enableGrouping
                  enablePinning
                  enableColumnResizing
                  initialState={{ density: 'compact' }}
                  positionToolbarAlertBanner="bottom"
                />
              )}
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
          visible={newDataFormModalVisible}
          onClose={() => setNewDataFormModalVisible(false)}
          backdrop="static"
          keyboard={false}
          size="lg"
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
                  feedbackInvalid="Date is required"
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
      </Draggable>

      {/* Report */}

      <Draggable
        handle=".modal-header"
        position={modalPosition}
        onStop={(e, data) => {
          setModalPosition({ x: data.x, y: data.y })
        }}
      >
        <CModal
          alignment="center"
          visible={reportFormModalVisible}
          onClose={() => setReportFormModalVisible(false)}
          backdrop="static"
          keyboard={false}
          size="lg"
        >
          <CModalHeader>
            <CModalTitle>Generate Report</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <RequiredNote />
            <CForm
              className="row g-3 needs-validation"
              noValidate
              validated={validated}
              onSubmit={handleReportSubmit}
            >
              <CCol md={6}>
                <CFormInput
                  type="date"
                  feedbackInvalid="Start Date is required"
                  id="start-date"
                  label={
                    <>
                      Start Date
                      <span className="text-warning">
                        <strong>*</strong>
                      </span>
                    </>
                  }
                  name="start_date"
                  value={formReportData.start_date}
                  onChange={handleReportChange}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  type="date"
                  feedbackInvalid="End Date is required"
                  id="end-date"
                  label={
                    <>
                      End Date
                      <span className="text-warning">
                        <strong>*</strong>
                      </span>
                    </>
                  }
                  name="end_date"
                  value={formReportData.end_date}
                  onChange={handleReportChange}
                  required
                />
              </CCol>

              <CCol md={12}>
                <CFormSelect
                  id="address"
                  label="Address"
                  name="address"
                  value={formReportData.address}
                  onChange={handleReportChange}
                >
                  <option value="">Choose...</option>
                  {barangayOptions.map((barangay) => (
                    <option key={barangay.barangay} value={barangay.barangay}>
                      {barangay.barangay}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <hr />
              <CCol xs={12}>
                <CButton color="primary" type="submit" className="float-end">
                  Generate
                </CButton>
              </CCol>
            </CForm>
          </CModalBody>
        </CModal>
      </Draggable>

      {/* Adopt Form */}

      <Draggable
        handle=".modal-header"
        position={modalPosition}
        onStop={(e, data) => {
          setModalPosition({ x: data.x, y: data.y })
        }}
      >
        <CModal
          alignment="center"
          visible={adoptFormModalVisible}
          onClose={() => setAdoptFormModalVisible(false)}
          backdrop="static"
          keyboard={false}
          size="lg"
        >
          <CModalHeader>
            <CModalTitle>Adopt/Claim</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <RequiredNote />
            <CForm
              className="row g-3 needs-validation"
              noValidate
              validated={validated}
              onSubmit={handleAdoptClaimSubmit}
            >
              <CCol md={12}>
                <CFormInput
                  type="date"
                  feedbackInvalid="Date is required"
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
                  value={formAdoptData.date}
                  onChange={handleAdoptChange}
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
                  value={formAdoptData.owner_name}
                  onChange={handleAdoptChange}
                  required
                />
              </CCol>

              <CCol md={12}>
                <CFormSelect
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
                  value={formAdoptData.address}
                  onChange={handleAdoptChange}
                  required
                  feedbackInvalid="Address is required"
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
                <CFormSelect
                  feedbackInvalid="Sex is required"
                  id="status"
                  label={
                    <>
                      Status
                      <span className="text-warning">
                        <strong>*</strong>
                      </span>
                    </>
                  }
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose...</option>
                  <option value="Adopt">Adopt</option>
                  <option value="Claim">Claim</option>
                </CFormSelect>
              </CCol>
              <hr />
              <CCol xs={12}>
                <CButton color="primary" type="submit" className="float-end">
                  Generate
                </CButton>
              </CCol>
            </CForm>
          </CModalBody>
        </CModal>
      </Draggable>

      {/* Disposed */}

      {/* <Draggable
        handle=".modal-header"
        position={modalPosition}
        onStop={(e, data) => {
          setModalPosition({ x: data.x, y: data.y })
        }}
      > */}
      <CModal
        alignment="center"
        visible={disposedFormModalVisible}
        onClose={() => setDisposedFormModalVisible(false)}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Disposed Dog</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <RequiredNote />
          <CForm
            className="row g-3 needs-validation"
            noValidate
            validated={validated}
            onSubmit={handleDisposedSubmit}
          >
            <CCol md={12}>
              <CFormInput
                type="date"
                feedbackInvalid="Date is required"
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
                value={formDisposedData.date}
                onChange={handleDisposedChange}
                required
              />
            </CCol>
            <CCol md={12}>
              <CFormInput
                type="text"
                feedbackInvalid="Name of the Medicine is required"
                id="medicine-name"
                label={
                  <>
                    Name of the Medicine
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="medicine"
                value={formDisposedData.medicine}
                onChange={handleDisposedChange}
                required
              />
            </CCol>
            <hr />
            <CCol xs={12}>
              <CButton color="primary" type="submit" className="float-end">
                Generate
              </CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>
      {/* </Draggable> */}
    </CRow>
  )
}

export default Pet_owner

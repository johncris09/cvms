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
  CInputGroup,
  CFormLabel,
  CTooltip,
} from '@coreui/react'
import { MenuItem, ListItemIcon, Box, darken } from '@mui/material'
import { OroquietaCityLogo, cityVetLogo } from 'src/helper/LogoReport'
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
import {
  faCirclePlus,
  faFileExcel,
  faFilePdf,
  faInfoCircle,
  faPlus,
  faPlusCircle,
  faQuestion,
  faQuestionCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'
import Table from 'src/constant/Table'
import ConvertToTitleCase from 'src/helper/ConvertToTitleCase'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.pdfMake.vfs
const MySwal = withReactContent(Swal)

const Deworming = ({ roleType }) => {
  const _table = 'deworming'
  const timestamp = serverTimestamp()
  const [data, setData] = useState([])
  const [newDataFormModalVisible, setNewDataFormModalVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [reportFormModalVisible, setReportFormModalVisible] = useState(false)
  const [barangayOptions, setBarangayOptions] = useState([])
  const [speciesOptions, setSpeciesOptions] = useState([])
  const [medicationOptions, setMedicationOptions] = useState([])
  const [currentYear, setCurrentYear] = useState()
  const [formData, setFormData] = useState({
    date_deworming: '',
    address: '',
    farmer_name: '',
    species: '',
    head_number: '',
    treatment: '',
    inputs: [{ id: 1, value: '' }],
    female: '',
    male: '',
  })
  const [formReportData, setFormReportData] = useState({
    start_date: '',
    end_date: '',
    address: '',
    species: '',
  })
  const [selectedItemId, setSelectedItemId] = useState(null)
  useEffect(() => {
    fetchBarangay()
    fetchSpecies()
    fetchMedication()

    const currentYear = new Date().getFullYear() // Get the current year
    setCurrentYear(currentYear)

    fetchData(_table, currentYear)
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { month: 'long', day: 'numeric', year: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

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

          const processedData = filteredData.map(async (item) => {
            // get the species
            const species = item.species
            const speciesSnapshot = await get(ref(database, `deworm_species/${species}`))
            const speciesObject = speciesSnapshot.val()

            const treatment = item.treatment
            const treatmentSnapshot = await get(ref(database, `medication/${treatment}`))
            const treatmentObject = treatmentSnapshot.val()

            const amounts = item.amount
            const unitMap = {}
            const individualAmounts = amounts.map((amount) => {
              const [value, unit] = amount.split(' ')
              if (!unitMap[unit]) {
                unitMap[unit] = 0
              }
              unitMap[unit] += parseInt(value)
              return `${value} ${unit}`
            })

            const totalAmount = Object.entries(unitMap)
              .map(([unit, value]) => `${value} ${unit}`)
              .join(' + ')

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
              species: speciesObject ? speciesObject.name : '',
              head_number: item.head_number,
              sex: sexText,
              treatment: treatmentObject ? treatmentObject.medication : '',
              amount: individualAmounts.join(', ') + ' = ' + totalAmount,
            }
          })

          Promise.all(processedData).then((data) => {
            setData(data)
          })
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
  const fetchSpecies = async () => {
    try {
      const databaseRef = ref(database, 'deworm_species')
      const snapshot = await get(databaseRef)
      if (snapshot.exists()) {
        const species = Object.values(snapshot.val()).sort((a, b) => a.name.localeCompare(b.name))
        setSpeciesOptions(species)
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
      const species = formData.get('species')
      generateReport(_table, 2023, start_date, end_date, address, species)
    }
    setValidated(true)
  }

  const generateReport = async (
    table,
    currentYear,
    start_date,
    end_date,
    addressFilter,
    speciesFilter,
  ) => {
    try {
      const dataRef = ref(database, table)
      const dataQuery = query(dataRef, orderByChild('timestamp'))

      onValue(dataQuery, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const dataArray = Object.values(data)
          // Filter the data based on the desired year and semester
          const filteredData = dataArray.filter((item) => {
            const date = new Date(item.date_deworming)
            const year = date.getFullYear()
            const startDate = new Date(start_date)
            const endDate = new Date(end_date)

            // return year === currentYear
            return (
              date >= startDate &&
              date <= endDate &&
              year === currentYear &&
              addressFilter === item.address &&
              (speciesFilter === '' ? true : speciesFilter === item.species)
            )
          })

          // // Sort the filtered data by spNo
          filteredData.sort((a, b) => new Date(b.date_deworming) - new Date(a.date_deworming))

          const processedData = filteredData.map(async (item) => {
            // get the species
            const species = item.species
            const speciesSnapshot = await get(ref(database, `deworm_species/${species}`))
            const speciesObject = speciesSnapshot.val()

            const treatment = item.treatment
            const treatmentSnapshot = await get(ref(database, `medication/${treatment}`))
            const treatmentObject = treatmentSnapshot.val()

            const amounts = item.amount
            const unitMap = {}
            const individualAmounts = amounts.map((amount) => {
              const [value, unit] = amount.split(' ')
              if (!unitMap[unit]) {
                unitMap[unit] = 0
              }
              unitMap[unit] += parseInt(value)
              return `${value} ${unit}`
            })

            const totalAmount = Object.entries(unitMap)
              .map(([unit, value]) => `${value} ${unit}`)
              .join(' + ')

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
              species: speciesObject ? speciesObject.name : '',
              head_number: item.head_number,
              sex: sexText,
              treatment: treatmentObject ? treatmentObject.medication : '',
              amount: individualAmounts.join(', ') + ' = ' + totalAmount,
            }
          })

          Promise.all(processedData).then((data) => {
            if (data.length > 0) {
              const content = []
              // Add table header
              const tableHeader = [
                { text: "Farmer's Name", style: 'tableHeader', bold: true },
                { text: 'Species', style: 'tableHeader', bold: true },
                { text: 'Head(s)', style: 'tableHeader', bold: true },
                { text: 'Treatment', style: 'tableHeader', bold: true },
                { text: 'Amount', style: 'tableHeader', bold: true },
                { text: 'Sex', style: 'tableHeader', bold: true },
              ]
              content.push(tableHeader)

              // Add table rows
              for (const item of data) {
                const tableRow = [
                  item.farmer_name,
                  item.species,
                  item.head_number,
                  item.treatment,
                  item.amount,
                  item.sex,
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
                    columns: [
                      {
                        text: 'DEWORMING\n',
                        style: 'headerText',
                        bold: true,
                        alignment: 'center',
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
                              formatDate(formReportData.start_date) +
                              ' - ' +
                              formatDate(formReportData.end_date),
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
            } else {
              MySwal.fire({
                title: <strong>No record found</strong>,
                html: <i>There are no records matching your search criteria.</i>,
                icon: 'info',
              })
            }
          })
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
      const date_deworming = _formData.get('date_deworming')
      const address = _formData.get('address')
      const farmer_name = _formData.get('farmer_name')
      const species = _formData.get('species')
      const head_number = _formData.get('head_number')
      const amount = formData.inputs.map((input) => input.value)
      const treatment = _formData.get('treatment')
      const female = _formData.get('female')
      const male = _formData.get('male')

      if (selectedItemId) {
        // Update operation
        const itemRef = ref(database, `${_table}/${selectedItemId}`)
        update(itemRef, {
          date_deworming,
          address,
          farmer_name,
          species,
          head_number,
          treatment,
          amount,
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
          treatment,
          amount,
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
      // setNewDataFormModalVisible(false)
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

  const handleInputChange = (e, index) => {
    const { value } = e.target
    const updatedInputs = [...formData.inputs]
    updatedInputs[index].value = value
    setFormData({ ...formData, inputs: updatedInputs })
  }

  const handleAddInput = () => {
    const newInput = { id: formData.inputs.length + 1, value: '' }
    setFormData({ ...formData, inputs: [...formData.inputs, newInput] })
  }
  const handleRemoveInput = (id) => {
    const updatedInputs = formData.inputs.filter((input) => input.id !== id)
    setFormData({ ...formData, inputs: updatedInputs })
  }

  const columns = [
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
      accessorKey: 'treatment',
      header: 'Treament and Amount',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
    },
    {
      accessorKey: 'sex',
      header: 'Sex',
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
    csvExporter.generateCsv(rows.map((row) => row.original))
  }
  const handleExportData = () => {
    csvExporter.generateCsv(data)
  }
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Deworming</strong>
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

                        const dewormingRef = ref(database, _table)
                        const dewormingSnapshot = await get(child(dewormingRef, row.original.id))
                        if (dewormingSnapshot.exists()) {
                          // Deworming data found
                          const dewormingData = dewormingSnapshot.val()
                          let idCounter = 1
                          const inputs = Object.entries(dewormingData.amount).map(
                            ([id, value]) => ({
                              id: idCounter++,
                              value,
                            }),
                          )
                          console.info(inputs)
                          setFormData({
                            date_deworming: dewormingData.date_deworming,
                            address: dewormingData.address,
                            farmer_name: dewormingData.farmer_name,
                            species: dewormingData.species,
                            female: dewormingData.female,
                            male: dewormingData.male,
                            head_number: dewormingData.head_number,
                            treatment: dewormingData.treatment,
                            inputs: inputs,
                          })

                          setSelectedItemId(row.original.id) // Set the selected item ID
                          setNewDataFormModalVisible(true)
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

      {/* Add new Data */}
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
                {speciesOptions.map((species) => (
                  <option key={species.id} value={species.id}>
                    {species.name}
                  </option>
                ))}
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
            <CCol md={12}>
              <CFormSelect
                feedbackInvalid="Treatment is required"
                id="treatment"
                label={
                  <>
                    Treatment
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="treatment"
                value={formData.treatment}
                onChange={handleChange}
                required
              >
                <option value="">Choose...</option>
                {medicationOptions.map((medication) => (
                  <option key={medication.id} value={medication.id}>
                    {medication.medication}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            {/* Dynamic Inputs */}
            {formData.inputs.map((input) => {
              if (input.id === 1) {
                return (
                  <CCol md={12} key={input.id}>
                    <CFormLabel htmlFor="basic-url">
                      Amount
                      <CTooltip
                        className="bg-info"
                        content="Reminder: Please remember to separate the numbers and units of measurement when entering the input values. 
                        For example, enter 1 mg or 10 sachet with a space between the number and the unit. This will help ensure accurate calculations and prevent any issues during data processing."
                        placement="right"
                      >
                        <sup>
                          <FontAwesomeIcon className="text-info" size="lg" icon={faInfoCircle} />
                        </sup>
                      </CTooltip>
                    </CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        type="text"
                        name="input"
                        value={input.value}
                        onChange={(e) => handleInputChange(e, input.id - 1)}
                      />
                      <CTooltip content="Add Input" placement="top">
                        <CButton
                          type="button"
                          color="primary"
                          variant="outline"
                          onClick={handleAddInput}
                        >
                          <FontAwesomeIcon size="lg" icon={faCirclePlus} />
                        </CButton>
                      </CTooltip>
                    </CInputGroup>
                  </CCol>
                )
              } else {
                return (
                  <CCol md={12} key={input.id}>
                    <CFormLabel htmlFor="basic-url">Amount</CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        type="text"
                        name="input"
                        value={input.value}
                        onChange={(e) => handleInputChange(e, input.id - 1)}
                      />
                      <CTooltip content="Remove Input" placement="top">
                        <CButton
                          type="button"
                          color="danger"
                          variant="outline"
                          onClick={() => handleRemoveInput(input.id)}
                        >
                          <FontAwesomeIcon size="lg" icon={faTimesCircle} />
                        </CButton>
                      </CTooltip>
                    </CInputGroup>
                  </CCol>
                )
              }
              return null
            })}

            <hr />
            <CCol xs={12}>
              <CButton color="primary" type="submit" className="float-end">
                {editMode ? 'Update' : 'Submit form'}
              </CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Report */}
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
            onSubmit={handleReportSubmit}
          >
            <CCol md={6}>
              <CFormInput
                type="date"
                feedbackInvalid="OR # is required"
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
                feedbackInvalid="OR # is required"
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
                feedbackInvalid="Address is required"
                label={
                  <>
                    Address
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
                name="address"
                value={formReportData.address}
                onChange={handleReportChange}
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
              <CFormSelect
                feedbackInvalid="Species is required"
                id="species"
                label="Species"
                name="species"
                value={formReportData.species}
                onChange={handleReportChange}
              >
                <option value="">Choose...</option>
                {speciesOptions.map((species) => (
                  <option key={species.id} value={species.id}>
                    {species.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <hr />
            <CCol xs={12}>
              <CButton color="primary" type="submit" className="float-end">
                <FontAwesomeIcon icon={faFilePdf} /> Generate Report
              </CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>
    </CRow>
  )
}

export default Deworming

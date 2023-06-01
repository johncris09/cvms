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
import { faPlusCircle, faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import Table from 'src/constant/Table'
import ConvertToTitleCase from 'src/helper/ConvertToTitleCase'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { prettyFormat } from '@testing-library/react'
pdfMake.vfs = pdfFonts.pdfMake.vfs
const MySwal = withReactContent(Swal)

const Anti_rabies_vaccination = () => {
  const _table = 'anti_rabies_vaccination'

  const timestamp = serverTimestamp()
  const [data, setData] = useState([])
  const [newDataFormModalVisible, setNewDataFormModalVisible] = useState(false)
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [reportFormModalVisible, setReportFormModalVisible] = useState(false)
  const [barangayOptions, setBarangayOptions] = useState([])
  const [speciesOptions, setSpeciesOptions] = useState([])
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
  const [formReportData, setFormReportData] = useState({
    start_date: '2023-05-01',
    end_date: '2023-05-31',
    address: '',
    species: '',
  })
  const [selectedItemId, setSelectedItemId] = useState(null)
  useEffect(() => {
    fetchBarangay()
    fetchSpecies()

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
            const date = new Date(item.date_vaccinated)
            const year = date.getFullYear()
            return year === currentYear
          })

          // // Sort the filtered data by spNo
          filteredData.sort((a, b) => new Date(b.date_vaccinated) - new Date(a.date_vaccinated))

          const processedData = filteredData.map(async (item) => {
            // get the species
            const species = item.species
            const speciesSnapshot = await get(ref(database, `anti_rabies_species/${species}`))
            const speciesObject = speciesSnapshot.val()

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
              species: speciesObject ? speciesObject.name : '',
              date_vaccinated: item.date_vaccinated,
              vaccine_type: item.vaccine_type,
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
            const date = new Date(item.date_vaccinated)
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

          // Sort the filtered data by date vaccinated
          filteredData.sort((a, b) => new Date(b.date_vaccinated) - new Date(a.date_vaccinated))

          const processedData = filteredData.map(async (item) => {
            // get the species
            const species = item.species
            const speciesSnapshot = await get(ref(database, `anti_rabies_species/${species}`))
            const speciesObject = speciesSnapshot.val()

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
              species: speciesObject ? speciesObject.name : '',
              date_vaccinated: item.date_vaccinated,
              vaccine_type: item.vaccine_type,
            }
          })
          Promise.all(processedData).then((data) => {
            if (data.length > 0) {
              const content = []
              // Add table header
              const tableHeader = [
                { text: "Owner's Name", style: 'tableHeader', bold: true },
                { text: "Pet's Name", style: 'tableHeader', bold: true },
                { text: 'Age', style: 'tableHeader', bold: true },
                { text: 'Sex', style: 'tableHeader', bold: true },
                { text: 'Color', style: 'tableHeader', bold: true },
                { text: 'Species', style: 'tableHeader', bold: true },
                { text: 'Neutered', style: 'tableHeader', bold: true },
                { text: 'Vaccine Type', style: 'tableHeader', bold: true },
              ]
              content.push(tableHeader)

              // Add table rows
              for (const item of data) {
                let speciesName = ''
                if (item.species === 'Dog') {
                  speciesName = 'C'
                } else if (item.species === 'Cat') {
                  speciesName = 'F'
                } else if (item.species === 'Monkey') {
                  speciesName = 'P'
                }

                let speciesSex = ''
                if (item.sex === 'Male') {
                  speciesSex = 'M'
                } else if (item.sex === 'Female') {
                  speciesSex = 'F'
                }

                const tableRow = [
                  item.owner_name,
                  item.pet_name,
                  item.age,
                  speciesSex,
                  item.color,
                  speciesName,
                  item.neutered,
                  item.vaccine_type,
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
      const formData = new FormData(form)
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

  const columns = [
    {
      accessorKey: 'date_vaccinated',
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
            <strong>Anti Rabies Vaccination</strong>
            <CButton color="success" variant="outline" className="float-end" onClick={handleReport}>
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
                enableRowSelection
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
                {speciesOptions.map((species) => (
                  <option key={species.id} value={species.id}>
                    {species.name}
                  </option>
                ))}
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
                label="Address"
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
                label={
                  <>
                    Species
                    <span className="text-warning">
                      <strong>*</strong>
                    </span>
                  </>
                }
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

export default Anti_rabies_vaccination

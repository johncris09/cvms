import React, { useEffect, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CRow,
} from '@coreui/react'

import { database, ref, query, orderByChild, onValue, get } from '../../firebaseConfig'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { OroquietaCityLogo, cityVetLogo } from 'src/helper/LogoReport'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePdf } from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

pdfMake.vfs = pdfFonts.pdfMake.vfs
const AntiRabiesVaccinationReport = () => {
  const [currentYear, setCurrentYear] = useState()
  const [barangayOptions, setBarangayOptions] = useState([])
  const [speciesOptions, setSpeciesOptions] = useState([])
  const [data, setData] = useState([])
  const _table = 'anti_rabies_vaccination'

  const [validated, setValidated] = useState(false)
  const [formReportData, setFormReportData] = useState({
    start_date: '2023-05-01',
    end_date: '2023-05-31',
    address: '',
    species: '',
  })

  useEffect(() => {
    fetchBarangay()
    fetchSpecies()
    const currentYear = new Date().getFullYear() // Get the current year
    setCurrentYear(currentYear)
  }, [])

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
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormReportData({ ...formReportData, [name]: value })
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { month: 'long', day: 'numeric', year: 'numeric' }
    return date.toLocaleDateString('en-US', options)
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

                const tableRow = [
                  item.owner_name,
                  item.pet_name,
                  item.age,
                  item.sex,
                  item.color,
                  speciesName,
                  item.neutered,
                  item.vaccine_type,
                ]
                content.push(tableRow)
              }

              const currentDateTime = new Date().toLocaleString('en-US')
              const documentDefinition = {
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

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Anti-Rabies Vaccination Report</strong>
          </CCardHeader>
          <CCardBody>
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default AntiRabiesVaccinationReport

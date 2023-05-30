import React, { useEffect, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CRow,
} from '@coreui/react'

import { database, ref, query, orderByChild, onValue } from '../../firebaseConfig'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

import { OroquietaCityLogo, cityVetLogo } from 'src/helper/LogoReport'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePdf } from '@fortawesome/free-solid-svg-icons'
pdfMake.vfs = pdfFonts.pdfMake.vfs
const PetOwnerReport = () => {
  const [currentYear, setCurrentYear] = useState()

  const [data, setData] = useState([])
  const _table = 'pet_owner'

  const [validated, setValidated] = useState(false)
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    const currentYear = new Date().getFullYear() // Get the current year
    setCurrentYear(currentYear)
  }, [])

  const handleChange = (e) => {
    const { name, value, type } = e.target

    setFormData({ ...formData, [name]: value })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { month: 'long', day: 'numeric', year: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  const handleSubmit = (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      event.preventDefault()
      const formData = new FormData(form)
      const start_date = formData.get('start_date')
      const end_date = formData.get('end_date')
      generateReport(_table, 2023, start_date, end_date)
    }
    setValidated(true)
  }

  const generateReport = async (table, currentYear, start_date, end_date) => {
    try {
      const petOwnerRef = ref(database, table)
      const petOwnerQuery = query(petOwnerRef, orderByChild('control_number'))

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

            return date >= startDate && date <= endDate && year === currentYear
          })
          // // Sort the filtered data by date
          filteredData.sort((a, b) => new Date(a.date) - new Date(b.date))

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
          // console.info(processedData)
          // setData(processedData)
          const content = []
          // Add table header
          const tableHeader = [
            { text: 'Control Number', style: 'tableHeader', bold: true },
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
              item.control_number,
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
          const documentDefinition = {
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
                text: formatDate(formData.start_date) + ' - ' + formatDate(formData.end_date),
                style: 'subheaderText',
                alignment: 'right',
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
            },
          }
          const pdfDoc = pdfMake.createPdf(documentDefinition)
          pdfDoc.open()
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
            <strong>Pet Owner Report</strong>
          </CCardHeader>
          <CCardBody>
            <CForm
              className="row g-3 needs-validation"
              noValidate
              validated={validated}
              onSubmit={handleSubmit}
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
                  value={formData.start_date}
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
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
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

export default PetOwnerReport

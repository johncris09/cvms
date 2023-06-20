import React, { useEffect, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormSelect,
} from '@coreui/react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { database, ref, get, push, update, set, child } from '../../firebaseConfig'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import TrackUserActivity from 'src/helper/TrackUserActivity'
import RequiredNote from 'src/helper/RequiredNote'
pdfMake.vfs = pdfFonts.pdfMake.vfs
const MySwal = withReactContent(Swal)

const Config = ({ roleType, userId }) => {
  const _table = 'config'
  const [validated, setValidated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentYear, setCurrentYear] = useState()
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [formData, setFormData] = useState({
    year: '',
  })
  useEffect(() => {
    const currentYear = new Date().getFullYear() // Get the current year
    setCurrentYear(currentYear)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const yearRef = ref(database, _table)
      const yearSnapshot = await get(child(yearRef, '-NYLG8JAhoqBoLkdZJML'))
      if (yearSnapshot.exists()) {
        // year data found
        const yearData = yearSnapshot.val()
        setFormData({
          year: yearData.year,
        })

        setSelectedItemId('-NYLG8JAhoqBoLkdZJML') // Set the selected item ID
        setEditMode(true)
      } else {
        // year data not found
        console.log('year not found')
      }
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
      const year = _formData.get('year')

      if (selectedItemId) {
        // Update operation
        const itemRef = ref(database, `${_table}/${selectedItemId}`)
        update(itemRef, {
          year,
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
          reference: 'Deworming',
          referenceTable: _table,
          activity: 'Updated a record',
          value: { id: selectedItemId, year: year },
        })
      } else {
        // Add operation
        const newItemRef = push(ref(database, _table))
        const id = newItemRef.key
        set(newItemRef, {
          id,
          year,
        })
          .then(() => {
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
          reference: 'Year',
          referenceTable: _table,
          activity: 'Update Year to view',
          value: { id: id, year: year },
        })
      }
      setValidated(false)
      // setNewDataFormModalVisible(false)
    }
    // form.reset()
    setValidated(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData({ ...formData, [name]: value })
  }
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Config</strong>
          </CCardHeader>
          <CCardBody>
            <CForm
              className="row g-3 needs-validation"
              noValidate
              validated={validated}
              onSubmit={handleSubmit}
            >
              <RequiredNote />

              <CCol md={12}>
                <CFormSelect
                  feedbackInvalid="Year is required"
                  id="year"
                  label={
                    <>
                      Please select the year for displaying the data.
                      <span className="text-warning">
                        <strong>*</strong>
                      </span>
                    </>
                  }
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose...</option>
                  {Array.from({ length: currentYear - 2020 + 1 }, (_, index) => (
                    <option key={currentYear - index} value={currentYear - index}>
                      {currentYear - index}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <hr />
              <CCol xs={12}>
                <CButton color="primary" type="submit" className="float-end">
                  Update
                </CButton>
              </CCol>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Config

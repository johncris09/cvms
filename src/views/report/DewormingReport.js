import React, { useEffect, useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'

const DewormingReport = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Deworming Report</strong>
          </CCardHeader>
          <CCardBody>Report</CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default DewormingReport

import React, { useEffect, useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'

const PetOwnerReport = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Pet Owner Report</strong>
          </CCardHeader>
          <CCardBody>Report</CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default PetOwnerReport

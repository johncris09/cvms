import React, { useEffect, useState, useMemo } from 'react'
import { CButton, CCard, CCardHeader, CCol, CRow } from '@coreui/react'
import { Box, ListItemIcon, MenuItem } from '@mui/material'
import MaterialReactTable from 'material-react-table'
import { faDatabase, faPlusCircle, faUserCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Check, CheckBox, Close, PendingActions } from '@mui/icons-material'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { child, database, get, onValue, ref, update } from '../../firebaseConfig'
const MySwal = withReactContent(Swal)

const DatabaseBackup = () => {
  const handleBackup = async () => {
    try {
      const snapshot = await get(ref(database))

      const jsonData = JSON.stringify(snapshot.val(), null, 2)

      const currentDateTime = new Date()
        .toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        .replace(/[/:]/g, '-')

      const fileName = `database_backup_${currentDateTime}.json`

      const blob = new Blob([jsonData], { type: 'application/json' })

      const downloadLink = document.createElement('a')
      downloadLink.href = URL.createObjectURL(blob)
      downloadLink.download = fileName

      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    } catch (error) {
      console.error('Failed to create database backup:', error)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Database Backup</strong>
            <CButton color="primary" className="float-end" onClick={handleBackup}>
              <FontAwesomeIcon icon={faDatabase} /> Backup
            </CButton>
          </CCardHeader>
        </CCard>
      </CCol>
    </CRow>
  )
}
export default DatabaseBackup

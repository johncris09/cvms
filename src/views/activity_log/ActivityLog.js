import React, { useEffect, useMemo, useState } from 'react'
import MaterialReactTable from 'material-react-table'
import { CCard, CCardBody, CCardHeader, CCol, CRow, CTooltip } from '@coreui/react'
import { Box, darken } from '@mui/material'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
  database,
  ref,
  get,
  serverTimestamp,
  query,
  orderByChild,
  onValue,
} from '../../firebaseConfig'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import ConvertToTitleCase from 'src/helper/ConvertToTitleCase'
pdfMake.vfs = pdfFonts.pdfMake.vfs

const ActivityLog = () => {
  const _table = 'user_activity'
  const timestamp = serverTimestamp()
  const [data, setData] = useState([])
  const [currentYear, setCurrentYear] = useState()
  useEffect(() => {
    const currentYear = new Date().getFullYear() // Get the current year
    setCurrentYear(currentYear)

    fetchData(_table, currentYear)
  }, [])

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
          filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

          const processedData = filteredData.map(async (item) => {
            // console.info(item)

            // get the species
            const userSnapshot = await get(ref(database, `users/${item.userId}`))
            const userData = userSnapshot.val()
            // console.info(userData)

            // const treatment = item.treatment
            // const treatmentSnapshot = await get(ref(database, `medication/${treatment}`))
            // const treatmentObject = treatmentSnapshot.val()

            const dateTime = new Date(item.timestamp)
            const formattedDateTime = dateTime.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })

            return {
              displayName: userData.displayName,
              email: userData.email,
              userId: item.userId,
              activity: item.activity,
              value: item.value,
              created_at: formattedDateTime,
              browser: item.browser,
              os: item.os,
              type: item.type,
              reference: item.reference,
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
  const columns = useMemo(
    () => [
      {
        id: 'user',
        columns: [
          {
            accessorKey: 'displayName',
            header: 'User',
          },

          {
            accessorKey: 'activity',
            header: 'Activity',
          },
          {
            accessorKey: 'reference',
            header: 'Reference',
          },

          {
            accessorFn: (row) => `${row.value}`,
            id: 'value',
            header: 'Value',
            size: 250,
            Cell: ({ renderedCellValue, row }) => (
              <>
                {Object.values(row.original.value)[1]}{' '}
                <CTooltip
                  content={
                    <table className="table table-bordered table-sm mt-3">
                      <thead>
                        <tr className="text-white">
                          <th>Key</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(row.original.value).map(
                          ([key, value]) => (
                            // key !== 'id' && (
                            <tr key={key} className="text-white">
                              <td>{ConvertToTitleCase(key)}</td>
                              <td>{value}</td>
                            </tr>
                          ),
                          // ),
                        )}
                      </tbody>
                    </table>
                  }
                  placement="right"
                >
                  <sup>
                    <FontAwesomeIcon className="text-info" size="lg" icon={faQuestionCircle} />
                  </sup>
                </CTooltip>
              </>
            ),
          },
          {
            accessorKey: 'type',
            header: 'Type',
          },
          {
            accessorKey: 'browser',
            header: 'Browser',
          },
          {
            accessorKey: 'os',
            header: 'Os',
          },
          {
            accessorKey: 'created_at',
            header: 'Created At',
          },
        ],
      },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Activity Log</strong>
          </CCardHeader>
          <CCardBody>
            <>
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
            </>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ActivityLog

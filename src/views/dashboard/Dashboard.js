import React, { useEffect, useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react'
import { auth, ref, database, onValue, query, orderByChild, equalTo } from '../../firebaseConfig'
const Dashboard = () => {
  const [status, setStatus] = useState(null)
  const [email, setEmail] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setEmail(user.email)
        console.info(user)
        // User is signed in
        const userRef = ref(database, 'users')
        const queryRef = query(userRef, orderByChild('email'), equalTo(user.email))
        onValue(queryRef, (snapshot) => {
          const userData = snapshot.val()
          if (userData) {
            const userId = Object.keys(userData)[0]
            setStatus(userData[userId].status)
          }
        })
      } else {
        // User is signed out
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            {status === 'Approved' ? <strong>Dashboard</strong> : <strong>Message</strong>}
          </CCardHeader>
          <CCardBody>
            {status === 'Approved' ? (
              <p className="text-medium-emphasis small"></p>
            ) : (
              <CAlert color="info" className="d-flex align-items-center">
                <p>
                  Dear <strong>{email}</strong> , <br />
                  <br />
                  Thank you for logging into our system. We would like to inform you that your
                  account is currently pending approval from the system administrator. We appreciate
                  your patience during this process.
                  <br />
                  <br /> Once your account is approved, you will have full access to all the
                  features and functionalities of our system. We strive to review and process
                  account approvals as quickly as possible.
                  <br />
                  <br />
                  If you have any urgent questions or require further assistance, please don&apos;t
                  hesitate to reach out to our support team. We will be happy to assist you. <br />
                  <br />
                  Thank you for your understanding. <br />
                  <br />
                  Best regards, <br />
                  The System Adminstrator
                </p>
              </CAlert>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Dashboard

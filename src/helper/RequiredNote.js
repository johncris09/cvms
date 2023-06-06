import React from 'react'

function RequiredNote() {
  return (
    <p style={{ fontSize: '14px' }}>
      Note:{' '}
      <strong>
        <span className="text-danger">*</span> is required
      </strong>
    </p>
  )
}

export default RequiredNote

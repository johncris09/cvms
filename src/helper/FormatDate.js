import React from 'react'

function FormatDate(dateString) {
  const date = new Date(dateString)
  const options = { month: 'long', day: 'numeric', year: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

export default FormatDate

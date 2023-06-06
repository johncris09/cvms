import React from 'react'

function FormatDateTime(timestamp) {
  const date = new Date(timestamp)
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

  const _date = formattedDate === '' ? '' : formattedDate
  const _time = formattedTime === '' ? '' : formattedTime
  return _date + ' ' + _time
}

export default FormatDateTime

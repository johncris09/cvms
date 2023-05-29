import React from 'react'

function ConvertToTitleCase(input) {
  return input.toLowerCase().replace(/(?:^|\s)\w/g, (match) => {
    return match.toUpperCase()
  })
}

export default ConvertToTitleCase

import React from 'react'

function Footer(currentPage, pageCount, currentDateTime) {
  return {
    columns: [
      {
        text: `Date Printed: ${currentDateTime}`,
        alignment: 'left',
        fontSize: 8,
        margin: [20, 0],
      },
      {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'right',
        fontSize: 8,
        margin: [0, 0, 20, 0],
      },
    ],
    margin: [20, 10],
  }
}

export default Footer

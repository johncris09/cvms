import React from 'react'
import { OroquietaCityLogo, cityVetLogo } from '../LogoReport'
function Header() {
  return {
    columns: [
      {
        width: 'auto',
        image: cityVetLogo,
        fit: [50, 50],
      },
      {
        text: [
          'Republic of the Philippines\n',
          'OFFICE OF THE VETERINARIAN\n',
          'Oroquieta City\n\n',
          {
            text: 'City of Good Life',
            style: 'subheaderText',
            alignment: 'center',
            italics: true,
            bold: true,
          },
        ],
        style: 'headerText',
        bold: false,
        alignment: 'center',
      },
      {
        width: 'auto',
        image: OroquietaCityLogo,
        fit: [50, 50],
        alignment: 'right',
      },
    ],
  }
}

export default Header

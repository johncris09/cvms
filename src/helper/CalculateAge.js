import React from 'react'

function CalculateAge(pet_birthdate) {
  const today = new Date()
  const birthdate = new Date(pet_birthdate)
  const ageTime = today - birthdate
  const age = Math.floor(ageTime / (1000 * 60 * 60 * 24 * 365)) // Calculating age in years
  return age === 1
    ? age.toString() + ' year old'
    : age < 1
    ? 'Less than 1 year old'
    : age.toString() + ' years old'
}

export default CalculateAge

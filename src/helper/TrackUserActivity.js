import React, { useEffect, useState, useMemo } from 'react'
import { database, ref, push, set } from './../firebaseConfig'

const TrackUserActivity = (activityData) => {
  const device = {
    type: '',
    os: '',
    browser: '',
  }

  // Get device type
  if (navigator.userAgent.match(/Mobile|Tablet/i)) {
    device.type = 'Mobile'
  } else {
    device.type = 'Desktop'
  }

  // Get operating system
  const userAgent = navigator.userAgent
  const platform = navigator.platform
  if (/Win/i.test(platform)) {
    device.os = 'Windows'
  } else if (/Mac/i.test(platform)) {
    device.os = 'Mac OS'
  } else if (/Linux/i.test(platform)) {
    device.os = 'Linux'
  } else if (/Android/i.test(userAgent)) {
    device.os = 'Android'
  } else if (/iOS|iPadOS/i.test(userAgent)) {
    device.os = 'iOS'
  } else {
    device.os = 'Unknown'
  }

  // Get browser information
  const browserName = navigator.userAgent.toLowerCase()
  if (browserName.includes('firefox')) {
    device.browser = 'Firefox'
  } else if (browserName.includes('chrome')) {
    device.browser = 'Chrome'
  } else if (browserName.includes('safari')) {
    device.browser = 'Safari'
  } else if (browserName.includes('opera')) {
    device.browser = 'Opera'
  } else if (browserName.includes('edge')) {
    device.browser = 'Edge'
  } else if (browserName.includes('msie')) {
    device.browser = 'Internet Explorer'
  } else {
    device.browser = 'Unknown'
  }
  const userActivity = {
    timestamp: new Date().toISOString(),
    ...activityData,
    ...device,
  }
  const activityRef = ref(database, 'user_activity')
  const newActivityRef = push(activityRef)
  set(newActivityRef, userActivity)
}

export default TrackUserActivity

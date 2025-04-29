console.log("🔍 DoctoNote extension activated on Doctolib!")

// Initialize immediately and also on DOMContentLoaded
initDoctoNote()
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOMContentLoaded event fired")
  initDoctoNote()
})

// URL change observer
let lastUrl = location.href
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    console.log("🔄 URL changed, reinitializing...")
    initDoctoNote()
  }
}).observe(document, { subtree: true, childList: true })

// DOM change observer
new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE &&
          (node.classList?.contains("search-result-card") ||
            node.querySelector?.(".search-result-card") ||
            node.classList?.contains("dl-profile-header-name") ||
            node.querySelector?.(".dl-profile-header-name") ||
            node.classList?.contains("dl-text") ||
            node.querySelector?.(".dl-text"))) {
          console.log("🔄 DOM changed with relevant elements, reinitializing...")
          initDoctoNote()
          return
        }
      }
    }
  }
}).observe(document.body, { childList: true, subtree: true })

// Initialize DoctoNote
function initDoctoNote() {
  const searchResultCards = document.querySelectorAll(".search-result-card")
  if (searchResultCards.length > 0) {
    console.log("🔎 Processing search results")
    processSearchResults()
    return
  }

  const doctorNameH1 = document.querySelector(".dl-profile-header-name")
  const doctorAddress = document.querySelector(".mt-8.flex.items-start[data-test='location'] .dl-text")
  if (doctorNameH1 && doctorAddress) {
    console.log("🩺 Processing doctor profile")
    processDoctorProfile(doctorNameH1, doctorAddress)
  }
}

// Extract doctor info from the profile page
async function processDoctorProfile(doctorNameH1, doctorAddress) {
  const doctorName = doctorNameH1.textContent.trim()
  const address = doctorAddress.textContent.trim()
  console.log("👨‍⚕️ Doctor name:", doctorName)
  console.log("📍 Doctor address:", address)

  // Show loading state immediately
  displayProfileRatingBadge({ rating: "Loading...", reviewsCount: 0 })

  console.log(`🔍 Checking cache for ${doctorName}...`)
  const cachedRating = await getCachedRating(doctorName, address)
  if (cachedRating) {
    console.log(`🎁 Rating found in cache for ${doctorName}:`, cachedRating)
    displayProfileRatingBadge(cachedRating)
    return
  }

  console.log(`🔄 No cached rating found, fetching from API...`)
  const rating = await fetchDoctorRating(doctorName, address)
  displayProfileRatingBadge(rating)
}

async function getCachedRating(doctorName, address) {
  try {
    const key = `${doctorName}-${address}`
    console.log(`🔍 Looking for cached rating with key: ${key}`)
    const cachedData = await browser.storage.local.get(key)
    console.log(`📦 Retrieved cached data:`, cachedData)
    const rating = cachedData[key]
    console.log(`⭐ Rating from cache:`, rating)
    return rating
  } catch (error) {
    console.warn('⚠️ Could not get cached rating:', error)
    return null
  }
}

async function processSearchResults() {
  const doctorCards = document.querySelectorAll(".search-result-card")
  if (doctorCards.length === 0) return

  console.log(`🧾 Number of doctors: ${doctorCards.length}`)

  for (let i = 0; i < doctorCards.length; i++) {
    await processDoctorCard(doctorCards[i])
    if (i < doctorCards.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

async function processDoctorCard(card) {
  if (card.querySelector(".doctonote-rating-badge")) return

  const nameElement = card.querySelector("h2")
  if (!nameElement) return

  const doctorName = nameElement.textContent.trim()
  const addressElements = card.querySelectorAll(".dl-text-neutral-130")
  let address = ""

  if (addressElements.length >= 2) {
    address = Array.from(addressElements)
      .slice(0, 2)
      .map(el => el.textContent.trim())
      .join(", ")
  }

  const cachedRating = await getCachedRating(doctorName, address)
  if (cachedRating) {
    displaySearchResultRating(card, cachedRating)
    return
  }

  const rating = await fetchDoctorRating(doctorName, address)
  displaySearchResultRating(card, rating)
}

// Fetch the rating from the API
async function fetchDoctorRating(doctorName, address) {
  console.log(`🔍 Searching for: ${doctorName}`)

  try {
    const response = await fetch(
      `${doctonoteConfig.BACKEND_URL}/api/doctor-rating?doctorName=${encodeURIComponent(doctorName)}&address=${encodeURIComponent(address)}`
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const ratingData = await response.json()

    // Add fallback URL if placeId is not provided
    if (!ratingData.placeId && !ratingData.placeUrl) {
      const searchQuery = encodeURIComponent(`${doctorName} ${address}`)
      ratingData.placeUrl = `https://www.google.com/maps/search/${searchQuery}`
    }

    saveRatingToStorage(doctorName, address, ratingData)
    return ratingData
  } catch (error) {
    console.error(`❌ Error fetching rating for ${doctorName}:`, error)
    return {
      rating: "N/A",
      reviewsCount: 0,
      placeUrl: `https://www.google.com/maps/search/${encodeURIComponent(doctorName)}`
    }
  }
}

async function saveRatingToStorage(doctorName, address, ratingData) {
  const key = `${doctorName}-${address}`
  try {
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      await browser.storage.local.set({ [key]: ratingData })
      console.log(`📦 Rating cached for ${doctorName}`)

      const storedData = await browser.storage.local.get(key)
      console.log(`🔍 Verified stored data:`, storedData)
    }

    else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [key]: ratingData })
      console.log(`📦 Rating cached for ${doctorName}`)

      const storedData = await chrome.storage.local.get(key)
      console.log(`🔍 Verified stored data:`, storedData)
    }
  } catch (storageError) {
    console.warn('⚠️ Could not cache rating data:', storageError)
  }
}

// Display the rating badge on the doctor profile page
function displayProfileRatingBadge(ratingData) {
  const existingBadge = document.getElementById("doctonote-badge")
  if (existingBadge) existingBadge.remove()

  const badge = document.createElement("div")
  badge.id = "doctonote-badge"
  badge.className = "doctonote-rating-badge"
  badge.style.cursor = "pointer"

  // Add click handler to open Google Maps reviews
  badge.addEventListener("click", () => {
    console.log("🔗 Opening Google Maps reviews for this doctor")
    console.log("📊 Rating data:", ratingData)

    if (ratingData.placeId) {
      const url = `https://www.google.com/maps/place/?q=place_id:${ratingData.placeId}`
      console.log("🔗 Opening URL:", url)
      window.open(url, "_blank")
    } else if (ratingData.placeUrl) {
      console.log("🔗 Opening place URL:", ratingData.placeUrl)
      window.open(ratingData.placeUrl, "_blank")
    } else if (ratingData.placeName) {
      const searchQuery = encodeURIComponent(ratingData.placeName)
      const url = `https://www.google.com/maps/search/${searchQuery}`
      console.log("🔗 Opening search URL:", url)
      window.open(url, "_blank")
    } else {
      console.warn("⚠️ No valid URL data found in rating:", ratingData)
    }
  })

  const ratingStars = document.createElement("div")
  ratingStars.className = "doctonote-stars"

  const fullStars = Math.floor(ratingData.rating)
  for (let i = 0; i < fullStars; i++) {
    const star = document.createElement("span")
    star.className = "doctonote-star-full"
    star.textContent = "★"
    ratingStars.appendChild(star)
  }

  if (ratingData.rating % 1 >= 0.5) {
    const halfStar = document.createElement("span")
    halfStar.className = "doctonote-star-half"
    halfStar.textContent = "★"
    ratingStars.appendChild(halfStar)
  }

  const emptyStars = 5 - Math.ceil(ratingData.rating)
  for (let i = 0; i < emptyStars; i++) {
    const star = document.createElement("span")
    star.className = "doctonote-star-empty"
    star.textContent = "☆"
    ratingStars.appendChild(star)
  }

  const ratingText = document.createElement("div")
  ratingText.className = "doctonote-rating-text"
  ratingText.textContent = `${ratingData.rating}/5 (${ratingData.reviewsCount} avis)`

  const attribution = document.createElement("div")
  attribution.className = "doctonote-attribution"
  attribution.textContent = "Source: Google Maps"

  badge.appendChild(ratingStars)
  badge.appendChild(ratingText)
  badge.appendChild(attribution)

  const targetElement = document.querySelector(".dl-profile-wrapper.dl-profile-header-wrapper")
  if (targetElement) {
    targetElement.appendChild(badge)
  }
}

function displaySearchResultRating(card, ratingData) {
  const badge = document.createElement("div")
  badge.className = "doctonote-rating-badge doctonote-search-badge"
  badge.style.cursor = "pointer"

  // Make the badge clickable to open Google Maps reviews
  badge.addEventListener("click", () => {
    console.log("🔗 Opening Google Maps reviews for this doctor")
    console.log("📊 Rating data:", ratingData)

    if (ratingData.placeId) {
      const url = `https://www.google.com/maps/place/?q=place_id:${ratingData.placeId}`
      console.log("🔗 Opening URL:", url)
      window.open(url, "_blank")
    } else if (ratingData.placeUrl) {
      console.log("🔗 Opening place URL:", ratingData.placeUrl)
      window.open(ratingData.placeUrl, "_blank")
    } else if (ratingData.placeName) {
      const searchQuery = encodeURIComponent(ratingData.placeName)
      const url = `https://www.google.com/maps/search/${searchQuery}`
      console.log("🔗 Opening search URL:", url)
      window.open(url, "_blank")
    } else {
      console.warn("⚠️ No valid URL data found in rating:", ratingData)
    }
  })

  const ratingDisplay = document.createElement("div")
  ratingDisplay.className = "doctonote-search-rating"

  const starIcon = document.createElement("span")
  starIcon.className = "doctonote-star-icon"
  starIcon.textContent = "★"
  ratingDisplay.appendChild(starIcon)

  const ratingText = document.createElement("span")
  ratingText.className = "doctonote-search-rating-text"
  ratingText.textContent = `${ratingData.rating}/5 (${ratingData.reviewsCount})`
  ratingDisplay.appendChild(ratingText)

  badge.appendChild(ratingDisplay)

  const addressSection = card.querySelector(".mt-8")

  if (addressSection) {
    addressSection.insertAdjacentElement("beforebegin", badge)
  } else {
    const insertPoint = card.querySelector(".dl-justify-center") ||
      card.querySelector(".dl-card-content")

    if (insertPoint) {
      insertPoint.insertAdjacentElement("beforebegin", badge)
    } else {
      card.appendChild(badge)
    }
  }
}

// Debug function to check storage
async function debugStorage() {
  try {
    const allData = await browser.storage.local.get(null)
    console.log('📦 All stored data:', allData)
    return allData
  } catch (error) {
    console.error('❌ Error accessing storage:', error)
    return null
  }
} 
const BACKEND_URL = "https://doctolib-notes.vercel.app"
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Firefox exposes the promise-based `browser`, Chrome MV3 a promise-based `chrome`
const storage = (globalThis.browser ?? globalThis.chrome).storage.local

// Search results: no stable card class anymore, so anchor on the doctor name (h2 inside
// the profile link) and on the address row (location icon)
const SEARCH_NAME_SELECTOR = "a[href] h2"
const ADDRESS_ICON_SELECTOR = "svg[data-icon-name='regular/location-dot']"
const PROFILE_NAME_SELECTOR = ".dl-profile-header-name"
const PROFILE_ADDRESS_SELECTOR = "[data-test='location'] .dl-text"
const PROFILE_BADGE_TARGET_SELECTOR = ".dl-profile-wrapper.dl-profile-header-wrapper"

console.log("🔍 DoctoNote extension activated on Doctolib!")

let scheduled = false
function scheduleInit() {
  if (scheduled) return
  scheduled = true
  // Batch bursts of DOM mutations (SPA rendering) into a single pass
  setTimeout(() => {
    scheduled = false
    initDoctoNote()
  }, 300)
}

scheduleInit()
new MutationObserver(scheduleInit).observe(document.documentElement, { childList: true, subtree: true })

function initDoctoNote() {
  const searchResults = findSearchResults()
  if (searchResults.length > 0) {
    processSearchResults(searchResults)
    return
  }

  const doctorName = document.querySelector(PROFILE_NAME_SELECTOR)
  const doctorAddress = document.querySelector(PROFILE_ADDRESS_SELECTOR)
  if (doctorName && doctorAddress) {
    processDoctorProfile(doctorName.textContent.trim(), doctorAddress.textContent.trim())
  }
}

let currentProfileKey = null
async function processDoctorProfile(doctorName, address) {
  const key = cacheKey(doctorName, address)
  if (currentProfileKey === key && document.getElementById("doctonote-badge")) return
  currentProfileKey = key

  console.log("🩺 Processing doctor profile:", doctorName, address)
  displayProfileRatingBadge({ rating: "…", reviewsCount: 0 }, doctorName, address)
  const rating = await getRating(doctorName, address)
  if (currentProfileKey !== key) return
  displayProfileRatingBadge(rating, doctorName, address)
}

// Returns [{ nameElement, addressRow }] for each result card that has both a name and an address
function findSearchResults() {
  const results = []
  for (const nameElement of document.querySelectorAll(SEARCH_NAME_SELECTOR)) {
    // Walk up from the name until reaching the card that also holds the address row
    let card = nameElement.parentElement
    while (card && card !== document.body && !card.querySelector(ADDRESS_ICON_SELECTOR)) {
      card = card.parentElement
    }
    // Reached a container spanning several doctors: this h2 is not a result card name
    if (!card || card.querySelectorAll(SEARCH_NAME_SELECTOR).length > 1) continue
    const addressIcon = card?.querySelector(ADDRESS_ICON_SELECTOR)
    const addressRow = addressIcon?.parentElement?.parentElement
    if (addressRow) results.push({ nameElement, addressRow })
  }
  return results
}

function extractDoctorName(nameElement) {
  // Drop screen-reader suffixes like ", Consultation vidéo disponible"
  const clone = nameElement.cloneNode(true)
  clone.querySelectorAll(".sr-only").forEach(el => el.remove())
  return clone.textContent.trim()
}

async function processSearchResults(results) {
  for (const { nameElement, addressRow } of results) {
    if (nameElement.dataset.doctonote) continue
    nameElement.dataset.doctonote = "pending"

    const doctorName = extractDoctorName(nameElement)
    const address = Array.from(addressRow.querySelectorAll("p"))
      .map(el => el.textContent.trim())
      .filter(Boolean)
      .join(", ")

    const rating = await getRating(doctorName, address)
    displaySearchResultRating(addressRow, rating, doctorName, address)
    nameElement.dataset.doctonote = "done"
  }
}

function cacheKey(doctorName, address) {
  return `${doctorName}-${address}`
}

async function getRating(doctorName, address) {
  const key = cacheKey(doctorName, address)
  try {
    const cached = (await storage.get(key))[key]
    if (cached?.cachedAt && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached
  } catch (error) {
    console.warn("⚠️ Could not read cache:", error)
  }

  const rating = await fetchDoctorRating(doctorName, address)
  if (!rating) return { rating: "N/A", reviewsCount: 0 }

  try {
    await storage.set({ [key]: { ...rating, cachedAt: Date.now() } })
  } catch (error) {
    console.warn("⚠️ Could not write cache:", error)
  }
  return rating
}

// Returns null on network/server error so that failures are not cached
async function fetchDoctorRating(doctorName, address) {
  try {
    const params = new URLSearchParams({ doctorName, address })
    const response = await fetch(`${BACKEND_URL}/api/doctor-rating?${params}`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error(`❌ Error fetching rating for ${doctorName}:`, error)
    return null
  }
}

function openGoogleMaps(ratingData, doctorName, address) {
  const url = ratingData.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${ratingData.placeId}`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${doctorName} ${address}`)}`
  window.open(url, "_blank", "noopener")
}

function toNumber(rating) {
  const value = parseFloat(rating)
  return Number.isNaN(value) ? null : value
}

function formatRating(ratingData, withReviewsLabel) {
  const value = toNumber(ratingData.rating)
  if (value === null) return ratingData.rating === "N/A" ? "Pas de note" : ratingData.rating
  const reviews = withReviewsLabel ? `${ratingData.reviewsCount} avis` : ratingData.reviewsCount
  return `${value.toFixed(1)}/5 (${reviews})`
}

function createStars(rating) {
  const stars = document.createElement("div")
  stars.className = "doctonote-stars"
  const value = toNumber(rating)
  if (value === null) return stars

  const full = Math.floor(value)
  const half = value - full >= 0.5 ? 1 : 0
  const parts = [
    ...Array(full).fill(["doctonote-star-full", "★"]),
    ...Array(half).fill(["doctonote-star-half", "★"]),
    ...Array(5 - full - half).fill(["doctonote-star-empty", "☆"])
  ]
  for (const [className, char] of parts) {
    const star = document.createElement("span")
    star.className = className
    star.textContent = char
    stars.appendChild(star)
  }
  return stars
}

function displayProfileRatingBadge(ratingData, doctorName, address) {
  const targetElement = document.querySelector(PROFILE_BADGE_TARGET_SELECTOR)
    ?? document.querySelector(PROFILE_NAME_SELECTOR)?.parentElement
  if (!targetElement) return

  document.getElementById("doctonote-badge")?.remove()

  const badge = document.createElement("div")
  badge.id = "doctonote-badge"
  badge.className = "doctonote-rating-badge"
  badge.addEventListener("click", () => openGoogleMaps(ratingData, doctorName, address))

  const ratingText = document.createElement("div")
  ratingText.className = "doctonote-rating-text"
  ratingText.textContent = formatRating(ratingData, true)

  const attribution = document.createElement("div")
  attribution.className = "doctonote-attribution"
  attribution.textContent = "Source : Google Maps"

  badge.append(createStars(ratingData.rating), ratingText, attribution)
  targetElement.appendChild(badge)
}

function displaySearchResultRating(addressRow, ratingData, doctorName, address) {
  const badge = document.createElement("div")
  badge.className = "doctonote-rating-badge doctonote-search-badge"
  badge.addEventListener("click", (event) => {
    // Cards link to the profile: don't navigate when clicking the badge
    event.preventDefault()
    event.stopPropagation()
    openGoogleMaps(ratingData, doctorName, address)
  })

  const ratingDisplay = document.createElement("div")
  ratingDisplay.className = "doctonote-search-rating"

  const starIcon = document.createElement("span")
  starIcon.className = "doctonote-star-icon"
  starIcon.textContent = "★"

  const ratingText = document.createElement("span")
  ratingText.className = "doctonote-search-rating-text"
  ratingText.textContent = formatRating(ratingData, false)

  ratingDisplay.append(starIcon, ratingText)
  badge.appendChild(ratingDisplay)

  addressRow.insertAdjacentElement("beforebegin", badge)
}

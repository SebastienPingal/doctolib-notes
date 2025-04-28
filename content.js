console.log("🔍 DoctoNote extension activated on Doctolib!")

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initDoctoNote, 1000)
})

// Look for changes in the URL
let lastUrl = location.href
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    setTimeout(initDoctoNote, 1000)
  }
}).observe(document, { subtree: true, childList: true })

// Look for changes in the DOM
new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && 
            (node.classList?.contains("search-result-card") || 
             node.querySelector?.(".search-result-card"))) {
          setTimeout(initDoctoNote, 1000)
          return
        }
      }
    }
  }
}).observe(document.body, { childList: true, subtree: true })

function initDoctoNote() {
  // Search results page
  const searchResultCards = document.querySelectorAll(".search-result-card")
  if (searchResultCards.length > 0) {
    console.log("🔎 Processing search results")
    processSearchResults()
    return
  }
  
  // Doctor profile page
  const profileCard = document.querySelector(".dl-profile-card")
  const doctorNameH1 = document.querySelector("h1")
  if (profileCard && doctorNameH1) {
    console.log("🩺 Processing doctor profile")
    extractDoctorInfo()
  }
}

async function extractDoctorInfo() {
  const nameElement = document.querySelector("h1")
  if (!nameElement) return
  
  const doctorName = nameElement.textContent.trim()
  const specialty = document.querySelector("h2")?.textContent.trim() || ""
  const address = document.querySelector(".dl-profile-card-address")?.textContent.trim() || ""
  
  console.log(`👨‍⚕️ Doctor: ${doctorName}`)

  const rating = await fetchDoctorRating(doctorName, address)
  displayRatingBadge(rating)
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
  
  const rating = await fetchDoctorRating(doctorName, address)
  displaySearchResultRating(card, rating)
}

async function fetchDoctorRating(doctorName, address) {
  console.log(`🔍 Searching for: ${doctorName}`)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Mock data - in a real extension this would come from an API
  return {
    rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
    reviewsCount: Math.floor(Math.random() * 50) + 5 // Random number of reviews
  }
}

function displayRatingBadge(ratingData) {
  const existingBadge = document.getElementById("doctonote-badge")
  if (existingBadge) existingBadge.remove()
  
  const badge = document.createElement("div")
  badge.id = "doctonote-badge"
  badge.className = "doctonote-rating-badge"
  
  const ratingStars = document.createElement("div")
  ratingStars.className = "doctonote-stars"
  
  // Full stars
  const fullStars = Math.floor(ratingData.rating)
  for (let i = 0; i < fullStars; i++) {
    const star = document.createElement("span")
    star.className = "doctonote-star-full"
    star.textContent = "★"
    ratingStars.appendChild(star)
  }
  
  // Half star if needed
  if (ratingData.rating % 1 >= 0.5) {
    const halfStar = document.createElement("span")
    halfStar.className = "doctonote-star-half"
    halfStar.textContent = "★"
    ratingStars.appendChild(halfStar)
  }
  
  // Empty stars
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
  
  const targetElement = document.querySelector(".dl-profile-card")
  if (targetElement) {
    targetElement.insertAdjacentElement("afterbegin", badge)
  }
}

function displaySearchResultRating(card, ratingData) {
  const badge = document.createElement("div")
  badge.className = "doctonote-rating-badge doctonote-search-badge"
  
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
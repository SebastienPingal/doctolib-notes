const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
require('dotenv').config()

const app = express()

// Configure CORS to allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

app.get('/api/doctor-rating', async (req, res) => {
  try {
    const { doctorName, address } = req.query
    console.log('🔍 Received request for doctor rating:', { doctorName, address })
    
    if (!doctorName || !address) {
      console.log('❌ Missing required parameters')
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('❌ Google Maps API key is not set')
      return res.status(500).json({ error: 'Server configuration error' })
    }
    
    // Format the query to be more specific for Google Maps
    const query = `doctor ${doctorName} ${address}`
    const encodedQuery = encodeURIComponent(query)
    
    console.log('🔍 Making Google Maps API request for:', query)
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    
    if (!response.ok) {
      console.error('❌ Google Maps API error:', response.status)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()

    if (data.error_message) {
      console.error('❌ Google Maps API error:', data.status, data.error_message)
      return res.status(500).json({ error: 'Google Maps API error' })
    }

    const place = data.results?.[0]
    if (!place) {
      console.log('⚠️ No results found for:', doctorName)
      return res.json({ rating: "N/A", reviewsCount: 0 })
    }

    // A matching place may exist without any review
    console.log('✅ Found place for:', doctorName, place.name, place.rating)
    return res.json({
      rating: typeof place.rating === 'number' ? place.rating : "N/A",
      reviewsCount: place.user_ratings_total ?? 0,
      placeId: place.place_id
    })
  } catch (error) {
    console.error('❌ Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Export the Express app for Vercel
module.exports = app 
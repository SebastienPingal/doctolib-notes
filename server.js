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
    console.log('🔍 Received request for doctor rating:', {
      doctorName: req.query.doctorName,
      address: req.query.address,
      headers: req.headers
    })
    
    const { doctorName, address } = req.query
    
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
    console.log('📦 Google Maps API response:', data)
    
    if (data.error_message) {
      console.error('❌ Google Maps API error:', data.error_message)
      return res.status(500).json({ error: 'Google Maps API error' })
    }
    
    if (data.results && data.results.length > 0) {
      const place = data.results[0]
      console.log('✅ Found rating for:', doctorName, place.rating)
      return res.json({
        rating: place.rating.toFixed(1),
        reviewsCount: place.user_ratings_total,
        placeId: place.place_id
      })
    }
    
    console.log('⚠️ No results found for:', doctorName)
    return res.json({
      rating: "N/A",
      reviewsCount: 0
    })
  } catch (error) {
    console.error('❌ Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Export the Express app for Vercel
module.exports = app 
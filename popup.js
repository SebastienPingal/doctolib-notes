document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 DoctoNote popup ouvert")

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const currentTab = tabs[0]
  const statusElement = document.getElementById('status')

  if (!currentTab.url.includes('doctolib.fr')) {
    updateStatus("Extension inactive - Visitez Doctolib.fr", 'inactive')
    return
  }

  try {
    const results = await chrome.tabs.executeScript(currentTab.id, {
      code: `
        (function() {
          const searchResults = document.querySelectorAll(".search-result-card");
          if (searchResults.length > 0) return "search";
          
          const profileCard = document.querySelector(".dl-profile-card");
          const doctorNameH1 = document.querySelector("h1");
          if (profileCard && doctorNameH1) return "profile";
          
          return "other";
        })();
      `
    })

    const pageType = results[0]

  } catch (error) {
    console.error("Erreur:", error)
    updateStatus("Extension active - Vérification impossible", null)
  }

  function updateStatus(message, statusClass) {
    statusElement.textContent = message

    // Réinitialiser les classes
    statusElement.classList.remove('active', 'inactive')

    // Ajouter la nouvelle classe si spécifiée
    if (statusClass) {
      statusElement.classList.add(statusClass)
    }
  }
}) 
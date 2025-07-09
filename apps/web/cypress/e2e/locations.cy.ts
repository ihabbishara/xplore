describe('Location Discovery & Wishlist', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('user@example.com', 'SecurePassword123!')
  })

  describe('Location Search', () => {
    beforeEach(() => {
      cy.visit('/locations')
    })

    it('should search for locations', () => {
      // Mock search API
      cy.intercept('GET', '/api/locations/search*', {
        statusCode: 200,
        body: {
          results: [
            {
              id: 'loc-1',
              placeId: 'place.123',
              name: 'Paris',
              country: 'France',
              city: 'Paris',
              region: 'Île-de-France',
              address: 'Paris, France',
              coordinates: { lat: 48.8566, lng: 2.3522 },
              type: 'city',
            },
            {
              id: 'loc-2',
              placeId: 'place.456',
              name: 'Paris',
              country: 'United States',
              city: 'Paris',
              region: 'Texas',
              address: 'Paris, TX, USA',
              coordinates: { lat: 33.6609, lng: -95.5555 },
              type: 'city',
            },
          ],
        },
      }).as('searchLocations')

      // Type in search box
      cy.get('[data-testid="location-search"]').type('Paris')
      cy.wait('@searchLocations')

      // Should display search results
      cy.get('[data-testid="search-results"]').should('be.visible')
      cy.get('[data-testid="location-card"]').should('have.length', 2)
      
      // Verify first result
      cy.get('[data-testid="location-card"]').first().within(() => {
        cy.contains('Paris').should('be.visible')
        cy.contains('France').should('be.visible')
      })
    })

    it('should handle empty search results', () => {
      cy.intercept('GET', '/api/locations/search*', {
        statusCode: 200,
        body: { results: [] },
      }).as('emptySearch')

      cy.get('[data-testid="location-search"]').type('NonexistentPlace123')
      cy.wait('@emptySearch')

      cy.contains('No locations found').should('be.visible')
      cy.contains('Try adjusting your search').should('be.visible')
    })

    it('should handle search errors gracefully', () => {
      cy.intercept('GET', '/api/locations/search*', {
        statusCode: 500,
        body: { error: 'Search service unavailable' },
      }).as('searchError')

      cy.get('[data-testid="location-search"]').type('Paris')
      cy.wait('@searchError')

      cy.contains('Failed to search locations').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })
  })

  describe('Saving Locations to Wishlist', () => {
    beforeEach(() => {
      cy.visit('/locations')
      
      // Mock initial search
      cy.intercept('GET', '/api/locations/search*', {
        statusCode: 200,
        body: {
          results: [
            {
              id: 'loc-1',
              placeId: 'place.123',
              name: 'Barcelona',
              country: 'Spain',
              city: 'Barcelona',
              coordinates: { lat: 41.3851, lng: 2.1734 },
              type: 'city',
            },
          ],
        },
      }).as('search')

      cy.get('[data-testid="location-search"]').type('Barcelona')
      cy.wait('@search')
    })

    it('should save a location to wishlist', () => {
      // Mock save API
      cy.intercept('POST', '/api/locations/save', {
        statusCode: 201,
        body: {
          id: 'saved-1',
          location: {
            id: 'loc-1',
            name: 'Barcelona',
            country: 'Spain',
          },
          savedAt: new Date().toISOString(),
        },
      }).as('saveLocation')

      // Click save button on location card
      cy.get('[data-testid="location-card"]').first().within(() => {
        cy.get('[data-testid="save-button"]').click()
      })

      cy.wait('@saveLocation')

      // Heart icon should be filled
      cy.get('[data-testid="location-card"]').first().within(() => {
        cy.get('[data-testid="save-button"] svg').should('have.class', 'text-red-500')
      })

      // Success notification
      cy.contains('Location saved to wishlist').should('be.visible')
    })

    it('should add notes and tags when saving', () => {
      // Click on location card to open details
      cy.get('[data-testid="location-card"]').first().click()
      
      // Should open modal/drawer
      cy.get('[data-testid="location-details"]').should('be.visible')
      
      // Add notes
      cy.get('textarea[name="personalNotes"]').type('Want to visit Sagrada Familia')
      
      // Add tags
      cy.get('input[name="tags"]').type('architecture{enter}gaudi{enter}')
      
      // Set rating
      cy.get('[data-testid="rating-star-4"]').click()

      // Mock save with details
      cy.intercept('POST', '/api/locations/save', {
        statusCode: 201,
        body: {
          id: 'saved-1',
          personalNotes: 'Want to visit Sagrada Familia',
          customTags: ['architecture', 'gaudi'],
          rating: 4,
        },
      }).as('saveWithDetails')

      // Save
      cy.get('button[data-testid="save-with-details"]').click()
      cy.wait('@saveWithDetails')

      cy.contains('Location saved with your notes').should('be.visible')
    })
  })

  describe('Managing Saved Locations', () => {
    beforeEach(() => {
      // Mock saved locations
      cy.intercept('GET', '/api/locations/saved*', {
        statusCode: 200,
        body: {
          locations: [
            {
              id: 'saved-1',
              location: {
                id: 'loc-1',
                name: 'Tokyo',
                country: 'Japan',
                coordinates: { lat: 35.6762, lng: 139.6503 },
              },
              personalNotes: 'Cherry blossom season',
              customTags: ['culture', 'food'],
              rating: 5,
              isFavorite: true,
              savedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 'saved-2',
              location: {
                id: 'loc-2',
                name: 'Bali',
                country: 'Indonesia',
                coordinates: { lat: -8.3405, lng: 115.0920 },
              },
              rating: 4,
              isFavorite: false,
              savedAt: '2024-01-02T00:00:00Z',
            },
          ],
          total: 2,
        },
      }).as('getSavedLocations')

      cy.visit('/locations/saved')
      cy.wait('@getSavedLocations')
    })

    it('should display saved locations', () => {
      cy.get('[data-testid="saved-location-card"]').should('have.length', 2)
      
      // Check first location
      cy.get('[data-testid="saved-location-card"]').first().within(() => {
        cy.contains('Tokyo').should('be.visible')
        cy.contains('Japan').should('be.visible')
        cy.contains('Cherry blossom season').should('be.visible')
        cy.contains('culture').should('be.visible')
        cy.get('[data-testid="rating-display"]').should('contain', '5')
        cy.get('[data-testid="favorite-icon"]').should('have.class', 'text-yellow-500')
      })
    })

    it('should filter saved locations', () => {
      // Filter by favorites
      cy.get('[data-testid="filter-favorites"]').click()
      
      cy.intercept('GET', '/api/locations/saved?favorites=true*', {
        statusCode: 200,
        body: {
          locations: [
            {
              id: 'saved-1',
              location: { name: 'Tokyo', country: 'Japan' },
              isFavorite: true,
            },
          ],
          total: 1,
        },
      }).as('getFavorites')

      cy.wait('@getFavorites')
      cy.get('[data-testid="saved-location-card"]').should('have.length', 1)
      cy.contains('Tokyo').should('be.visible')

      // Filter by tag
      cy.get('[data-testid="filter-tag-culture"]').click()
      
      cy.intercept('GET', '/api/locations/saved?tags=culture*', {
        statusCode: 200,
        body: {
          locations: [
            {
              id: 'saved-1',
              location: { name: 'Tokyo', country: 'Japan' },
              customTags: ['culture'],
            },
          ],
          total: 1,
        },
      }).as('getByTag')

      cy.wait('@getByTag')
    })

    it('should update saved location', () => {
      // Click edit on first location
      cy.get('[data-testid="saved-location-card"]').first().within(() => {
        cy.get('[data-testid="edit-button"]').click()
      })

      // Update notes
      cy.get('textarea[name="personalNotes"]').clear().type('Visit in April for sakura')
      
      // Update rating
      cy.get('[data-testid="rating-star-4"]').click()

      // Mock update API
      cy.intercept('PUT', '/api/locations/saved/saved-1', {
        statusCode: 200,
        body: {
          id: 'saved-1',
          personalNotes: 'Visit in April for sakura',
          rating: 4,
        },
      }).as('updateLocation')

      cy.get('button[data-testid="save-changes"]').click()
      cy.wait('@updateLocation')

      cy.contains('Location updated').should('be.visible')
    })

    it('should remove location from wishlist', () => {
      // Mock remove API
      cy.intercept('DELETE', '/api/locations/saved/saved-1', {
        statusCode: 200,
      }).as('removeLocation')

      // Click remove on first location
      cy.get('[data-testid="saved-location-card"]').first().within(() => {
        cy.get('[data-testid="remove-button"]').click()
      })

      // Confirm removal
      cy.get('[data-testid="confirm-remove"]').click()
      cy.wait('@removeLocation')

      cy.contains('Location removed from wishlist').should('be.visible')
      
      // Should update the list
      cy.get('[data-testid="saved-location-card"]').should('have.length', 1)
    })
  })

  describe('Map View', () => {
    beforeEach(() => {
      // Mock map locations
      cy.intercept('GET', '/api/locations/saved/map', {
        statusCode: 200,
        body: [
          {
            id: 'loc-1',
            coordinates: { lat: 48.8566, lng: 2.3522 },
            name: 'Paris',
            type: 'city',
            isFavorite: true,
            rating: 5,
          },
          {
            id: 'loc-2',
            coordinates: { lat: 41.3851, lng: 2.1734 },
            name: 'Barcelona',
            type: 'city',
            isFavorite: false,
            rating: 4,
          },
        ],
      }).as('getMapLocations')

      cy.visit('/locations/map')
      cy.wait('@getMapLocations')
    })

    it('should display locations on map', () => {
      // Map should be visible
      cy.get('[data-testid="location-map"]').should('be.visible')
      
      // Markers should be rendered
      cy.get('.mapboxgl-marker').should('have.length', 2)
      
      // Legend should show location types
      cy.get('[data-testid="map-legend"]').within(() => {
        cy.contains('Favorite').should('be.visible')
        cy.contains('Regular').should('be.visible')
      })
    })

    it('should show location details on marker click', () => {
      // Click first marker
      cy.get('.mapboxgl-marker').first().click()
      
      // Popup should appear
      cy.get('.mapboxgl-popup').should('be.visible')
      cy.get('.mapboxgl-popup-content').within(() => {
        cy.contains('Paris').should('be.visible')
        cy.get('[data-testid="popup-rating"]').should('contain', '5')
      })
    })

    it('should toggle between map and list view', () => {
      // Should start in map view
      cy.get('[data-testid="location-map"]').should('be.visible')
      
      // Switch to list view
      cy.get('[data-testid="view-toggle-list"]').click()
      
      // Map should be hidden, list visible
      cy.get('[data-testid="location-map"]').should('not.exist')
      cy.get('[data-testid="location-list"]').should('be.visible')
      
      // Switch back to map
      cy.get('[data-testid="view-toggle-map"]').click()
      cy.get('[data-testid="location-map"]').should('be.visible')
    })
  })

  describe('Popular Destinations', () => {
    it('should display and interact with popular destinations', () => {
      cy.intercept('GET', '/api/locations/popular', {
        statusCode: 200,
        body: [
          {
            id: 'pop-1',
            name: 'Paris',
            country: 'France',
            image: '/images/paris.jpg',
            description: 'City of Light',
          },
          {
            id: 'pop-2',
            name: 'Tokyo',
            country: 'Japan',
            image: '/images/tokyo.jpg',
            description: 'Modern metropolis',
          },
        ],
      }).as('getPopular')

      cy.visit('/locations')
      cy.wait('@getPopular')

      // Popular destinations section
      cy.get('[data-testid="popular-destinations"]').within(() => {
        cy.contains('Popular Destinations').should('be.visible')
        cy.get('[data-testid="destination-card"]').should('have.length', 2)
      })

      // Click on a popular destination
      cy.get('[data-testid="destination-card"]').first().click()
      
      // Should open details
      cy.get('[data-testid="location-details"]').should('be.visible')
      cy.contains('Paris').should('be.visible')
      cy.contains('City of Light').should('be.visible')
    })
  })
})
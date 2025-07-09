/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { LocationCard } from '../LocationCard'
import locationReducer, { saveLocation, removeLocation, toggleFavorite } from '../../store/locationSlice'
import { LocationSearchResult, SavedLocation } from '@xplore/shared'

// Mock the actions
jest.mock('../../store/locationSlice', () => ({
  ...jest.requireActual('../../store/locationSlice'),
  saveLocation: jest.fn(),
  removeLocation: jest.fn(),
  toggleFavorite: jest.fn(),
}))

const mockStore = configureStore({
  reducer: {
    locations: locationReducer,
  },
})

const mockSearchResult: LocationSearchResult = {
  id: 'location-1',
  placeId: 'place.123',
  name: 'Paris',
  country: 'France',
  city: 'Paris',
  region: 'Île-de-France',
  address: 'Paris, France',
  coordinates: { lat: 48.8566, lng: 2.3522 },
  type: 'city',
}

const mockSavedLocation: SavedLocation = {
  id: 'saved-1',
  location: mockSearchResult,
  personalNotes: 'Want to visit the Eiffel Tower',
  customTags: ['romantic', 'culture'],
  rating: 5,
  isFavorite: true,
  savedAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  )
}

describe('LocationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(saveLocation as unknown as jest.Mock).mockReturnValue({
      type: 'locations/saveLocation',
      payload: {}
    })
    ;(removeLocation as unknown as jest.Mock).mockReturnValue({
      type: 'locations/removeLocation',
      payload: {}
    })
    ;(toggleFavorite as unknown as jest.Mock).mockReturnValue({
      type: 'locations/toggleFavorite',
      payload: {}
    })
  })

  describe('Search Result Display', () => {
    it('should render location search result correctly', () => {
      renderWithProvider(<LocationCard location={mockSearchResult} />)

      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('Paris, Île-de-France, France')).toBeInTheDocument()
    })

    it('should show save button for search results', () => {
      renderWithProvider(<LocationCard location={mockSearchResult} />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeInTheDocument()
      
      // Check that heart icon is not filled
      const svg = saveButton.querySelector('svg')
      expect(svg).toHaveClass('text-gray-600')
      expect(svg).not.toHaveClass('text-red-500')
    })

    it('should handle saving a location', async () => {
      const user = userEvent.setup()
      const onSave = jest.fn()
      
      renderWithProvider(
        <LocationCard location={mockSearchResult} onSave={onSave} />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(saveLocation).toHaveBeenCalledWith({
          placeId: mockSearchResult.placeId,
          name: mockSearchResult.name,
          country: mockSearchResult.country,
          city: mockSearchResult.city,
          region: mockSearchResult.region,
          address: mockSearchResult.address,
          latitude: mockSearchResult.coordinates.lat,
          longitude: mockSearchResult.coordinates.lng,
          placeType: mockSearchResult.type,
          metadata: mockSearchResult.metadata,
        })
      })
    })
  })

  describe('Saved Location Display', () => {
    it('should render saved location correctly', () => {
      renderWithProvider(<LocationCard location={mockSavedLocation} isSaved={true} />)

      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('Want to visit the Eiffel Tower')).toBeInTheDocument()
      expect(screen.getByText('romantic')).toBeInTheDocument()
      expect(screen.getByText('culture')).toBeInTheDocument()
    })

    it('should show filled heart icon for saved locations', () => {
      renderWithProvider(<LocationCard location={mockSavedLocation} isSaved={true} />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      const svg = saveButton.querySelector('svg')
      
      expect(svg).toHaveClass('text-red-500')
      expect(svg).toHaveClass('fill-current')
    })

    it('should display rating stars correctly', () => {
      renderWithProvider(<LocationCard location={mockSavedLocation} isSaved={true} />)

      const stars = screen.getAllByRole('img', { hidden: true }) // SVG stars
      const filledStars = stars.filter(star => 
        star.classList.contains('text-yellow-400')
      )
      
      expect(filledStars).toHaveLength(5) // All 5 stars should be filled for rating 5
    })

    it('should display favorite star when location is favorited', () => {
      renderWithProvider(<LocationCard location={mockSavedLocation} isSaved={true} />)

      const favoriteButton = screen.getAllByRole('button')[1] // Second button is favorite
      const svg = favoriteButton.querySelector('svg')
      
      expect(svg).toHaveClass('fill-current')
    })

    it('should handle removing a saved location', async () => {
      const user = userEvent.setup()
      const onRemove = jest.fn()
      
      renderWithProvider(
        <LocationCard 
          location={mockSavedLocation} 
          isSaved={true}
          onRemove={onRemove}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(removeLocation).toHaveBeenCalledWith(mockSearchResult.id)
      })
    })

    it('should handle toggling favorite status', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <LocationCard location={mockSavedLocation} isSaved={true} />
      )

      const favoriteButton = screen.getAllByRole('button')[1]
      await user.click(favoriteButton)

      expect(toggleFavorite).toHaveBeenCalledWith(mockSavedLocation.id)
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner when saving', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      ;(saveLocation as unknown as jest.Mock).mockImplementation(() => ({
        type: 'locations/saveLocation',
        payload: new Promise(resolve => setTimeout(resolve, 100))
      }))
      
      renderWithProvider(<LocationCard location={mockSearchResult} />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Check for loading spinner
      const spinner = saveButton.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should disable save button while loading', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(<LocationCard location={mockSearchResult} />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(saveButton).toBeDisabled()
    })
  })

  describe('View Details', () => {
    it('should show view details button when callback provided', () => {
      const onViewDetails = jest.fn()
      
      renderWithProvider(
        <LocationCard 
          location={mockSearchResult} 
          onViewDetails={onViewDetails}
        />
      )

      const detailsButton = screen.getByText('View Details')
      expect(detailsButton).toBeInTheDocument()
    })

    it('should call onViewDetails when clicked', async () => {
      const user = userEvent.setup()
      const onViewDetails = jest.fn()
      
      renderWithProvider(
        <LocationCard 
          location={mockSearchResult} 
          onViewDetails={onViewDetails}
        />
      )

      const detailsButton = screen.getByText('View Details')
      await user.click(detailsButton)

      expect(onViewDetails).toHaveBeenCalled()
    })

    it('should not show view details button when callback not provided', () => {
      renderWithProvider(<LocationCard location={mockSearchResult} />)

      const detailsButton = screen.queryByText('View Details')
      expect(detailsButton).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle locations without optional fields', () => {
      const minimalLocation: LocationSearchResult = {
        ...mockSearchResult,
        city: undefined,
        region: undefined,
      }

      renderWithProvider(<LocationCard location={minimalLocation} />)

      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('France')).toBeInTheDocument()
    })

    it('should handle saved locations without notes or tags', () => {
      const minimalSavedLocation: SavedLocation = {
        ...mockSavedLocation,
        personalNotes: undefined,
        customTags: [],
      }

      renderWithProvider(<LocationCard location={minimalSavedLocation} isSaved={true} />)

      expect(screen.queryByText('Want to visit the Eiffel Tower')).not.toBeInTheDocument()
      expect(screen.queryByText('romantic')).not.toBeInTheDocument()
    })

    it('should handle errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      
      ;(saveLocation as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Save failed')
      })
      
      renderWithProvider(<LocationCard location={mockSearchResult} />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(consoleError).toHaveBeenCalledWith('Failed to toggle save:', expect.anything())
      
      consoleError.mockRestore()
    })
  })
})
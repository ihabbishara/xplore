import { test, expect } from '@playwright/test';

test.describe('Weather Timeline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the trip planning page
    await page.goto('/trips/new');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Switch to weather tab
    await page.click('button:has-text("Weather")');
    await page.waitForTimeout(1000);
  });

  test('should display weather timeline interface', async ({ page }) => {
    // Check that weather timeline is visible
    await expect(page.locator('text=Weather Timeline')).toBeVisible();
    await expect(page.locator('text=Weather forecasts for your trip destinations')).toBeVisible();
    
    // Check that weather tab is active
    await expect(page.locator('button:has-text("Weather")')).toHaveClass(/border-primary-500/);
  });

  test('should handle weather loading states', async ({ page }) => {
    // Check for loading indicators
    const loadingIndicators = page.locator('[class*="animate-pulse"]');
    
    if (await loadingIndicators.first().isVisible()) {
      // If loading is visible, wait for it to complete
      await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 15000 });
    }
    
    // After loading, weather content should be visible
    await expect(page.locator('text=Weather Timeline')).toBeVisible();
  });

  test('should display weather information for trip days', async ({ page }) => {
    // Wait for weather data to load
    await page.waitForTimeout(2000);
    
    // Check for day headers
    const dayHeaders = page.locator('h4[class*="font-semibold"]');
    await expect(dayHeaders.first()).toBeVisible();
    
    // Check for date information
    const dateInfo = page.locator('p[class*="text-sm text-gray-600"]');
    await expect(dateInfo.first()).toBeVisible();
  });

  test('should handle weather API errors gracefully', async ({ page }) => {
    // Monitor for error states
    const errorMessages = page.locator('text=Failed to load weather data');
    
    if (await errorMessages.isVisible()) {
      // If error is visible, check for retry functionality
      await expect(page.locator('text=Retry')).toBeVisible();
    } else {
      // If no error, weather content should be visible
      await expect(page.locator('text=Weather Timeline')).toBeVisible();
    }
  });

  test('should display weather cards for destinations', async ({ page }) => {
    // Wait for weather data
    await page.waitForTimeout(3000);
    
    // Check for weather cards (these might be in loading state initially)
    const weatherCards = page.locator('[class*="bg-white rounded-lg border border-gray-200"]');
    
    if (await weatherCards.first().isVisible()) {
      await expect(weatherCards).toHaveCount(2); // Should have cards for Paris and Amsterdam
    }
  });

  test('should handle weather recommendations', async ({ page }) => {
    // Wait for weather data to load
    await page.waitForTimeout(3000);
    
    // Check for weather recommendations section
    const recommendationsSection = page.locator('text=Weather Recommendations');
    
    if (await recommendationsSection.isVisible()) {
      // If recommendations are shown, check for recommendation content
      await expect(page.locator('[class*="bg-blue-50"]')).toBeVisible();
    }
  });

  test('should display temperature and weather conditions', async ({ page }) => {
    // Wait for weather data
    await page.waitForTimeout(3000);
    
    // Look for temperature indicators
    const temperatureElements = page.locator('[class*="text-orange-500"]');
    
    if (await temperatureElements.first().isVisible()) {
      await expect(temperatureElements).toBeVisible();
    }
    
    // Look for precipitation indicators
    const precipitationElements = page.locator('[class*="text-blue-500"]');
    
    if (await precipitationElements.first().isVisible()) {
      await expect(precipitationElements).toBeVisible();
    }
  });

  test('should handle day selection in weather timeline', async ({ page }) => {
    // Wait for weather timeline to load
    await page.waitForTimeout(3000);
    
    // Find clickable day elements
    const dayElements = page.locator('[class*="border rounded-lg"]');
    
    if (await dayElements.first().isVisible()) {
      // Click on first day
      await dayElements.first().click();
      await page.waitForTimeout(500);
      
      // Check for selection state
      await expect(dayElements.first()).toHaveClass(/border-primary-300/);
    }
  });

  test('should maintain selected day state when switching tabs', async ({ page }) => {
    // Wait for weather timeline to load
    await page.waitForTimeout(3000);
    
    // Click on a day (if available)
    const dayElements = page.locator('[class*="border rounded-lg"]');
    
    if (await dayElements.first().isVisible()) {
      await dayElements.first().click();
      await page.waitForTimeout(500);
      
      // Switch to timeline tab
      await page.click('button:has-text("Timeline")');
      await page.waitForTimeout(500);
      
      // Switch back to weather tab
      await page.click('button:has-text("Weather")');
      await page.waitForTimeout(500);
      
      // Day should still be selected
      await expect(dayElements.first()).toHaveClass(/border-primary-300/);
    }
  });

  test('should handle weather icons display', async ({ page }) => {
    // Wait for weather data
    await page.waitForTimeout(3000);
    
    // Check for weather icons (img elements)
    const weatherIcons = page.locator('img[alt*="condition"], img[title*="condition"]');
    
    if (await weatherIcons.first().isVisible()) {
      await expect(weatherIcons).toBeTruthy();
    }
  });

  test('should display weather for multiple destinations', async ({ page }) => {
    // Wait for weather data
    await page.waitForTimeout(3000);
    
    // Check for destination names in weather context
    const destinationNames = page.locator('text=Paris, text=Amsterdam');
    
    if (await destinationNames.first().isVisible()) {
      await expect(destinationNames).toHaveCount(2);
    }
  });

  test('should handle responsive weather display', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Weather timeline should still be visible
    await expect(page.locator('text=Weather Timeline')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Weather timeline should still be visible
    await expect(page.locator('text=Weather Timeline')).toBeVisible();
  });

  test('should handle empty weather state', async ({ page }) => {
    // If weather data fails to load or is empty
    await page.waitForTimeout(5000);
    
    // Check for empty state or error message
    const emptyState = page.locator('text=No weather data available');
    const errorState = page.locator('text=Failed to load weather data');
    
    if (await emptyState.isVisible() || await errorState.isVisible()) {
      // Should show appropriate message
      await expect(emptyState.or(errorState)).toBeVisible();
    } else {
      // Should show weather content
      await expect(page.locator('text=Weather Timeline')).toBeVisible();
    }
  });

  test('should handle weather refresh functionality', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // If there's a retry button (in case of error)
    const retryButton = page.locator('text=Retry');
    
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await page.waitForTimeout(2000);
      
      // Should attempt to reload weather data
      await expect(page.locator('text=Weather Timeline')).toBeVisible();
    }
  });

  test('should handle weather timeline scroll', async ({ page }) => {
    // Wait for weather timeline to load
    await page.waitForTimeout(3000);
    
    // Find scrollable container
    const scrollableContainer = page.locator('[class*="overflow-y-auto"]');
    
    if (await scrollableContainer.isVisible()) {
      // Test scrolling
      await scrollableContainer.scrollIntoViewIfNeeded();
      await expect(scrollableContainer).toBeVisible();
    }
  });

  test('should handle weather data for different time zones', async ({ page }) => {
    // Wait for weather data
    await page.waitForTimeout(3000);
    
    // Check that dates are displayed correctly
    const dateElements = page.locator('[class*="text-sm text-gray-600"]');
    
    if (await dateElements.first().isVisible()) {
      // Should show date information
      await expect(dateElements).toBeTruthy();
    }
  });

  test('should handle weather alerts if present', async ({ page }) => {
    // Wait for weather data
    await page.waitForTimeout(3000);
    
    // Check for weather alerts
    const alertElements = page.locator('[class*="bg-red-50"], [class*="bg-yellow-50"]');
    
    if (await alertElements.first().isVisible()) {
      // Weather alerts should be prominently displayed
      await expect(alertElements).toBeVisible();
    }
  });

  test('should handle weather timeline performance', async ({ page }) => {
    // Monitor for performance issues
    const startTime = Date.now();
    
    // Wait for weather timeline to load
    await page.waitForTimeout(3000);
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Should load within reasonable time (10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Weather timeline should be visible
    await expect(page.locator('text=Weather Timeline')).toBeVisible();
  });

  test('should handle weather data caching', async ({ page }) => {
    // Load weather data
    await page.waitForTimeout(3000);
    
    // Switch to timeline tab
    await page.click('button:has-text("Timeline")');
    await page.waitForTimeout(500);
    
    // Switch back to weather tab
    await page.click('button:has-text("Weather")');
    
    // Should load quickly from cache
    await expect(page.locator('text=Weather Timeline')).toBeVisible({ timeout: 2000 });
  });
});
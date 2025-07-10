import { test, expect } from '@playwright/test';

test.describe('Trip Planning Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the trip planning page
    await page.goto('/trips/new');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load trip planning page successfully', async ({ page }) => {
    // Check that the main elements are visible
    await expect(page.locator('h1')).toContainText('European Adventure');
    await expect(page.locator('text=Destinations')).toBeVisible();
    await expect(page.locator('text=Timeline')).toBeVisible();
    await expect(page.locator('text=Weather')).toBeVisible();
    
    // Check for the map container
    await expect(page.locator('[class*="relative"]')).toBeVisible();
    
    // Check for the search bar
    await expect(page.locator('input[placeholder*="Search destinations"]')).toBeVisible();
  });

  test('should display initial mock destinations', async ({ page }) => {
    // Check that mock destinations are displayed
    await expect(page.locator('text=Paris')).toBeVisible();
    await expect(page.locator('text=Amsterdam')).toBeVisible();
    
    // Check destination counter
    await expect(page.locator('text=Destinations (2)')).toBeVisible();
    
    // Check that map shows destinations
    await expect(page.locator('text=2 destinations')).toBeVisible();
  });

  test('should switch between timeline and weather tabs', async ({ page }) => {
    // Initially timeline tab should be active
    await expect(page.locator('button:has-text("Timeline")')).toHaveClass(/border-primary-500/);
    
    // Click weather tab
    await page.click('button:has-text("Weather")');
    
    // Wait for tab switch
    await page.waitForTimeout(500);
    
    // Weather tab should now be active
    await expect(page.locator('button:has-text("Weather")')).toHaveClass(/border-primary-500/);
    
    // Weather content should be visible
    await expect(page.locator('text=Weather Timeline')).toBeVisible();
    await expect(page.locator('text=Weather forecasts for your trip destinations')).toBeVisible();
    
    // Switch back to timeline
    await page.click('button:has-text("Timeline")');
    await page.waitForTimeout(500);
    
    // Timeline should be active again
    await expect(page.locator('button:has-text("Timeline")')).toHaveClass(/border-primary-500/);
  });

  test('should display trip summary information', async ({ page }) => {
    // Check trip summary section
    await expect(page.locator('text=Trip Summary')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible();
    await expect(page.locator('text=Distance')).toBeVisible();
    await expect(page.locator('text=Budget')).toBeVisible();
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Save Trip")')).toBeVisible();
    await expect(page.locator('button:has-text("Share Trip")')).toBeVisible();
  });

  test('should allow trip title editing', async ({ page }) => {
    // Find the trip title
    const tripTitle = page.locator('h1:has-text("European Adventure")');
    await expect(tripTitle).toBeVisible();
    
    // Click to edit title
    await tripTitle.click();
    
    // Input should be visible
    await expect(page.locator('input[value="European Adventure"]')).toBeVisible();
    
    // Edit the title
    await page.fill('input[value="European Adventure"]', 'My Amazing Trip');
    
    // Press Enter or click elsewhere to save
    await page.keyboard.press('Enter');
    
    // Check that title was updated
    await expect(page.locator('h1:has-text("My Amazing Trip")')).toBeVisible();
  });

  test('should handle destination search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    await expect(searchInput).toBeVisible();
    
    // Click on search input
    await searchInput.click();
    
    // Type a search query
    await searchInput.fill('London');
    
    // Wait for potential search results (this would depend on actual API)
    await page.waitForTimeout(1000);
    
    // Check that input has value
    await expect(searchInput).toHaveValue('London');
    
    // Clear search
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('should display timeline with activities', async ({ page }) => {
    // Ensure timeline tab is active
    await page.click('button:has-text("Timeline")');
    await page.waitForTimeout(500);
    
    // Check for timeline days
    await expect(page.locator('text=Monday')).toBeVisible();
    await expect(page.locator('text=Tuesday')).toBeVisible();
    
    // Check for activities
    await expect(page.locator('text=Eiffel Tower')).toBeVisible();
    await expect(page.locator('text=Louvre Museum')).toBeVisible();
    await expect(page.locator('text=Canal Tour')).toBeVisible();
    
    // Check for add activity buttons
    await expect(page.locator('button[title="Add activity"]').first()).toBeVisible();
  });

  test('should handle day selection in timeline', async ({ page }) => {
    // Ensure timeline tab is active
    await page.click('button:has-text("Timeline")');
    await page.waitForTimeout(500);
    
    // Click on a day element more specifically
    const dayElement = page.locator('[class*="mb-6 cursor-pointer"]').first();
    await dayElement.click();
    
    // Wait for selection animation
    await page.waitForTimeout(500);
    
    // Check that day is selected (visual indication)
    await expect(dayElement).toHaveClass(/scale-105/);
  });

  test('should display weather information when weather tab is active', async ({ page }) => {
    // Click weather tab
    await page.click('button:has-text("Weather")');
    await page.waitForTimeout(1000);
    
    // Check for weather timeline
    await expect(page.locator('text=Weather Timeline')).toBeVisible();
    await expect(page.locator('text=Weather forecasts for your trip destinations')).toBeVisible();
    
    // Check for loading state or weather content
    // Note: This might show loading initially if weather API is being called
    const weatherContent = page.locator('[class*="animate-pulse"]');
    if (await weatherContent.isVisible()) {
      // If loading, wait for it to finish
      await expect(weatherContent).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check that elements are still visible and properly arranged
    await expect(page.locator('text=Destinations')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search destinations"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Check that layout is properly arranged
    await expect(page.locator('text=Destinations')).toBeVisible();
    await expect(page.locator('text=Trip Summary')).toBeVisible();
  });

  test('should handle drag and drop interactions', async ({ page }) => {
    // Check that destinations section is visible (where drag handles would be)
    await expect(page.locator('text=Destinations')).toBeVisible();
    
    // Check for draggable destination items
    const destinationItems = page.locator('[class*="group flex items-center"]');
    if (await destinationItems.first().isVisible()) {
      await expect(destinationItems.first()).toBeVisible();
    }
    
    // Note: Actual drag and drop testing would require more specific selectors
    // and would depend on the dnd-kit implementation
  });

  test('should handle map interactions', async ({ page }) => {
    // Check that map container is visible
    const mapContainer = page.locator('[class*="relative"]').nth(1); // Assuming second relative container is the map
    await expect(mapContainer).toBeVisible();
    
    // Check for destination markers
    await expect(page.locator('text=2 destinations')).toBeVisible();
    
    // Check for legend
    await expect(page.locator('text=Legend')).toBeVisible();
    await expect(page.locator('text=Start')).toBeVisible();
    await expect(page.locator('text=End')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Monitor for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Perform various interactions
    await page.click('button:has-text("Weather")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Timeline")');
    await page.waitForTimeout(1000);
    
    // Check for React errors
    await expect(page.locator('text=Unhandled Runtime Error')).not.toBeVisible();
    await expect(page.locator('text=TypeError')).not.toBeVisible();
    
    // Check that no critical errors occurred
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('TypeError') || 
      error.includes('Cannot read property') ||
      error.includes('Cannot destructure property')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should maintain state between tab switches', async ({ page }) => {
    // Make some interactions in timeline
    await page.click('button:has-text("Timeline")');
    await page.waitForTimeout(500);
    
    // Select a day
    const dayElement = page.locator('text=Monday').locator('..').locator('..');
    await dayElement.click();
    
    // Switch to weather tab
    await page.click('button:has-text("Weather")');
    await page.waitForTimeout(500);
    
    // Switch back to timeline
    await page.click('button:has-text("Timeline")');
    await page.waitForTimeout(500);
    
    // Check that the day is still selected
    await expect(dayElement).toHaveClass(/scale-105/);
  });

  test('should handle floating controls', async ({ page }) => {
    // Check for floating search bar
    await expect(page.locator('input[placeholder*="Search destinations"]')).toBeVisible();
    
    // Check for floating controls on the map
    const floatingControls = page.locator('[class*="absolute top-4 right-4"]');
    await expect(floatingControls).toBeVisible();
  });

  test('should display proper loading states', async ({ page }) => {
    // Refresh the page to catch loading states
    await page.reload();
    
    // Check for any loading spinners or skeletons
    const loadingElements = page.locator('[class*="animate-pulse"], [class*="animate-spin"]');
    
    // If loading elements are present, they should eventually disappear
    if (await loadingElements.first().isVisible()) {
      await expect(loadingElements.first()).not.toBeVisible({ timeout: 10000 });
    }
    
    // After loading, main content should be visible
    await expect(page.locator('text=Destinations')).toBeVisible();
  });
});
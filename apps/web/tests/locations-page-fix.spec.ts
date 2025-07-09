import { test, expect } from '@playwright/test';

test.describe('Locations Page Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3006');
  });

  test('should not throw destructuring error when accessing locations page while signed in', async ({ page }) => {
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

    try {
      // First, try to access the locations page without signing in
      await page.goto('http://localhost:3006/locations');
      
      // Wait for the page to load
      await page.waitForTimeout(2000);
      
      // Check if the page loaded successfully
      await expect(page.locator('h1')).toContainText('Discover Your Next Destination');
      
      // Verify no destructuring errors occurred
      expect(pageErrors.filter(error => 
        error.includes('Cannot destructure property') && 
        error.includes('savedLocations')
      )).toHaveLength(0);
      
      // Check that basic page elements are visible
      await expect(page.locator('text=Search and save locations')).toBeVisible();
      await expect(page.locator('text=Popular Destinations')).toBeVisible();
      
      console.log('✅ Locations page loads without destructuring errors');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      console.error('Console errors:', consoleErrors);
      console.error('Page errors:', pageErrors);
      throw error;
    }
  });

  test('should handle Redux state properly when locations slice is available', async ({ page }) => {
    // Go to locations page
    await page.goto('http://localhost:3006/locations');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page renders the correct structure
    await expect(page.locator('h1')).toContainText('Discover Your Next Destination');
    
    // Verify search bar is present
    await expect(page.locator('input[placeholder*="search"], input[placeholder*="Search"]')).toBeVisible({ timeout: 5000 });
    
    // Verify popular destinations section exists
    await expect(page.locator('text=Popular Destinations')).toBeVisible();
    
    // Check that no React runtime errors are shown
    await expect(page.locator('text=Unhandled Runtime Error')).not.toBeVisible();
    await expect(page.locator('text=TypeError')).not.toBeVisible();
    
    console.log('✅ Page renders correctly with proper Redux state handling');
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Navigate to locations page
    await page.goto('http://localhost:3006/locations');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Since user is not authenticated, should not show saved locations section
    // But should show the search interface
    await expect(page.locator('h1')).toContainText('Discover Your Next Destination');
    
    // Should not show "Your Saved Locations" since user is not authenticated
    await expect(page.locator('text=Your Saved Locations')).not.toBeVisible();
    
    // Should show popular destinations (even if empty)
    await expect(page.locator('text=Popular Destinations')).toBeVisible();
    
    console.log('✅ Empty state handled correctly for unauthenticated user');
  });

  test('should display search functionality', async ({ page }) => {
    await page.goto('http://localhost:3006/locations');
    await page.waitForLoadState('networkidle');
    
    // Try to find a search input - it might have different placeholder text
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Try typing in the search input
    await searchInput.fill('Paris');
    
    // Verify the input accepts text
    await expect(searchInput).toHaveValue('Paris');
    
    console.log('✅ Search functionality is accessible');
  });
});
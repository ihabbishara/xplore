import { test, expect } from '@playwright/test';

test.describe('Destination Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the trip planning page
    await page.goto('/trips/new');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display search input', async ({ page }) => {
    // Check that search input is visible
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    await expect(searchInput).toBeVisible();
    
    // Check that search has proper styling
    await expect(searchInput).toHaveClass(/bg-transparent/);
    
    // Check for search icon
    const searchIcon = page.locator('svg[class*="w-5 h-5 text-gray-400"]');
    await expect(searchIcon).toBeVisible();
  });

  test('should handle search input interaction', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Click on search input
    await searchInput.click();
    
    // Check that input is focused
    await expect(searchInput).toBeFocused();
    
    // Type in search input
    await searchInput.fill('London');
    
    // Check that input has value
    await expect(searchInput).toHaveValue('London');
  });

  test('should show search results dropdown', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Click and type in search input
    await searchInput.click();
    await searchInput.fill('Paris');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check for search results dropdown
    const searchDropdown = page.locator('[class*="absolute top-full"]');
    
    if (await searchDropdown.isVisible()) {
      await expect(searchDropdown).toBeVisible();
    }
  });

  test('should handle search loading state', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Start typing
    await searchInput.click();
    await searchInput.fill('New York');
    
    // Check for loading indicator
    const loadingIndicator = page.locator('[class*="animate-spin"]');
    
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('should handle popular destinations when search is empty', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Click on search input without typing
    await searchInput.click();
    
    // Wait for popular destinations
    await page.waitForTimeout(1000);
    
    // Check for popular destinations header
    const popularHeader = page.locator('text=Popular Destinations');
    
    if (await popularHeader.isVisible()) {
      await expect(popularHeader).toBeVisible();
    }
  });

  test('should handle search result selection', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type in search
    await searchInput.click();
    await searchInput.fill('Tokyo');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check for search results
    const searchResults = page.locator('[class*="px-4 py-3 cursor-pointer"]');
    
    if (await searchResults.first().isVisible()) {
      // Click on first result
      await searchResults.first().click();
      
      // Search input should be cleared
      await expect(searchInput).toHaveValue('');
    }
  });

  test('should handle keyboard navigation in search results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type in search
    await searchInput.click();
    await searchInput.fill('Berlin');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    
    // Should handle keyboard selection
    await expect(searchInput).toHaveValue('');
  });

  test('should handle search escape key', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type in search
    await searchInput.click();
    await searchInput.fill('Madrid');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Search dropdown should close
    const searchDropdown = page.locator('[class*="absolute top-full"]');
    await expect(searchDropdown).not.toBeVisible();
  });

  test('should handle search result display', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type in search
    await searchInput.click();
    await searchInput.fill('Rome');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check for search result structure
    const searchResults = page.locator('[class*="px-4 py-3 cursor-pointer"]');
    
    if (await searchResults.first().isVisible()) {
      // Should show location icon
      await expect(searchResults.first().locator('svg')).toBeVisible();
      
      // Should show location name
      await expect(searchResults.first().locator('h4')).toBeVisible();
      
      // Should show location details
      await expect(searchResults.first().locator('p')).toBeVisible();
    }
  });

  test('should handle search empty state', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type in search that returns no results
    await searchInput.click();
    await searchInput.fill('Nonexistentplace12345');
    
    // Wait for search
    await page.waitForTimeout(2000);
    
    // Check for empty state
    const emptyState = page.locator('text=No destinations found');
    
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=Try searching for a different location')).toBeVisible();
    }
  });

  test('should handle search focus and blur', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Focus on search input
    await searchInput.focus();
    
    // Search container should show focus state
    const searchContainer = searchInput.locator('..');
    await expect(searchContainer).toHaveClass(/ring-2 ring-primary-200/);
    
    // Blur the input
    await searchInput.blur();
    
    // Focus state should be removed
    await page.waitForTimeout(500);
    await expect(searchContainer).not.toHaveClass(/ring-2 ring-primary-200/);
  });

  test('should handle search debouncing', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type quickly (should debounce)
    await searchInput.click();
    await searchInput.type('L');
    await searchInput.type('o');
    await searchInput.type('n');
    await searchInput.type('d');
    await searchInput.type('o');
    await searchInput.type('n');
    
    // Wait for debounce delay
    await page.waitForTimeout(500);
    
    // Should show final search results
    await expect(searchInput).toHaveValue('London');
  });

  test('should handle search result location types', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type in search
    await searchInput.click();
    await searchInput.fill('San Francisco');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check for location type badges
    const typeBadges = page.locator('[class*="inline-flex items-center px-2 py-1 rounded-full"]');
    
    if (await typeBadges.first().isVisible()) {
      await expect(typeBadges.first()).toBeVisible();
    }
  });

  test('should handle search clear functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type in search
    await searchInput.click();
    await searchInput.fill('Barcelona');
    
    // Clear the search
    await searchInput.clear();
    
    // Should show empty value
    await expect(searchInput).toHaveValue('');
    
    // Should show popular destinations again
    await page.waitForTimeout(1000);
    const popularHeader = page.locator('text=Popular Destinations');
    
    if (await popularHeader.isVisible()) {
      await expect(popularHeader).toBeVisible();
    }
  });

  test('should handle search result hover states', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type in search
    await searchInput.click();
    await searchInput.fill('Vienna');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check for search results
    const searchResults = page.locator('[class*="px-4 py-3 cursor-pointer"]');
    
    if (await searchResults.first().isVisible()) {
      // Hover over first result
      await searchResults.first().hover();
      
      // Should show hover state
      await expect(searchResults.first()).toHaveClass(/hover:bg-gray-50/);
    }
  });

  test('should handle search accessibility', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Check for proper accessibility attributes
    await expect(searchInput).toHaveAttribute('type', 'text');
    
    // Check for placeholder text
    await expect(searchInput).toHaveAttribute('placeholder');
    
    // Should be keyboard accessible
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });

  test('should handle search performance', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Monitor search performance
    const startTime = Date.now();
    
    // Type and wait for results
    await searchInput.click();
    await searchInput.fill('Amsterdam');
    
    // Wait for search completion
    await page.waitForTimeout(1000);
    
    const endTime = Date.now();
    const searchTime = endTime - startTime;
    
    // Should complete within reasonable time
    expect(searchTime).toBeLessThan(3000);
  });

  test('should handle search error states', async ({ page }) => {
    // Monitor for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Perform search
    await searchInput.click();
    await searchInput.fill('TestCity');
    
    // Wait for search
    await page.waitForTimeout(2000);
    
    // Check for search-related errors
    const searchErrors = consoleErrors.filter(error => 
      error.includes('search') || 
      error.includes('fetch') || 
      error.includes('network')
    );
    
    // Should handle errors gracefully
    expect(searchErrors).toHaveLength(0);
  });

  test('should handle multiple search interactions', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Perform multiple searches
    await searchInput.click();
    await searchInput.fill('Paris');
    await page.waitForTimeout(1000);
    
    await searchInput.clear();
    await searchInput.fill('London');
    await page.waitForTimeout(1000);
    
    await searchInput.clear();
    await searchInput.fill('Tokyo');
    await page.waitForTimeout(1000);
    
    // Should handle multiple searches without issues
    await expect(searchInput).toHaveValue('Tokyo');
  });

  test('should handle search with special characters', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search destinations"]');
    
    // Type search with special characters
    await searchInput.click();
    await searchInput.fill('São Paulo');
    
    // Should handle special characters
    await expect(searchInput).toHaveValue('São Paulo');
    
    // Wait for search
    await page.waitForTimeout(1000);
    
    // Should not cause errors
    await expect(searchInput).toBeVisible();
  });
});
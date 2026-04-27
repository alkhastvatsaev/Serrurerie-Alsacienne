import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto('/');
  });

  test('should load the dashboard and show core elements', async ({ page }) => {
    // Check for "Actions Manager" title
    await expect(page.getByText('Actions Manager')).toBeVisible();
    
    // Check for the Map
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should open the create mission modal', async ({ page }) => {
    // Click the "Plus" button in the dock
    // The button has aria-label="Nouvelle Intervention"
    const plusButton = page.getByLabel('Nouvelle Intervention');
    await plusButton.click();

    // Check if the modal appears
    await expect(page.getByText('Créer une Nouvelle Mission')).toBeVisible();
    
    // Check for form fields
    await expect(page.getByPlaceholder('Adresse de l\'intervention...')).toBeVisible();
  });

  test('should trigger AI dispatch suggestion', async ({ page }) => {
    await page.getByLabel('Nouvelle Intervention').click();
    
    // Select a category
    await page.getByRole('combobox').first().click();
    await page.getByLabel('Réparation / Entretien').click();

    // Click "Dispatch IA"
    const aiButton = page.getByText('Dispatch IA');
    await aiButton.click();

    // Since it's a simulated AI in ai-agent.ts (setTimeout 1500ms), 
    // we wait for the reasoning to appear
    await expect(page.getByText('Analyse IA en cours...')).toBeVisible();
    
    // Wait for the suggestion (it should say "Technicien sectorisé" or similar)
    await expect(page.getByText(/Technicien/i)).toBeVisible({ timeout: 5000 });
  });
});

'use strict'

/**
 * Author Color Palette Generator
 *
 * Generates a palette of colors that meet WCAG 3:1 contrast ratio requirements
 * against both light (#ffffff) and dark (#0d0d0d) backgrounds.
 *
 * This ensures authorship colors are visible in both the light (default) and
 * dark (one-dark) editor themes.
 */

const crypto = require('crypto')

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {object} RGB values {r, g, b} in 0-255 range
 */
function hslToRgb (h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2

  let r, g, b
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

/**
 * Calculate relative luminance according to WCAG formula
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {number} Relative luminance (0-1)
 */
function getRelativeLuminance (r, g, b) {
  // Convert to 0-1 range
  const rSRGB = r / 255
  const gSRGB = g / 255
  const bSRGB = b / 255

  // Apply gamma correction
  const rLinear = rSRGB <= 0.03928 ? rSRGB / 12.92 : Math.pow((rSRGB + 0.055) / 1.055, 2.4)
  const gLinear = gSRGB <= 0.03928 ? gSRGB / 12.92 : Math.pow((gSRGB + 0.055) / 1.055, 2.4)
  const bLinear = bSRGB <= 0.03928 ? bSRGB / 12.92 : Math.pow((bSRGB + 0.055) / 1.055, 2.4)

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Calculate contrast ratio between two luminance values
 * @param {number} l1 - Luminance 1
 * @param {number} l2 - Luminance 2
 * @returns {number} Contrast ratio
 */
function getContrastRatio (l1, l2) {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Convert RGB to hex color string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color (e.g., '#ff0000')
 */
function rgbToHex (r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

/**
 * Generate a palette of colors meeting contrast requirements
 * @returns {Array<string>} Array of hex color strings
 */
function generatePalette () {
  const colors = []
  const colorSet = new Set() // Prevent duplicates

  // Background luminance values
  const darkBgLuminance = 0.004 // ~#0d0d0d
  const lightBgLuminance = 1.0 // #ffffff
  const minContrast = 3.0 // WCAG AA for large text and graphical objects

  // Sample HSL space
  const hueSteps = 24 // Every 15 degrees
  const saturationValues = [0.6, 0.75, 0.9]
  const lightnessSteps = 10
  const lightnessMin = 0.10
  const lightnessMax = 0.60

  for (let hueStep = 0; hueStep < hueSteps; hueStep++) {
    const hue = (hueStep * 360) / hueSteps

    for (const saturation of saturationValues) {
      for (let lightStep = 0; lightStep < lightnessSteps; lightStep++) {
        const lightness = lightnessMin + (lightStep * (lightnessMax - lightnessMin)) / (lightnessSteps - 1)

        // Convert to RGB
        const rgb = hslToRgb(hue, saturation, lightness)
        const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b)

        // Calculate contrast ratios
        const contrastDark = getContrastRatio(luminance, darkBgLuminance)
        const contrastLight = getContrastRatio(luminance, lightBgLuminance)

        // Check if meets requirements
        if (contrastDark >= minContrast && contrastLight >= minContrast) {
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b)

          // Avoid duplicates
          if (!colorSet.has(hex)) {
            colorSet.add(hex)
            colors.push(hex)
          }
        }
      }
    }
  }

  return colors
}

/**
 * Pre-generated palette of colors meeting contrast requirements
 * @type {Array<string>}
 */
const PALETTE = generatePalette()

/**
 * Get a deterministic color for a user ID
 * Uses MD5 hash to ensure same userId always returns same color
 * @param {string} userId - User identifier
 * @returns {string} Hex color from palette
 */
function getColorForUserId (userId) {
  // Use a consistent fallback for null/undefined/empty to ensure deterministic behavior
  if (!userId) {
    userId = 'anonymous-user'
  }

  const hash = crypto.createHash('md5').update(userId).digest('hex')
  const index = parseInt(hash.substring(0, 8), 16) % PALETTE.length
  return PALETTE[index]
}

module.exports = {
  PALETTE,
  getColorForUserId,
  // Export for testing
  getRelativeLuminance,
  getContrastRatio,
  hslToRgb,
  rgbToHex
}

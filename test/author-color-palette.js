'use strict'

const assert = require('assert')
const palette = require('../lib/author-color-palette')

describe('Author Color Palette', function () {
  describe('PALETTE generation', function () {
    it('should contain at least 150 colors', function () {
      assert.ok(palette.PALETTE.length >= 150, `Palette has ${palette.PALETTE.length} colors, expected at least 150`)
    })

    it('should not contain duplicate colors', function () {
      const uniqueColors = new Set(palette.PALETTE)
      assert.strictEqual(uniqueColors.size, palette.PALETTE.length, 'Palette contains duplicate colors')
    })

    it('should contain only valid hex colors', function () {
      const hexPattern = /^#[0-9a-f]{6}$/
      palette.PALETTE.forEach((color, index) => {
        assert.ok(hexPattern.test(color), `Color at index ${index} (${color}) is not a valid hex color`)
      })
    })

    it('all colors should meet 3:1 contrast against dark background (#0d0d0d)', function () {
      const darkBgLuminance = 0.004 // ~#0d0d0d
      const minContrast = 3.0

      palette.PALETTE.forEach((color) => {
        // Parse hex color
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        
        const luminance = palette.getRelativeLuminance(r, g, b)
        const contrast = palette.getContrastRatio(luminance, darkBgLuminance)
        
        assert.ok(contrast >= minContrast, `Color ${color} has contrast ${contrast.toFixed(2)} against dark bg, expected >= ${minContrast}`)
      })
    })

    it('all colors should meet 3:1 contrast against light background (#ffffff)', function () {
      const lightBgLuminance = 1.0 // #ffffff
      const minContrast = 3.0

      palette.PALETTE.forEach((color) => {
        // Parse hex color
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        
        const luminance = palette.getRelativeLuminance(r, g, b)
        const contrast = palette.getContrastRatio(luminance, lightBgLuminance)
        
        assert.ok(contrast >= minContrast, `Color ${color} has contrast ${contrast.toFixed(2)} against light bg, expected >= ${minContrast}`)
      })
    })
  })

  describe('getColorForUserId()', function () {
    it('should return a color from the palette', function () {
      const color = palette.getColorForUserId('test-user-123')
      assert.ok(palette.PALETTE.includes(color), `Returned color ${color} is not in palette`)
    })

    it('should return the same color for the same userId', function () {
      const userId = 'test-user-456'
      const color1 = palette.getColorForUserId(userId)
      const color2 = palette.getColorForUserId(userId)
      assert.strictEqual(color1, color2, 'Same userId should always return same color')
    })

    it('should return different colors for different userIds', function () {
      const colors = new Set()
      // Generate colors for multiple different users
      for (let i = 0; i < 50; i++) {
        const color = palette.getColorForUserId(`user-${i}`)
        colors.add(color)
      }
      // Should have multiple different colors (not all the same)
      assert.ok(colors.size > 10, `Expected diverse colors, got only ${colors.size} unique colors from 50 users`)
    })

    it('should handle null userId', function () {
      const color = palette.getColorForUserId(null)
      assert.ok(typeof color === 'string', 'Should return a string for null userId')
      assert.ok(palette.PALETTE.includes(color), 'Should return a valid palette color for null userId')
    })

    it('should handle undefined userId', function () {
      const color = palette.getColorForUserId(undefined)
      assert.ok(typeof color === 'string', 'Should return a string for undefined userId')
      assert.ok(palette.PALETTE.includes(color), 'Should return a valid palette color for undefined userId')
    })

    it('should handle empty string userId', function () {
      const color = palette.getColorForUserId('')
      assert.ok(typeof color === 'string', 'Should return a string for empty string userId')
      assert.ok(palette.PALETTE.includes(color), 'Should return a valid palette color for empty string userId')
    })
  })

  describe('Helper functions', function () {
    it('getRelativeLuminance() should calculate correct luminance for white', function () {
      const luminance = palette.getRelativeLuminance(255, 255, 255)
      assert.ok(Math.abs(luminance - 1.0) < 0.01, `Expected luminance ~1.0 for white, got ${luminance}`)
    })

    it('getRelativeLuminance() should calculate correct luminance for black', function () {
      const luminance = palette.getRelativeLuminance(0, 0, 0)
      assert.ok(Math.abs(luminance - 0.0) < 0.01, `Expected luminance ~0.0 for black, got ${luminance}`)
    })

    it('getContrastRatio() should calculate 21:1 for white vs black', function () {
      const whiteLum = 1.0
      const blackLum = 0.0
      const contrast = palette.getContrastRatio(whiteLum, blackLum)
      assert.ok(Math.abs(contrast - 21) < 0.1, `Expected contrast ~21:1, got ${contrast}`)
    })

    it('getContrastRatio() should be symmetric', function () {
      const l1 = 0.5
      const l2 = 0.1
      const contrast1 = palette.getContrastRatio(l1, l2)
      const contrast2 = palette.getContrastRatio(l2, l1)
      assert.strictEqual(contrast1, contrast2, 'Contrast ratio should be symmetric')
    })

    it('hslToRgb() should convert correctly', function () {
      // Red: H=0, S=1, L=0.5 -> RGB(255, 0, 0)
      const red = palette.hslToRgb(0, 1, 0.5)
      assert.strictEqual(red.r, 255)
      assert.strictEqual(red.g, 0)
      assert.strictEqual(red.b, 0)

      // Green: H=120, S=1, L=0.5 -> RGB(0, 255, 0)
      const green = palette.hslToRgb(120, 1, 0.5)
      assert.strictEqual(green.r, 0)
      assert.strictEqual(green.g, 255)
      assert.strictEqual(green.b, 0)

      // Blue: H=240, S=1, L=0.5 -> RGB(0, 0, 255)
      const blue = palette.hslToRgb(240, 1, 0.5)
      assert.strictEqual(blue.r, 0)
      assert.strictEqual(blue.g, 0)
      assert.strictEqual(blue.b, 255)
    })

    it('rgbToHex() should convert correctly', function () {
      assert.strictEqual(palette.rgbToHex(255, 0, 0), '#ff0000')
      assert.strictEqual(palette.rgbToHex(0, 255, 0), '#00ff00')
      assert.strictEqual(palette.rgbToHex(0, 0, 255), '#0000ff')
      assert.strictEqual(palette.rgbToHex(255, 255, 255), '#ffffff')
      assert.strictEqual(palette.rgbToHex(0, 0, 0), '#000000')
    })
  })
})

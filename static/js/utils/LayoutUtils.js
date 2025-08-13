/**
 * Layout Utilities - Shared functions for layout point calculations and positioning
 */
import { LAYOUT_MODES, LAYOUT_DEFINITIONS, getLayoutPoints, layoutUsesCenter } from '../constants/LayoutConstants.js';

export const LayoutUtils = {
  /**
   * Get layout points in viewport coordinates for a given layout mode
   * @param {string} layoutMode - The layout mode identifier
   * @param {Object} area - The area to calculate points within (default: viewport)
   * @param {number} area.left - Left offset
   * @param {number} area.top - Top offset
   * @param {number} area.width - Area width
   * @param {number} area.height - Area height
   * @returns {Array} Array of {x, y} points in absolute coordinates
   */
  getAbsoluteLayoutPoints(layoutMode, area = null) {
    // Use viewport if no area specified
    if (!area) {
      area = {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    }

    const relativePoints = getLayoutPoints(layoutMode);
    if (!relativePoints.length) {
      console.warn(`LayoutUtils: No points found for layout mode: ${layoutMode}`);
      return [];
    }

    // Convert relative points to absolute coordinates within the specified area
    return relativePoints.map(point => ({
      x: area.left + (area.width * point.x),
      y: area.top + (area.height * point.y)
    }));
  },

  /**
   * Get layout points in viewport percentage coordinates
   * @param {string} layoutMode - The layout mode identifier
   * @returns {Array} Array of {x, y} points as viewport percentages
   */
  getViewportPercentagePoints(layoutMode) {
    const relativePoints = getLayoutPoints(layoutMode);
    
    // Convert to viewport percentages (0.5 = 50vw/vh)
    return relativePoints.map(point => ({
      x: (point.x - 0.5) * 100, // Convert to offset from center in vw units
      y: (point.y - 0.5) * 100  // Convert to offset from center in vh units
    }));
  },

  /**
   * Get the next layout point using round-robin cycling
   * @param {string} layoutMode - The layout mode identifier
   * @param {number} currentIndex - Current index in the cycle
   * @param {Object} area - The area to calculate points within (default: viewport)
   * @returns {Object} {point: {x, y}, nextIndex: number}
   */
  getNextLayoutPoint(layoutMode, currentIndex, area = null) {
    const points = this.getAbsoluteLayoutPoints(layoutMode, area);
    
    if (!points.length) {
      return { point: { x: 0, y: 0 }, nextIndex: 0 };
    }

    const index = currentIndex % points.length;
    const nextIndex = (currentIndex + 1) % points.length;
    
    return {
      point: points[index],
      nextIndex
    };
  },

  /**
   * Get the next viewport percentage point using round-robin cycling
   * @param {string} layoutMode - The layout mode identifier
   * @param {number} currentIndex - Current index in the cycle
   * @returns {Object} {point: {x, y}, nextIndex: number}
   */
  getNextViewportPercentagePoint(layoutMode, currentIndex) {
    const points = this.getViewportPercentagePoints(layoutMode);
    
    if (!points.length) {
      return { point: { x: 0, y: 0 }, nextIndex: 0 };
    }

    const index = currentIndex % points.length;
    const nextIndex = (currentIndex + 1) % points.length;
    
    return {
      point: points[index],
      nextIndex
    };
  },

  /**
   * Convert absolute position to viewport-center offset
   * @param {number} absoluteX - Absolute X coordinate
   * @param {number} absoluteY - Absolute Y coordinate
   * @returns {Object} {x, y} offset from viewport center in pixels
   */
  absoluteToViewportOffset(absoluteX, absoluteY) {
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    return {
      x: absoluteX - viewportCenterX,
      y: absoluteY - viewportCenterY
    };
  },

  /**
   * Apply deviation to a point within area bounds
   * @param {Object} point - Original point {x, y}
   * @param {Object} area - Constraining area
   * @param {number} maxHorizontalDeviationPercent - Max horizontal deviation as percentage
   * @param {number} maxVerticalDeviationPercent - Max vertical deviation as percentage
   * @param {Function} randomFunc - Random function to use
   * @returns {Object} Deviated point {x, y}
   */
  applyPointDeviation(point, area, maxHorizontalDeviationPercent = 0, maxVerticalDeviationPercent = 0, randomFunc = Math.random) {
    if (maxHorizontalDeviationPercent === 0 && maxVerticalDeviationPercent === 0) {
      return { x: point.x, y: point.y };
    }

    const maxHorizontalDev = maxHorizontalDeviationPercent / 100;
    const maxVerticalDev = maxVerticalDeviationPercent / 100;
    
    const horizontalDeviation = (randomFunc() - 0.5) * 2 * maxHorizontalDev * area.width;
    const verticalDeviation = (randomFunc() - 0.5) * 2 * maxVerticalDev * area.height;
    
    const deviatedX = Math.max(area.left, Math.min(area.left + area.width, point.x + horizontalDeviation));
    const deviatedY = Math.max(area.top, Math.min(area.top + area.height, point.y + verticalDeviation));
    
    return {
      x: deviatedX,
      y: deviatedY
    };
  },

  /**
   * Check if a layout mode should show center dot
   * @param {string} layoutMode - The layout mode identifier
   * @returns {boolean} True if center dot should be visible
   */
  shouldShowCenterDot(layoutMode) {
    return layoutUsesCenter(layoutMode);
  },

  /**
   * Get current layout mode from config
   * @returns {string} Current layout mode
   */
  getCurrentLayoutMode() {
    return window.APP_CONFIG?.transformations?.translation?.layout_mode || LAYOUT_MODES.RULE_OF_THIRDS;
  },

  /**
   * Check if current layout mode is random
   * @returns {boolean} True if using random layout mode
   */
  isRandomLayoutMode() {
    return this.getCurrentLayoutMode() === LAYOUT_MODES.RANDOM;
  }
};
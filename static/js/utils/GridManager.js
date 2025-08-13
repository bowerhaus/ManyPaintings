/**
 * Grid Manager - Handles rule of thirds grid positioning with matte border awareness
 */
import { LAYOUT_MODES, LAYOUT_DEFINITIONS, getLayoutColors } from '../constants/LayoutConstants.js';
import { LayoutUtils } from './LayoutUtils.js';

export const GridManager = {
  gridElement: null,
  centerDot: null,

  init() {
    this.gridElement = document.getElementById('rule-of-thirds-grid');
    this.centerDot = document.getElementById('center-grid-dot');
    
    if (!this.gridElement) {
      console.warn('GridManager: Rule of thirds grid element not found');
      return;
    }

    console.log('GridManager: Initialized');
  },

  // Update grid positioning based on current image area
  updateGridPosition() {
    if (!this.gridElement) {
      return;
    }

    // Get the effective image area from MatteBorderManager
    const MatteBorderManager = window.App?.MatteBorderManager;
    if (!MatteBorderManager) {
      console.warn('GridManager: MatteBorderManager not available');
      return;
    }

    const imageArea = MatteBorderManager.getImageArea();
    
    // Position the grid container to match the image area
    this.gridElement.style.position = 'absolute';
    this.gridElement.style.left = `${imageArea.left}px`;
    this.gridElement.style.top = `${imageArea.top}px`;
    this.gridElement.style.width = `${imageArea.width}px`;
    this.gridElement.style.height = `${imageArea.height}px`;

    // Update the grid lines within this positioned container
    this.updateGridLines();

    console.log('GridManager: Updated grid position to image area:', imageArea);
  },

  updateGridLines() {
    if (!this.gridElement) {
      return;
    }

    // Clear existing grid lines
    this.gridElement.innerHTML = '';

    // Get current layout mode and its definition
    const currentLayoutMode = LayoutUtils.getCurrentLayoutMode();
    const layoutDefinition = LAYOUT_DEFINITIONS[currentLayoutMode];
    const layoutColors = getLayoutColors(currentLayoutMode);
    
    if (!layoutDefinition) {
      console.warn(`GridManager: Unknown layout mode: ${currentLayoutMode}`);
      return;
    }

    // Create vertical lines
    layoutDefinition.verticalLines.forEach(fraction => {
      const line = document.createElement('div');
      line.style.cssText = `position: absolute; left: ${fraction * 100}%; top: 0; width: 1px; height: 100%; background: ${layoutColors.lines};`;
      this.gridElement.appendChild(line);
    });

    // Create horizontal lines
    layoutDefinition.horizontalLines.forEach(fraction => {
      const line = document.createElement('div');
      line.style.cssText = `position: absolute; left: 0; top: ${fraction * 100}%; width: 100%; height: 1px; background: ${layoutColors.lines};`;
      this.gridElement.appendChild(line);
    });

    // Create corner intersection points
    layoutDefinition.cornerPoints.forEach(point => {
      const dot = document.createElement('div');
      dot.style.cssText = `position: absolute; left: calc(${point.x * 100}% - 3px); top: calc(${point.y * 100}% - 3px); width: 6px; height: 6px; background: ${layoutColors.dots}; border-radius: 50%;`;
      this.gridElement.appendChild(dot);
    });

    // Create center point if needed
    const centerDot = document.createElement('div');
    centerDot.id = 'center-grid-dot';
    centerDot.style.cssText = `position: absolute; left: calc(50% - 3px); top: calc(50% - 3px); width: 6px; height: 6px; background: ${layoutColors.dots}; border-radius: 50%; display: none;`;
    this.gridElement.appendChild(centerDot);
    
    // Update the reference to the center dot
    this.centerDot = centerDot;
  },

  // Get rule of thirds intersection points in viewport coordinates
  getRuleOfThirdsPoints() {
    // Get the effective image area from MatteBorderManager
    const MatteBorderManager = window.App?.MatteBorderManager;
    const imageArea = MatteBorderManager ? 
      MatteBorderManager.getImageArea() : 
      null;

    return LayoutUtils.getAbsoluteLayoutPoints(LAYOUT_MODES.RULE_OF_THIRDS_AND_CENTRE, imageArea);
  },

  // Get rule of fifths thirds points (3x3 grid: 20%, 50%, 80% horizontal; 33%, 50%, 66% vertical) in viewport coordinates
  getRuleOfFifthsThirdsPoints() {
    // Get the effective image area from MatteBorderManager
    const MatteBorderManager = window.App?.MatteBorderManager;
    const imageArea = MatteBorderManager ? 
      MatteBorderManager.getImageArea() : 
      null;

    return LayoutUtils.getAbsoluteLayoutPoints(LAYOUT_MODES.RULE_OF_FIFTHS_THIRDS_AND_CENTRE, imageArea);
  },


  // Get rule of fifths and thirds points (3x3 grid excluding center: 1/5, 1/2, 4/5 horizontal; 1/3, 1/2, 2/3 vertical) in viewport coordinates
  getRuleOfFifthsAndThirdsPoints() {
    // Get the effective image area from MatteBorderManager
    const MatteBorderManager = window.App?.MatteBorderManager;
    const imageArea = MatteBorderManager ? 
      MatteBorderManager.getImageArea() : 
      null;

    return LayoutUtils.getAbsoluteLayoutPoints(LAYOUT_MODES.RULE_OF_FIFTHS_AND_THIRDS, imageArea);
  },



  // Update center dot visibility based on layout mode
  updateCenterDotVisibility() {
    if (!this.centerDot) {
      // Try to find the center dot if we don't have a reference
      this.centerDot = document.getElementById('center-grid-dot');
    }

    if (!this.centerDot || !this.gridElement) {
      return;
    }

    const currentLayoutMode = LayoutUtils.getCurrentLayoutMode();
    const isGridVisible = this.gridElement.style.display !== 'none';
    const isRandomMode = LayoutUtils.isRandomLayoutMode();
    
    if (isRandomMode) {
      this.gridElement.style.display = 'none';
      this.centerDot.style.display = 'none';
      return;
    }
    
    if (isGridVisible && LayoutUtils.shouldShowCenterDot(currentLayoutMode)) {
      this.centerDot.style.display = 'block';
    } else {
      this.centerDot.style.display = 'none';
    }
  },

  // Handle window resize events
  handleResize() {
    if (this.gridElement && this.gridElement.style.display !== 'none') {
      // Re-update grid position when window resizes
      setTimeout(() => {
        this.updateGridPosition();
      }, 100); // Small delay to ensure matte border calculations are complete
    }
  }
};
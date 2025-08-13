/**
 * Grid Manager - Handles rule of thirds grid positioning with matte border awareness
 */
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

    // Get current layout mode to determine grid type
    const currentLayoutMode = window.APP_CONFIG?.transformations?.translation?.layout_mode;
    
    if (currentLayoutMode === 'rule_of_fifths_thirds_and_centre') {
      // Rule of fifths thirds mode: 1/5, 1/2, 4/5 vertical lines and 1/3, 1/2, 2/3 horizontal lines
      const verticalLine1 = document.createElement('div');
      verticalLine1.style.cssText = `position: absolute; left: ${(1/5 * 100)}%; top: 0; width: 1px; height: 100%; background: rgba(0, 255, 255, 0.5);`;
      this.gridElement.appendChild(verticalLine1);

      const verticalLine2 = document.createElement('div');
      verticalLine2.style.cssText = `position: absolute; left: ${(1/2 * 100)}%; top: 0; width: 1px; height: 100%; background: rgba(0, 255, 255, 0.5);`;
      this.gridElement.appendChild(verticalLine2);

      const verticalLine3 = document.createElement('div');
      verticalLine3.style.cssText = `position: absolute; left: ${(4/5 * 100)}%; top: 0; width: 1px; height: 100%; background: rgba(0, 255, 255, 0.5);`;
      this.gridElement.appendChild(verticalLine3);

      // Horizontal lines at 1/3, 1/2, 2/3
      const horizontalLine1 = document.createElement('div');
      horizontalLine1.style.cssText = `position: absolute; left: 0; top: ${(1/3 * 100)}%; width: 100%; height: 1px; background: rgba(0, 255, 255, 0.5);`;
      this.gridElement.appendChild(horizontalLine1);

      const horizontalLine2 = document.createElement('div');
      horizontalLine2.style.cssText = `position: absolute; left: 0; top: ${(1/2 * 100)}%; width: 100%; height: 1px; background: rgba(0, 255, 255, 0.5);`;
      this.gridElement.appendChild(horizontalLine2);

      const horizontalLine3 = document.createElement('div');
      horizontalLine3.style.cssText = `position: absolute; left: 0; top: ${(2/3 * 100)}%; width: 100%; height: 1px; background: rgba(0, 255, 255, 0.5);`;
      this.gridElement.appendChild(horizontalLine3);

      // Create corner intersection points + center for rule of fifths thirds mode
      const ruleOfFifthsThirdsPoints = [
        { x: 1/5, y: 1/3 },  // Top-left
        { x: 4/5, y: 1/3 },  // Top-right
        { x: 1/5, y: 2/3 },  // Bottom-left
        { x: 4/5, y: 2/3 },  // Bottom-right
        { x: 1/2, y: 1/2 }   // Center
      ];

      ruleOfFifthsThirdsPoints.forEach(point => {
        const dot = document.createElement('div');
        dot.style.cssText = `position: absolute; left: calc(${point.x * 100}% - 3px); top: calc(${point.y * 100}% - 3px); width: 6px; height: 6px; background: rgba(0, 255, 255, 0.8); border-radius: 50%;`;
        this.gridElement.appendChild(dot);
      });
      
    } else if (currentLayoutMode === 'rule_of_fifths_and_thirds') {
      // Rule of fifths and thirds mode (without center): 1/5, 1/2, 4/5 vertical lines and 1/3, 1/2, 2/3 horizontal lines
      const verticalLine1 = document.createElement('div');
      verticalLine1.style.cssText = `position: absolute; left: ${(1/5 * 100)}%; top: 0; width: 1px; height: 100%; background: rgba(255, 165, 0, 0.5);`;
      this.gridElement.appendChild(verticalLine1);

      const verticalLine2 = document.createElement('div');
      verticalLine2.style.cssText = `position: absolute; left: ${(1/2 * 100)}%; top: 0; width: 1px; height: 100%; background: rgba(255, 165, 0, 0.5);`;
      this.gridElement.appendChild(verticalLine2);

      const verticalLine3 = document.createElement('div');
      verticalLine3.style.cssText = `position: absolute; left: ${(4/5 * 100)}%; top: 0; width: 1px; height: 100%; background: rgba(255, 165, 0, 0.5);`;
      this.gridElement.appendChild(verticalLine3);

      // Horizontal lines at 1/3, 1/2, 2/3
      const horizontalLine1 = document.createElement('div');
      horizontalLine1.style.cssText = `position: absolute; left: 0; top: ${(1/3 * 100)}%; width: 100%; height: 1px; background: rgba(255, 165, 0, 0.5);`;
      this.gridElement.appendChild(horizontalLine1);

      const horizontalLine2 = document.createElement('div');
      horizontalLine2.style.cssText = `position: absolute; left: 0; top: ${(1/2 * 100)}%; width: 100%; height: 1px; background: rgba(255, 165, 0, 0.5);`;
      this.gridElement.appendChild(horizontalLine2);

      const horizontalLine3 = document.createElement('div');
      horizontalLine3.style.cssText = `position: absolute; left: 0; top: ${(2/3 * 100)}%; width: 100%; height: 1px; background: rgba(255, 165, 0, 0.5);`;
      this.gridElement.appendChild(horizontalLine3);

      // Create corner intersection points for rule of fifths and thirds mode (excluding center)
      const ruleOfFifthsAndThirdsPoints = [
        { x: 1/5, y: 1/3 },  // Top-left
        { x: 4/5, y: 1/3 },  // Top-right
        { x: 1/5, y: 2/3 },  // Bottom-left
        { x: 4/5, y: 2/3 }   // Bottom-right
      ];

      ruleOfFifthsAndThirdsPoints.forEach(point => {
        const dot = document.createElement('div');
        dot.style.cssText = `position: absolute; left: calc(${point.x * 100}% - 3px); top: calc(${point.y * 100}% - 3px); width: 6px; height: 6px; background: rgba(255, 165, 0, 0.8); border-radius: 50%;`;
        this.gridElement.appendChild(dot);
      });
      
    } else {
      // Rule of thirds mode: 33.33% and 66.67% lines
      const verticalLine1 = document.createElement('div');
      verticalLine1.style.cssText = 'position: absolute; left: 33.333%; top: 0; width: 1px; height: 100%; background: rgba(255, 0, 0, 0.5);';
      this.gridElement.appendChild(verticalLine1);

      const verticalLine2 = document.createElement('div');
      verticalLine2.style.cssText = 'position: absolute; left: 66.667%; top: 0; width: 1px; height: 100%; background: rgba(255, 0, 0, 0.5);';
      this.gridElement.appendChild(verticalLine2);

      // Create horizontal lines (at 1/3 and 2/3 of the image area height)
      const horizontalLine1 = document.createElement('div');
      horizontalLine1.style.cssText = 'position: absolute; left: 0; top: 33.333%; width: 100%; height: 1px; background: rgba(255, 0, 0, 0.5);';
      this.gridElement.appendChild(horizontalLine1);

      const horizontalLine2 = document.createElement('div');
      horizontalLine2.style.cssText = 'position: absolute; left: 0; top: 66.667%; width: 100%; height: 1px; background: rgba(255, 0, 0, 0.5);';
      this.gridElement.appendChild(horizontalLine2);

      // Create corner intersection points (rule of thirds corners)
      const cornerPoints = [
        { x: 33.333, y: 33.333 },  // Top-left
        { x: 66.667, y: 33.333 },  // Top-right
        { x: 33.333, y: 66.667 },  // Bottom-left
        { x: 66.667, y: 66.667 }   // Bottom-right
      ];

      cornerPoints.forEach(point => {
        const dot = document.createElement('div');
        dot.style.cssText = `position: absolute; left: calc(${point.x}% - 3px); top: calc(${point.y}% - 3px); width: 6px; height: 6px; background: rgba(255, 255, 0, 0.8); border-radius: 50%;`;
        this.gridElement.appendChild(dot);
      });
    }

    // Create center point (for rule_of_thirds_and_centre and rule_of_fifths_thirds_and_centre modes)
    const centerDot = document.createElement('div');
    centerDot.id = 'center-grid-dot';
    const centerColor = currentLayoutMode === 'rule_of_fifths_thirds_and_centre' ? 'rgba(0, 255, 255, 0.8)' : 
                       currentLayoutMode === 'rule_of_fifths_and_thirds' ? 'rgba(255, 165, 0, 0.8)' :
                       'rgba(255, 255, 0, 0.8)';
    centerDot.style.cssText = `position: absolute; left: calc(50% - 3px); top: calc(50% - 3px); width: 6px; height: 6px; background: ${centerColor}; border-radius: 50%; display: none;`;
    this.gridElement.appendChild(centerDot);
    
    // Update the reference to the center dot
    this.centerDot = centerDot;
  },

  // Get rule of thirds intersection points in viewport coordinates
  getRuleOfThirdsPoints() {
    // Get the effective image area from MatteBorderManager
    const MatteBorderManager = window.App?.MatteBorderManager;
    if (!MatteBorderManager) {
      console.warn('GridManager: MatteBorderManager not available');
      return this.getViewportRuleOfThirdsPoints();
    }

    const imageArea = MatteBorderManager.getImageArea();

    // Calculate rule of thirds corner points within the image area
    const points = [
      {
        x: imageArea.left + (imageArea.width * 1/3),
        y: imageArea.top + (imageArea.height * 1/3)
      },
      {
        x: imageArea.left + (imageArea.width * 2/3),
        y: imageArea.top + (imageArea.height * 1/3)
      },
      {
        x: imageArea.left + (imageArea.width * 1/3),
        y: imageArea.top + (imageArea.height * 2/3)
      },
      {
        x: imageArea.left + (imageArea.width * 2/3),
        y: imageArea.top + (imageArea.height * 2/3)
      }
    ];

    // Add center point for rule_of_thirds_and_centre mode
    points.push({
      x: imageArea.left + (imageArea.width * 1/2),
      y: imageArea.top + (imageArea.height * 1/2)
    });

    return points;
  },

  // Get rule of fifths thirds points (3x3 grid: 20%, 50%, 80% horizontal; 33%, 50%, 66% vertical) in viewport coordinates
  getRuleOfFifthsThirdsPoints() {
    // Get the effective image area from MatteBorderManager
    const MatteBorderManager = window.App?.MatteBorderManager;
    if (!MatteBorderManager) {
      console.warn('GridManager: MatteBorderManager not available');
      return this.getViewportRuleOfFifthsThirdsPoints();
    }

    const imageArea = MatteBorderManager.getImageArea();

    // Calculate rule of fifths thirds corner points + center within the image area
    const points = [
      {
        x: imageArea.left + (imageArea.width * 1/5),
        y: imageArea.top + (imageArea.height * 1/3)
      },
      {
        x: imageArea.left + (imageArea.width * 4/5),
        y: imageArea.top + (imageArea.height * 1/3)
      },
      {
        x: imageArea.left + (imageArea.width * 1/5),
        y: imageArea.top + (imageArea.height * 2/3)
      },
      {
        x: imageArea.left + (imageArea.width * 4/5),
        y: imageArea.top + (imageArea.height * 2/3)
      },
      {
        x: imageArea.left + (imageArea.width * 1/2),
        y: imageArea.top + (imageArea.height * 1/2)
      }
    ];

    return points;
  },

  // Fallback: get rule of fifths thirds points for full viewport (when matte border disabled)
  getViewportRuleOfFifthsThirdsPoints() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Corner points + center for rule of fifths thirds and centre
    const points = [
      { x: viewportWidth * 1/5, y: viewportHeight * 1/3 },  // Top-left
      { x: viewportWidth * 4/5, y: viewportHeight * 1/3 },  // Top-right
      { x: viewportWidth * 1/5, y: viewportHeight * 2/3 },  // Bottom-left
      { x: viewportWidth * 4/5, y: viewportHeight * 2/3 },  // Bottom-right
      { x: viewportWidth * 1/2, y: viewportHeight * 1/2 }   // Center
    ];

    return points;
  },

  // Get rule of fifths and thirds points (3x3 grid excluding center: 1/5, 1/2, 4/5 horizontal; 1/3, 1/2, 2/3 vertical) in viewport coordinates
  getRuleOfFifthsAndThirdsPoints() {
    // Get the effective image area from MatteBorderManager
    const MatteBorderManager = window.App?.MatteBorderManager;
    if (!MatteBorderManager) {
      console.warn('GridManager: MatteBorderManager not available');
      return this.getViewportRuleOfFifthsAndThirdsPoints();
    }

    const imageArea = MatteBorderManager.getImageArea();

    // Calculate rule of fifths and thirds corner points within the image area
    const points = [
      {
        x: imageArea.left + (imageArea.width * 1/5),
        y: imageArea.top + (imageArea.height * 1/3)
      },
      {
        x: imageArea.left + (imageArea.width * 4/5),
        y: imageArea.top + (imageArea.height * 1/3)
      },
      {
        x: imageArea.left + (imageArea.width * 1/5),
        y: imageArea.top + (imageArea.height * 2/3)
      },
      {
        x: imageArea.left + (imageArea.width * 4/5),
        y: imageArea.top + (imageArea.height * 2/3)
      }
    ];

    return points;
  },

  // Fallback: get rule of fifths and thirds points for full viewport (when matte border disabled)
  getViewportRuleOfFifthsAndThirdsPoints() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Corner points only for rule of fifths and thirds
    const points = [
      { x: viewportWidth * 1/5, y: viewportHeight * 1/3 },  // Top-left
      { x: viewportWidth * 4/5, y: viewportHeight * 1/3 },  // Top-right
      { x: viewportWidth * 1/5, y: viewportHeight * 2/3 },  // Bottom-left
      { x: viewportWidth * 4/5, y: viewportHeight * 2/3 }   // Bottom-right
    ];

    return points;
  },

  // Fallback: get rule of thirds points for full viewport (when matte border disabled)
  getViewportRuleOfThirdsPoints() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const points = [
      { x: viewportWidth * 1/3, y: viewportHeight * 1/3 },
      { x: viewportWidth * 2/3, y: viewportHeight * 1/3 },
      { x: viewportWidth * 1/3, y: viewportHeight * 2/3 },
      { x: viewportWidth * 2/3, y: viewportHeight * 2/3 }
    ];

    // Add center point
    points.push({ x: viewportWidth * 0.5, y: viewportHeight * 0.5 });

    return points;
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

    const currentLayoutMode = window.APP_CONFIG?.transformations?.translation?.layout_mode;
    const isGridVisible = this.gridElement.style.display !== 'none';
    const isUsingCenterMode = currentLayoutMode === 'rule_of_thirds_and_centre';
    const isRuleOfFifthsThirdsMode = currentLayoutMode === 'rule_of_fifths_thirds_and_centre';
    const isRuleOfFifthsAndThirdsMode = currentLayoutMode === 'rule_of_fifths_and_thirds';
    const isRandomMode = currentLayoutMode === 'random';
    
    if (isRandomMode) {
      this.gridElement.style.display = 'none';
      this.centerDot.style.display = 'none';
      return;
    }
    
    if (isGridVisible && (isUsingCenterMode || isRuleOfFifthsThirdsMode)) {
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
/**
 * Layout Constants - Centralized layout definitions and color schemes
 */

// Layout mode identifiers
export const LAYOUT_MODES = {
  RULE_OF_THIRDS: 'rule_of_thirds',
  RULE_OF_THIRDS_AND_CENTRE: 'rule_of_thirds_and_centre',
  RULE_OF_FIFTHS_THIRDS_AND_CENTRE: 'rule_of_fifths_thirds_and_centre',
  RULE_OF_FIFTHS_AND_THIRDS: 'rule_of_fifths_and_thirds',
  RANDOM: 'random'
};

// Grid fraction constants
export const GRID_FRACTIONS = {
  ONE_THIRD: 1/3,
  TWO_THIRDS: 2/3,
  ONE_FIFTH: 1/5,
  FOUR_FIFTHS: 4/5,
  ONE_HALF: 1/2
};

// Color schemes for different layout modes
export const LAYOUT_COLORS = {
  [LAYOUT_MODES.RULE_OF_THIRDS]: {
    lines: 'rgba(255, 0, 0, 0.5)',      // Red
    dots: 'rgba(255, 255, 0, 0.8)'      // Yellow
  },
  [LAYOUT_MODES.RULE_OF_THIRDS_AND_CENTRE]: {
    lines: 'rgba(255, 0, 0, 0.5)',      // Red
    dots: 'rgba(255, 255, 0, 0.8)'      // Yellow
  },
  [LAYOUT_MODES.RULE_OF_FIFTHS_THIRDS_AND_CENTRE]: {
    lines: 'rgba(0, 255, 255, 0.5)',    // Cyan
    dots: 'rgba(0, 255, 255, 0.8)'      // Cyan
  },
  [LAYOUT_MODES.RULE_OF_FIFTHS_AND_THIRDS]: {
    lines: 'rgba(255, 165, 0, 0.5)',    // Orange
    dots: 'rgba(255, 165, 0, 0.8)'      // Orange
  }
};

// Layout mode definitions with their grid points
export const LAYOUT_DEFINITIONS = {
  [LAYOUT_MODES.RULE_OF_THIRDS]: {
    name: 'Rule of Thirds',
    cornerPoints: [
      { x: GRID_FRACTIONS.ONE_THIRD, y: GRID_FRACTIONS.ONE_THIRD },    // Top-left
      { x: GRID_FRACTIONS.TWO_THIRDS, y: GRID_FRACTIONS.ONE_THIRD },   // Top-right
      { x: GRID_FRACTIONS.ONE_THIRD, y: GRID_FRACTIONS.TWO_THIRDS },   // Bottom-left
      { x: GRID_FRACTIONS.TWO_THIRDS, y: GRID_FRACTIONS.TWO_THIRDS }   // Bottom-right
    ],
    includeCenter: false,
    verticalLines: [GRID_FRACTIONS.ONE_THIRD, GRID_FRACTIONS.TWO_THIRDS],
    horizontalLines: [GRID_FRACTIONS.ONE_THIRD, GRID_FRACTIONS.TWO_THIRDS]
  },
  
  [LAYOUT_MODES.RULE_OF_THIRDS_AND_CENTRE]: {
    name: 'Rule of Thirds + Centre',
    cornerPoints: [
      { x: GRID_FRACTIONS.ONE_THIRD, y: GRID_FRACTIONS.ONE_THIRD },    // Top-left
      { x: GRID_FRACTIONS.TWO_THIRDS, y: GRID_FRACTIONS.ONE_THIRD },   // Top-right
      { x: GRID_FRACTIONS.ONE_THIRD, y: GRID_FRACTIONS.TWO_THIRDS },   // Bottom-left
      { x: GRID_FRACTIONS.TWO_THIRDS, y: GRID_FRACTIONS.TWO_THIRDS }   // Bottom-right
    ],
    includeCenter: true,
    verticalLines: [GRID_FRACTIONS.ONE_THIRD, GRID_FRACTIONS.TWO_THIRDS],
    horizontalLines: [GRID_FRACTIONS.ONE_THIRD, GRID_FRACTIONS.TWO_THIRDS]
  },
  
  [LAYOUT_MODES.RULE_OF_FIFTHS_THIRDS_AND_CENTRE]: {
    name: 'Rule of Fifths Thirds + Centre',
    cornerPoints: [
      { x: GRID_FRACTIONS.ONE_FIFTH, y: GRID_FRACTIONS.ONE_THIRD },    // Top-left
      { x: GRID_FRACTIONS.FOUR_FIFTHS, y: GRID_FRACTIONS.ONE_THIRD },  // Top-right
      { x: GRID_FRACTIONS.ONE_FIFTH, y: GRID_FRACTIONS.TWO_THIRDS },   // Bottom-left
      { x: GRID_FRACTIONS.FOUR_FIFTHS, y: GRID_FRACTIONS.TWO_THIRDS }  // Bottom-right
    ],
    includeCenter: true,
    verticalLines: [GRID_FRACTIONS.ONE_FIFTH, GRID_FRACTIONS.ONE_HALF, GRID_FRACTIONS.FOUR_FIFTHS],
    horizontalLines: [GRID_FRACTIONS.ONE_THIRD, GRID_FRACTIONS.ONE_HALF, GRID_FRACTIONS.TWO_THIRDS]
  },
  
  [LAYOUT_MODES.RULE_OF_FIFTHS_AND_THIRDS]: {
    name: 'Rule of Fifths and Thirds',
    cornerPoints: [
      { x: GRID_FRACTIONS.ONE_FIFTH, y: GRID_FRACTIONS.ONE_THIRD },    // Top-left
      { x: GRID_FRACTIONS.FOUR_FIFTHS, y: GRID_FRACTIONS.ONE_THIRD },  // Top-right
      { x: GRID_FRACTIONS.ONE_FIFTH, y: GRID_FRACTIONS.TWO_THIRDS },   // Bottom-left
      { x: GRID_FRACTIONS.FOUR_FIFTHS, y: GRID_FRACTIONS.TWO_THIRDS }  // Bottom-right
    ],
    includeCenter: false,
    verticalLines: [GRID_FRACTIONS.ONE_FIFTH, GRID_FRACTIONS.ONE_HALF, GRID_FRACTIONS.FOUR_FIFTHS],
    horizontalLines: [GRID_FRACTIONS.ONE_THIRD, GRID_FRACTIONS.ONE_HALF, GRID_FRACTIONS.TWO_THIRDS]
  }
};

// Helper function to get all points (corners + center if applicable) for a layout mode
export function getLayoutPoints(layoutMode) {
  const definition = LAYOUT_DEFINITIONS[layoutMode];
  if (!definition) {
    console.warn(`LayoutConstants: Unknown layout mode: ${layoutMode}`);
    return [];
  }

  const points = [...definition.cornerPoints];
  
  if (definition.includeCenter) {
    points.push({ x: GRID_FRACTIONS.ONE_HALF, y: GRID_FRACTIONS.ONE_HALF });
  }
  
  return points;
}

// Helper function to check if a layout mode uses center point
export function layoutUsesCenter(layoutMode) {
  const definition = LAYOUT_DEFINITIONS[layoutMode];
  return definition ? definition.includeCenter : false;
}

// Helper function to get grid colors for a layout mode
export function getLayoutColors(layoutMode) {
  return LAYOUT_COLORS[layoutMode] || LAYOUT_COLORS[LAYOUT_MODES.RULE_OF_THIRDS];
}
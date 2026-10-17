import { CognitiveQuestion } from '../../types/cognitiveAssessment';

export const PRACTICE_QUESTION: CognitiveQuestion = {
  id: 'practice-1',
  domain: 'practice',
  activityKind: 'practice',
  title: 'Practice Round: Category Selection',
  instructions: 'This is a practice exercise to help you get comfortable with selecting and submitting answers. It will not be scored.',
  detailPrompt: 'Select all items that belong to the "Natural World" category, then click Submit Practice.',
  isPractice: true,
  options: [
    { id: 'p-tree', label: 'Oak Tree', isTarget: true, iconName: 'Trees' },
    { id: 'p-lamp', label: 'Desk Lamp', isTarget: false, iconName: 'Lamp' },
    { id: 'p-river', label: 'Forest Stream', isTarget: true, iconName: 'Waves' },
    { id: 'p-stapler', label: 'Iron Stapler', isTarget: false, iconName: 'Paperclip' }
  ]
};

export const MEMORY_STUDY_ITEMS = [
  { id: 'm-apple', label: 'Apple', hint: 'Red orchard fruit', iconName: 'Apple' },
  { id: 'm-clock', label: 'Desk Clock', hint: 'Brass analog timepiece', iconName: 'Clock' },
  { id: 'm-river', label: 'Blue River', hint: 'Flowing natural water', iconName: 'Waves' },
  { id: 'm-garden', label: 'Flower Garden', hint: 'Blooming flora bed', iconName: 'Flower2' },
  { id: 'm-key', label: 'Brass Key', hint: 'Traditional door key', iconName: 'Key' },
  { id: 'm-bicycle', label: 'Bicycle', hint: 'Two-wheeled city bike', iconName: 'Bike' }
];

export const DELAYED_RECALL_OPTIONS = [
  // 6 Originals
  { id: 'm-apple', label: 'Apple', isTarget: true, iconName: 'Apple' },
  { id: 'm-clock', label: 'Desk Clock', isTarget: true, iconName: 'Clock' },
  { id: 'm-river', label: 'Blue River', isTarget: true, iconName: 'Waves' },
  { id: 'm-garden', label: 'Flower Garden', isTarget: true, iconName: 'Flower2' },
  { id: 'm-key', label: 'Brass Key', isTarget: true, iconName: 'Key' },
  { id: 'm-bicycle', label: 'Bicycle', isTarget: true, iconName: 'Bike' },
  // 6 Distractors
  { id: 'd-book', label: 'Hardcover Book', isTarget: false, iconName: 'BookOpen' },
  { id: 'd-candle', label: 'Wax Candle', isTarget: false, iconName: 'Flame' },
  { id: 'd-mountain', label: 'Mountain Peak', isTarget: false, iconName: 'Mountain' },
  { id: 'd-shoe', label: 'Running Shoe', isTarget: false, iconName: 'Footprints' },
  { id: 'd-pencil', label: 'Wooden Pencil', isTarget: false, iconName: 'PenTool' },
  { id: 'd-bottle', label: 'Glass Bottle', isTarget: false, iconName: 'Wine' }
];

export const ASSESSMENT_QUESTIONS: CognitiveQuestion[] = [
  // 1. Memory Study Phase (Unscored setup, items will be recalled later in Delayed Recall)
  {
    id: 'q-mem-study',
    domain: 'memory',
    activityKind: 'memory_study',
    title: 'Memory Study: Everyday Items',
    instructions: 'Take a moment to carefully study the 6 items displayed below. You will be asked to identify them later in today\'s check.',
    detailPrompt: 'Memorize these 6 items. When you are ready, click "I Have Memorized Them" to proceed to the next activity.',
    studyDurationSeconds: 25
  },

  // 2. Attention Challenge: Trial 1 (Target Discrimination)
  {
    id: 'q-att-1',
    domain: 'attention',
    activityKind: 'attention_target',
    title: 'Attention Challenge: Target Discrimination',
    instructions: 'Examine the grid of cards below. Look specifically for cards showing a "Circle with a Dot". Ignore other geometric symbols.',
    detailPrompt: 'Select every "Circle with Dot" card (there are exactly 4). Leave all other shapes unselected.',
    targetCount: 4,
    options: [
      { id: 'att-1-1', label: 'Circle with Dot', isTarget: true, shapeSvg: 'circle-dot' },
      { id: 'att-1-2', label: 'Hollow Diamond', isTarget: false, shapeSvg: 'diamond' },
      { id: 'att-1-3', label: 'Circle with Dot', isTarget: true, shapeSvg: 'circle-dot' },
      { id: 'att-1-4', label: 'Solid Square', isTarget: false, shapeSvg: 'square' },
      { id: 'att-1-5', label: 'Six-Point Star', isTarget: false, shapeSvg: 'star' },
      { id: 'att-1-6', label: 'Circle with Dot', isTarget: true, shapeSvg: 'circle-dot' },
      { id: 'att-1-7', label: 'Hollow Circle', isTarget: false, shapeSvg: 'circle-hollow' },
      { id: 'att-1-8', label: 'Triangle', isTarget: false, shapeSvg: 'triangle' },
      { id: 'att-1-9', label: 'Hollow Diamond', isTarget: false, shapeSvg: 'diamond' },
      { id: 'att-1-10', label: 'Circle with Dot', isTarget: true, shapeSvg: 'circle-dot' },
      { id: 'att-1-11', label: 'Solid Square', isTarget: false, shapeSvg: 'square' },
      { id: 'att-1-12', label: 'Six-Point Star', isTarget: false, shapeSvg: 'star' }
    ]
  },

  // 3. Attention Challenge: Trial 2 (Symbol Sequence)
  {
    id: 'q-att-2',
    domain: 'attention',
    activityKind: 'attention_target',
    title: 'Attention Challenge: Verified Badges',
    instructions: 'Scan the symbol tokens below. Identify and select only the "Shield with Checkmark" tokens.',
    detailPrompt: 'Select all 4 "Shield with Checkmark" tokens while ignoring alert symbols and plain badges.',
    targetCount: 4,
    options: [
      { id: 'att-2-1', label: 'Alert Triangle', isTarget: false, shapeSvg: 'alert' },
      { id: 'att-2-2', label: 'Shield with Checkmark', isTarget: true, shapeSvg: 'shield-check' },
      { id: 'att-2-3', label: 'Plain Octagon', isTarget: false, shapeSvg: 'octagon' },
      { id: 'att-2-4', label: 'Shield with Checkmark', isTarget: true, shapeSvg: 'shield-check' },
      { id: 'att-2-5', label: 'Lightning Bolt', isTarget: false, shapeSvg: 'bolt' },
      { id: 'att-2-6', label: 'Plain Badge', isTarget: false, shapeSvg: 'badge' },
      { id: 'att-2-7', label: 'Shield with Checkmark', isTarget: true, shapeSvg: 'shield-check' },
      { id: 'att-2-8', label: 'Alert Triangle', isTarget: false, shapeSvg: 'alert' },
      { id: 'att-2-9', label: 'Shield with Checkmark', isTarget: true, shapeSvg: 'shield-check' },
      { id: 'att-2-10', label: 'Lightning Bolt', isTarget: false, shapeSvg: 'bolt' },
      { id: 'att-2-11', label: 'Plain Octagon', isTarget: false, shapeSvg: 'octagon' },
      { id: 'att-2-12', label: 'Plain Badge', isTarget: false, shapeSvg: 'badge' }
    ]
  },

  // 4. Working Memory: Trial 1 (Sequence Length 3)
  {
    id: 'q-wm-1',
    domain: 'workingMemory',
    activityKind: 'working_memory_sequence',
    title: 'Working Memory: 3-Tile Sequence',
    instructions: 'Watch the 3x3 grid carefully as 3 tiles illuminate in sequence. Once playback finishes, tap the tiles in the exact same order.',
    detailPrompt: 'Reproduce the 3-step sequence by tapping the numbered pads in the recorded order.',
    sequenceTarget: [2, 6, 8] // Pads 2, 6, 8
  },

  // 5. Working Memory: Trial 2 (Sequence Length 4)
  {
    id: 'q-wm-2',
    domain: 'workingMemory',
    activityKind: 'working_memory_sequence',
    title: 'Working Memory: 4-Tile Sequence',
    instructions: 'Now the sequence is slightly longer. Observe 4 tiles illuminate sequentially, then reproduce them in order.',
    detailPrompt: 'Reproduce the 4-step sequence by tapping the pads in the same sequence.',
    sequenceTarget: [1, 5, 7, 3] // Pads 1, 5, 7, 3
  },

  // 6. Pattern & Rule Challenge: Trial 1 (Number Progression)
  {
    id: 'q-pat-1',
    domain: 'pattern',
    activityKind: 'pattern_reasoning',
    title: 'Pattern & Rule: Sequence Completion',
    instructions: 'Analyze the mathematical sequence shown below. Determine the logical pattern and select the correct missing number.',
    detailPrompt: 'Progression:  3  ➔  6  ➔  12  ➔  24  ➔  [ ? ]\nWhat number replaces the question mark?',
    options: [
      { id: 'pat-1-opt1', label: '36' },
      { id: 'pat-1-opt2', label: '42' },
      { id: 'pat-1-opt3', label: '48', isTarget: true }, // 24 * 2 = 48
      { id: 'pat-1-opt4', label: '54' }
    ]
  },

  // 7. Pattern & Rule Challenge: Trial 2 (Rule Grouping - 4 Sides)
  {
    id: 'q-pat-2',
    domain: 'pattern',
    activityKind: 'rule_grouping',
    title: 'Pattern & Rule: Categorical Rule',
    instructions: 'Apply the explicit rule stated below to group the matching shapes.',
    detailPrompt: 'Rule: Select all geometric shapes that have EXACTLY 4 straight sides.',
    ruleDescription: 'Rule: Exactly 4 straight sides (Quadrilaterals)',
    options: [
      { id: 'pat-2-rect', label: 'Rectangle (4 sides)', isTarget: true, shapeSvg: 'rect' },
      { id: 'pat-2-tri', label: 'Triangle (3 sides)', isTarget: false, shapeSvg: 'triangle' },
      { id: 'pat-2-sq', label: 'Square (4 sides)', isTarget: true, shapeSvg: 'square' },
      { id: 'pat-2-pent', label: 'Pentagon (5 sides)', isTarget: false, shapeSvg: 'pentagon' },
      { id: 'pat-2-rhom', label: 'Rhombus (4 sides)', isTarget: true, shapeSvg: 'diamond' },
      { id: 'pat-2-circ', label: 'Circle (0 sides)', isTarget: false, shapeSvg: 'circle-hollow' }
    ]
  },

  // 8. Pattern & Rule Challenge: Trial 3 (Rule Change - Curved Edges)
  {
    id: 'q-pat-3',
    domain: 'pattern',
    activityKind: 'rule_grouping',
    title: 'Pattern & Rule: Rule Change',
    instructions: 'The rule has now changed! Disregard the previous 4-sided rule and follow the new criterion below.',
    detailPrompt: 'NEW RULE: Select all geometric figures that contain CURVED boundaries.',
    ruleDescription: 'Rule Change: Must contain curved boundaries',
    options: [
      { id: 'pat-3-circ', label: 'Circle (Curved boundary)', isTarget: true, shapeSvg: 'circle-hollow' },
      { id: 'pat-3-sq', label: 'Square (Straight sides)', isTarget: false, shapeSvg: 'square' },
      { id: 'pat-3-oval', label: 'Oval (Curved boundary)', isTarget: true, shapeSvg: 'oval' },
      { id: 'pat-3-star', label: 'Star (Straight sides)', isTarget: false, shapeSvg: 'star' },
      { id: 'pat-3-cyl', label: 'Cylinder (Curved outline)', isTarget: true, shapeSvg: 'cylinder' },
      { id: 'pat-3-hex', label: 'Hexagon (Straight sides)', isTarget: false, shapeSvg: 'hexagon' }
    ]
  },

  // 9. Visual-Spatial Challenge: Trial 1 (Rotation Match)
  {
    id: 'q-vs-1',
    domain: 'visualSpatial',
    activityKind: 'visual_spatial_match',
    title: 'Visual-Spatial: 2D Mental Rotation',
    instructions: 'Look at the target shape in the reference box. One of the options below is the EXACT same shape, merely rotated clockwise.',
    detailPrompt: 'Target: Asymmetric L-Shape with a notch on top.\nWhich option is an exact rotated match without being flipped or distorted?',
    options: [
      { id: 'vs-1-opt1', label: 'Figure A (Rotated 90° Clockwise)', isTarget: true, shapeSvg: 'l-rot-90' },
      { id: 'vs-1-opt2', label: 'Figure B (Mirrored / Inverted)', isTarget: false, shapeSvg: 'l-mirror' },
      { id: 'vs-1-opt3', label: 'Figure C (Altered Notch Size)', isTarget: false, shapeSvg: 'l-altered' },
      { id: 'vs-1-opt4', label: 'Figure D (Opposite Flange)', isTarget: false, shapeSvg: 'l-wrong' }
    ]
  },

  // 10. Visual-Spatial Challenge: Trial 2 (Symmetry Grid Completion)
  {
    id: 'q-vs-2',
    domain: 'visualSpatial',
    activityKind: 'visual_spatial_match',
    title: 'Visual-Spatial: Matrix Alignment',
    instructions: 'A 2x2 symmetrical quadrant pattern has a missing bottom-right quadrant (indicated by the dashed border).',
    detailPrompt: 'Which piece correctly completes the bilateral symmetry across the vertical and horizontal axes?',
    options: [
      { id: 'vs-2-opt1', label: 'Quadrant A (Inverted diagonal)', isTarget: false, shapeSvg: 'quad-wrong' },
      { id: 'vs-2-opt2', label: 'Quadrant B (Exact Symmetrical Match)', isTarget: true, shapeSvg: 'quad-correct' },
      { id: 'vs-2-opt3', label: 'Quadrant C (Horizontal flip only)', isTarget: false, shapeSvg: 'quad-partial' },
      { id: 'vs-2-opt4', label: 'Quadrant D (Solid fill foil)', isTarget: false, shapeSvg: 'quad-solid' }
    ]
  },

  // 11. Delayed Memory Recall (Final scored task for Memory domain)
  {
    id: 'q-mem-delayed',
    domain: 'memory',
    activityKind: 'memory_delayed_recall',
    title: 'Delayed Memory Recall: Original Items',
    instructions: 'Earlier in today\'s assessment, you studied 6 everyday items before completing the attention and spatial activities.',
    detailPrompt: 'Select all 6 items you studied earlier from the 12 options below. 6 are original items and 6 are distractors.',
    targetCount: 6,
    options: DELAYED_RECALL_OPTIONS
  }
];

/**
 * Diagram Editor
 * Copyright © 2026 Nawaraj Poudel. All rights reserved.
 */

const GRID = 20;
let tool = 'select';
let wireStyle = 'ortho'; // 'ortho' | 'straight'
let comps = [];
let wires = [];
let sel = null;
let dragging = false;
let dragOff = { x: 0, y: 0 };
let wireStart = null;
let tempMouse = null;
let history = [];
let ctxTarget = null;

// Zoom and Pan States
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let spacePressed = false;

// Properties Panel Selection Tracker
let lastSelId = null;
let currentDiagramType = 'erd_diagram';
let pickerSearchText = '';
let pickerCategory = 'all';

// List of all diagram types
const DIAGRAM_TYPES = [
  {
    id: 'circuit',
    name: 'Circuit Diagram',
    category: 'general',
    desc: 'Design electronic circuits using resistors, capacitors, and other electrical components.',
    toolbox: [
      { title: 'Circuit Components', items: ['resistor', 'capacitor', 'inductor', 'voltage', 'ground', 'led', 'nmos'] },
      { title: 'Annotations', items: ['wf_text', 'wf_box'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'voltage', x: 200, y: 250, label: '9V' },
        { id: '2', type: 'resistor', x: 350, y: 150, label: '1kΩ' },
        { id: '3', type: 'led', x: 500, y: 250, label: 'Red LED' },
        { id: '4', type: 'ground', x: 350, y: 400, label: '' }
      ],
      wires: [
        { from: '1', fromPin: 0, to: '2', toPin: 0, style: 'ortho' },
        { from: '2', fromPin: 1, to: '3', toPin: 0, style: 'ortho' },
        { from: '3', fromPin: 1, to: '4', toPin: 0, style: 'ortho' },
        { from: '4', fromPin: 0, to: '1', toPin: 1, style: 'ortho' }
      ]
    }
  },
  {
    id: 'logic',
    name: 'Logic Circuit Diagram',
    category: 'general',
    desc: 'Design digital logic circuits using AND, OR, NOT, NAND, NOR, XOR, and XNOR gates.',
    toolbox: [
      { title: 'Logic Gates', items: ['gate_and', 'gate_or', 'gate_not', 'gate_nand', 'gate_nor', 'gate_xor', 'gate_xnor'] },
      { title: 'I/O', items: ['logic_input', 'logic_output'] },
      { title: 'Annotations', items: ['wf_text', 'wf_box'] }
    ]
  },
  {
    id: 'dfd',
    name: 'Data Flow Diagram (DFD)',
    category: 'general',
    desc: 'Visualize data flow within a system using processes, external entities, and data stores.',
    toolbox: [
      { title: 'DFD Shapes', items: ['dfd_process', 'dfd_external', 'dfd_datastore'] }
    ]
  },
  {
    id: 'erd_diagram',
    name: 'ER Diagram',
    category: 'db',
    desc: 'Chen ER Notation with Entities, Attributes, Primary Keys, Relationships, and Cardinality.',
    toolbox: [
      { title: 'ER Diagram Shapes', items: ['entity', 'weak_entity', 'attribute', 'key_attr', 'multivalued_attr', 'derived_attr', 'relation', 'weak_relationship', 'cardinality'] }
    ]
  },
  {
    id: 'erd_db',
    name: 'ERD Diagram',
    category: 'db',
    desc: 'Entity-Relationship Diagram database schema view with attributes and relationships.',
    toolbox: [
      { title: 'Database Shapes', items: ['entity', 'weak_entity', 'attribute', 'key_attr', 'relation', 'cardinality'] }
    ]
  },
  {
    id: 'wireframe',
    name: 'Wireframe',
    category: 'general',
    desc: 'Design low-fidelity UI layouts using container boxes, input fields, images, and text.',
    toolbox: [
      { title: 'Wireframe Elements', items: ['wf_box', 'wf_button', 'wf_input', 'wf_text', 'wf_image', 'wf_divider'] }
    ]
  },
  {
    id: 'flowchart',
    name: 'Programming Flowchart',
    category: 'general',
    desc: 'Map out step-by-step algorithms using terminals, decisions, processes, and I/O shapes.',
    toolbox: [
      { title: 'Flowchart Shapes', items: ['flow_terminal', 'flow_process', 'flow_decision', 'flow_io', 'flow_subprocess', 'flow_connector'] }
    ]
  },
  {
    id: 'uml_class',
    name: 'UML Class Diagram',
    category: 'uml',
    desc: 'Model object-oriented system structures using Class, Interface, and Relationship shapes.',
    toolbox: [
      { title: 'Class Shapes', items: ['uml_class', 'uml_interface', 'uml_usecase', 'cardinality'] }
    ]
  },
  {
    id: 'uml_usecase',
    name: 'UML Use Case Diagram',
    category: 'uml',
    desc: 'Model system interactions using Actors, Use Cases, and System Boundaries.',
    toolbox: [
      { title: 'Use Case Shapes', items: ['uml_actor', 'uml_usecase', 'uml_boundary'] }
    ]
  },
  {
    id: 'uml_sequence',
    name: 'UML Sequence Diagram',
    category: 'uml',
    desc: 'Model message passing over time using Lifelines and Activation Boxes.',
    toolbox: [
      { title: 'Sequence Shapes', items: ['uml_lifeline', 'uml_activation', 'wf_text'] }
    ]
  },
  {
    id: 'uml_activity',
    name: 'UML Activity Diagram',
    category: 'uml',
    desc: 'Model control and data flows using Activity States, Decision points, and Fork/Joins.',
    toolbox: [
      { title: 'Activity Shapes', items: ['uml_initial', 'uml_final', 'uml_activity', 'flow_decision', 'uml_fork_join'] }
    ]
  },
  {
    id: 'uml_state',
    name: 'UML State Diagram',
    category: 'uml',
    desc: 'Model state machine behaviors using States, Initial/Final markers, and Transitions.',
    toolbox: [
      { title: 'State Shapes', items: ['uml_initial', 'uml_final', 'uml_activity'] }
    ]
  },
  {
    id: 'uml_component',
    name: 'UML Component Diagram',
    category: 'uml',
    desc: 'Model high-level software architectures using Components, Interfaces, and Ports.',
    toolbox: [
      { title: 'Component Shapes', items: ['uml_component', 'uml_interface_lollipop', 'uml_boundary'] }
    ]
  },
  {
    id: 'uml_deployment',
    name: 'UML Deployment Diagram',
    category: 'uml',
    desc: 'Model physical hardware deployments using Nodes and Artifacts.',
    toolbox: [
      { title: 'Deployment Shapes', items: ['uml_node', 'uml_component', 'wf_box'] }
    ]
  },
  {
    id: 'uml_package',
    name: 'UML Package Diagram',
    category: 'uml',
    desc: 'Organize architectural components into Packages and Subsystem groups.',
    toolbox: [
      { title: 'Package Shapes', items: ['uml_package', 'uml_component'] }
    ]
  },
  {
    id: 'uml_composite',
    name: 'UML Composite Diagram',
    category: 'uml',
    desc: 'Model internal structures and classifier behaviors using nested Parts and Ports.',
    toolbox: [
      { title: 'Composite Shapes', items: ['uml_component', 'uml_boundary'] }
    ]
  },
  {
    id: 'uml_communication',
    name: 'UML Communication Diagram',
    category: 'uml',
    desc: 'Model object interactions focused on structural relationships and message sequencing.',
    toolbox: [
      { title: 'Communication Shapes', items: ['uml_actor', 'uml_usecase', 'cardinality'] }
    ]
  },
  {
    id: 'uml_interaction',
    name: 'UML Interaction Overview Diagram',
    category: 'uml',
    desc: 'Model interaction control flow using a hybrid of Activity and Sequence blocks.',
    toolbox: [
      { title: 'Interaction Shapes', items: ['uml_initial', 'uml_final', 'uml_activity', 'flow_decision'] }
    ]
  },
  {
    id: 'online_order',
    name: 'Online Order System',
    category: 'db',
    desc: 'Pre-built relational schema mapping order management databases.',
    toolbox: [
      { title: 'Database Shapes', items: ['entity', 'weak_entity', 'attribute', 'key_attr', 'relation', 'cardinality'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'entity', x: 200, y: 150, label: 'Customer' },
        { id: '2', type: 'entity', x: 500, y: 150, label: 'Order' },
        { id: '3', type: 'relation', x: 350, y: 150, label: 'Places' },
        { id: '4', type: 'attribute', x: 200, y: 50, label: 'CustID (PK)' },
        { id: '5', type: 'attribute', x: 500, y: 50, label: 'OrderID (PK)' },
        { id: '6', type: 'cardinality', x: 280, y: 170, label: '1' },
        { id: '7', type: 'cardinality', x: 420, y: 170, label: 'N' }
      ],
      wires: [
        { from: '1', fromPin: 1, to: '3', toPin: 3, style: 'straight' },
        { from: '3', fromPin: 1, to: '2', toPin: 3, style: 'straight' },
        { from: '1', fromPin: 0, to: '4', toPin: 2, style: 'straight' },
        { from: '2', fromPin: 0, to: '5', toPin: 2, style: 'straight' }
      ]
    }
  },
  {
    id: 'sales_model',
    name: 'Internet Sales Model',
    category: 'db',
    desc: 'Relational mapping for E-commerce internet sales systems.',
    toolbox: [
      { title: 'Database Shapes', items: ['entity', 'weak_entity', 'attribute', 'key_attr', 'relation', 'cardinality'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'entity', x: 200, y: 200, label: 'Product' },
        { id: '2', type: 'entity', x: 500, y: 200, label: 'Sale' },
        { id: '3', type: 'relation', x: 350, y: 200, label: 'Contains' }
      ],
      wires: [
        { from: '1', fromPin: 1, to: '3', toPin: 3, style: 'straight' },
        { from: '3', fromPin: 1, to: '2', toPin: 3, style: 'straight' }
      ]
    }
  },
  {
    id: 'example_uml_activity',
    name: 'UML Activity Diagram (Example)',
    category: 'examples',
    desc: 'A ready-to-use UML Activity workflow representing checkout authorization.',
    toolbox: [
      { title: 'Activity Shapes', items: ['uml_initial', 'uml_final', 'uml_activity', 'flow_decision', 'uml_fork_join'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'uml_initial', x: 100, y: 150, label: '' },
        { id: '2', type: 'uml_activity', x: 240, y: 150, label: 'Authorize Card' },
        { id: '3', type: 'flow_decision', x: 420, y: 150, label: 'Valid?' },
        { id: '4', type: 'uml_activity', x: 580, y: 100, label: 'Success' },
        { id: '5', type: 'uml_activity', x: 580, y: 200, label: 'Reject Order' },
        { id: '6', type: 'uml_final', x: 740, y: 150, label: '' }
      ],
      wires: [
        { from: '1', fromPin: 1, to: '2', toPin: 3, style: 'straight' },
        { from: '2', fromPin: 1, to: '3', toPin: 3, style: 'straight' },
        { from: '3', fromPin: 0, to: '4', toPin: 3, style: 'straight' },
        { from: '3', fromPin: 2, to: '5', toPin: 3, style: 'straight' },
        { from: '4', fromPin: 1, to: '6', toPin: 0, style: 'straight' },
        { from: '5', fromPin: 1, to: '6', toPin: 2, style: 'straight' }
      ]
    }
  },
  {
    id: 'example_uml_class',
    name: 'UML Class Diagram (Example)',
    category: 'examples',
    desc: 'An object-oriented UML Class hierarchy containing subclass relationships.',
    toolbox: [
      { title: 'Class Shapes', items: ['uml_class', 'uml_interface', 'uml_usecase', 'cardinality'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'uml_class', x: 200, y: 180, label: 'Vehicle' },
        { id: '2', type: 'uml_class', x: 450, y: 100, label: 'Car' },
        { id: '3', type: 'uml_class', x: 450, y: 260, label: 'Truck' }
      ],
      wires: [
        { from: '2', fromPin: 3, to: '1', toPin: 1, style: 'straight' },
        { from: '3', fromPin: 3, to: '1', toPin: 2, style: 'straight' }
      ]
    }
  },
  {
    id: 'example_uml_comm',
    name: 'UML Communication Diagram (Example)',
    category: 'examples',
    desc: 'Interaction overview detailing collaborating lifelines.',
    toolbox: [
      { title: 'Communication Shapes', items: ['uml_actor', 'uml_usecase', 'cardinality'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'uml_actor', x: 200, y: 180, label: 'User' },
        { id: '2', type: 'uml_usecase', x: 450, y: 180, label: 'Order System' }
      ],
      wires: [
        { from: '1', fromPin: 1, to: '2', toPin: 3, style: 'straight' }
      ]
    }
  },
  {
    id: 'example_uml_comp',
    name: 'UML Component Diagram (Example)',
    category: 'examples',
    desc: 'Modular software system components connected through interfaces.',
    toolbox: [
      { title: 'Component Shapes', items: ['uml_component', 'uml_interface_lollipop', 'uml_boundary'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'uml_component', x: 200, y: 180, label: 'API Gateway' },
        { id: '2', type: 'uml_component', x: 500, y: 180, label: 'Auth Service' }
      ],
      wires: [
        { from: '1', fromPin: 1, to: '2', toPin: 3, style: 'straight' }
      ]
    }
  },
  {
    id: 'example_uml_seq',
    name: 'UML Sequence Diagram (Example)',
    category: 'examples',
    desc: 'Interaction scenario between a User Actor and Auth Server.',
    toolbox: [
      { title: 'Sequence Shapes', items: ['uml_lifeline', 'uml_activation', 'wf_text'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'uml_lifeline', x: 200, y: 100, label: 'User' },
        { id: '2', type: 'uml_lifeline', x: 450, y: 100, label: 'AuthServer' },
        { id: '3', type: 'uml_activation', x: 200, y: 180, label: '' },
        { id: '4', type: 'uml_activation', x: 450, y: 180, label: '' }
      ],
      wires: [
        { from: '3', fromPin: 1, to: '4', toPin: 3, style: 'straight' }
      ]
    }
  },
  {
    id: 'example_uml_usecase',
    name: 'UML Use Case Diagram (Example)',
    category: 'examples',
    desc: 'A complete Use Case map for an online banking application.',
    toolbox: [
      { title: 'Use Case Shapes', items: ['uml_actor', 'uml_usecase', 'uml_boundary'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'uml_actor', x: 150, y: 180, label: 'Customer' },
        { id: '2', type: 'uml_boundary', x: 450, y: 180, label: 'Bank System', w: 240, h: 220 },
        { id: '3', type: 'uml_usecase', x: 450, y: 120, label: 'Check Balance' },
        { id: '4', type: 'uml_usecase', x: 450, y: 220, label: 'Transfer Funds' }
      ],
      wires: [
        { from: '1', fromPin: 1, to: '3', toPin: 3, style: 'straight' },
        { from: '1', fromPin: 1, to: '4', toPin: 3, style: 'straight' }
      ]
    }
  },
  {
    id: 'trading_wf',
    name: 'Trading App Wireframe',
    category: 'examples',
    desc: 'A dashboard blueprint for a cryptocurrency trading app UI.',
    toolbox: [
      { title: 'Wireframe Elements', items: ['wf_box', 'wf_button', 'wf_input', 'wf_text', 'wf_image', 'wf_divider'] }
    ],
    template: {
      comps: [
        { id: '1', type: 'wf_box', x: 380, y: 200, label: 'Dashboard Frame', w: 420, h: 260 },
        { id: '2', type: 'wf_text', x: 260, y: 100, label: 'Portfolio Balance: $14,242.00' },
        { id: '3', type: 'wf_button', x: 260, y: 260, label: 'BUY' },
        { id: '4', type: 'wf_button', x: 420, y: 260, label: 'SELL' },
        { id: '5', type: 'wf_image', x: 380, y: 180, label: 'Price Chart', w: 340, h: 100 }
      ],
      wires: []
    }
  }
];

// SVG previews for the toolbox buttons
const SHAPE_SVGS = {
  // Tools
  select: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l7.187 17 3.01-6.803L21 11.187z"/></svg>`,
  wire: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20L20 4"/><circle cx="4" cy="20" r="2" fill="currentColor"/><circle cx="20" cy="4" r="2" fill="currentColor"/></svg>`,

  // Circuit
  resistor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h3l2-5 3 10 3-10 2 7 2-2h3"/></svg>`,
  capacitor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h7M14 12h7M10 6v12M14 6v12"/></svg>`,
  inductor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h2c1.5 0 1.5-4 3-4s1.5 4 3 4c1.5 0 1.5-4 3-4s1.5 4 3 4h2"/></svg>`,
  voltage: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></svg>`,
  ground: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v10M6 14h12M8 17h8M10 20h4"/></svg>`,
  led: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12M9 7l6 5-6 5V7zM15 7v10"/></svg>`,
  nmos: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h5M10 7v10M13 8h5v-3M13 16h5v3M13 8v8"/></svg>`,

  // Logic
  gate_and: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6c5.523 0 10 4.477 10 10s-4.477 10-10 10H4V4z"/></svg>`,
  gate_or: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4c4 0 16 2 16 10s-12 10-16 10c2-5 2-15 0-20z"/></svg>`,
  gate_not: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l12 8-12 8V4z"/><circle cx="19" cy="12" r="2"/></svg>`,
  gate_nand: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h6c5.523 0 10 4.477 10 10s-4.477 10-10 10H2V4z"/><circle cx="21" cy="14" r="2"/></svg>`,
  gate_nor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4c4 0 14 2 14 10s-10 10-14 10c2-5 2-15 0-20z"/><circle cx="19" cy="14" r="2"/></svg>`,
  gate_xor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4c4 0 14 2 14 10s-10 10-14 10c2-5 2-15 0-20z"/><path d="M2 4c2 5 2 15 0 20"/></svg>`,
  gate_xnor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4c4 0 14 2 14 10s-10 10-14 10c2-5 2-15 0-20z"/><path d="M2 4c2 5 2 15 0 20"/><circle cx="23" cy="14" r="2"/></svg>`,
  logic_input: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="12" height="8"/><path d="M16 12h4"/></svg>`,
  logic_output: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="12" r="4"/><path d="M4 12h8"/></svg>`,

  // ER
  entity: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="1"/></svg>`,
  weak_entity: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="1"/><rect x="6" y="8" width="12" height="8" rx="0.5"/></svg>`,
  attribute: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9" ry="6"/></svg>`,
  key_attr: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="11" rx="9" ry="5"/><path d="M6 19h12"/></svg>`,
  multivalued_attr: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="6" ry="4"/></svg>`,
  derived_attr: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3,2"><ellipse cx="12" cy="12" rx="9" ry="6"/></svg>`,
  relation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l9 9-9 9-9-9z"/></svg>`,
  weak_relationship: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l9 9-9 9-9-9z"/><path d="M12 6l6 6-6 6-6-6z"/></svg>`,
  cardinality: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="12" y="16" font-size="14" font-weight="bold" text-anchor="middle" fill="currentColor">N</text></svg>`,

  // DFD
  dfd_process: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`,
  dfd_external: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="1"/></svg>`,
  dfd_datastore: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 18h18"/></svg>`,

  // Flowchart
  flow_terminal: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="4"/></svg>`,
  flow_process: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14"/></svg>`,
  flow_decision: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l9 9-9 9-9-9z"/></svg>`,
  flow_io: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-3 12H3l3-12z"/></svg>`,
  flow_subprocess: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14"/><path d="M7 5v14M17 5v14"/></svg>`,
  flow_connector: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>`,

  // Wireframe
  wf_box: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  wf_button: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="10" rx="3" fill="currentColor"/></svg>`,
  wf_input: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 15h12"/></svg>`,
  wf_text: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
  wf_image: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 3l18 18M21 3L3 21"/></svg>`,
  wf_divider: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18"/></svg>`,

  // UML
  uml_class: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18"/></svg>`,
  uml_interface: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18"/><path d="M8 6h8"/></svg>`,
  uml_actor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M12 11v6M9 14h6M10 21l2-4 2 4"/></svg>`,
  uml_usecase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9" ry="5"/></svg>`,
  uml_boundary: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3,2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  uml_lifeline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="12" height="6"/><path d="M12 10v11" stroke-dasharray="3,2"/></svg>`,
  uml_activation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="4" width="4" height="16" fill="currentColor"/></svg>`,
  uml_initial: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>`,
  uml_final: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>`,
  uml_activity: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="4"/></svg>`,
  uml_fork_join: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12h16"/></svg>`,
  uml_component: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="15" height="16" rx="1"/><rect x="3" y="7" width="5" height="4"/><rect x="3" y="13" width="5" height="4"/></svg>`,
  uml_interface_lollipop: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M12 11v8"/></svg>`,
  uml_node: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7l5-4 8 3-5 4zM7 7v10l5 4V10zM20 6v10l-8 5v-11z"/></svg>`,
  uml_package: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h7l2 2h9v12H3zM3 6v14"/></svg>`
};

const SHAPE_NAMES = {
  // Circuit
  resistor: 'Resistor',
  capacitor: 'Capacitor',
  inductor: 'Inductor',
  voltage: 'Voltage Source',
  ground: 'Ground',
  led: 'LED',
  nmos: 'NMOS Transistor',
  // Logic
  gate_and: 'AND Gate',
  gate_or: 'OR Gate',
  gate_not: 'NOT Gate',
  gate_nand: 'NAND Gate',
  gate_nor: 'NOR Gate',
  gate_xor: 'XOR Gate',
  gate_xnor: 'XNOR Gate',
  logic_input: 'Logic Input',
  logic_output: 'Logic Output',
  // DFD
  dfd_process: 'Process',
  dfd_external: 'External Entity',
  dfd_datastore: 'Data Store',
  // Flowchart
  flow_terminal: 'Terminal (Start/End)',
  flow_process: 'Process Step',
  flow_decision: 'Decision Diamond',
  flow_io: 'Input / Output',
  flow_subprocess: 'Subprocess',
  flow_connector: 'Connector Dot',
  // Wireframe
  wf_box: 'UI Container Box',
  wf_button: 'Button Element',
  wf_input: 'Input Field Block',
  wf_text: 'Text Label',
  wf_image: 'Image Placeholder',
  wf_divider: 'Horizontal Line Divider',
  // UML
  uml_class: 'UML Class',
  uml_interface: 'UML Interface',
  uml_actor: 'UML Actor Stickman',
  uml_usecase: 'UML Use Case',
  uml_boundary: 'System Boundary Box',
  uml_lifeline: 'UML Lifeline',
  uml_activation: 'Activation Lifeline Box',
  uml_initial: 'UML Initial State',
  uml_final: 'UML Final State',
  uml_activity: 'UML Activity State',
  uml_fork_join: 'Fork / Join Bar',
  uml_component: 'Software Component',
  uml_interface_lollipop: 'Lollipop Interface',
  uml_node: 'Server Node Box',
  uml_package: 'UML Package Folder',
  // Fallbacks/General
  entity: 'Entity',
  weak_entity: 'Weak Entity',
  attribute: 'Attribute',
  key_attr: 'Primary Key Attribute',
  multivalued_attr: 'Multivalued Attribute',
  derived_attr: 'Derived Attribute',
  relation: 'Relationship',
  weak_relationship: 'Weak Relationship',
  cardinality: 'Cardinality'
};

// Diagram Picker Modal Handlers
function showPicker() {
  document.getElementById('picker-modal').style.display = 'flex';
  document.getElementById('picker-search').value = '';
  pickerSearchText = '';
  renderPickerGrid();
}

function hidePicker() {
  document.getElementById('picker-modal').style.display = 'none';
}

function filterDiagrams(val) {
  pickerSearchText = val.toLowerCase();
  renderPickerGrid();
}

function switchPickerCategory(cat) {
  pickerCategory = cat;
  document.querySelectorAll('.picker-tab').forEach(t => t.classList.remove('active'));
  const activeTabBtn = Array.from(document.querySelectorAll('.picker-tab')).find(btn => {
    return btn.textContent.toLowerCase().includes(cat === 'db' ? 'database' : cat === 'examples' ? 'templates' : cat);
  });
  if (activeTabBtn) activeTabBtn.classList.add('active');
  renderPickerGrid();
}

function renderPickerGrid() {
  const grid = document.getElementById('picker-grid-content');
  grid.innerHTML = '';

  const filtered = DIAGRAM_TYPES.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(pickerSearchText) || d.desc.toLowerCase().includes(pickerSearchText);
    const matchesCat = pickerCategory === 'all' || d.category === pickerCategory;
    return matchesSearch && matchesCat;
  });

  filtered.forEach(d => {
    const card = document.createElement('div');
    card.className = 'picker-card';
    card.onclick = () => {
      if (d.template && comps.length > 0) {
        if (confirm(`Do you want to clear your current workspace and load the ${d.name} template?\n\nClick OK to replace your work with the template.\nClick Cancel to keep your current diagram and just change the toolbox.`)) {
          setDiagramType(d.id, true);
        } else {
          setDiagramType(d.id, false);
        }
      } else {
        setDiagramType(d.id, true);
      }
      hidePicker();
    };

    const categoryLabels = { uml: 'UML', db: 'Database / ER', general: 'General', examples: 'Example Template' };

    card.innerHTML = `
      <div class="picker-card-header">
        <h3 class="picker-card-title">${d.name}</h3>
        <span class="picker-badge ${d.category}">${categoryLabels[d.category] || d.category}</span>
      </div>
      <p class="picker-card-desc">${d.desc}</p>
    `;
    grid.appendChild(card);
  });
}

function setDiagramType(typeId, loadTemplate = true) {
  const d = DIAGRAM_TYPES.find(x => x.id === typeId) || DIAGRAM_TYPES[1];
  currentDiagramType = d.id;

  // Update toolbar text label
  document.getElementById('active-diagram-type-label').textContent = d.name;

  // If a template is available, load its components and wires
  if (loadTemplate && d.template) {
    saveHistory();
    comps = d.template.comps.map(c => ({ ...c, id: c.id || crypto.randomUUID() }));
    wires = d.template.wires.map(w => ({ ...w }));
    sel = null;
  }

  renderToolbox();
  draw();
}

function renderToolbox() {
  const toolbox = document.getElementById('toolbox');
  toolbox.innerHTML = '';

  // 1. General Routing/Selector Tools
  const toolsTitle = document.createElement('div');
  toolsTitle.className = 'toolbox-section-title';
  toolsTitle.textContent = 'Tools';
  toolbox.appendChild(toolsTitle);

  const selBtn = document.createElement('button');
  selBtn.id = 'btn-select';
  selBtn.className = `toolbox-btn ${tool === 'select' ? 'active' : ''}`;
  selBtn.onclick = () => setTool('select');
  selBtn.innerHTML = `${SHAPE_SVGS.select} Select Mode`;
  toolbox.appendChild(selBtn);

  const wireBtn = document.createElement('button');
  wireBtn.id = 'btn-wire';
  wireBtn.className = `toolbox-btn ${tool === 'wire' ? 'active' : ''}`;
  wireBtn.onclick = () => setTool('wire');
  wireBtn.innerHTML = `${SHAPE_SVGS.wire} Connector`;
  toolbox.appendChild(wireBtn);

  // Add wire style toggle submenu
  const toggleDiv = document.createElement('div');
  toggleDiv.className = 'wire-style-toggle';
  toggleDiv.innerHTML = `
    <button id="ws-ortho" class="wire-style-btn ${wireStyle === 'ortho' ? 'active' : ''}" onclick="setWireStyle('ortho')" title="Orthogonal (right-angle) connector">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 20h8V4"/></svg> Ortho
    </button>
    <button id="ws-straight" class="wire-style-btn ${wireStyle === 'straight' ? 'active' : ''}" onclick="setWireStyle('straight')" title="Straight (free-angle) connector">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 20L20 4"/></svg> Straight
    </button>
  `;
  toolbox.appendChild(toggleDiv);

  // 2. Specific shape items config
  const d = DIAGRAM_TYPES.find(x => x.id === currentDiagramType) || DIAGRAM_TYPES[1];
  d.toolbox.forEach(sect => {
    const title = document.createElement('div');
    title.className = 'toolbox-section-title';
    title.textContent = sect.title;
    toolbox.appendChild(title);

    sect.items.forEach(typeKey => {
      const btn = document.createElement('button');
      btn.className = 'toolbox-btn';
      btn.onclick = () => addComp(typeKey);

      const svgIcon = SHAPE_SVGS[typeKey] || SHAPE_SVGS.entity;
      const labelText = SHAPE_NAMES[typeKey] || typeKey;

      btn.innerHTML = `${svgIcon} ${labelText}`;
      toolbox.appendChild(btn);
    });
  });
}


const wrap = document.getElementById('canvas-wrap');
const gridC = document.getElementById('grid-canvas');
const mainC = document.getElementById('main-canvas');
const gc = gridC.getContext('2d');
const ctx = mainC.getContext('2d');

function isDark() {
  return window.matchMedia('(prefers-color-scheme:dark)').matches;
}

function theme() {
  return isDark()
    ? { bg: '#1e1e1e', bg2: '#252525', text: '#e0e0e0', sub: '#888', wire: '#4a9eff', sel: '#4a9eff', stroke: '#ccc', fill: '#2a2a2a', pin: '#4a9eff', grid: 'rgba(255,255,255,0.05)' }
    : { bg: '#fff', bg2: '#f5f5f4', text: '#1a1a1a', sub: '#777', wire: '#1a6bcc', sel: '#1a6bcc', stroke: '#2a2a2a', fill: '#f9f9f7', pin: '#1a6bcc', grid: 'rgba(0,0,0,0.06)' };
}

function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  [gridC, mainC].forEach(c => { c.width = w; c.height = h; });
  drawGrid(); draw();
}

function snap(v) { return Math.round(v / GRID) * GRID; }

function drawGrid() {
  const T = theme();
  const w = gridC.width, h = gridC.height;
  gc.clearRect(0, 0, w, h);

  gc.save();
  gc.translate(offsetX, offsetY);
  gc.scale(scale, scale);

  gc.strokeStyle = T.grid;
  gc.lineWidth = 0.5 / scale;

  // Calculate visible range in grid coordinates
  const startX = Math.floor(-offsetX / scale / GRID) * GRID - GRID;
  const endX = startX + (w / scale) + GRID * 2;
  const startY = Math.floor(-offsetY / scale / GRID) * GRID - GRID;
  const endY = startY + (h / scale) + GRID * 2;

  // Draw lines
  for (let x = startX; x < endX; x += GRID) {
    gc.beginPath(); gc.moveTo(x, startY); gc.lineTo(x, endY); gc.stroke();
  }
  for (let y = startY; y < endY; y += GRID) {
    gc.beginPath(); gc.moveTo(startX, y); gc.lineTo(endX, y); gc.stroke();
  }

  // Intersect dots every 5 grids
  gc.fillStyle = isDark() ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const dotSpacing = GRID * 5;
  const dotStartX = Math.floor(startX / dotSpacing) * dotSpacing;
  const dotStartY = Math.floor(startY / dotSpacing) * dotSpacing;

  for (let x = dotStartX; x < endX; x += dotSpacing) {
    for (let y = dotStartY; y < endY; y += dotSpacing) {
      gc.beginPath(); gc.arc(x, y, 1.5 / scale, 0, Math.PI * 2); gc.fill();
    }
  }
  gc.restore();
}

function drawComp(c, isSel) {
  const T = theme();
  ctx.save();
  ctx.translate(c.x, c.y);

  if (isSel) {
    ctx.shadowColor = T.sel;
    ctx.shadowBlur = 10;
  }

  ctx.strokeStyle = isSel ? T.sel : T.stroke;
  ctx.fillStyle = T.fill;
  ctx.lineWidth = isSel ? 2 : 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (c.type) {
    case 'resistor': {
      ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(-15, 0); ctx.stroke();
      ctx.beginPath(); ctx.rect(-15, -9, 30, 18); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(32, 0); ctx.stroke();
      // zigzag inside
      ctx.beginPath();
      const pts = [[-14, 0], [-10, -7], [-5, 7], [0, -7], [5, 7], [10, -7], [14, 0]];
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.strokeStyle = isSel ? T.sel : (isDark() ? '#888' : '#555');
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = isSel ? T.sel : T.stroke; ctx.lineWidth = isSel ? 2 : 1.6;
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 27);
      break;
    }
    case 'capacitor': {
      ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-5, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(28, 0); ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(-5, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -14); ctx.lineTo(5, 14); ctx.stroke();
      ctx.lineWidth = isSel ? 2 : 1.6;
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'inductor': {
      ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-32, 0);
      for (let i = 0; i < 5; i++) {
        ctx.arc(-32 + i * 14 + 7, 0, 7, Math.PI, 0);
      }
      ctx.lineTo(40, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 22);
      break;
    }
    case 'voltage': {
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('+', -8, -4); ctx.fillText('−', 8, 7);
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -34); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 34); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif';
      ctx.fillText(c.label, 0, 48);
      break;
    }
    case 'ground': {
      ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, 0); ctx.stroke();
      [[24, 0], [16, 8], [8, 16]].forEach(([w, y]) => {
        ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); ctx.stroke();
      });
      break;
    }
    case 'led': {
      ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-12, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(24, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -14); ctx.lineTo(12, 0); ctx.lineTo(-12, 14); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(12, -14); ctx.lineTo(12, 14); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#f59e0b';
      ctx.beginPath(); ctx.moveTo(16, -10); ctx.lineTo(22, -17); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, -6); ctx.lineTo(26, -11); ctx.stroke();
      ctx.strokeStyle = isSel ? T.sel : T.stroke; ctx.lineWidth = isSel ? 2 : 1.6;
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'nmos': {
      ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-12, 0); ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-12, -16); ctx.lineTo(-12, 16); ctx.stroke();
      ctx.lineWidth = isSel ? 2 : 1.6;
      ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-8, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(-8, 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(0, -8); ctx.lineTo(0, -20); ctx.lineTo(20, -20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(0, 8); ctx.lineTo(0, 20); ctx.lineTo(20, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, 0); ctx.lineTo(20, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 4, 36);
      break;
    }
    case 'gate_not': {
      ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-15, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(10, 0); ctx.lineTo(-15, 15); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(14, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(25, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'gate_and': {
      ctx.beginPath(); ctx.moveTo(-25, -8); ctx.lineTo(-15, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-25, 8); ctx.lineTo(-15, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, -16); ctx.lineTo(0, -16); ctx.arc(0, 0, 16, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-15, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(25, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'gate_nand': {
      ctx.beginPath(); ctx.moveTo(-25, -8); ctx.lineTo(-15, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-25, 8); ctx.lineTo(-15, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, -16); ctx.lineTo(0, -16); ctx.arc(0, 0, 16, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-15, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(19, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(25, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'gate_or': {
      ctx.beginPath(); ctx.moveTo(-25, -8); ctx.lineTo(-12, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-25, 8); ctx.lineTo(-12, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-16, -16); ctx.quadraticCurveTo(4, -16, 16, 0); ctx.quadraticCurveTo(4, 16, -16, 16); ctx.quadraticCurveTo(-6, 0, -16, -16); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(25, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'gate_nor': {
      ctx.beginPath(); ctx.moveTo(-25, -8); ctx.lineTo(-12, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-25, 8); ctx.lineTo(-12, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-16, -16); ctx.quadraticCurveTo(4, -16, 16, 0); ctx.quadraticCurveTo(4, 16, -16, 16); ctx.quadraticCurveTo(-6, 0, -16, -16); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(19, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(25, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'gate_xor': {
      ctx.beginPath(); ctx.moveTo(-25, -8); ctx.lineTo(-16, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-25, 8); ctx.lineTo(-16, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, -16); ctx.quadraticCurveTo(-10, 0, -20, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, -16); ctx.quadraticCurveTo(6, -16, 18, 0); ctx.quadraticCurveTo(6, 16, -14, 16); ctx.quadraticCurveTo(-4, 0, -14, -16); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(25, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'gate_xnor': {
      ctx.beginPath(); ctx.moveTo(-25, -8); ctx.lineTo(-16, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-25, 8); ctx.lineTo(-16, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, -16); ctx.quadraticCurveTo(-10, 0, -20, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, -16); ctx.quadraticCurveTo(6, -16, 18, 0); ctx.quadraticCurveTo(6, 16, -14, 16); ctx.quadraticCurveTo(-4, 0, -14, -16); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(21, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(25, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 28);
      break;
    }
    case 'logic_input': {
      const w = c.w || 30, h = c.h || 20;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2 + 10, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'logic_output': {
      const w = c.w || 30, h = c.h || 20;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2 - 10, 0); ctx.lineTo(-w / 2, 0); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'entity': {
      const w = c.w || 100, h = c.h || 45;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'weak_entity': {
      const w = c.w || 100, h = c.h || 45;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.rect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8); ctx.stroke();
      ctx.lineWidth = isSel ? 2 : 1.6;
      ctx.fillStyle = T.text; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'attribute': {
      const rx = c.w ? c.w / 2 : 44, ry = c.h ? c.h / 2 : 22;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'key_attr': {
      const rx = c.w ? c.w / 2 : 44, ry = c.h ? c.h / 2 : 22;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      // underline
      const tw = ctx.measureText(c.label).width;
      ctx.beginPath(); ctx.moveTo(-tw / 2, 8); ctx.lineTo(tw / 2, 8); ctx.stroke();
      break;
    }
    case 'multivalued_attr': {
      const rx = c.w ? c.w / 2 : 44, ry = c.h ? c.h / 2 : 22;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(0, 0, rx - 4, ry - 3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = isSel ? 2 : 1.6;
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'derived_attr': {
      const rx = c.w ? c.w / 2 : 44, ry = c.h ? c.h / 2 : 22;
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'relation': {
      const hw = c.w ? c.w / 2 : 48, hh = c.h ? c.h / 2 : 26;
      ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, 0); ctx.lineTo(0, hh); ctx.lineTo(-hw, 0); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'weak_relationship': {
      const hw = c.w ? c.w / 2 : 48, hh = c.h ? c.h / 2 : 26;
      ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, 0); ctx.lineTo(0, hh); ctx.lineTo(-hw, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, -hh + 4); ctx.lineTo(hw - 6, 0); ctx.lineTo(0, hh - 4); ctx.lineTo(-hw + 6, 0); ctx.closePath(); ctx.stroke();
      ctx.lineWidth = isSel ? 2 : 1.6;
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'cardinality': {
      ctx.fillStyle = T.text; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    // DFD Shapes
    case 'dfd_process': {
      const r = (c.w || 60) / 2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Horizontal division line
      ctx.beginPath(); ctx.moveTo(-r * Math.cos(Math.asin(0.4)), -r * 0.4); ctx.lineTo(r * Math.cos(Math.asin(0.4)), -r * 0.4); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText("DFD", 0, -r * 0.55);
      ctx.font = '11px sans-serif';
      ctx.fillText(c.label, 0, 8);
      break;
    }
    case 'dfd_external': {
      const w = c.w || 100, h = c.h || 60;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'dfd_datastore': {
      const w = c.w || 120, h = c.h || 40;
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(w / 2, h / 2); ctx.stroke();
      // left side open vertical indicator
      ctx.beginPath(); ctx.moveTo(-w / 2 + 12, -h / 2); ctx.lineTo(-w / 2 + 12, h / 2); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 6, 4);
      break;
    }
    // Flowchart Shapes
    case 'flow_terminal': {
      const w = c.w || 100, h = c.h || 40, r = h / 2;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + r, -h / 2);
      ctx.lineTo(w / 2 - r, -h / 2);
      ctx.arcTo(w / 2, -h / 2, w / 2, 0, r);
      ctx.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
      ctx.lineTo(-w / 2 + r, h / 2);
      ctx.arcTo(-w / 2, h / 2, -w / 2, 0, r);
      ctx.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'flow_process': {
      const w = c.w || 100, h = c.h || 60;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'flow_decision': {
      const hw = (c.w || 90) / 2, hh = (c.h || 60) / 2;
      ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, 0); ctx.lineTo(0, hh); ctx.lineTo(-hw, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'flow_io': {
      const w = c.w || 110, h = c.h || 50;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 10, -h / 2); ctx.lineTo(w / 2, -h / 2);
      ctx.lineTo(w / 2 - 10, h / 2); ctx.lineTo(-w / 2, h / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'flow_subprocess': {
      const w = c.w || 110, h = c.h || 60;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2 + 8, -h / 2); ctx.lineTo(-w / 2 + 8, h / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2 - 8, -h / 2); ctx.lineTo(w / 2 - 8, h / 2); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'flow_connector': {
      const r = (c.w || 24) / 2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label || 'C', 0, 3);
      break;
    }
    // Wireframe Shapes
    case 'wf_box': {
      const w = c.w || 160, h = c.h || 120;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.sub; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(c.label, -w / 2 + 8, -h / 2 + 16);
      break;
    }
    case 'wf_button': {
      const w = c.w || 90, h = c.h || 36;
      ctx.fillStyle = isDark() ? '#3a3a3a' : '#eaeaea';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -h / 2, w, h, 6) : ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'wf_input': {
      const w = c.w || 130, h = c.h || 36;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -h / 2, w, h, 4) : ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.sub; ctx.font = 'italic 11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(c.label, -w / 2 + 8, 4);
      break;
    }
    case 'wf_text': {
      ctx.fillStyle = T.text; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      const lines = c.label.split('\n');
      lines.forEach((line, idx) => {
        ctx.fillText(line, 0, 4 + (idx - (lines.length - 1) / 2) * 16);
      });
      break;
    }
    case 'wf_image': {
      const w = c.w || 120, h = c.h || 90;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2); ctx.stroke();
      ctx.fillStyle = T.bg; ctx.beginPath(); ctx.rect(-24, -10, 48, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label || 'IMAGE', 0, 3);
      break;
    }
    case 'wf_divider': {
      const w = c.w || 160;
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
      break;
    }
    // UML Shapes
    case 'uml_class':
    case 'uml_interface': {
      const w = c.w || 130, h = c.h || 100;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      // Draw standard UML class division lines
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 30); ctx.lineTo(w / 2, -h / 2 + 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 65); ctx.lineTo(w / 2, -h / 2 + 65); ctx.stroke();

      ctx.fillStyle = T.text; ctx.textAlign = 'center';
      if (c.type === 'uml_interface') {
        ctx.font = 'italic 10px sans-serif';
        ctx.fillText('«interface»', 0, -h / 2 + 12);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(c.label.replace('«interface»', '').trim(), 0, -h / 2 + 24);
      } else {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(c.label, 0, -h / 2 + 18);
      }

      // Draw attributes / methods placeholders
      ctx.fillStyle = T.sub; ctx.font = '10px monospace'; ctx.textAlign = 'left';
      ctx.fillText('+ id: int', -w / 2 + 8, -h / 2 + 44);
      ctx.fillText('+ getName(): string', -w / 2 + 8, -h / 2 + 82);
      break;
    }
    case 'uml_actor': {
      // Stick figure
      ctx.beginPath(); ctx.arc(0, -20, 10, 0, Math.PI * 2); ctx.stroke(); // Head
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 15); ctx.stroke(); // Body
      ctx.beginPath(); ctx.moveTo(-18, -3); ctx.lineTo(18, -3); ctx.stroke(); // Arms
      ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(-12, 35); ctx.stroke(); // Left Leg
      ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(12, 35); ctx.stroke(); // Right Leg
      ctx.fillStyle = T.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 48);
      break;
    }
    case 'uml_usecase': {
      const rx = c.w ? c.w / 2 : 55, ry = c.h ? c.h / 2 : 25;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'uml_boundary': {
      const w = c.w || 200, h = c.h || 200;
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = T.sub; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(c.label, -w / 2 + 10, -h / 2 + 18);
      break;
    }
    case 'uml_lifeline': {
      const w = c.w || 90, h = c.h || 180;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, 32); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(0, -h / 2 + 32); ctx.lineTo(0, h / 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = T.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, -h / 2 + 20);
      break;
    }
    case 'uml_activation': {
      const w = c.w || 20, h = c.h || 80;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      break;
    }
    case 'uml_initial': {
      const r = (c.w || 24) / 2;
      ctx.fillStyle = T.stroke;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'uml_final': {
      const r = (c.w || 26) / 2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = T.stroke;
      ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'uml_activity': {
      const w = c.w || 110, h = c.h || 50, r = 12;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-w / 2, -h / 2, w, h, r) : ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 4);
      break;
    }
    case 'uml_fork_join': {
      const w = c.w || 140, h = c.h || 12;
      ctx.fillStyle = T.stroke;
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill();
      break;
    }
    case 'uml_component': {
      const w = c.w || 120, h = c.h || 70;
      ctx.beginPath(); ctx.rect(-w / 2 + 8, -h / 2, w - 8, h); ctx.fill(); ctx.stroke();
      // Draw the two left-side protruding tabs
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2 + 10, 16, 12); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(-w / 2, h / 2 - 22, 16, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 8, 4);
      break;
    }
    case 'uml_interface_lollipop': {
      const r = 10;
      ctx.beginPath(); ctx.arc(0, -20, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 30); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label || 'Interface', 0, 42);
      break;
    }
    case 'uml_node': {
      const w = c.w || 110, h = c.h || 90, d = 14;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + d, -h / 2); ctx.lineTo(w / 2, -h / 2);
      ctx.lineTo(w / 2, h / 2 - d); ctx.lineTo(-w / 2 + d, h / 2 - d); ctx.closePath();
      ctx.rect(-w / 2, -h / 2 + d, w - d, h - d);
      ctx.moveTo(-w / 2, -h / 2 + d); ctx.lineTo(-w / 2 + d, -h / 2);
      ctx.moveTo(w / 2 - d, -h / 2 + d); ctx.lineTo(w / 2, -h / 2);
      ctx.moveTo(w / 2 - d, h / 2); ctx.lineTo(w / 2, h / 2 - d);
      ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-w / 2 + d, h / 2 - d);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, -d / 2, d / 2 + 4);
      break;
    }
    case 'uml_package': {
      const w = c.w || 120, h = c.h || 80;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(-w / 2 + 40, -h / 2);
      ctx.lineTo(-w / 2 + 50, -h / 2 + 10);
      ctx.lineTo(w / 2, -h / 2 + 10);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 10); ctx.lineTo(w / 2, -h / 2 + 10); ctx.stroke();
      ctx.fillStyle = T.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, 0, 16);
      break;
    }
  }

  // Draw pins when selected
  if (isSel) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = T.pin;
    getPins(c).forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = T.bg; ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  ctx.restore();
}

function getPins(c) {
  switch (c.type) {
    case 'resistor': return [{ x: -32, y: 0 }, { x: 32, y: 0 }];
    case 'capacitor': return [{ x: -28, y: 0 }, { x: 28, y: 0 }];
    case 'inductor': return [{ x: -40, y: 0 }, { x: 40, y: 0 }];
    case 'voltage': return [{ x: 0, y: -34 }, { x: 0, y: 34 }];
    case 'ground': return [{ x: 0, y: -24 }];
    case 'led': return [{ x: -24, y: 0 }, { x: 24, y: 0 }];
    case 'nmos': return [{ x: -28, y: 0 }, { x: 20, y: -20 }, { x: 20, y: 20 }];
    case 'uml_actor': return [{ x: 0, y: -30 }, { x: 18, y: -3 }, { x: 0, y: 35 }, { x: -18, y: -3 }];
    case 'uml_interface_lollipop': return [{ x: 0, y: -30 }, { x: 0, y: 30 }];
    case 'uml_activation': return [{ x: 0, y: -(c.h || 80) / 2 }, { x: (c.w || 20) / 2, y: 0 }, { x: 0, y: (c.h || 80) / 2 }, { x: -(c.w || 20) / 2, y: 0 }];
    case 'uml_fork_join': {
      const w = c.w || 140;
      return [
        { x: -w / 2, y: 0 }, { x: -w / 4, y: 0 }, { x: 0, y: 0 }, { x: w / 4, y: 0 }, { x: w / 2, y: 0 }
      ];
    }
    case 'flow_connector':
    case 'uml_initial':
    case 'uml_final': {
      const r = (c.w || 24) / 2;
      return [{ x: 0, y: -r }, { x: r, y: 0 }, { x: 0, y: r }, { x: -r, y: 0 }];
    }
    case 'gate_not': return [{ x: -25, y: 0 }, { x: 25, y: 0 }];
    case 'gate_and':
    case 'gate_or':
    case 'gate_nand':
    case 'gate_nor':
    case 'gate_xor':
    case 'gate_xnor': return [{ x: -25, y: -8 }, { x: -25, y: 8 }, { x: 25, y: 0 }];
    case 'logic_input': return [{ x: (c.w || 30) / 2 + 10, y: 0 }];
    case 'logic_output': return [{ x: -(c.w || 30) / 2 - 10, y: 0 }];
    // All other 4-pin shapes
    default: {
      const hw = (c.w || 100) / 2;
      const hh = (c.h || 50) / 2;
      return [{ x: 0, y: -hh }, { x: hw, y: 0 }, { x: 0, y: hh }, { x: -hw, y: 0 }];
    }
  }
}

function getAbsPins(c) {
  return getPins(c).map(p => ({ x: c.x + p.x, y: c.y + p.y }));
}

function getWireCoords(w) {
  const fromComp = comps.find(c => c.id === w.from);
  const toComp = comps.find(c => c.id === w.to);
  if (!fromComp || !toComp) return null;

  const fromPins = getAbsPins(fromComp);
  const toPins = getAbsPins(toComp);

  const p1 = fromPins[w.fromPin] || { x: fromComp.x, y: fromComp.y };
  const p2 = toPins[w.toPin] || { x: toComp.x, y: toComp.y };

  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

function nearestPin(c, mx, my, thresh = 18) {
  let best = null, bd = Infinity;
  getAbsPins(c).forEach((p, i) => {
    const d = Math.hypot(p.x - mx, p.y - my);
    if (d < bd && d < thresh) { bd = d; best = i; }
  });
  return best;
}

function drawArrowhead(ctx, fromX, fromY, toX, toY, T, isSel) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const size = 9; // Let size stay fixed visually or scale with scale: 9 / scale is actually better for retaining crisp proportions at any zoom!
  const scaledSize = size / scale;

  ctx.save();
  ctx.translate(toX, toY);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-scaledSize, -scaledSize * 0.4);
  ctx.lineTo(-scaledSize * 0.75, 0);
  ctx.lineTo(-scaledSize, scaledSize * 0.4);
  ctx.closePath();

  ctx.fillStyle = isSel ? T.sel : T.wire;
  ctx.fill();
  ctx.restore();
}

function draw() {
  const T = theme();
  ctx.clearRect(0, 0, mainC.width, mainC.height);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Draw wires
  wires.forEach(w => {
    const coords = getWireCoords(w);
    if (!coords) return;
    const { x1, y1, x2, y2 } = coords;

    ctx.save();
    ctx.strokeStyle = w === sel ? T.sel : T.wire;
    ctx.lineWidth = w === sel ? 2.5 / scale : 1.8 / scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    let lastPointX = x1;
    let lastPointY = y1;

    if (w.style === 'ortho') {
      const mx = (x1 + x2) / 2;
      ctx.lineTo(mx, y1);
      ctx.lineTo(mx, y2);
      lastPointX = mx;
      lastPointY = y2;
    }
    // 'straight' just goes directly x1,y1 -> x2,y2 (lastPoint stays x1,y1)
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead at target end
    drawArrowhead(ctx, lastPointX, lastPointY, x2, y2, T, w === sel);

    // Junction dot at starting pin only
    ctx.beginPath(); ctx.arc(x1, y1, 3 / scale, 0, Math.PI * 2);
    ctx.fillStyle = T.wire; ctx.fill();

    ctx.restore();
  });

  // Temp wire during routing
  if (wireStart && tempMouse) {
    ctx.save();
    ctx.strokeStyle = T.wire; ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([6 / scale, 4 / scale]);
    ctx.beginPath();

    const startAbs = getAbsPins(wireStart.comp)[wireStart.pin];
    ctx.moveTo(startAbs.x, startAbs.y);

    let arrowFromX, arrowFromY;
    if (wireStyle === 'ortho') {
      const mx = (startAbs.x + tempMouse.x) / 2;
      ctx.lineTo(mx, startAbs.y);
      ctx.lineTo(mx, tempMouse.y);
      arrowFromX = mx; arrowFromY = tempMouse.y;
    } else {
      // Straight: draw direct line
      arrowFromX = startAbs.x; arrowFromY = startAbs.y;
    }
    ctx.lineTo(tempMouse.x, tempMouse.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrowhead pointing to cursor
    drawArrowhead(ctx, arrowFromX, arrowFromY, tempMouse.x, tempMouse.y, T, false);

    // Start pin highlight
    ctx.beginPath(); ctx.arc(startAbs.x, startAbs.y, 5 / scale, 0, Math.PI * 2);
    ctx.fillStyle = T.wire; ctx.fill();
    ctx.restore();
  }

  // Draw components
  comps.forEach(c => drawComp(c, c === sel));

  ctx.restore();

  // Re-sync properties panel
  updatePropertiesPanel();
}


function hitTest(c, mx, my) {
  const dx = mx - c.x, dy = my - c.y;
  const w = c.w || 100, h = c.h || 50;
  switch (c.type) {
    case 'resistor': return Math.abs(dx) <= 34 && Math.abs(dy) <= 13;
    case 'capacitor': return Math.abs(dx) <= 30 && Math.abs(dy) <= 16;
    case 'inductor': return Math.abs(dx) <= 42 && Math.abs(dy) <= 14;
    case 'voltage': return dx * dx + dy * dy <= 1100;
    case 'ground': return Math.abs(dx) <= 16 && dy >= -26 && dy <= 18;
    case 'led': return Math.abs(dx) <= 26 && Math.abs(dy) <= 16;
    case 'nmos': return Math.abs(dx) <= 30 && Math.abs(dy) <= 24;
    case 'attribute': case 'key_attr': case 'multivalued_attr': case 'derived_attr': case 'uml_usecase':
      return (dx * dx) / Math.pow(w / 2 + 4, 2) + (dy * dy) / Math.pow(h / 2 + 4, 2) <= 1;
    case 'dfd_process':
    case 'uml_initial':
    case 'uml_final':
    case 'flow_connector':
      return dx * dx + dy * dy <= Math.pow(w / 2 + 4, 2);
    case 'relation': case 'weak_relationship': case 'flow_decision': {
      const hw = w / 2 + 4, hh = h / 2 + 4;
      return Math.abs(dx) / hw + Math.abs(dy) / hh <= 1;
    }
    case 'gate_not':
    case 'gate_and':
    case 'gate_or':
    case 'gate_nand':
    case 'gate_nor':
    case 'gate_xor':
    case 'gate_xnor':
      return Math.abs(dx) <= 25 && Math.abs(dy) <= 20;
    case 'logic_input':
    case 'logic_output':
      return Math.abs(dx) <= (w || 30) / 2 + 10 && Math.abs(dy) <= (h || 20) / 2 + 5;
    default:
      return Math.abs(dx) <= w / 2 + 4 && Math.abs(dy) <= h / 2 + 4;
  }
}

function hitWire(w, mx, my) {
  const coords = getWireCoords(w);
  if (!coords) return false;
  const { x1, y1, x2, y2 } = coords;

  if (w.style === 'ortho') {
    const midX = (x1 + x2) / 2;
    return ptSegDist(mx, my, x1, y1, midX, y1) < 9 ||
      ptSegDist(mx, my, midX, y1, midX, y2) < 9 ||
      ptSegDist(mx, my, midX, y2, x2, y2) < 9;
  }
  return ptSegDist(mx, my, x1, y1, x2, y2) < 9;
}

function ptSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  if (!l2) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function setTool(t) {
  tool = t; wireStart = null; tempMouse = null;
  document.querySelectorAll('.toolbox-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('btn-' + t);
  if (btn) btn.classList.add('active');
  mainC.style.cursor = t === 'wire' ? 'crosshair' : 'default';
  setStatus(t === 'select' ? 'Select tool — click to select, drag to move' : `Connector (${wireStyle}) — click a pin to start, click another pin to connect`);
  draw();
}

function setWireStyle(s) {
  wireStyle = s;
  document.querySelectorAll('.wire-style-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('ws-' + s);
  if (btn) btn.classList.add('active');
  if (tool === 'wire') setStatus(`Connector (${wireStyle}) — click a pin to start, click another pin to connect`);
}

function setStatus(s) { document.getElementById('status').textContent = s; }

function saveHistory() {
  history.push(JSON.stringify({ comps: comps.map(c => ({ ...c })), wires: wires.map(w => ({ ...w })) }));
  if (history.length > 60) history.shift();
}

function undo() {
  if (!history.length) return;
  const state = JSON.parse(history.pop());
  comps = state.comps; wires = state.wires; sel = null; draw();
  setStatus('Undo');
}

function clearAll() {
  if (!comps.length && !wires.length) return;
  saveHistory(); comps = []; wires = []; sel = null; draw();
  setStatus('Canvas cleared');
}

function addComp(type) {
  saveHistory();

  // Center spawn relative to visible canvas area
  const cx = snap((-offsetX + mainC.width / 2) / scale + (Math.random() - 0.5) * 80);
  const cy = snap((-offsetY + mainC.height / 2) / scale + (Math.random() - 0.5) * 80);

  const counter = comps.filter(c => c.type === type).length + 1;
  const defaults = {
    resistor: { label: `R${counter}`, w: 64, h: 18 },
    capacitor: { label: `C${counter}`, w: 56, h: 28 },
    inductor: { label: `L${counter}`, w: 80, h: 14 },
    voltage: { label: `V${counter}`, w: 44, h: 44 },
    ground: { label: '', w: 24, h: 30 },
    led: { label: `D${counter}`, w: 48, h: 28 },
    nmos: { label: `M${counter}`, w: 56, h: 40 },
    entity: { label: `Entity${counter}`, w: 120, h: 80 },
    weak_entity: { label: `Weak${counter}`, w: 120, h: 80 },
    attribute: { label: `attr${counter}`, w: 88, h: 40 },
    key_attr: { label: `PK_attr${counter}`, w: 100, h: 40 },
    multivalued_attr: { label: `multi_attr${counter}`, w: 100, h: 44 },
    derived_attr: { label: `derived_attr${counter}`, w: 100, h: 44 },
    relation: { label: `rel${counter}`, w: 96, h: 50 },
    weak_relationship: { label: `weak_rel${counter}`, w: 96, h: 50 },
    cardinality: { label: 'N', w: 30, h: 20 },
    // DFD
    dfd_process: { label: `Process${counter}`, w: 60, h: 60 },
    dfd_external: { label: `External${counter}`, w: 100, h: 60 },
    dfd_datastore: { label: `DataStore${counter}`, w: 120, h: 40 },
    // Flowchart
    flow_terminal: { label: 'Start/End', w: 100, h: 40 },
    flow_process: { label: `Process${counter}`, w: 100, h: 60 },
    flow_decision: { label: `Decision${counter}`, w: 90, h: 60 },
    flow_io: { label: `I/O`, w: 110, h: 50 },
    flow_subprocess: { label: `Subprocess${counter}`, w: 110, h: 60 },
    flow_connector: { label: '', w: 24, h: 24 },
    // Wireframe
    wf_box: { label: 'Container', w: 160, h: 120 },
    wf_button: { label: 'Button', w: 90, h: 36 },
    wf_input: { label: 'Input Text...', w: 130, h: 36 },
    wf_text: { label: 'Static Text Label', w: 120, h: 24 },
    wf_image: { label: 'Image', w: 120, h: 90 },
    wf_divider: { label: '', w: 160, h: 10 },
    // UML
    uml_class: { label: `Class${counter}`, w: 130, h: 100 },
    uml_interface: { label: `«interface»\nInterface${counter}`, w: 130, h: 100 },
    uml_actor: { label: `Actor${counter}`, w: 50, h: 80 },
    uml_usecase: { label: `UseCase${counter}`, w: 110, h: 50 },
    uml_boundary: { label: 'Boundary', w: 200, h: 200 },
    uml_lifeline: { label: `Lifeline${counter}`, w: 90, h: 180 },
    uml_activation: { label: '', w: 20, h: 80 },
    uml_initial: { label: '', w: 24, h: 24 },
    uml_final: { label: '', w: 26, h: 26 },
    uml_activity: { label: `ActivityState`, w: 110, h: 50 },
    uml_fork_join: { label: '', w: 140, h: 12 },
    uml_component: { label: `Component${counter}`, w: 120, h: 70 },
    uml_interface_lollipop: { label: '', w: 30, h: 60 },
    uml_node: { label: `Node${counter}`, w: 110, h: 90 },
    uml_package: { label: `Package${counter}`, w: 120, h: 80 }
  };
  const c = { id: crypto.randomUUID(), type, x: cx, y: cy, ...defaults[type] };
  comps.push(c); sel = c; draw();
  setStatus(`Added ${type.toUpperCase().replace('_', ' ')}. Drag to position.`);
  setTool('select');
}

// Mouse events
mainC.addEventListener('mousedown', e => {
  const r = mainC.getBoundingClientRect();
  const screenX = e.clientX - r.left;
  const screenY = e.clientY - r.top;

  // Handle pan initiation (Middle click OR Space + Left click)
  if (e.button === 1 || (e.button === 0 && spacePressed)) {
    isPanning = true;
    panStartX = e.clientX - offsetX;
    panStartY = e.clientY - offsetY;
    mainC.style.cursor = 'grabbing';
    e.preventDefault();
    return;
  }

  // Convert to canvas/grid coordinate space
  const mx = (screenX - offsetX) / scale;
  const my = (screenY - offsetY) / scale;

  if (e.button === 2) {
    const hit = comps.slice().reverse().find(c => hitTest(c, mx, my)) || wires.find(w => hitWire(w, mx, my));
    if (hit) { ctxTarget = hit; showCtxMenu(e.clientX, e.clientY); }
    e.preventDefault(); return;
  }

  if (tool === 'wire') {
    for (const c of comps) {
      const pi = nearestPin(c, mx, my);
      if (pi !== null) {
        if (!wireStart) {
          const abs = getAbsPins(c)[pi];
          wireStart = { comp: c, pin: pi, x: abs.x, y: abs.y };
          sel = c; draw();
          setStatus('Wire started — click another pin to complete, Esc to cancel');
        } else {
          if (c !== wireStart.comp) {
            saveHistory();
            wires.push({
              from: wireStart.comp.id,
              fromPin: wireStart.pin,
              to: c.id,
              toPin: pi,
              style: wireStyle
            });
            wireStart = null; tempMouse = null; sel = null; draw();
            setStatus('Wire connected');
          }
        }
        return;
      }
    }
    return;
  }

  const hitC = comps.slice().reverse().find(c => hitTest(c, mx, my));
  if (hitC) {
    sel = hitC; dragging = true;
    dragOff = { x: mx - hitC.x, y: my - hitC.y };
    draw(); return;
  }

  const hitW = wires.find(w => hitWire(w, mx, my));
  if (hitW) { sel = hitW; draw(); return; }
  sel = null; draw();
});

mainC.addEventListener('mousemove', e => {
  const r = mainC.getBoundingClientRect();
  const screenX = e.clientX - r.left;
  const screenY = e.clientY - r.top;

  if (isPanning) {
    offsetX = e.clientX - panStartX;
    offsetY = e.clientY - panStartY;
    drawGrid();
    draw();
    return;
  }

  const mx = (screenX - offsetX) / scale;
  const my = (screenY - offsetY) / scale;
  document.getElementById('coords').textContent = `x: ${snap(mx)}, y: ${snap(my)}`;

  if (wireStart) {
    tempMouse = { x: snap(mx), y: snap(my) };
    draw(); return;
  }

  if (dragging && sel && tool === 'select') {
    sel.x = snap(mx - dragOff.x);
    sel.y = snap(my - dragOff.y);
    draw(); return;
  }
});

mainC.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    mainC.style.cursor = spacePressed ? 'grab' : (tool === 'wire' ? 'crosshair' : 'default');
    return;
  }
  if (dragging) saveHistory();
  dragging = false;
});

mainC.addEventListener('mouseleave', () => {
  if (isPanning) {
    isPanning = false;
    mainC.style.cursor = spacePressed ? 'grab' : (tool === 'wire' ? 'crosshair' : 'default');
  }
  dragging = false;
});

mainC.addEventListener('contextmenu', e => e.preventDefault());

mainC.addEventListener('dblclick', e => {
  const r = mainC.getBoundingClientRect();
  const mx = (e.clientX - r.left - offsetX) / scale;
  const my = (e.clientY - r.top - offsetY) / scale;
  const hitC = comps.find(c => hitTest(c, mx, my));
  if (hitC) {
    // Select it, which automatically focuses properties sidebar label input
    sel = hitC;
    draw();
    const labelInput = document.getElementById('prop-label-input');
    if (labelInput) {
      labelInput.focus();
      labelInput.select();
    }
  }
});

// Zoom centered on cursor
mainC.addEventListener('wheel', e => {
  e.preventDefault();
  const r = mainC.getBoundingClientRect();
  const mouseX = e.clientX - r.left;
  const mouseY = e.clientY - r.top;

  const zoomFactor = 1.08;
  const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
  const clampedScale = Math.max(0.2, Math.min(4, newScale));

  if (clampedScale !== scale) {
    offsetX = mouseX - (mouseX - offsetX) * (clampedScale / scale);
    offsetY = mouseY - (mouseY - offsetY) * (clampedScale / scale);
    scale = clampedScale;
    drawGrid();
    draw();
    setStatus(`Zoom: ${Math.round(scale * 100)}%`);
  }
}, { passive: false });

// Properties Panel Logic
function updatePropertiesPanel() {
  const currentId = sel ? sel.id : (sel && sel.x1 !== undefined ? 'wire-' + wires.indexOf(sel) : null);

  if (currentId === lastSelId) {
    return;
  }
  lastSelId = currentId;

  const container = document.getElementById('properties-content');
  container.innerHTML = '';

  if (!sel) {
    container.innerHTML = `
      <div class="empty-properties">
        <i class="ri-info-card-line" style="font-size: 28px; color: var(--text3); margin-bottom: 8px;"></i>
        <p>No selection</p>
        <span>Click a component to edit its properties here.</span>
      </div>
    `;
    return;
  }

  // If it's a wire connection
  if (sel.from !== undefined) {
    container.innerHTML = `
      <div class="prop-group">
        <label class="prop-label">Component Type</label>
        <div class="prop-value-static">Wire Connection</div>
      </div>
      <div class="prop-group">
        <label class="prop-label">Style</label>
        <div class="prop-value-static">${sel.style === 'ortho' ? 'Orthogonal' : 'Straight'}</div>
      </div>
      <div class="prop-group" style="margin-top: auto; border-bottom: none;">
        <button class="prop-btn-danger" onclick="deleteSelectedComponent()"><i class="ri-delete-bin-line"></i> Delete Wire</button>
      </div>
    `;
    return;
  }

  // If it's a component
  container.innerHTML = `
    <div class="prop-group">
      <label class="prop-label">Component Type</label>
      <div class="prop-value-static">${sel.type.toUpperCase().replace('_', ' ')}</div>
    </div>
    <div class="prop-group">
      <label class="prop-label">Label / Name</label>
      <input type="text" id="prop-label-input" class="prop-input" value="${escapeHtml(sel.label || '')}" oninput="updateSelectedLabel(this.value)" />
    </div>
    <div class="prop-group">
      <label class="prop-label">Width</label>
      <input type="number" class="prop-input" value="${sel.w || 100}" oninput="updateSelectedWidth(this.value)" />
    </div>
    <div class="prop-group">
      <label class="prop-label">Height</label>
      <input type="number" class="prop-input" value="${sel.h || 50}" oninput="updateSelectedHeight(this.value)" />
    </div>
    <div class="prop-group" style="margin-top: auto; border-bottom: none; gap: 8px;">
      <button class="prop-btn-danger" onclick="deleteSelectedComponent()"><i class="ri-delete-bin-line"></i> Delete Component</button>
      <button class="prop-btn-primary" onclick="duplicateSelectedComponent()"><i class="ri-file-copy-line"></i> Duplicate</button>
    </div>
  `;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function updateSelectedLabel(val) {
  if (sel) {
    sel.label = val;
    draw();
  }
}

function updateSelectedWidth(val) {
  if (sel) {
    sel.w = Math.max(10, parseInt(val) || 10);
    draw();
  }
}

function updateSelectedHeight(val) {
  if (sel) {
    sel.h = Math.max(10, parseInt(val) || 10);
    draw();
  }
}

function deleteSelectedComponent() {
  if (sel) {
    saveHistory();
    if (comps.includes(sel)) {
      wires = wires.filter(w => w.from !== sel.id && w.to !== sel.id);
      comps = comps.filter(c => c !== sel);
    } else {
      wires = wires.filter(w => w !== sel);
    }
    sel = null;
    lastSelId = null;
    draw();
    setStatus('Deleted');
  }
}

function duplicateSelectedComponent() {
  if (sel && comps.includes(sel)) {
    saveHistory();
    const copy = { ...sel, id: crypto.randomUUID(), x: sel.x + 40, y: sel.y + 40 };
    comps.push(copy);
    sel = copy;
    lastSelId = null; // force reload properties HTML template
    draw();
  }
}

function showCtxMenu(x, y) {
  const m = document.getElementById('ctx-menu');
  m.style.display = 'block'; m.style.left = x + 'px'; m.style.top = y + 'px';
}

function hideCtxMenu() { document.getElementById('ctx-menu').style.display = 'none'; }
document.addEventListener('click', hideCtxMenu);

function ctxRename() {
  hideCtxMenu();
  if (!ctxTarget || ctxTarget.label === undefined) return;
  // Trigger properties panel edit
  sel = ctxTarget;
  lastSelId = null;
  draw();
  const labelInput = document.getElementById('prop-label-input');
  if (labelInput) {
    labelInput.focus();
    labelInput.select();
  }
}

function ctxDuplicate() {
  hideCtxMenu();
  if (!ctxTarget || ctxTarget.x === undefined) return;
  saveHistory();
  const copy = { ...ctxTarget, id: crypto.randomUUID(), x: ctxTarget.x + 40, y: ctxTarget.y + 40 };
  comps.push(copy); sel = copy; draw();
}

function ctxDelete() {
  hideCtxMenu();
  if (!ctxTarget) return;
  saveHistory();
  if (comps.includes(ctxTarget)) {
    wires = wires.filter(w => w.from !== ctxTarget.id && w.to !== ctxTarget.id);
    comps = comps.filter(c => c !== ctxTarget);
  } else {
    wires = wires.filter(w => w !== ctxTarget);
  }
  if (sel === ctxTarget) sel = null;
  ctxTarget = null; draw(); setStatus('Deleted');
}

function toggleHelp() {
  const h = document.getElementById('help');
  h.classList.toggle('show');
}

function exportPNG() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';

  const box = document.createElement('div');
  box.style.cssText = `background:${isDark() ? '#2b2b2b' : '#ffffff'};color:${isDark() ? '#eee' : '#111'};padding:20px 24px;border-radius:8px;font-family:sans-serif;min-width:220px;box-shadow:0 4px 20px rgba(0,0,0,0.3);`;

  box.innerHTML = `
    <div style="font-size:15px;font-weight:600;margin-bottom:12px;">Export as</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button data-fmt="png" style="padding:8px 12px;border-radius:5px;border:1px solid #888;background:transparent;color:inherit;cursor:pointer;text-align:left;">PNG</button>
      <button data-fmt="jpeg" style="padding:8px 12px;border-radius:5px;border:1px solid #888;background:transparent;color:inherit;cursor:pointer;text-align:left;">JPEG</button>
      <button data-fmt="webp" style="padding:8px 12px;border-radius:5px;border:1px solid #888;background:transparent;color:inherit;cursor:pointer;text-align:left;">WebP</button>
    </div>
    <div style="text-align:right;margin-top:14px;">
      <button data-fmt="cancel" style="padding:6px 10px;border:none;background:transparent;color:inherit;opacity:0.7;cursor:pointer;">Cancel</button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  box.querySelectorAll('button[data-fmt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fmt = btn.dataset.fmt;
      close();
      if (fmt === 'cancel') return;

      const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
      const mime = mimeMap[fmt];

      const exp = document.createElement('canvas');
      exp.width = mainC.width; exp.height = mainC.height;
      const ec = exp.getContext('2d');
      ec.fillStyle = isDark() ? '#1e1e1e' : '#ffffff';
      ec.fillRect(0, 0, exp.width, exp.height);
      ec.drawImage(gridC, 0, 0);
      ec.drawImage(mainC, 0, 0);

      exp.toBlob(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `diagram.${fmt === 'jpeg' ? 'jpg' : fmt}`;
        a.click();
      }, mime, fmt === 'png' ? undefined : 0.92);
    });
  });
}

// JSON Save/Load Logic
function exportJSON() {
  const data = JSON.stringify({ comps, wires }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'diagram.json';
  a.click();
  setStatus('Diagram exported successfully as JSON');
}

function triggerImport() {
  document.getElementById('import-file').click();
}

function handleImportFile(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && Array.isArray(data.comps) && Array.isArray(data.wires)) {
        saveHistory();
        comps = data.comps;
        wires = data.wires;
        sel = null;

        // Reset scale/pan so drawing is visible in center
        scale = 1;
        offsetX = 0;
        offsetY = 0;

        drawGrid();
        draw();
        setStatus('Diagram loaded successfully');
      } else {
        alert('Invalid file format. Must contain "comps" and "wires" arrays.');
      }
    } catch (err) {
      alert('Error parsing JSON file.');
    }
    input.value = '';
  };
  reader.readAsText(file);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.ctrlKey && e.key === 'z') { undo(); return; }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (sel) {
      saveHistory();
      if (comps.includes(sel)) {
        wires = wires.filter(w => w.from !== sel.id && w.to !== sel.id);
        comps = comps.filter(c => c !== sel);
      } else {
        wires = wires.filter(w => w !== sel);
      }
      sel = null; draw(); setStatus('Deleted');
    }
    return;
  }

  if (e.key === 'Escape') {
    const pickerModal = document.getElementById('picker-modal');
    if (pickerModal && pickerModal.style.display !== 'none') {
      hidePicker(); return;
    }
    if (document.getElementById('help').classList.contains('show')) {
      document.getElementById('help').classList.remove('show'); return;
    }
    wireStart = null; tempMouse = null; setTool('select'); draw(); return;
  }

  if (e.key.startsWith('Arrow')) {
    if (sel && comps.includes(sel)) {
      e.preventDefault();
      saveHistory();
      const step = e.shiftKey ? 1 : GRID;
      if (e.key === 'ArrowUp') sel.y -= step;
      if (e.key === 'ArrowDown') sel.y += step;
      if (e.key === 'ArrowLeft') sel.x -= step;
      if (e.key === 'ArrowRight') sel.x += step;

      if (!e.shiftKey) {
        sel.x = snap(sel.x);
        sel.y = snap(sel.y);
      }
      draw();
      if (typeof updatePropertiesPanel === 'function') updatePropertiesPanel();
      return;
    }
  }


  if (e.code === 'Space') {
    spacePressed = true;
    mainC.style.cursor = 'grab';
    e.preventDefault();
    return;
  }

  if (e.key === 'w' || e.key === 'W') { setTool('wire'); return; }
  if (e.key === 's' || e.key === 'S') { setTool('select'); return; }
  if (e.key === '?') { toggleHelp(); return; }
  if (e.key === 'F12') { e.preventDefault(); return; }
if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j'))) { 
    e.preventDefault(); 
    return; 
}
});

document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keyup', e => {
  if (e.code === 'Space') {
    spacePressed = false;
    mainC.style.cursor = tool === 'wire' ? 'crosshair' : 'default';
  }
});

// Responsive resizing
window.addEventListener('resize', () => { resize(); });
window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => { drawGrid(); draw(); });

setTimeout(() => {
  setDiagramType('erd_diagram', false);
  resize();
  setStatus('Click a component in the toolbox to add it — W = wire, S = select, ? = shortcuts');
}, 80);



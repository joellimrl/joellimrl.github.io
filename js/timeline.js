/**
 * Timeline-specific interactions and animations
 * Handles timeline node behaviors and card management
 */

// Timeline module state
const TimelineState = {
  activeNodes: new Set(),
  cardAnimations: new Map(),
  scrollListeners: [],
  resizeObserver: null
};

// Timeline configuration
const TimelineConfig = {
  nodeHoverDelay: 200,
  cardAnimationDuration: 400,
  staggerDelay: 100,
  scrollThreshold: 0.1
};

/**
 * Initialize timeline-specific functionality
 * This function is called from main.js
 */
function initializeTimeline() {
  try {
    setupTimelineNodes();
    setupCardAnimations();
    setupTimelineScroll();
    setupResizeObserver();
    
    console.log('Timeline functionality initialized');
  } catch (error) {
    console.error('Error initializing timeline:', error);
  }
}

/**
 * Setup timeline node interactions
 */
function setupTimelineNodes() {
  const timelineNodes = document.querySelectorAll('.timeline-node');
  
  timelineNodes.forEach((node, index) => {
    // Enhanced hover effects
    node.addEventListener('mouseenter', () => handleNodeHover(node, true));
    node.addEventListener('mouseleave', () => handleNodeHover(node, false));
    
    // Touch support for mobile
    node.addEventListener('touchstart', (e) => handleNodeTouch(e, node), { passive: true });
    
    // Enhanced focus management
    node.addEventListener('focus', () => handleNodeFocus(node));
    node.addEventListener('blur', () => handleNodeBlur(node));
    
    // Add node index for navigation
    node.dataset.nodeIndex = index;
    
    // Set initial ARIA attributes
    updateNodeAria(node, false);
  });
}

/**
 * Handle node hover effects
 */
function handleNodeHover(node, isHovering) {
  if (isHovering) {
    node.classList.add('hovered');
    
    // Show preview of associated card
    const timelineItem = node.closest('.timeline-item');
    const card = timelineItem?.querySelector('.project-card');
    
    if (card && !card.querySelector('.card-content').classList.contains('expanded')) {
      card.classList.add('preview');
    }
  } else {
    node.classList.remove('hovered');
    
    // Remove card preview
    const timelineItem = node.closest('.timeline-item');
    const card = timelineItem?.querySelector('.project-card');
    
    if (card) {
      card.classList.remove('preview');
    }
  }
}

/**
 * Handle node touch for mobile devices
 */
function handleNodeTouch(event, node) {
  // Prevent default to avoid triggering click immediately
  event.preventDefault();
  
  // Add touch feedback
  node.classList.add('touched');
  
  setTimeout(() => {
    node.classList.remove('touched');
  }, 150);
  
  // Trigger click after short delay
  setTimeout(() => {
    node.click();
  }, 100);
}

/**
 * Handle node focus
 */
function handleNodeFocus(node) {
  node.classList.add('focused');
  
  // Ensure node is visible
  scrollNodeIntoView(node);
  
  // Announce to screen readers
  const timelineItem = node.closest('.timeline-item');
  const projectTitle = timelineItem?.querySelector('.project-title')?.textContent;
  
  if (projectTitle) {
    announceToScreenReader(`Focused on ${projectTitle} timeline node`);
  }
}

/**
 * Handle node blur
 */
function handleNodeBlur(node) {
  node.classList.remove('focused');
}

/**
 * Scroll node into view if needed
 */
function scrollNodeIntoView(node) {
  const rect = node.getBoundingClientRect();
  const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
  
  if (!isVisible) {
    node.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}

/**
 * Update node ARIA attributes
 */
function updateNodeAria(node, isExpanded) {
  node.setAttribute('aria-expanded', isExpanded.toString());
  
  const timelineItem = node.closest('.timeline-item');
  const projectTitle = timelineItem?.querySelector('.project-title')?.textContent;
  
  if (projectTitle) {
    const action = isExpanded ? 'Collapse' : 'Expand';
    node.setAttribute('aria-label', `${action} ${projectTitle} project details`);
  }
}

/**
 * Setup card animations
 */
function setupCardAnimations() {
  const cards = document.querySelectorAll('.project-card');
  
  cards.forEach(card => {
    const cardContent = card.querySelector('.card-content');
    
    if (cardContent) {
      // Setup transition listeners
      cardContent.addEventListener('transitionstart', (e) => {
        if (e.propertyName === 'max-height') {
          handleCardAnimationStart(card);
        }
      });
      
      cardContent.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'max-height') {
          handleCardAnimationEnd(card);
        }
      });
    }
  });
}

/**
 * Handle card animation start
 */
function handleCardAnimationStart(card) {
  card.classList.add('animating');
  
  // Store animation reference
  const projectId = card.closest('.timeline-item')?.dataset.project;
  if (projectId) {
    TimelineState.cardAnimations.set(projectId, 'animating');
  }
}

/**
 * Handle card animation end
 */
function handleCardAnimationEnd(card) {
  card.classList.remove('animating');
  
  // Clear animation reference
  const projectId = card.closest('.timeline-item')?.dataset.project;
  if (projectId) {
    TimelineState.cardAnimations.delete(projectId);
  }
  
  // Ensure proper focus management
  const cardContent = card.querySelector('.card-content');
  if (cardContent?.classList.contains('expanded')) {
    // Focus first interactive element in expanded card
    const firstButton = cardContent.querySelector('.btn');
    if (firstButton) {
      firstButton.focus();
    }
  }
}

/**
 * Setup timeline scroll effects
 */
function setupTimelineScroll() {
  let ticking = false;
  
  const scrollHandler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateTimelineOnScroll();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', scrollHandler, { passive: true });
  TimelineState.scrollListeners.push(scrollHandler);
  
  // Initial call
  updateTimelineOnScroll();
}

/**
 * Update timeline appearance based on scroll position
 */
function updateTimelineOnScroll() {
  const timelineContainer = document.querySelector('.timeline-container');
  const timelineNodes = document.querySelectorAll('.timeline-node');
  
  if (!timelineContainer) {return}
  
  const containerRect = timelineContainer.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // Calculate scroll progress
  const progress = Math.max(0, Math.min(1, -containerRect.top / (containerRect.height - windowHeight)));
  
  // Update timeline line progress
  updateTimelineProgress(progress);
  
  // Update node visibility and animations
  timelineNodes.forEach((node, index) => {
    const rect = node.getBoundingClientRect();
    const isVisible = rect.top < windowHeight * 0.8 && rect.bottom > windowHeight * 0.2;
    
    if (isVisible && !TimelineState.activeNodes.has(index)) {
      activateTimelineNode(node, index);
    } else if (!isVisible && TimelineState.activeNodes.has(index)) {
      deactivateTimelineNode(node, index);
    }
  });
}

/**
 * Update timeline progress indicator
 */
function updateTimelineProgress(progress) {
  const timelineLine = document.querySelector('.timeline-line');
  if (!timelineLine) {return}
  
  // Create or update progress line
  let progressLine = timelineLine.querySelector('.timeline-progress');
  if (!progressLine) {
    progressLine = document.createElement('div');
    progressLine.className = 'timeline-progress';
    progressLine.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
      transition: height 0.3s ease;
      z-index: 2;
      border-radius: inherit;
    `;
    timelineLine.appendChild(progressLine);
  }
  
  progressLine.style.height = `${progress * 100}%`;
}

/**
 * Activate timeline node animation
 */
function activateTimelineNode(node, index) {
  TimelineState.activeNodes.add(index);
  
  // Add animation class with stagger delay
  setTimeout(() => {
    node.classList.add('animated');
    
    // Animate associated timeline item
    const timelineItem = node.closest('.timeline-item');
    if (timelineItem) {
      timelineItem.classList.add('visible');
    }
  }, index * TimelineConfig.staggerDelay);
}

/**
 * Deactivate timeline node animation
 */
function deactivateTimelineNode(node, index) {
  // Keep nodes active once they've been seen
  // This prevents re-animation on scroll up
  // TimelineState.activeNodes.delete(index);
}

/**
 * Setup resize observer for responsive adjustments
 */
function setupResizeObserver() {
  if (!window.ResizeObserver) {return}
  
  const timelineContainer = document.querySelector('.timeline-container');
  if (!timelineContainer) {return}
  
  TimelineState.resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(entry => {
      handleTimelineResize(entry);
    });
  });
  
  TimelineState.resizeObserver.observe(timelineContainer);
}

/**
 * Handle timeline container resize
 */
function handleTimelineResize(entry) {
  const container = entry.target;
  const width = entry.contentRect.width;
  
  // Adjust timeline layout based on width
  if (width < 768) {
    container.classList.add('mobile-layout');
  } else {
    container.classList.remove('mobile-layout');
  }
  
  // Recalculate positions if needed
  updateTimelinePositions();
}

/**
 * Update timeline positions after resize
 */
function updateTimelinePositions() {
  // Force repaint to ensure proper positioning
  requestAnimationFrame(() => {
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
      // Trigger reflow
      item.offsetHeight;
    });
  });
}

/**
 * Get timeline state for debugging
 */
function getTimelineState() {
  return {
    activeNodes: Array.from(TimelineState.activeNodes),
    animatingCards: Array.from(TimelineState.cardAnimations.keys()),
    scrollListeners: TimelineState.scrollListeners.length,
    hasResizeObserver: !!TimelineState.resizeObserver
  };
}

/**
 * Clean up timeline resources
 */
function cleanupTimeline() {
  // Remove scroll listeners
  TimelineState.scrollListeners.forEach(listener => {
    window.removeEventListener('scroll', listener);
  });
  TimelineState.scrollListeners = [];
  
  // Disconnect resize observer
  if (TimelineState.resizeObserver) {
    TimelineState.resizeObserver.disconnect();
    TimelineState.resizeObserver = null;
  }
  
  // Clear state
  TimelineState.activeNodes.clear();
  TimelineState.cardAnimations.clear();
  
  console.log('Timeline cleanup completed');
}

// Enhanced CSS for timeline effects
const timelineStyles = `
  .timeline-node.hovered {
    transform: translateX(-50%) scale(1.05);
    box-shadow: 0 0 0 6px var(--accent-primary), 0 4px 12px var(--shadow-medium);
  }
  
  .timeline-node.touched {
    transform: translateX(-50%) scale(0.95);
  }
  
  .timeline-node.focused {
    outline: 3px solid var(--accent-primary);
    outline-offset: 4px;
  }
  
  .timeline-node.animated {
    animation: nodeReveal 0.6s ease-out forwards;
  }
  
  .project-card.preview {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px var(--shadow-medium);
  }
  
  .project-card.animating {
    pointer-events: none;
  }
  
  .timeline-container.mobile-layout .timeline-node {
    left: 15px;
  }
  
  .timeline-container.mobile-layout .project-card {
    margin-left: 40px;
    width: calc(100% - 40px);
  }
  
  @keyframes nodeReveal {
    0% {
      opacity: 0;
      transform: translateX(-50%) scale(0);
    }
    60% {
      transform: translateX(-50%) scale(1.1);
    }
    100% {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .timeline-node.animated {
      animation: none;
    }
    
    .timeline-node.hovered,
    .project-card.preview {
      transform: none;
    }
  }
`;

// Inject timeline styles
if (!document.getElementById('timeline-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'timeline-styles';
  styleElement.textContent = timelineStyles;
  document.head.appendChild(styleElement);
}

// Auto-initialize if main.js hasn't loaded yet
if (typeof initializeApp === 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeTimeline);
}

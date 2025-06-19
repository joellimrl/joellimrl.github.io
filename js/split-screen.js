// Split Screen Functionality
// Handles responsive behavior, scroll interactions, and state management for the split-screen layout

class SplitScreenManager {
  constructor() {
    this.state = {
      isLeftPanelVisible: true,
      isMobileView: window.innerWidth < 768,
      activeProject: null,
      rightPanelScrollY: 0,
      viewportWidth: window.innerWidth,
      currentBreakpoint: this.getCurrentBreakpoint()
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateLayout();
    this.initializeIntersectionObserver();
  }

  bindEvents() {
    // Resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Scroll handler for right panel
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
      rightPanel.addEventListener('scroll', this.handleRightPanelScroll.bind(this));
    }

    // Project card hover handlers
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
      card.addEventListener('mouseenter', this.handleProjectHover.bind(this));
      card.addEventListener('mouseleave', this.handleProjectLeave.bind(this));
    });

    // Social link interactions
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
      link.addEventListener('mouseenter', this.handleSocialHover.bind(this));
      link.addEventListener('mouseleave', this.handleSocialLeave.bind(this));
    });

    // Skill tag interactions
    const skillTags = document.querySelectorAll('.skill-tag');
    skillTags.forEach(tag => {
      tag.addEventListener('click', this.handleSkillClick.bind(this));
    });
  }

  handleResize() {
    const newWidth = window.innerWidth;
    const newBreakpoint = this.getCurrentBreakpoint();
    
    if (this.state.viewportWidth !== newWidth) {
      this.state.viewportWidth = newWidth;
      this.state.isMobileView = newWidth < 768;
      this.state.currentBreakpoint = newBreakpoint;
      
      this.updateLayout();
      this.dispatchStateChange();
    }
  }

  handleRightPanelScroll(event) {
    const scrollY = event.target.scrollTop;
    this.state.rightPanelScrollY = scrollY;
    
    // Add scroll-based interactions here if needed
    this.updateScrollIndicators();
  }

  handleProjectHover(event) {
    const projectCard = event.currentTarget;
    const projectId = projectCard.dataset.category;
    
    this.state.hoveredProjectId = projectId;
    this.highlightRelatedSkills(projectId);
  }

  handleProjectLeave() {
    this.state.hoveredProjectId = null;
    this.clearSkillHighlights();
  }

  handleSocialHover(event) {
    const link = event.currentTarget;
    link.style.transform = 'translateX(8px) scale(1.02)';
  }

  handleSocialLeave(event) {
    const link = event.currentTarget;
    link.style.transform = '';
  }

  handleSkillClick(event) {
    const skill = event.currentTarget;
    const skillName = skill.textContent.toLowerCase();
    
    this.filterProjectsBySkill(skillName);
    this.highlightSkill(skill);
  }

  getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width >= 1200) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }

  updateLayout() {
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    
    if (this.state.isMobileView) {
      leftPanel?.classList.add('mobile-layout');
      rightPanel?.classList.add('mobile-layout');
    } else {
      leftPanel?.classList.remove('mobile-layout');
      rightPanel?.classList.remove('mobile-layout');
    }
  }

  updateScrollIndicators() {
    // Optional: Add scroll progress indicators
    const scrollProgress = this.state.rightPanelScrollY / 
      (document.querySelector('.right-panel').scrollHeight - window.innerHeight);
    
    // Could add a progress bar here
  }

  highlightRelatedSkills(projectCategory) {
    const skillMap = {
      'web': ['javascript', 'html5', 'css3', 'react'],
      'mobile': ['react', 'javascript', 'ui/ux'],
      'tool': ['javascript', 'node.js', 'git'],
      'library': ['javascript', 'node.js', 'git']
    };

    const relatedSkills = skillMap[projectCategory] || [];
    const skillTags = document.querySelectorAll('.skill-tag');
    
    skillTags.forEach(tag => {
      const skillName = tag.textContent.toLowerCase();
      if (relatedSkills.includes(skillName)) {
        tag.classList.add('highlighted');
      }
    });
  }

  clearSkillHighlights() {
    const skillTags = document.querySelectorAll('.skill-tag');
    skillTags.forEach(tag => {
      tag.classList.remove('highlighted');
    });
  }

  filterProjectsBySkill(skillName) {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
      const techBadges = card.querySelectorAll('.tech-badge');
      let hasSkill = false;
      
      techBadges.forEach(badge => {
        if (badge.textContent.toLowerCase().includes(skillName)) {
          hasSkill = true;
        }
      });
      
      if (hasSkill) {
        card.style.opacity = '1';
        card.style.transform = 'scale(1.02)';
      } else {
        card.style.opacity = '0.5';
        card.style.transform = 'scale(0.98)';
      }
    });

    // Reset after 3 seconds
    setTimeout(() => {
      projectCards.forEach(card => {
        card.style.opacity = '';
        card.style.transform = '';
      });
    }, 3000);
  }

  highlightSkill(skillElement) {
    // Remove previous highlights
    document.querySelectorAll('.skill-tag').forEach(tag => {
      tag.classList.remove('active');
    });
    
    // Add highlight to clicked skill
    skillElement.classList.add('active');
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      skillElement.classList.remove('active');
    }, 3000);
  }

  initializeIntersectionObserver() {
    const projectCards = document.querySelectorAll('.project-card');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    projectCards.forEach(card => {
      observer.observe(card);
    });
  }

  dispatchStateChange() {
    // Dispatch custom event for state changes
    const event = new CustomEvent('splitScreenStateChange', {
      detail: { ...this.state }
    });
    window.dispatchEvent(event);
  }

  // Public API methods
  getState() {
    return { ...this.state };
  }

  setActiveProject(projectId) {
    this.state.activeProject = projectId;
    this.dispatchStateChange();
  }

  scrollToProject(projectId) {
    const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
    if (projectCard) {
      const rightPanel = document.querySelector('.right-panel');
      const cardTop = projectCard.offsetTop;
      const panelHeight = rightPanel.clientHeight;
      const scrollTo = cardTop - (panelHeight / 2);

      rightPanel.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }
}

// CSS for dynamic interactions
const dynamicStyles = `
  .skill-tag.highlighted {
    background-color: var(--accent-primary) !important;
    color: white !important;
    transform: translateY(-2px) scale(1.05);
  }

  .skill-tag.active {
    background-color: var(--accent-primary) !important;
    color: white !important;
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  .project-card.in-view {
    animation: slideInUp 0.6s ease-out;
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .social-link:hover .social-icon {
    animation: bounce 0.6s ease-in-out;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-3px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .project-card.in-view {
      animation: none;
    }
    
    .social-link:hover .social-icon {
      animation: none;
    }
  }
`;

// Initialize split screen functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add dynamic styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = dynamicStyles;
  document.head.appendChild(styleSheet);

  // Initialize split screen manager
  window.splitScreenManager = new SplitScreenManager();

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add loading class removal after everything is loaded
  window.addEventListener('load', function() {
    document.body.classList.add('loaded');
  });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SplitScreenManager;
}

# Joel Lim - Developer Portfolio

A modern split-screen GitHub portfolio showcasing projects with dynamic GitHub API integration.

## Features

🖥️ **Split-Screen Design**
- Fixed left panel with profile information and skills
- Scrollable right panel with dynamic project showcase
- Responsive design that adapts to all screen sizes
- Smooth transitions and modern card-based layout

🔄 **Dynamic GitHub Integration**
- Automatically fetches repositories from GitHub API
- Real-time project information including creation dates
- Dynamic tech stack detection from repository languages
- Configurable project filtering and display options

🎨 **Modern UI/UX**
- Clean, professional design with earth-tone color scheme
- Animated typing effect for tagline
- Interactive project cards with hover effects
- Responsive layout optimized for all devices

♿ **Accessibility First**
- Full keyboard navigation support
- Screen reader compatible with ARIA labels
- Focus indicators and semantic HTML structure
- Proper contrast ratios and readable typography

⚡ **Performance Optimized**
- Vanilla JavaScript (no frameworks)
- CSS Grid and Flexbox for efficient layouts
- Lazy loading for project images
- Graceful degradation when JavaScript is disabled

## Structure

```
/
├── index.html              # Main HTML document
├── css/
│   ├── styles.css         # Main stylesheet
│   └── responsive.css     # Responsive design breakpoints
├── js/
│   ├── main.js           # Core application logic
│   ├── split-screen.js   # Split-screen layout interactions
│   ├── github-api.js     # GitHub API integration
│   └── typing-animation.js # Animated typing effect
├── images/
│   ├── profile.jpg       # Profile photo
│   └── projects/         # Project screenshots
└── docs/                 # Documentation files
    └── feature/          # Feature documentation
```

## Key Features

- **Split-Screen Layout**: Fixed sidebar with scrollable content area
- **GitHub API Integration**: Automatic project fetching from repositories
- **Dynamic Content**: Real-time repository information and statistics
- **Responsive Design**: Seamless experience across all device sizes
- **Modern Interactions**: Smooth animations and intuitive navigation

## Browser Support

- Modern browsers with ES6+ support
- Progressive enhancement for older browsers
- Mobile-first responsive design

## GitHub API Integration

The portfolio dynamically fetches project information from GitHub repositories:

- **Automatic Updates**: No manual editing required for new projects
- **Real-time Data**: Repository creation dates, descriptions, and languages
- **Smart Filtering**: Configurable filters for repository selection
- **Fallback Support**: Graceful handling of API rate limits or errors

### Configuration

Projects are automatically fetched based on:
- Repository activity and updates
- Configured inclusion/exclusion filters
- Repository topics and descriptions
- Public repository status

## Development

The site is built with vanilla HTML, CSS, and JavaScript following modern web standards:

- Semantic HTML5 elements
- CSS Custom Properties (CSS Variables)
- ES6+ JavaScript features with async/await
- GitHub REST API integration
- CSS Grid and Flexbox layouts
- Progressive Web App principles

## Live Demo

Visit the live site: [joellimrl.github.io](https://joellimrl.github.io)

---

*Built with ❤️ using vanilla web technologies*

## Featured Projects

The portfolio currently highlights these projects:

- **Tic Tac Toe Game** – AI-enhanced tic-tac-toe with animations. [Code](https://github.com/joellimrl/ticTacToeSimple) · [Live](https://joellimrl.github.io/ticTacToeSimple/)
- **Lucky Draw** – Interactive event raffle with CSV upload & confetti. [Code](https://github.com/joellimrl/luckyDraw) · [Live](https://joellimrl.github.io/luckyDraw/)
- **Left or Right** – Party decision game for groups. [Code](https://github.com/joellimrl/leftOrRight) · [Live](https://joellimrl.github.io/leftOrRight/)
- **Unix Clock** – Real-time Unix timestamp viewer & converter. [Code](https://github.com/joellimrl/unixClock) · [Live](https://joellimrl.github.io/unixClock/)
- **IRAS Helper** – Utility scripts to streamline repetitive IRAS tax form tasks. [Code](https://github.com/joellimrl/irasHelper) · [Live](https://joellimrl.github.io/irasHelper/)

> Screenshot assets or live demos for projects marked "pending" will be added once published to GitHub Pages.
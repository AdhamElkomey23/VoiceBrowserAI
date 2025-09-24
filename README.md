# Voice AI Browser Agent

A comprehensive browser automation and AI assistant platform that combines voice control, web scraping, and WordPress integration in a modern React dashboard.

## Features

- **Voice Control**: Push-to-talk voice commands with speech recognition
- **Browser Automation**: Embedded browser with persistent sessions and profiles
- **AI Assistant**: Natural language processing for task automation
- **WordPress Integration**: Direct integration for content creation and management
- **Task Templates**: Reusable automation workflows
- **Action Logging**: Complete audit trail of all automation activities
- **Real-time Updates**: Live status updates for running tasks

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn/UI component library
- TanStack Query for state management
- Wouter for routing
- Web Speech API for voice recognition

### Backend
- Express.js with TypeScript
- OpenAI GPT-5 integration for AI processing
- In-memory storage for rapid prototyping
- RESTful API architecture

### Browser Automation
- Playwright for browser control (simulated in current implementation)
- Persistent browser profiles with session storage
- Cross-site authentication management

## Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- (Optional) WordPress site with application password for integration

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd voice-ai-browser-agent

# Voice AI Browser Agent

## Overview

Voice AI Browser Agent is a comprehensive browser automation and AI assistant platform that combines voice control, web scraping, and WordPress integration in a modern React dashboard. The application enables users to interact with web content through voice commands, automate browser tasks, and seamlessly integrate with WordPress sites for content creation and management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Styling**: Tailwind CSS with Shadcn/UI component library for consistent, accessible UI components
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Voice Integration**: Web Speech API for browser-native voice recognition capabilities

The frontend follows a component-based architecture with three main panels:
- Left panel for browser profiles and browsing history
- Center panel for embedded browser interface with analysis sidebar
- Right panel for AI chat interface and task management

### Backend Architecture
- **Framework**: Express.js with TypeScript for robust API development
- **AI Processing**: OpenAI GPT-5 integration for natural language processing and intent recognition
- **Data Storage**: In-memory storage implementation for rapid prototyping, with Drizzle ORM configuration for future PostgreSQL integration
- **API Design**: RESTful architecture with dedicated service layers for modularity

The backend is organized into service modules:
- AI Processor for voice command interpretation and content analysis
- Browser Automation for web scraping and page interaction
- WordPress Integration for content management operations
- Voice Processor for speech recognition and synthesis

### Data Architecture
- **Database**: Configured for PostgreSQL using Drizzle ORM with comprehensive schema definitions
- **Storage Strategy**: Current in-memory storage with migration path to persistent database
- **Data Models**: Well-defined schemas for users, browser profiles, browsing history, task templates, task executions, chat conversations, and action logs

### Authentication and Session Management
- **Browser Profiles**: Persistent browser contexts with session data storage
- **Security**: Encrypted session data storage with OAuth integration planning for Google and WordPress
- **User Management**: Multi-user support with profile-based session isolation

### Task Automation System
- **Template System**: Reusable automation workflows with variable substitution
- **Execution Engine**: Asynchronous task processing with real-time status updates
- **Action Logging**: Comprehensive audit trail for all automation activities
- **Safety Mechanisms**: Confirmation dialogs for destructive actions

## External Dependencies

### AI and Language Processing
- **OpenAI API**: GPT-5 integration for natural language understanding, intent parsing, and content generation
- **Web Speech API**: Browser-native speech recognition and synthesis capabilities

### Database and Storage
- **PostgreSQL**: Primary database for persistent data storage (configured via Neon)
- **Drizzle ORM**: Type-safe database interactions and schema management
- **Connect PG Simple**: Session storage for PostgreSQL

### Browser Automation
- **Playwright**: Planned integration for browser automation and web scraping
- **Persistent Contexts**: Browser profile management with session persistence

### WordPress Integration
- **WordPress REST API**: Content creation and management operations
- **Application Passwords**: Secure authentication for WordPress operations
- **Custom Plugin Support**: Extensible WordPress integration architecture

### UI and Frontend Libraries
- **Radix UI**: Accessible component primitives for consistent user experience
- **Embla Carousel**: Carousel functionality for content presentation
- **Lucide Icons**: Comprehensive icon system for UI elements
- **React Hook Form**: Form state management and validation

### Development and Build Tools
- **Vite**: Fast development server and build tool
- **ESBuild**: Fast JavaScript bundling for production builds
- **TypeScript**: Type safety across the entire application stack
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
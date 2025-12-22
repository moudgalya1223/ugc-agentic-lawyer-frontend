<div align="center">
  
# Verdict.ai - Indian Law Assistant

</div>

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Mantine](https://img.shields.io/badge/Mantine-8.3.10-339AF0?style=for-the-badge&logo=mantine&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)

<img width="981" height="461" alt="image" src="https://github.com/user-attachments/assets/83b01c03-82b7-4d40-94b7-07b325aab718" />

<img width="1313" height="687" alt="image" src="https://github.com/user-attachments/assets/07b304c8-816a-4ae4-96e4-1f0706418e66" />


</div>

An AI-powered legal assistant specializing exclusively in Indian laws, legal matters, and legal procedures. Get accurate information about Indian Acts, Statutes, Regulations, case law, and legal procedures through an intuitive chat interface.

## 🚀 Features

- **🤖 AI-Powered Chat**: Interactive chat interface powered by OpenRouter AI for legal Q&A
- **📜 Indian Law Focus**: Specialized exclusively in Indian laws, acts, statutes, and legal procedures
- **📝 Markdown Rendering**: Beautiful markdown rendering for legal responses with proper formatting
- **💬 Context-Aware Suggestions**: Smart prompt suggestions based on conversation history
- **🎤 Voice Input**: Speech-to-text support for natural question input
- **📄 Document Upload**: Upload PDF documents for analysis (up to 2MB)
- **💾 Chat History**: Automatic saving of chat conversations to README file
- **🌓 Theme Support**: Dark/light mode with system preference detection
- **📱 Responsive Design**: Mobile-first, fully responsive layouts
- **⚡ Real-time Responses**: Fast AI responses with fallback model support

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [Mantine v8](https://mantine.dev/)
- **Language**: TypeScript
- **AI Integration**: [OpenRouter](https://openrouter.ai/) API
- **State Management**:
  - [Zustand](https://zustand-demo.pmnd.rs/) for client-side global state
  - [TanStack Query](https://tanstack.com/query) for server state and API calls
- **API Client**: [react-query-ease](https://www.npmjs.com/package/react-query-ease)
- **Icons**: [Tabler Icons](https://tabler.io/icons)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **Speech Recognition**: [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition)
- **Linting/Formatting**: [Biome](https://biomejs.dev/)

## 📋 Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun
- OpenRouter API key ([Get one here](https://openrouter.ai/))

## 🏃 Getting Started

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ugc-agentic-lawyer-frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── api/                    # API configuration and hooks
│   ├── config.ts          # API client setup
│   └── hooks/             # Custom React Query hooks
│       ├── useChat.ts     # Chat API hooks
│       └── index.ts
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   │   └── login/
│   ├── (protected)/       # Protected routes
│   │   ├── _components/   # Shared protected components
│   │   │   ├── DashboardHeader.tsx
│   │   │   └── DashboardSidebar.tsx
│   │   ├── chat/          # Chat interface
│   │   │   ├── _components/
│   │   │   │   └── MarkdownRenderer.tsx
│   │   │   ├── suggestions/
│   │   │   │   └── route.ts
│   │   │   └── page.tsx
│   │   └── layout.tsx     # Protected layout with AppShell
│   ├── api/               # API routes
│   │   └── chat/
│   │       └── route.ts   # Chat API endpoint
│   ├── _components/        # Shared components
│   │   ├── LawyerHeroSection.tsx
│   │   ├── LawyerFeaturesSection.tsx
│   │   └── LawyerCTASection.tsx
│   ├── error.tsx           # Error boundary
│   ├── loading.tsx         # Loading component
│   └── layout.tsx          # Root layout
├── providers/              # Context providers
│   ├── app-provider.tsx    # Mantine and Query providers
│   └── query-provider.tsx  # TanStack Query setup
├── store/                  # Zustand stores
│   ├── useLocalStore.ts    # Local storage state
│   └── types.ts            # Store type definitions
└── utils/                  # Utility functions
    ├── openrouter.utils.ts # OpenRouter API utilities
    ├── readme.utils.ts     # Chat history saving utilities
    ├── api-response.ts     # API response helpers
    └── format.ts           # Formatting utilities
```
## User Flow and Tech FLow
![User Flow and Tech Flow in whimsical](https://github.com/user-attachments/assets/b1edb6ec-dc19-4f52-a477-31c88e5789a7)


## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome
- `npm run analyze` - Analyze bundle size

## 🔧 Configuration

### Environment Variables

Required environment variables:

- `OPENROUTER_API_KEY` - Your OpenRouter API key (required)
- `OPENROUTER_API_URL` - OpenRouter API endpoint (optional, defaults to OpenRouter URL)
- `NEXT_PUBLIC_APP_URL` - Your app URL for OpenRouter referrer header (optional)

### AI Model Configuration

The app uses `openai/gpt-oss-20b:free` as the default model. You can customize this in `src/utils/openrouter.utils.ts`:

```typescript
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-20b:free";
```

### Theme Configuration

The app uses Mantine's theme system. You can customize the theme in `src/providers/app-provider.tsx`:

```typescript
const theme = createTheme({
  fontFamily: "var(--font-nunito), sans-serif",
  primaryColor: "green",
  // Add your customizations here
});
```

## 🎯 Key Features Explained

### Chat Interface

- **Markdown Support**: All bot responses are rendered as markdown for better readability
- **Context-Aware Suggestions**: Get relevant follow-up questions based on your conversation
- **Voice Input**: Use your microphone to ask questions naturally
- **File Upload**: Upload PDF documents (up to 2MB) for analysis

### Indian Law Specialization

The AI is specifically configured to:

- Only provide information about Indian laws and legal systems
- Use Indian legal terminology (e.g., "Section" instead of "Article")
- Reference Indian legal procedures (CPC, CrPC, Indian Evidence Act)
- Cite relevant Indian legal provisions, acts, or case laws

### Chat History

All conversations are automatically saved to `CHAT_HISTORY.md` in the project root, including:

- Full conversation transcripts
- Model information
- Token usage statistics
- Timestamps

## 🎯 Best Practices

- TypeScript for type safety
- React Query for efficient data fetching and caching
- Zustand for lightweight state management
- Biome for fast linting and formatting
- Error boundaries for graceful error handling
- Markdown rendering for better content presentation

## 📝 License

This project is private and proprietary.

## 📧 Support

For support, please open an issue in the repository.

---

Built with ❤️ using Next.js, React, Mantine, and OpenRouter AI

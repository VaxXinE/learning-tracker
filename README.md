# 🎓 Learning Tracker - Next.js Educational Platform

A comprehensive learning management system built with Next.js 14, TypeScript, and Firebase that helps students and educators track courses, lessons, tasks, and study sessions with advanced features like Pomodoro timer, progress tracking, and data export capabilities.

## 🚀 Features

### 📚 Course Management
- **Course Creation & Management**: Create, edit, and organize courses with detailed information
- **Lesson Planning**: Structure lessons within courses with rich content support
- **Progress Tracking**: Visual progress indicators for course completion

### ✅ Task Management
- **Smart Task Creation**: Add tasks with priorities, due dates, and categories
- **Task Organization**: Filter and sort tasks by status, priority, or course
- **Bulk Operations**: Export tasks to CSV for external analysis
- **Real-time Updates**: Live synchronization across devices

### ⏱️ Pomodoro Timer
- **Integrated Timer**: Built-in Pomodoro technique timer for focused study sessions
- **Session Tracking**: Automatically log study sessions with detailed statistics
- **Customizable Settings**: Adjustable work/break intervals
- **History & Analytics**: Track productivity patterns over time

### 🔐 Authentication & Security
- **Firebase Authentication**: Secure user authentication with email/password
- **Protected Routes**: Role-based access control for sensitive pages
- **Session Management**: Persistent user sessions across devices

### 🎨 Modern UI/UX
- **Responsive Design**: Fully responsive interface for all devices
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Intuitive Navigation**: Clean, user-friendly interface with smooth transitions
- **Loading States**: Skeleton loaders and progress indicators

### 📊 Analytics & Insights
- **Dashboard Overview**: Comprehensive view of learning progress
- **Performance Metrics**: Track completion rates and study time
- **Visual Charts**: Interactive charts for data visualization
- **Export Capabilities**: Export data for external analysis

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form validation and management
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icons

### Backend & Database
- **Firebase** - Backend-as-a-Service
  - **Firebase Authentication** - User management
  - **Cloud Firestore** - NoSQL database
  - **Firebase Storage** - File storage (future feature)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **TypeScript** - Type checking

## 📁 Project Structure

```
learning-tracker/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── courses/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── firebase-dashboard.tsx
│   │   │   └── page.tsx
│   │   ├── lessons/
│   │   │   └── page.tsx
│   │   ├── tasks/
│   │   │   ├── firebase-tasks.tsx
│   │   │   ├── page.tsx
│   │   │   └── Pomodoro.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AuthProvider.tsx
│   │   ├── Protected.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── TopBar.tsx
│   │   └── TutorialPopup.tsx
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── courses.ts
│   │   │   ├── lessons.ts
│   │   │   └── tasks.ts
│   │   ├── dateUtils.ts
│   │   ├── exportCsv.ts
│   │   ├── firebase.ts
│   │   └── fs.ts
│   └── store/
│       └── theme.ts
├── public/
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project set up
- Package manager (npm, yarn, or pnpm)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/learning-tracker.git
   cd learning-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase configuration

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Guide

### For Students
1. **Register/Login**: Create an account or log in
2. **Create Courses**: Add your courses with relevant details
3. **Add Lessons**: Structure lessons within each course
4. **Manage Tasks**: Create tasks for each lesson/course
5. **Track Progress**: Use the dashboard to monitor your progress
6. **Study Sessions**: Use the Pomodoro timer for focused study

### For Educators
1. **Course Management**: Create and manage course content
2. **Student Progress**: Monitor student engagement and progress
3. **Task Assignment**: Create and assign tasks to students
4. **Analytics**: Use dashboard insights for course improvement

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style
- **ESLint**: Enforces code quality and style
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking enabled

### Folder Conventions
- `src/app/` - Next.js App Router pages
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and Firebase services
- `src/store/` - Zustand state management stores

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy with one click

### Other Platforms
- **Netlify**: Connect your GitHub repository
- **Firebase Hosting**: Use Firebase CLI for deployment
- **Docker**: Build and deploy with Docker containers

## 🔍 API Reference

### Firebase Collections

#### Courses Collection
```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  progress: number;
}
```

#### Lessons Collection
```typescript
interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
  completed: boolean;
  createdAt: Timestamp;
}
```

#### Tasks Collection
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  courseId: string;
  lessonId?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Course creation and editing
- [ ] Lesson management
- [ ] Task creation and completion
- [ ] Pomodoro timer functionality
- [ ] Data export features
- [ ] Responsive design on mobile
- [ ] Dark mode toggle
- [ ] Firebase authentication

## 📈 Performance Optimization

### Next.js Optimizations
- **Image Optimization**: Automatic with Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: ISR for course and lesson pages
- **Bundle Analysis**: Use @next/bundle-analyzer

### Firebase Optimizations
- **Query Optimization**: Use compound queries and indexes
- **Real-time Updates**: Efficient Firestore listeners
- **Caching Strategy**: Implement React Query for data caching

## 🔐 Security Best Practices

- **Input Validation**: All forms validated with React Hook Form
- **XSS Protection**: Built-in Next.js protection
- **Firebase Security Rules**: Comprehensive Firestore rules
- **HTTPS Only**: Enforced in production
- **Rate Limiting**: API route protection

## 📱 Mobile Support

- **Responsive Design**: Mobile-first approach
- **Touch Gestures**: Swipe support for task management
- **PWA Ready**: Service worker and manifest included
- **Offline Support**: Basic offline functionality with service worker

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive commit messages
- Add tests for new features
- Update documentation for API changes
- Ensure responsive design for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Firebase](https://firebase.google.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for beautiful icons
- [Vercel](https://vercel.com/) for deployment platform

## 📞 Support


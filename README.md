# Neomate - Therapeutic AI Assistant for Neonatal Care

![Neomate Logo](https://via.placeholder.com/200x80/3B82F6/FFFFFF?text=Neomate)

## Overview

Neomate is a compassionate AI-powered platform designed to provide therapeutic support and evidence-based information for families navigating neonatal hospitalization. Built with empathy and medical expertise, Neomate offers 24/7 support during one of life's most challenging journeys.

## Features

### 🤖 **Compassionate AI Support**
- Empathetic AI conversations designed by healthcare professionals
- Emotional support tailored to neonatal care situations
- Understanding responses to family concerns and questions

### ⏰ **24/7 Availability**
- Round-the-clock support when you need it most
- No waiting times or appointment scheduling
- Immediate access to guidance and information

### 🧠 **Evidence-Based Information**
- Medical information backed by latest neonatal research
- Content reviewed by board-certified neonatologists
- Up-to-date guidelines and best practices

### 🔒 **Privacy & Security**
- HIPAA compliant platform
- Secure, encrypted conversations
- Complete privacy protection for sensitive information

### ❤️ **Emotional Wellness Tools**
- Stress and anxiety management techniques
- Coping strategies for difficult situations
- Mental health support resources

### 👨‍👩‍👧‍👦 **Family-Centered Care**
- Support for parents, siblings, and extended family
- Guidance for the entire family unit
- Community connection opportunities

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Code Quality**: ESLint with TypeScript support

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/alissatroiano/neomate.git
cd neomate
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
neomate/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Navigation header
│   │   ├── Hero.tsx            # Hero section
│   │   ├── Features.tsx        # Features showcase
│   │   ├── About.tsx           # About section with stats
│   │   ├── Testimonials.tsx    # User testimonials
│   │   ├── CTA.tsx             # Call-to-action section
│   │   └── Footer.tsx          # Footer component
│   ├── App.tsx                 # Main application component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── public/                     # Static assets
├── index.html                 # HTML template
└── package.json               # Dependencies and scripts
```

## Design System

### Colors
- **Primary**: Blue (#3B82F6)
- **Secondary**: Indigo (#6366F1)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Readable, accessible font sizes
- **Line Height**: 150% for body text, 120% for headings

### Spacing
- Consistent 8px spacing system
- Proper alignment and visual balance
- Intentional white space usage

## Compliance & Security

- **HIPAA Compliant**: Meets healthcare privacy standards
- **Evidence-Based**: All medical content reviewed by professionals
- **Secure**: End-to-end encryption for all communications
- **Accessible**: WCAG 2.1 AA compliance

## Target Audience

- **Primary**: Parents and families with babies in NICU
- **Secondary**: Healthcare providers and support staff
- **Tertiary**: Extended family members and caregivers

## Contributing

We welcome contributions from healthcare professionals, developers, and families with lived experience. Please read our contributing guidelines before submitting pull requests.

### Development Guidelines

1. Follow the existing code style and conventions
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed
5. Ensure accessibility standards are met

## Research

The initial build can use ChatGPT output, but will be specially trained on data from:

- [Nationwide Children's Health - NICU Terms](https://www.nationwidechildrens.org/family-resources-education/health-wellness-and-safety-resources/resources-for-parents-and-kids/nicu-resources/common-terms).
- [Neonatal Studies](https://neonatal.rti.org/index.cfm?fuseaction=home.studies)
- 
## Medical Disclaimer

Neomate provides general information and emotional support but is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Neonatology medical experts who provided guidance
- Families who shared their experiences and feedback
- Healthcare institutions supporting the project
- Open source community for tools and libraries

---

**Built with ❤️ for families navigating the NICU journey**

*Neomate - Your caring AI companion for neonatal care*

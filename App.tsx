
import React, { useState, useRef, useEffect } from 'react';
import { ArchitectureGraph } from './components/ArchitectureGraph';
import { ChatInterface } from './components/ChatInterface';
import { generateArchitecture, critiqueArchitecture, chatWithArchitect, analyzeDiagramImage, getTechRecommendations, generateSystemTutorial, scoreArchitecture, generateGameChallenge, validateGameSolution, improveArchitecture, analyzeImage, generateImage } from './services/geminiService';
import { SystemArchitecture, ArchitectureNode, ChatMessage, AnalysisResult, NodeType, TutorialStep, ProjectDetails, ArchitectureScore, GameScenario, GameValidation } from './types';
import { Markdown } from './components/Markdown';

// --- Icons ---
const Icons = {
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
  Design: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>,
  Architect: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" /></svg>,
  Review: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 0121 12z" /></svg>,
  Stack: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.75 6.495c.75.412.75 1.572 0 1.984l-11.75 6.495c-.75.412-1.667-.13-1.667-.986V5.653z" /></svg>,
  Stop: () => <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h15a3 3 0 003-3v-9a3 3 0 00-3-3h-15z" /></svg>,
  School: () => <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 001.402 10.06a.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" /><path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 0110.94 15.473c.196.104.417.167.643.167.2270 .448-.063.644-.167z" /><path d="M5.05 14.013c-.22 1.831-.42 3.667-.6 5.502a.75.75 0 01-1.49-.15c.18-1.834.38-3.67.6-5.501.07-.585.88-.585.95 0a.44.44 0 01-.06.28.44.44 0 01.6.369z" /></svg>,
  Hub: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
  BrandLogo: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-500 hover:text-blue-400 transition-colors"><path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" /><path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 002.322-4.446z" /></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  Game: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>,
  Language: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>,
  Add: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  Bolt: () => <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" /></svg>,
  Link: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Magic: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  Photo: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  Expand: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>,
  Contract: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>
};

// ... (SidebarBtn component remains the same)
const SidebarBtn = ({ icon, label, description, active, onClick }: { icon: React.ReactNode, label: string, description: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-6 py-3 flex items-start gap-3 transition-colors duration-200 border-l-2 ${
      active 
        ? 'bg-blue-500/10 border-blue-500' 
        : 'border-transparent hover:bg-slate-800'
    }`}
  >
    <div className={`mt-0.5 ${active ? 'text-blue-400' : 'text-slate-500'}`}>
      {icon}
    </div>
    <div>
      <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{label}</div>
      <div className="text-[10px] text-slate-500 font-mono">{description}</div>
    </div>
  </button>
);

// --- Translations ---
const translations = {
  // ... (translations remain exactly the same)
  en: {
    title: 'ArchGen',
    subtitle: 'System Architect AI',
    canvas: 'Design Canvas',
    canvasDesc: 'Visual Editor',
    architect: 'AI Architect',
    architectDesc: 'Chat & Refine',
    review: 'System Review',
    reviewDesc: 'Critique & Benchmark',
    stack: 'Tech Stack',
    stackDesc: 'Recommendations',
    game: 'Game Arena',
    gameDesc: 'Skills & Tutorials',
    studio: 'Vision Studio',
    studioDesc: 'Image Analysis & Gen',
    import: 'Import Diagram',
    generateBtn: 'Generate Architecture',
    ready: 'Ready to Architect',
    livePreview: 'Live Preview',
    noArch: 'No active architecture',
    critiqueTitle: 'Architecture Analysis',
    critiqueSub: 'Benchmark Scores & Deep Critique',
    analyzing: 'Benchmarking & Analyzing...',
    noCritique: 'Generate a system design first.',
    stackTitle: 'Technology Stack',
    stackSub: 'Modern recommendations',
    searching: 'Searching Google Grounding...',
    noStack: 'Generate a system first.',
    compDetails: 'Component Details',
    name: 'Name',
    type: 'Type',
    desc: 'Description',
    techSuggest: 'Tech Suggestion',
    run: 'Run',
    stop: 'Stop',
    tutorialMode: 'Tutorial',
    tutorialActive: 'Active',
    exitTutorial: 'Exit',
    nextStep: 'Next',
    back: 'Back',
    step: 'Step',
    sources: 'Sources',
    welcomeMsg: "I've designed a {title}. I can refine this with you in the 'Architect' tab.",
    failedGen: "Failed to generate architecture.",
    failedTut: "Failed to generate tutorial.",
    startNew: 'Start New Project',
    startDesc: 'Design a new distributed system from scratch',
    cancel: 'Cancel',
    grade: 'Overall Grade',
    formTitle: 'New System Project',
    formDesc: 'Define your requirements to generate a precise architecture.',
    lblProjectName: 'Project Name',
    lblDomain: 'Domain / Industry',
    lblScale: 'Target Scale',
    lblPriorities: 'Key Priorities',
    lblDescription: 'Detailed Description',
    generatePlaceholder: 'e.g., A global video streaming platform with recommendation engine...',
    domains: ['Auto (AI Decides)', 'Basic Tool / Utility', 'E-commerce', 'Fintech', 'Social Network', 'IoT Platform', 'SaaS', 'Healthcare', 'Gaming', 'Streaming'],
    scales: ['Prototype / Personal (<100 users)', 'MVP / Startup (<1k users)', 'Scale-up (10k-100k users)', 'Enterprise (1M+ users)', 'Global Scale (100M+ users)'],
    priorities: ['High Availability', 'Low Latency', 'Cost Efficiency', 'Security Compliance', 'Rapid Development', 'Data Consistency'],
    benchmark: 'System Scorecard',
    improveBtn: 'Generate Improvements',
    improving: 'Optimizing Architecture...',
    originalArch: 'Current Architecture',
    improvedArch: 'Proposed Architecture',
    analysisReport: 'Analysis Report',
    gameTitle: 'Junior Architect Challenge',
    gameSub: 'Fix the broken system architecture',
    startGame: 'Start Level',
    gameLoading: 'Generating Challenge...',
    mission: 'Mission Brief',
    toolbox: 'Architect Toolbox',
    deploy: 'Deploy Solution',
    validating: 'Validating Solution...',
    gameWin: 'Problem Solved!',
    gameFail: 'Attempt Failed',
    hint: 'Hint',
    addToGraph: 'Add Component',
    score: 'Score',
    gameChatTitle: 'Game Tutor',
    gameChatWelcome: 'I am here to guide you. Use the chat if you need hints!',
    export: 'Export JSON',
    exportDesc: 'Download Plan',
    showSolution: 'Show Solution',
    nextLevel: 'Next Level',
    level: 'Level',
    locked: 'Locked',
    studioTabAnalyze: 'Analyze Image',
    studioTabGenerate: 'Generate Image',
    studioAnalyzeTitle: 'Visual Architecture Analysis',
    studioAnalyzeDesc: 'Upload a system diagram or whiteboard photo for AI breakdown.',
    studioGenTitle: 'Concept Visualization',
    studioGenDesc: 'Describe a component or system to visualize it.',
    dropImage: 'Drop image here or click to upload',
    analyzeBtn: 'Analyze Image',
    generateImageBtn: 'Generate Image',
    imagePromptPlaceholder: 'e.g., A futuristic server room with glowing blue cables...',
    imageSize: 'Image Size',
    analysisResult: 'Analysis Result',
    generatedImage: 'Generated Output',
    manualAdd: 'Add Node',
    linkMode: 'Link Mode',
    linkModeActive: 'Select Source & Target',
    switchToTurkish: 'Switch to Turkish',
    switchToEnglish: 'İngilizceye Geç',
    tutorialLoading: 'Generating...',
    importOverlayTitle: 'Import Diagram',
    importOverlayDesc: 'Drag & Drop your JSON or Image file here',
    importOverlayBtn: 'Or click to select',
    gameLobbyTitle: 'Game Arena',
    gameLobbySub: 'Choose your path: Learn basics or Challenge yourself',
    modeTutorial: 'Tutorial Mode',
    modeTutorialDesc: 'Guided learning scenarios. Perfect for beginners.',
    modeChallenge: 'Challenge Mode',
    modeChallengeDesc: 'Solve real-world architectural problems.',
    selectDomain: 'Select Domain',
    selectDiff: 'Select Level'
  },
  tr: {
    title: 'ArchGen',
    subtitle: 'Sistem Mimarı AI',
    canvas: 'Tasarım Tuvali',
    canvasDesc: 'Görsel Editör',
    architect: 'AI Mimar',
    architectDesc: 'Sohbet & İyileştirme',
    review: 'Sistem İncelemesi',
    reviewDesc: 'Skorlama & Analiz',
    stack: 'Teknoloji Yığını',
    stackDesc: 'Öneriler',
    game: 'Oyun Alanı',
    gameDesc: 'Yetenek & Eğitim',
    studio: 'Vizyon Stüdyosu',
    studioDesc: 'Görüntü Analiz & Üretim',
    import: 'Diyagram Yükle',
    generateBtn: 'Mimariyi Oluştur',
    ready: 'Mimari Oluşturmaya Hazır',
    livePreview: 'Canlı Önizleme',
    noArch: 'Aktif mimari yok',
    critiqueTitle: 'Mimari Analizi',
    critiqueSub: 'Benchmark Skorları & Detaylı Eleştiri',
    analyzing: 'Puanlanıyor ve analiz ediliyor...',
    noCritique: 'İnceleme için önce bir sistem tasarımı oluşturun.',
    stackTitle: 'Teknoloji Yığını',
    stackSub: 'Modern öneriler',
    searching: 'Google Grounding ile aranıyor...',
    noStack: 'Öneri için önce sistem oluşturun.',
    compDetails: 'Bileşen Detayları',
    name: 'İsim',
    type: 'Tip',
    desc: 'Açıklama',
    techSuggest: 'Teknoloji Önerisi',
    run: 'Çalıştır',
    stop: 'Durdur',
    tutorialMode: 'Eğitim',
    tutorialActive: 'Aktif',
    exitTutorial: 'Çık',
    nextStep: 'İleri',
    back: 'Geri',
    step: 'Adım',
    sources: 'Kaynaklar',
    welcomeMsg: "{title} tasarlandı. 'AI Mimar' sekmesinde geliştirebiliriz.",
    failedGen: "Mimari oluşturulamadı.",
    failedTut: "Eğitim oluşturulamadı.",
    startNew: 'Yeni Proje Başlat',
    startDesc: 'Sıfırdan yeni bir dağıtık sistem tasarla',
    cancel: 'İptal',
    grade: 'Genel Not',
    formTitle: 'Yeni Sistem Projesi',
    formDesc: 'Hassas bir mimari için gereksinimlerinizi tanımlayın.',
    lblProjectName: 'Proje Adı',
    lblDomain: 'Sektör / Alan',
    lblScale: 'Hedef Ölçek',
    lblPriorities: 'Ana Öncelikler',
    lblDescription: 'Detaylı Açıklama',
    generatePlaceholder: 'örn., Öneri motoruna sahip global video yayın platformu...',
    domains: ['Otomatik (Yapay Zeka Karar Versin)', 'Basit Araç / Utility', 'E-ticaret', 'Fintech', 'Sosyal Ağ', 'IoT Platformu', 'SaaS', 'Sağlık', 'Oyun', 'Yayıncılık'],
    scales: ['Prototip / Kişisel (<100 kullanıcı)', 'MVP / Startup (<1k kullanıcı)', 'Büyüme (10k-100k kullanıcı)', 'Kurumsal (1M+ kullanıcı)', 'Global Ölçek (100M+ kullanıcı)'],
    priorities: ['Yüksek Erişilebilirlik', 'Düşük Gecikme', 'Maliyet Etkinliği', 'Güvenlik Uyumu', 'Hızlı Geliştirme', 'Veri Tutarlılığı'],
    benchmark: 'Sistem Karnesi',
    improveBtn: 'Otomatik İyileştir',
    improving: 'Mimari Optimize Ediliyor...',
    originalArch: 'Mevcut Mimari',
    improvedArch: 'Önerilen Mimari',
    analysisReport: 'Analiz Raporu',
    gameTitle: 'Junior Mimar Meydan Okuması',
    gameSub: 'Bozuk sistem mimarisini düzelt',
    startGame: 'Seviyeyi Başlat',
    gameLoading: 'Görev Hazırlanıyor...',
    mission: 'Görev Tanımı',
    toolbox: 'Mimar Çantası',
    deploy: 'Çözümü Uygula',
    validating: 'Çözüm Doğrulanıyor...',
    gameWin: 'Sorun Çözüldü!',
    gameFail: 'Deneme Başarısız',
    hint: 'İpucu',
    addToGraph: 'Bileşen Ekle',
    score: 'Puan',
    gameChatTitle: 'Oyun Eğitmeni',
    gameChatWelcome: 'Sana rehberlik etmek için buradayım. İpucu istersen sorabilirsin!',
    export: 'Planı İndir',
    exportDesc: 'JSON olarak kaydet',
    showSolution: 'Çözümü Göster',
    nextLevel: 'Sonraki Seviye',
    level: 'Seviye',
    locked: 'Kilitli',
    studioTabAnalyze: 'Görüntü Analizi',
    studioTabGenerate: 'Görsel Üretimi',
    studioAnalyzeTitle: 'Mimari Görüntü Analizi',
    studioAnalyzeDesc: 'Bir sistem diyagramı veya tahta fotoğrafı yükleyin.',
    studioGenTitle: 'Konsept Görselleştirme',
    studioGenDesc: 'Görselleştirmek istediğiniz bileşeni veya sistemi tanımlayın.',
    dropImage: 'Resmi buraya sürükleyin veya tıklayın',
    analyzeBtn: 'Analiz Et',
    generateImageBtn: 'Görsel Üret',
    imagePromptPlaceholder: 'örn., Mavi kablolarla parlayan fütüristik sunucu odası...',
    imageSize: 'Görsel Boyutu',
    analysisResult: 'Analiz Sonucu',
    generatedImage: 'Üretilen Çıktı',
    manualAdd: 'Node Ekle',
    linkMode: 'Bağla',
    linkModeActive: 'Kaynak ve Hedef Seç',
    switchToTurkish: 'Switch to Turkish',
    switchToEnglish: 'İngilizceye Geç',
    tutorialLoading: 'Hazırlanıyor...',
    importOverlayTitle: 'Diyagram Yükle',
    importOverlayDesc: 'JSON veya Resim dosyanı buraya sürükle',
    importOverlayBtn: 'Veya seçmek için tıkla',
    gameLobbyTitle: 'Oyun Alanı',
    gameLobbySub: 'Yolunu seç: Temelleri öğren veya kendine meydan oku',
    modeTutorial: 'Eğitim Modu',
    modeTutorialDesc: 'Rehberli öğrenme senaryoları. Yeni başlayanlar için ideal.',
    modeChallenge: 'Meydan Okuma',
    modeChallengeDesc: 'Gerçek dünya mimari problemlerini çöz.',
    selectDomain: 'Alan Seçimi',
    selectDiff: 'Seviye Seçimi'
  }
};

// ... (GeneratingOverlay remains the same)
const GeneratingOverlay = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0e14]/90 backdrop-blur-md">
        <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500/30 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-24 h-24 border-4 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-icons text-4xl text-blue-400 animate-pulse">hub</span>
            </div>
        </div>
        <h3 className="mt-8 text-2xl font-bold text-white tracking-tight">System Generating...</h3>
        <p className="text-slate-400 mt-2 animate-pulse">Designing Nodes, Connecting Edges, Selecting Tech Stack...</p>
    </div>
);

export default function App() {
  const [lang, setLang] = useState<'en' | 'tr'>('tr');
  const t = translations[lang];

  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [showImportOverlay, setShowImportOverlay] = useState(false); 
  const [isDragging, setIsDragging] = useState(false); 

  // Project Form State
  const [showWizard, setShowWizard] = useState(false);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    name: '',
    domain: t.domains[0],
    scale: t.scales[0],
    priorities: [],
    description: ''
  });

  const [architecture, setArchitecture] = useState<SystemArchitecture | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);
  
  // Tech Editing State
  const [newTechInput, setNewTechInput] = useState('');

  // Highlighting State
  const [chatHighlights, setChatHighlights] = useState<{ nodes: string[], layer: string | null }>({ nodes: [], layer: null });
  
  // Game State
  const [gameScenario, setGameScenario] = useState<GameScenario | null>(null);
  const [gameValidation, setGameValidation] = useState<GameValidation | null>(null);
  const [selectedToolType, setSelectedToolType] = useState<NodeType>(NodeType.CACHE);
  const [gameChatMessages, setGameChatMessages] = useState<ChatMessage[]>([]);
  const [gameMode, setGameMode] = useState<'LOBBY' | 'PLAY'>('LOBBY');
  
  // Studio State
  const [studioTab, setStudioTab] = useState<'ANALYZE' | 'GENERATE'>('ANALYZE');
  const [studioImage, setStudioImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioResultText, setStudioResultText] = useState('');
  const [genImagePrompt, setGenImagePrompt] = useState('');
  const [genImageSize, setGenImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Level System
  const [gameSelection, setGameSelection] = useState({
      mode: 'Tutorial', 
      domain: 'E-commerce',
      level: 1
  });
  
  // Simulation & Tutorial State
  const [simulating, setSimulating] = useState(false);
  const [tutorialMode, setTutorialMode] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loadingTutorial, setLoadingTutorial] = useState(false);

  const currentStep = tutorialSteps[currentStepIndex];
  
  const [activeView, setActiveView] = useState('design');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Analysis State
  const [critique, setCritique] = useState<string>('');
  const [score, setScore] = useState<ArchitectureScore | null>(null);
  const [techRecs, setTechRecs] = useState<AnalysisResult | null>(null);
  const [improvedArch, setImprovedArch] = useState<SystemArchitecture | null>(null);
  const [isReportExpanded, setIsReportExpanded] = useState(false);
  
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-preview');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studioFileInputRef = useRef<HTMLInputElement>(null);

  // Handlers (...unchanged...)
  const handleDetailsChange = (field: keyof ProjectDetails, value: any) => {
    setProjectDetails(prev => ({ ...prev, [field]: value }));
  };

  const togglePriority = (p: string) => {
    setProjectDetails(prev => {
      const exists = prev.priorities.includes(p);
      return {
        ...prev,
        priorities: exists ? prev.priorities.filter(x => x !== p) : [...prev.priorities, p]
      };
    });
  };

  const handleGenerate = async () => {
    if (!projectDetails.description.trim()) return;
    setLoading(true);
    setArchitecture(null);
    setCritique('');
    setScore(null);
    setTechRecs(null);
    setImprovedArch(null); 
    setTutorialMode(false);
    setShowWizard(false); 
    
    setActiveView('design');

    try {
      const arch = await generateArchitecture(projectDetails, lang);
      setArchitecture(arch);
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: t.welcomeMsg.replace('{title}', arch.title),
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error(error);
      alert(t.failedGen);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (archToDownload: SystemArchitecture | null = architecture) => {
    if (!archToDownload) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archToDownload, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const fileName = archToDownload.title 
        ? `${archToDownload.title.replace(/\s+/g, '_')}_architecture.json` 
        : `system_architecture.json`;
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleStudioImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const result = ev.target?.result as string;
              const [prefix, data] = result.split(',');
              const mimeType = prefix.split(':')[1].split(';')[0];
              setStudioImage({ data, mimeType });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAnalyzeImage = async () => {
      if (!studioImage) return;
      setLoading(true);
      try {
          const prompt = studioPrompt || (lang === 'tr' ? 'Bu diyagramı veya resmi analiz et.' : 'Analyze this diagram or image.');
          const result = await analyzeImage(studioImage.data, studioImage.mimeType, prompt, lang);
          setStudioResultText(result);
      } catch (e) {
          console.error(e);
          setStudioResultText("Error analyzing image.");
      } finally {
          setLoading(false);
      }
  };

  const handleGenerateImage = async () => {
      if (!genImagePrompt) return;
      setLoading(true);
      setGeneratedImageUrl(null);
      try {
          const base64Image = await generateImage(genImagePrompt, genImageSize);
          setGeneratedImageUrl(base64Image);
      } catch (e) {
          console.error(e);
          alert("Image generation failed. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  const handleConnectNodes = (sourceId: string, targetId: string) => {
    if (!architecture) return;
    const exists = architecture.edges.some(e => e.source === sourceId && e.target === targetId);
    if (exists) return;

    const newEdge = {
        id: `edge-${Date.now()}`,
        source: sourceId,
        target: targetId,
        label: ''
    };
    setArchitecture({
        ...architecture,
        edges: [...architecture.edges, newEdge]
    });
    setIsLinkingMode(false);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!architecture) return;
    setArchitecture({
        ...architecture,
        nodes: architecture.nodes.filter(n => n.id !== nodeId),
        edges: architecture.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
    });
    setSelectedNode(null);
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (!architecture) return;
    setArchitecture(prev => prev ? ({
        ...prev,
        edges: prev.edges.filter(e => e.id !== edgeId)
    }) : null);
  };

  const handleManualAddNode = () => {
    if (!architecture) return;
    const newNode: ArchitectureNode = {
      id: `manual-${Date.now()}`,
      label: selectedToolType.toString(),
      type: selectedToolType,
      description: "Manually added node",
      technologies: ["Generic"]
    };
    setArchitecture({
      ...architecture,
      nodes: [...architecture.nodes, newNode],
      edges: architecture.edges
    });
  };

  const handleAddTech = () => {
      if (!selectedNode || !newTechInput.trim()) return;
      const currentTechs = selectedNode.technologies || [];
      if (!currentTechs.includes(newTechInput.trim())) {
          updateNode(selectedNode.id, 'technologies', [...currentTechs, newTechInput.trim()]);
      }
      setNewTechInput('');
  };

  const handleRemoveTech = (techToRemove: string) => {
      if (!selectedNode || !selectedNode.technologies) return;
      const newTechs = selectedNode.technologies.filter(t => t !== techToRemove);
      updateNode(selectedNode.id, 'technologies', newTechs);
  };

  const handleStartGame = async () => {
    setLoading(true);
    setGameValidation(null);
    setGameChatMessages([]);
    setGameMode('PLAY'); 

    const level = gameSelection.level; 
    const domain = gameSelection.domain;
    const mode = gameSelection.mode as 'Tutorial' | 'Challenge';

    try {
      const scenario = await generateGameChallenge(level, domain, lang, mode);
      setGameScenario(scenario);
      setArchitecture(scenario.architecture); 
      setGameChatMessages([{
          id: 'game-welcome',
          role: 'model',
          text: `**${t.gameChatTitle}**\n\n${t.gameChatWelcome}`,
          timestamp: Date.now()
      }]);
    } catch (e) {
      console.error(e);
      alert('Failed to start game');
      setGameMode('LOBBY'); 
    } finally {
      setLoading(false);
    }
  };

  const handleGameAddNode = () => {
    if (!architecture) return;
    
    const newNode: ArchitectureNode = {
      id: `game-added-${Date.now()}`,
      label: selectedToolType.toString(),
      type: selectedToolType,
      description: "User added component",
      technologies: ["Generic"]
    };

    setArchitecture({
      ...architecture,
      nodes: [...architecture.nodes, newNode],
      edges: [...architecture.edges] 
    });
  };

  const handleGameChatMessage = async (text: string) => {
      const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
      setGameChatMessages(prev => [...prev, newMessage]);
      setLoading(true); 

      try {
          const result = await chatWithArchitect(gameChatMessages.concat(newMessage), text, lang, architecture || undefined, undefined, undefined, 'tutor');
          
          setGameChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: result.message,
              timestamp: Date.now()
          }]);

          if (result.highlightNodeIds || result.highlightLayer) {
            setChatHighlights({ 
                nodes: result.highlightNodeIds || [], 
                layer: result.highlightLayer || null 
            });
            setTimeout(() => {
                setChatHighlights({ nodes: [], layer: null });
            }, 4000);
        }

      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleGameSubmit = async () => {
    if (!gameScenario || !architecture) return;
    
    setGameChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: t.deploy,
        timestamp: Date.now()
    }]);

    setLoading(true); 
    try {
      const result = await validateGameSolution(gameScenario, architecture, lang);
      setGameValidation(result);
      
      const resultText = result.success 
        ? `✅ **${t.gameWin}**\n\n${result.feedback}\n\nScore: ${result.score}`
        : `❌ **${t.gameFail}**\n\n${result.feedback}\n\nScore: ${result.score}`;

      setGameChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: resultText,
        timestamp: Date.now()
      }]);

    } catch (e) {
      console.error(e);
      setGameChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "⚠️ System Validation Timeout or Error. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowSolution = () => {
      if (gameValidation?.correctedArchitecture) {
          setArchitecture(gameValidation.correctedArchitecture);
          setGameChatMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `💡 **${t.showSolution}:** I have updated the canvas with the corrected architecture. Observe the changes!`,
              timestamp: Date.now()
          }]);
      }
  };

  const handleNextLevel = () => {
      if (gameSelection.level < 5) {
          setGameSelection(prev => ({ ...prev, level: prev.level + 1 }));
          setGameMode('LOBBY');
      }
  };

  const handleSimulateToggle = () => {
    if (tutorialMode) {
      setTutorialMode(false);
    }
    setSimulating(!simulating);
  };

  const handleTutorialStart = async () => {
    if (!architecture) return;
    setSimulating(false); 
    
    if (tutorialSteps.length > 0) {
      setTutorialMode(true);
      setCurrentStepIndex(0);
      return;
    }

    setLoadingTutorial(true);
    try {
      const steps = await generateSystemTutorial(architecture, lang);
      setTutorialSteps(steps);
      setTutorialMode(true);
      setCurrentStepIndex(0);
    } catch (e) {
      console.error(e);
      alert(t.failedTut);
    } finally {
      setLoadingTutorial(false);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const exitTutorial = () => {
    setTutorialMode(false);
  };

  const handleSendMessage = async (text: string) => {
    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setChatLoading(true);

    try {
      const result = await chatWithArchitect(
          messages.concat(newMessage), 
          text, 
          lang, 
          architecture || undefined, 
          critique || undefined, 
          score || undefined, 
          'architect',
          selectedModel
      );
      
      const newModelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.message,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newModelMessage]);

      if (result.updatedArchitecture) {
          setArchitecture(result.updatedArchitecture);
          setMessages(prev => [...prev, {
              id: (Date.now() + 2).toString(),
              role: 'model',
              text: `🛠️ ${lang === 'tr' ? 'Mimari planı güncellendi.' : 'Architecture diagram updated.'}`,
              timestamp: Date.now()
          }]);
      }

      if (result.highlightNodeIds || result.highlightLayer) {
          setChatHighlights({ 
              nodes: result.highlightNodeIds || [], 
              layer: result.highlightLayer || null 
          });
          setTimeout(() => {
              setChatHighlights({ nodes: [], layer: null });
          }, 4000);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCritique = async () => {
    if (!architecture) return;
    if (critique && score) return; 

    setLoading(true);
    try {
      const [critResult, scoreResult] = await Promise.all([
        critiqueArchitecture(architecture, lang),
        scoreArchitecture(architecture, projectDetails, lang)
      ]);
      setCritique(critResult);
      setScore(scoreResult);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImproveArchitecture = async () => {
      if (!architecture || !critique) return;
      setLoading(true);
      try {
          const improved = await improveArchitecture(architecture, critique, lang);
          setImprovedArch(improved);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleTechSearch = async () => {
    if (!architecture) return;
    setLoading(true);
    try {
      const query = `technologies for ${architecture.title}`;
      const { text, sources } = await getTechRecommendations(query, lang);
      setTechRecs({ markdown: text, sources });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file: File) => {
      if (!file) return;
      setShowImportOverlay(false); 
      
      if (file.type === "application/json" || file.name.endsWith('.json')) {
          setLoading(true);
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const json = JSON.parse(e.target?.result as string);
                  if (json.nodes && json.edges && json.title) {
                      setArchitecture(json);
                      setProjectDetails(prev => ({ ...prev, name: json.title, description: json.description }));
                      setMessages([{
                          id: 'welcome',
                          role: 'model',
                          text: `📂 ${lang === 'tr' ? 'Proje başarıyla yüklendi:' : 'Project loaded successfully:'} **${json.title}**`,
                          timestamp: Date.now()
                      }]);
                      setActiveView('design');
                  } else {
                      alert("Invalid Architecture JSON format.");
                  }
              } catch (err) {
                  console.error(err);
                  alert("Failed to parse JSON file.");
              } finally {
                  setLoading(false);
              }
          };
          reader.readAsText(file);
          return;
      }

      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeDiagramImage(base64, file.type, lang);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: `**${lang === 'tr' ? 'Görüntü Analiz Sonucu' : 'Image Analysis Result'}:**\n\n${result}`,
            timestamp: Date.now()
          }]);
          setActiveView('architect');
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
  };

  const switchView = (view: string) => {
    setActiveView(view);
    if (view === 'design' && gameScenario) {
        setArchitecture(null); 
        setGameScenario(null);
    }
    if (view === 'review' && architecture && (!critique || !score) && !loading && !gameScenario) {
      handleCritique();
    }
    if (view === 'stack' && architecture && !techRecs && !loading && !gameScenario) {
      handleTechSearch();
    }
  };

  const updateNode = (id: string, field: keyof ArchitectureNode, value: any) => {
    if (!architecture) return;
    const newNodes = architecture.nodes.map(n => 
        n.id === id ? { ...n, [field]: value } : n
    );
    setArchitecture({ ...architecture, nodes: newNodes });
    setSelectedNode(prev => prev ? { ...prev, [field]: value } : null);
  };

  const calculateGrade = (s: ArchitectureScore) => {
      const avg = (s.scalability + s.availability + s.complexity + s.costEfficiency + s.security) / 5;
      if (avg >= 95) return 'A+';
      if (avg >= 90) return 'A';
      if (avg >= 85) return 'B+';
      if (avg >= 80) return 'B';
      if (avg >= 70) return 'C';
      if (avg >= 60) return 'D';
      return 'F';
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0e14] text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex flex-col border-r border-slate-800 bg-[#0f1117] z-20 shadow-2xl relative overflow-hidden`}>
        <div className="flex items-center gap-3 px-6 py-8">
           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 text-white">
             <Icons.Hub />
           </div>
           <div className={`${!sidebarOpen && 'opacity-0'} transition-opacity duration-200 min-w-max`}>
             <h1 className="font-bold text-slate-100 tracking-tight leading-none text-lg">{t.title}</h1>
             <span className="text-[11px] text-slate-500 font-mono">{t.subtitle}</span>
           </div>
        </div>

        <nav className="flex-1 flex flex-col w-full py-4 space-y-1">
          <SidebarBtn icon={<Icons.Design />} label={t.canvas} description={t.canvasDesc} active={activeView === 'design'} onClick={() => switchView('design')} />
          <SidebarBtn icon={<Icons.Game />} label={t.game} description={t.gameDesc} active={activeView === 'game'} onClick={() => switchView('game')} />
          <SidebarBtn icon={<Icons.Architect />} label={t.architect} description={t.architectDesc} active={activeView === 'architect'} onClick={() => switchView('architect')} />
          <SidebarBtn icon={<Icons.Photo />} label={t.studio} description={t.studioDesc} active={activeView === 'studio'} onClick={() => switchView('studio')} />
          <SidebarBtn icon={<Icons.Review />} label={t.review} description={t.reviewDesc} active={activeView === 'review'} onClick={() => switchView('review')} />
          <SidebarBtn icon={<Icons.Stack />} label={t.stack} description={t.stackDesc} active={activeView === 'stack'} onClick={() => switchView('stack')} />
        </nav>

        <div className="px-6 pb-4 space-y-3">
           <button 
             onClick={() => setLang(prev => prev === 'en' ? 'tr' : 'en')}
             className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 rounded-md px-3 py-2 w-full justify-center whitespace-nowrap"
           >
             <Icons.Language />
             <span>{lang === 'en' ? t.switchToTurkish : t.switchToEnglish}</span>
           </button>
           
           <button 
             onClick={() => setShowImportOverlay(true)}
             className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-slate-700 rounded-md hover:border-blue-500 hover:bg-slate-800/50 cursor-pointer transition-all group"
           >
                <div className="text-slate-400 group-hover:text-blue-400 transition-colors">
                    <Icons.Upload />
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-white whitespace-nowrap">{t.import}</span>
            </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col">
        
        {/* Full Screen Import Overlay */}
        {showImportOverlay && (
            <div 
                className="absolute inset-0 z-50 bg-[#0b0e14]/95 backdrop-blur-xl flex items-center justify-center animate-fade-in"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <button 
                    onClick={() => setShowImportOverlay(false)} 
                    className="absolute top-8 right-8 text-slate-400 hover:text-white transform hover:scale-110 transition-all"
                >
                    <span className="material-icons text-4xl">close</span>
                </button>

                <div className={`
                    border-4 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center transition-all duration-300
                    ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-105' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'}
                `}>
                    <div className={`mb-6 p-6 rounded-full bg-slate-800 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`}>
                        <span className="material-icons text-6xl">cloud_upload</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t.importOverlayTitle}</h2>
                    <p className="text-slate-400 text-lg mb-8">{t.importOverlayDesc}</p>
                    
                    <label className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full cursor-pointer transition-transform hover:-translate-y-1 shadow-lg shadow-blue-600/30">
                        {t.importOverlayBtn}
                        <input type="file" onChange={(e) => { if(e.target.files?.[0]) processFile(e.target.files[0]) }} className="hidden" accept="image/*,.json" />
                    </label>
                </div>
            </div>
        )}

        {/* Top Header Bar */}
        <div className="h-14 bg-[#0f1117]/80 backdrop-blur border-b border-slate-800 flex items-center px-4 justify-between z-30">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white transition-colors p-2 rounded hover:bg-slate-800">
                <Icons.Menu />
            </button>
            <div className="flex items-center gap-4">
               {/* Global Status or Tools could go here */}
            </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
            {/* VIEW: DESIGN (Blue Screen & Canvas) */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeView === 'design' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            
            {loading && !architecture && <GeneratingOverlay />}

            {!architecture && !showWizard && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0e14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0e14] to-[#0b0e14] z-20">
                    <div className="text-center space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl shadow-blue-500/20 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">{t.ready}</h2>
                        <p className="text-slate-400 max-w-md mx-auto">{t.startDesc}</p>
                    </div>
                    <button 
                        onClick={() => setShowWizard(true)}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1"
                    >
                        <Icons.Add />
                        <span>{t.startNew}</span>
                    </button>
                    </div>
                </div>
            )}

            {/* Wizard Modal */}
            {showWizard && !architecture && (
                <div className="absolute inset-0 bg-[#0b0e14]/80 backdrop-blur-sm z-30 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-3xl bg-[#1e293b] border border-slate-700 rounded-2xl p-10 shadow-2xl animate-fade-in-up relative">
                    <button onClick={() => setShowWizard(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><Icons.Close /></button>
                    <div className="mb-8 border-b border-slate-700/50 pb-6"><h2 className="text-2xl font-bold text-white mb-2">{t.formTitle}</h2><p className="text-slate-400">{t.formDesc}</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"><div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.lblProjectName}</label><input type="text" value={projectDetails.name} onChange={(e) => handleDetailsChange('name', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:border-blue-500 focus:outline-none" autoFocus /></div><div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.lblDomain}</label><select value={projectDetails.domain} onChange={(e) => handleDetailsChange('domain', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:border-blue-500 focus:outline-none">{t.domains.map(d => <option key={d} value={d}>{d}</option>)}</select></div><div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.lblScale}</label><select value={projectDetails.scale} onChange={(e) => handleDetailsChange('scale', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:border-blue-500 focus:outline-none">{t.scales.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.lblPriorities}</label><div className="flex flex-wrap gap-2">{t.priorities.map(p => (<button key={p} onClick={() => togglePriority(p)} className={`px-3 py-1 text-xs rounded-full border transition-all ${projectDetails.priorities.includes(p) ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}>{p}</button>))}</div></div></div><div className="mb-8"><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.lblDescription}</label><textarea rows={4} value={projectDetails.description} onChange={(e) => handleDetailsChange('description', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:border-blue-500 focus:outline-none" placeholder={t.generatePlaceholder} /></div><div className="flex justify-end gap-3"><button onClick={() => setShowWizard(false)} className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors">{t.cancel}</button><button onClick={handleGenerate} disabled={loading || !projectDetails.description} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20">{loading ? <span className="material-icons animate-spin">sync</span> : <Icons.Bolt />}{t.generateBtn}</button></div></div></div>
            )}
            
            {/* GRAPH VIEW */}
            {architecture && (
                <ArchitectureGraph 
                data={architecture}
                simulating={simulating || tutorialMode}
                onNodeClick={setSelectedNode}
                onConnect={handleConnectNodes}
                onDeleteNode={handleDeleteNode}
                onDeleteEdge={handleDeleteEdge} // Pass delete handler
                highlightedNodeId={tutorialMode ? currentStep?.targetNodeId : undefined}
                highlightedEdgeId={tutorialMode ? currentStep?.targetEdgeId : undefined}
                isLinkingMode={isLinkingMode}
                // Pass new props
                activeHighlightNodes={chatHighlights.nodes}
                activeHighlightLayer={chatHighlights.layer}
                />
            )}
            
            {/* TUTORIAL OVERLAY */}
            {tutorialMode && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur border border-blue-500/30 p-6 rounded-xl shadow-2xl max-w-lg w-full z-40">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{t.tutorialMode} — {t.step} {currentStepIndex + 1}/{tutorialSteps.length}</span>
                        <button onClick={exitTutorial} className="text-slate-400 hover:text-white"><Icons.Close /></button>
                    </div>
                    <p className="text-lg text-white font-medium mb-4">{currentStep?.message}</p>
                    <div className="flex justify-between">
                        <button onClick={prevStep} disabled={currentStepIndex === 0} className="px-4 py-2 text-sm text-slate-300 hover:text-white disabled:opacity-50">{t.back}</button>
                        <button onClick={nextStep} disabled={currentStepIndex === tutorialSteps.length - 1} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50">{t.nextStep}</button>
                    </div>
                </div>
            )}
            
            {/* TOOLBAR (Design Mode) */}
            {activeView === 'design' && architecture && (
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-30">
                    <div className="pointer-events-auto flex gap-2">
                        <button onClick={handleSimulateToggle} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-all ${simulating ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-green-600 text-white hover:bg-green-500'}`}>
                            {simulating ? <Icons.Stop /> : <Icons.Play />}
                            <span>{simulating ? t.stop : t.run}</span>
                        </button>
                        <button 
                            onClick={handleTutorialStart} 
                            disabled={loadingTutorial}
                            className={`flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 hover:border-blue-500 rounded-lg shadow-lg transition-all font-medium text-sm ${loadingTutorial ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {loadingTutorial ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> : <Icons.School />}
                            <span>{loadingTutorial ? t.tutorialLoading : t.tutorialMode}</span>
                        </button>
                    </div>
                    <div className="pointer-events-auto flex gap-2">
                        {/* Link Mode Toggle */}
                        <button 
                            onClick={() => setIsLinkingMode(!isLinkingMode)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold shadow-lg transition-all ${
                                isLinkingMode 
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500' 
                                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-500 hover:text-amber-400'
                            }`}
                        >
                            <Icons.Link />
                            <span>{isLinkingMode ? t.linkModeActive : t.linkMode}</span>
                        </button>

                        {/* Manual Node Add */}
                        <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 shadow-lg">
                            <select 
                                value={selectedToolType} 
                                onChange={(e) => setSelectedToolType(e.target.value as NodeType)}
                                className="bg-transparent text-slate-300 text-sm py-2 pl-3 pr-8 focus:outline-none cursor-pointer hover:text-white appearance-none"
                            >
                                {Object.values(NodeType).map(t => (
                                    <option key={t} value={t} className="bg-slate-800 text-slate-200">
                                        {t}
                                    </option>
                                ))}
                            </select>
                            <button onClick={handleManualAddNode} className="px-3 py-2 border-l border-slate-700 hover:bg-slate-700 text-blue-400 font-bold transition-colors">
                                + {t.manualAdd}
                            </button>
                        </div>
                        <button onClick={() => handleDownload(architecture)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 hover:border-blue-500 rounded-lg shadow-lg transition-all font-medium text-sm">
                            <Icons.Download />
                            <span>{t.export}</span>
                        </button>
                    </div>
                </div>
            )}

            </div>
            {/* ... other views ... */}
            {/* VIEW: STUDIO (NEW) */}
            {activeView === 'studio' && (
            <div className="absolute inset-0 z-10 bg-slate-900 overflow-y-auto p-8">
                {/* ... existing studio content ... */}
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                            <Icons.Photo />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white">{t.studio}</h2>
                            <p className="text-slate-400">{t.studioDesc}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-slate-800 pb-1">
                        <button 
                            onClick={() => setStudioTab('ANALYZE')}
                            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${studioTab === 'ANALYZE' ? 'text-teal-400 border-teal-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                        >
                            {t.studioTabAnalyze}
                        </button>
                        <button 
                            onClick={() => setStudioTab('GENERATE')}
                            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${studioTab === 'GENERATE' ? 'text-teal-400 border-teal-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                        >
                            {t.studioTabGenerate}
                        </button>
                    </div>

                    {/* ANALYZE TAB */}
                    {studioTab === 'ANALYZE' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                            <div className="space-y-6">
                                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-2">{t.studioAnalyzeTitle}</h3>
                                    <p className="text-sm text-slate-400 mb-6">{t.studioAnalyzeDesc}</p>
                                    
                                    <div 
                                        className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-slate-900 transition-all min-h-[200px]"
                                        onClick={() => studioFileInputRef.current?.click()}
                                    >
                                        {studioImage ? (
                                            <img src={studioImage.data ? `data:${studioImage.mimeType};base64,${studioImage.data}` : ''} alt="Uploaded" className="max-h-64 object-contain rounded-lg shadow-lg" />
                                        ) : (
                                            <>
                                                <div className="bg-slate-700 p-4 rounded-full mb-3 text-slate-400">
                                                    <Icons.Upload />
                                                </div>
                                                <p className="text-slate-400 font-medium">{t.dropImage}</p>
                                            </>
                                        )}
                                        <input type="file" ref={studioFileInputRef} className="hidden" accept="image/*" onChange={handleStudioImageUpload} />
                                    </div>
                                </div>

                                {studioImage && (
                                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                        <label className="block text-sm font-semibold text-slate-400 mb-2">Analysis Prompt (Optional)</label>
                                        <textarea 
                                            value={studioPrompt}
                                            onChange={(e) => setStudioPrompt(e.target.value)}
                                            placeholder={lang === 'tr' ? 'Bu resimde ne görüyorsun?' : 'Describe the architecture in this image...'}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-teal-500 outline-none h-24 mb-4"
                                        />
                                        <button 
                                            onClick={handleAnalyzeImage}
                                            disabled={loading}
                                            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <span className="material-icons animate-spin">sync</span> : <Icons.Magic />}
                                            {t.analyzeBtn}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-full min-h-[400px]">
                                <h3 className="text-lg font-bold text-white mb-4">{t.analysisResult}</h3>
                                {studioResultText ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <Markdown content={studioResultText} />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-64 text-slate-600 italic">
                                        Waiting for analysis...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* GENERATE TAB */}
                    {studioTab === 'GENERATE' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                            <div className="space-y-6">
                                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-2">{t.studioGenTitle}</h3>
                                    <p className="text-sm text-slate-400 mb-6">{t.studioGenDesc}</p>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">Prompt</label>
                                            <textarea 
                                                value={genImagePrompt}
                                                onChange={(e) => setGenImagePrompt(e.target.value)}
                                                placeholder={t.imagePromptPlaceholder}
                                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-teal-500 outline-none h-32"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">{t.imageSize}</label>
                                            <div className="flex gap-2">
                                                {['1K', '2K', '4K'].map(s => (
                                                    <button 
                                                        key={s}
                                                        onClick={() => setGenImageSize(s as any)}
                                                        className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${genImageSize === s ? 'bg-teal-600 border-teal-500 text-white' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={handleGenerateImage}
                                            disabled={loading || !genImagePrompt}
                                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                                        >
                                            {loading ? <span className="material-icons animate-spin">sync</span> : <Icons.Photo />}
                                            {t.generateImageBtn}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col min-h-[400px]">
                                <h3 className="text-lg font-bold text-white mb-4">{t.generatedImage}</h3>
                                <div className="flex-1 flex items-center justify-center w-full bg-slate-900/50 rounded-xl border border-slate-700/50 relative group">
                                    {generatedImageUrl ? (
                                        <>
                                            <img src={generatedImageUrl} alt="Generated" className="max-w-full max-h-[400px] object-contain rounded-lg shadow-2xl" />
                                            <a 
                                                href={generatedImageUrl} 
                                                download={`archgen-vision-${Date.now()}.png`}
                                                className="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white p-2 rounded-lg backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Icons.Download />
                                            </a>
                                        </>
                                    ) : (
                                        <div className="text-center text-slate-600">
                                            <div className="mb-4 inline-flex p-4 rounded-full bg-slate-800">
                                                <Icons.Photo />
                                            </div>
                                            <p>Enter a prompt to visualize your concept.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            )}
            
            {/* VIEW: GAME */}
            {activeView === 'game' && (
             <div className="absolute inset-0 z-10 bg-slate-900 flex">
                {/* ... existing game content ... */}
                {/* LOBBY SCREEN */}
                {gameMode === 'LOBBY' && (
                     <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e14] z-20 p-8">
                        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">{t.gameLobbyTitle}</h1>
                                <p className="text-xl text-slate-400 mb-8">{t.gameLobbySub}</p>
                                
                                <div className="space-y-6">
                                    <div 
                                        onClick={() => setGameSelection(prev => ({ ...prev, mode: 'Tutorial' }))}
                                        className={`p-6 rounded-2xl border cursor-pointer transition-all ${gameSelection.mode === 'Tutorial' ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <Icons.School />
                                            <h3 className="text-lg font-bold text-white">{t.modeTutorial}</h3>
                                        </div>
                                        <p className="text-slate-400 text-sm">{t.modeTutorialDesc}</p>
                                    </div>

                                    <div 
                                        onClick={() => setGameSelection(prev => ({ ...prev, mode: 'Challenge' }))}
                                        className={`p-6 rounded-2xl border cursor-pointer transition-all ${gameSelection.mode === 'Challenge' ? 'bg-orange-600/10 border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-2 text-orange-400">
                                            <Icons.Game />
                                            <h3 className="text-lg font-bold text-white">{t.modeChallenge}</h3>
                                        </div>
                                        <p className="text-slate-400 text-sm">{t.modeChallengeDesc}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">{t.game} Settings</h3>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-400 mb-2">{t.selectDomain}</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['E-commerce', 'IoT Platform', 'Fintech', 'Social Media'].map(d => (
                                                <button 
                                                    key={d}
                                                    onClick={() => setGameSelection(prev => ({ ...prev, domain: d }))}
                                                    className={`p-3 text-xs font-medium rounded-lg border transition-all ${gameSelection.domain === d ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Level Selector - Now available for BOTH modes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-400 mb-2">
                                            {gameSelection.mode === 'Tutorial' ? 'Lesson Level' : 'Difficulty Level'}
                                        </label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(l => (
                                                <button 
                                                    key={l}
                                                    onClick={() => setGameSelection(prev => ({ ...prev, level: l }))}
                                                    className={`flex-1 p-3 text-xs font-medium rounded-lg border transition-all relative ${
                                                        gameSelection.level === l 
                                                            ? (gameSelection.mode === 'Tutorial' ? 'bg-blue-600 text-white border-blue-500' : 'bg-orange-600 text-white border-orange-500')
                                                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                                                    }`}
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleStartGame} 
                                        disabled={loading}
                                        className={`w-full py-4 mt-4 text-white rounded-xl font-bold shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${gameSelection.mode === 'Tutorial' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'}`}
                                    >
                                        {loading ? <span className="material-icons animate-spin">sync</span> : <Icons.Play />}
                                        {t.startGame}
                                    </button>
                                </div>
                            </div>
                        </div>
                     </div>
                )}

                {/* GAME PLAY SCREEN */}
                {gameMode === 'PLAY' && (
                    <>
                        <div className="flex-1 relative">
                            {architecture ? (
                                <ArchitectureGraph 
                                data={architecture} 
                                simulating={false}
                                className="w-full h-full"
                                // Pass Game Feedback
                                successNodeIds={gameValidation?.correctNodeIds}
                                errorNodeIds={gameValidation?.wrongNodeIds}
                                onDeleteNode={handleDeleteNode}
                                onDeleteEdge={handleDeleteEdge} // Add ability to delete edges in game
                                onConnect={handleConnectNodes}
                                onNodeClick={setSelectedNode}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4">
                                    <Icons.Game />
                                    <p>{t.gameLoading}</p>
                                </div>
                            )}
                            {gameScenario && !gameValidation && (
                                <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur p-4 rounded-lg border border-yellow-500/30 max-w-md shadow-2xl">
                                    <h3 className="text-yellow-400 font-bold mb-1 flex items-center gap-2"><Icons.Game /> {gameScenario.title}</h3>
                                    <div className="flex gap-2 mb-2">
                                        <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700">{t.level} {gameScenario.difficulty}</span>
                                        <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700">{gameScenario.domain}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 mb-2">{gameScenario.description}</p>
                                    <div className="text-xs text-slate-500 bg-slate-900 p-2 rounded border border-slate-700">
                                    <strong>{t.mission}:</strong> {t.hint}
                                    </div>
                                </div>
                            )}
                            
                            {/* Action Bar */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-800/90 p-2 rounded-xl border border-slate-700 shadow-2xl">
                                {!gameValidation ? (
                                    <>
                                        <select 
                                            value={selectedToolType} 
                                            onChange={(e) => setSelectedToolType(e.target.value as NodeType)}
                                            className="bg-slate-900 text-white text-sm p-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
                                        >
                                            {Object.values(NodeType).map(t => (
                                                <option key={t} value={t} className="bg-slate-800 text-slate-200">{t}</option>
                                            ))}
                                        </select>
                                        <button onClick={handleGameAddNode} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold">{t.addToGraph}</button>
                                        <div className="w-[1px] bg-slate-600 mx-2"></div>
                                        <button onClick={handleGameSubmit} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                                            {loading ? <span className="material-icons animate-spin text-sm">sync</span> : <Icons.Play />}
                                            {t.deploy}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {gameValidation.correctedArchitecture && (
                                            <button onClick={handleShowSolution} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                                                <Icons.Eye />
                                                {t.showSolution}
                                            </button>
                                        )}
                                        {gameValidation.success && gameSelection.mode === 'Challenge' && gameSelection.level < 5 && (
                                            <button onClick={handleNextLevel} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                                                {t.nextStep} <span className="material-icons text-sm">arrow_forward</span>
                                            </button>
                                        )}
                                        <button onClick={() => setGameValidation(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold">
                                            Retry
                                        </button>
                                    </>
                                )}
                            </div>

                            <button onClick={() => setGameMode('LOBBY')} className="absolute top-4 right-4 bg-slate-800 p-2 rounded text-slate-400 hover:text-white border border-slate-700 z-50">Exit</button>
                        </div>
                        <div className="w-96 border-l border-slate-800 flex flex-col">
                             <ChatInterface 
                                messages={gameChatMessages}
                                onSendMessage={handleGameChatMessage} 
                                isLoading={loading}
                                lang={lang}
                             />
                        </div>
                    </>
                )}
            </div>
            )}
            {/* ... other views ... */}
            {activeView === 'architect' && (
            <div className="absolute inset-0 z-10 bg-slate-900 flex">
                <div className="w-[50%] h-full border-r border-slate-800 bg-[#0f1117] flex flex-col relative">
                    {/* Model Switcher Header */}
                    <div className="absolute top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Model</span>
                        <select 
                            value={selectedModel} 
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="bg-slate-800 text-white text-xs py-1 px-2 rounded border border-slate-700 focus:border-blue-500 outline-none cursor-pointer"
                        >
                            <option value="gemini-2.5-flash" className="bg-slate-800 text-slate-200">Gemini 2.5 Flash (Fast)</option>
                            <option value="gemini-3-pro-preview" className="bg-slate-800 text-slate-200">Gemini 3.0 Pro (Smart)</option>
                        </select>
                    </div>
                    <div className="pt-14 h-full">
                        <ChatInterface 
                            messages={messages} 
                            onSendMessage={handleSendMessage} 
                            isLoading={chatLoading} 
                            lang={lang} 
                        />
                    </div>
                </div>
                <div className="flex-1 relative bg-slate-950 flex flex-col">
                    <div className="flex-1 overflow-hidden relative">
                        {architecture ? (
                            <ArchitectureGraph 
                                data={architecture} 
                                simulating={false} 
                                className="w-full h-full" 
                                // Pass highlights here too
                                activeHighlightNodes={chatHighlights.nodes}
                                activeHighlightLayer={chatHighlights.layer}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-600">
                            <p>{t.noArch}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
            {/* ... other views ... */}
            {activeView === 'review' && (
            <div className="absolute inset-0 z-10 bg-slate-900 overflow-hidden flex flex-col">
                {/* ... existing review content ... */}
                 <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-[1600px] mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <Icons.Review />
                            </div>
                            <div>
                            <h2 className="text-3xl font-bold text-white">{t.critiqueTitle}</h2>
                            <p className="text-slate-400">{t.critiqueSub}</p>
                            </div>
                        </div>

                        {loading && !improvedArch && <div className="p-12 text-center text-slate-400 animate-pulse">{t.analyzing}</div>}

                        {!loading && !score && !critique && (
                            <div className="p-12 text-center border border-dashed border-slate-700 rounded-2xl text-slate-500">
                            {t.noCritique}
                            </div>
                        )}

                        {score && (
                            <>
                                {/* Top Row: Scorecard & Text Analysis */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Scorecard */}
                                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl h-fit">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                                            {t.benchmark}
                                            <span className={`px-3 py-1 rounded-full text-sm ${calculateGrade(score) === 'A' || calculateGrade(score) === 'A+' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {t.grade}: {calculateGrade(score)}
                                            </span>
                                        </h3>
                                        <div className="space-y-4">
                                            {Object.entries(score).filter(([k]) => k !== 'summary').map(([key, val]) => (
                                                <div key={key}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <span className="text-white font-mono">{val}/100</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${val}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Critique Text (UPDATED WITH EXPAND & MARKDOWN) */}
                                    <div className={`
                                        bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex flex-col transition-all duration-300
                                        ${isReportExpanded 
                                            ? 'fixed inset-4 z-50 p-8' 
                                            : 'p-6 max-h-[500px]'
                                        }
                                    `}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                {t.analysisReport}
                                                {isReportExpanded && <span className="text-xs font-normal text-slate-400 px-2 py-1 bg-slate-700 rounded-lg">Full Screen</span>}
                                            </h3>
                                            <button 
                                                onClick={() => setIsReportExpanded(!isReportExpanded)}
                                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            >
                                                {isReportExpanded ? <Icons.Contract /> : <Icons.Expand />}
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                                            <Markdown content={critique} />
                                        </div>
                                        
                                        {!isReportExpanded && (
                                            <button 
                                                onClick={handleImproveArchitecture}
                                                disabled={loading}
                                                className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                {loading ? <span className="material-icons animate-spin">sync</span> : <Icons.Magic />}
                                                {loading ? t.improving : t.improveBtn}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Comparison View */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                                    {/* Left: Original */}
                                    <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col shadow-inner">
                                        <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-slate-400 border border-slate-700">
                                            {t.originalArch}
                                        </div>
                                        <div className="flex-1">
                                            <ArchitectureGraph data={architecture} simulating={false} />
                                        </div>
                                    </div>

                                    {/* Right: Improved (Placeholder or Real) */}
                                    <div className={`rounded-2xl border relative overflow-hidden flex flex-col shadow-inner transition-all duration-500 ${improvedArch ? 'bg-slate-900 border-green-900/30' : 'bg-slate-900/50 border-slate-800 flex items-center justify-center'}`}>
                                        <div className="absolute top-4 left-4 z-10 bg-green-900/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-green-400 border border-green-800/50 flex items-center gap-2">
                                            {t.improvedArch}
                                        </div>
                                        
                                        {/* Download Improved Arch Button */}
                                        {improvedArch && (
                                            <button 
                                                onClick={() => handleDownload(improvedArch)}
                                                className="absolute top-4 right-4 z-20 p-2 bg-slate-800 hover:bg-green-600 text-slate-300 hover:text-white rounded-lg border border-slate-600 hover:border-green-500 transition-all shadow-lg"
                                                title="Download Optimized Architecture"
                                            >
                                                <Icons.Download />
                                            </button>
                                        )}
                                        
                                        {improvedArch ? (
                                            <div className="flex-1 animate-fade-in">
                                                <ArchitectureGraph 
                                                    data={improvedArch} 
                                                    simulating={false} 
                                                    successNodeIds={improvedArch.nodes.map(n => n.id).filter(id => !architecture?.nodes.find(old => old.id === id))} // Highlight new nodes
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center p-8 opacity-50">
                                                <div className="mb-4 inline-flex p-4 rounded-full bg-slate-800 text-slate-600">
                                                    <Icons.Magic />
                                                </div>
                                                <p className="text-slate-500 text-sm">Click "Generate Improvements" to see the optimized system.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            )}
            {/* ... stack view ... */}
             {activeView === 'stack' && (
            <div className="absolute inset-0 z-10 bg-slate-900 overflow-y-auto p-8">
                {/* ... existing stack content ... */}
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
                        <Icons.Stack />
                        </div>
                        <div>
                        <h2 className="text-3xl font-bold text-white">{t.stackTitle}</h2>
                        <p className="text-slate-400">{t.stackSub}</p>
                        </div>
                    </div>

                    {loading && <div className="p-12 text-center text-slate-400 animate-pulse">{t.searching}</div>}
                    {!loading && !techRecs && (
                        <div className="p-12 text-center border border-dashed border-slate-700 rounded-2xl text-slate-500">
                        {t.noStack}
                        </div>
                    )}

                    {techRecs && (
                        <div className="space-y-6">
                            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
                                <div className="prose prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                                    <Markdown content={techRecs.markdown} />
                                </div>
                                </div>
                            </div>
                            {techRecs.sources && techRecs.sources.length > 0 && (
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t.sources}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {techRecs.sources.map((src: any, i: number) => (
                                        <a key={i} href={src.web?.uri || src.uri} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors group">
                                        <div className="mt-1 text-blue-500"><Icons.Hub /></div>
                                        <div>
                                            <div className="text-sm font-medium text-blue-400 group-hover:underline truncate w-64">{src.web?.title || src.title}</div>
                                            <div className="text-xs text-slate-500 truncate w-64">{src.web?.uri || src.uri}</div>
                                        </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
      </div>
      
      {/* Global Node Editor */}
      {selectedNode && (
        <div className="absolute right-6 bottom-6 w-80 bg-[#1e293b]/95 backdrop-blur border border-slate-700 rounded-xl p-5 shadow-2xl z-50 animate-fade-in-up flex flex-col gap-4">
           <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
              <span className="text-xs font-bold text-slate-500 uppercase">{t.compDetails}</span>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white bg-slate-800 rounded-full p-1 transition-colors"><Icons.Close /></button>
           </div>
           <div className="space-y-3">
              <div><label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">{t.name}</label><input type="text" value={selectedNode.label} onChange={(e) => updateNode(selectedNode.id, 'label', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" /></div>
              <div><label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">{t.type}</label><select value={selectedNode.type} onChange={(e) => updateNode(selectedNode.id, 'type', e.target.value as NodeType)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none">{Object.values(NodeType).map(type => <option key={type} value={type} className="bg-slate-800 text-slate-200">{type}</option>)}</select></div>
              <div><label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">{t.desc}</label><textarea rows={4} value={selectedNode.description} onChange={(e) => updateNode(selectedNode.id, 'description', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors resize-none" /></div>
              
              {/* Tech Suggestions Editor */}
              <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">{t.techSuggest}</label>
                  <div className="flex flex-wrap gap-2 mt-1 mb-2">
                      {(selectedNode.technologies || []).map(t => (
                          <span key={t} className="px-2 py-1 bg-slate-800 text-xs text-blue-300 border border-slate-600 rounded flex items-center gap-1 group">
                              {t}
                              <button 
                                  onClick={() => handleRemoveTech(t)}
                                  className="text-slate-500 hover:text-red-400 transition-colors"
                              >
                                  ×
                              </button>
                          </span>
                      ))}
                  </div>
                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          value={newTechInput}
                          onChange={(e) => setNewTechInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTech()}
                          placeholder="Add tech..." 
                          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                      />
                      <button 
                          onClick={handleAddTech}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
                      >
                          +
                      </button>
                  </div>
              </div>
           </div>
           <div className="pt-2 border-t border-slate-700/50">
               <button onClick={() => handleDeleteNode(selectedNode.id)} className="w-full bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 py-2 rounded text-xs font-bold uppercase transition-colors border border-red-900/50">Delete Node</button>
           </div>
        </div>
      )}

    </div>
  );
}

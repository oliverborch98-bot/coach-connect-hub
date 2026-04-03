import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'da' | 'en';

interface Translations {
  [key: string]: {
    da: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navigation
  dashboard: { da: 'Oversigt', en: 'Dashboard' },
  messages: { da: 'Beskeder', en: 'Messages' },
  calls: { da: 'Opkald', en: 'Calls' },
  new_client: { da: 'Ny klient', en: 'New Client' },
  requests: { da: 'Anmodninger', en: 'Requests' },
  program: { da: 'Program', en: 'Program' },
  nutrition: { da: 'Kostplan', en: 'Nutrition' },
  exercises: { da: 'Bibliotek', en: 'Library' },
  recipes: { da: 'Opskrifter', en: 'Recipes' },
  ai_program: { da: 'AI Program', en: 'AI Program' },
  ai_nutrition: { da: 'AI Kost', en: 'AI Nutrition' },
  payments: { da: 'Betaling', en: 'Payments' },
  analytics: { da: 'Analytics', en: 'Analytics' },
  settings: { da: 'Indstillinger', en: 'Settings' },
  logout: { da: 'Log ud', en: 'Log out' },
  end_session: { da: 'Afbryd session', en: 'End session' },
  inbox: { da: 'Inbox', en: 'Inbox' },
  new_messages: { da: 'NYE BESKEDER', en: 'NEW MESSAGES' },
  coach_portal: { da: 'Coach Portal', en: 'Coach Portal' },
  coach_menu: { da: 'Coach Menu', en: 'Coach Menu' },
  more: { da: 'Mere', en: 'More' },
  clients: { da: 'Klienter', en: 'Clients' },

  // Client Navigation
  home: { da: 'Hjem', en: 'Home' },
  training: { da: 'Træning', en: 'Training' },
  food: { da: 'Kost', en: 'Food' },
  phases: { da: 'Faser', en: 'Phases' },
  goals: { da: 'Mål', en: 'Goals' },
  checkin: { da: 'Check-in', en: 'Check-in' },
  habits: { da: 'Vaner', en: 'Habits' },
  habit_name: { da: 'Vanens navn', en: 'Habit Name' },
  habit_description: { da: 'Beskrivelse', en: 'Description' },
  habit_frequency: { da: 'Frekvens', en: 'Frequency' },
  habit_icon: { da: 'Ikon', en: 'Icon' },
  create_habit: { da: 'Opret vane', en: 'Create Habit' },
  assign_to_clients: { da: 'Tildel til klienter', en: 'Assign to Clients' },
  compliance: { da: 'Compliance', en: 'Compliance' },
  daily: { da: 'Daglig', en: 'Daily' },
  weekly: { da: 'Ugentlig', en: 'Weekly' },
  photos: { da: 'Billeder', en: 'Photos' },
  measurements: { da: 'Målinger', en: 'Measurements' },
  resources: { da: 'Ressourcer', en: 'Resources' },
  transformation: { da: 'Transformation', en: 'Transformation' },
  ai_chat: { da: 'AI Chat', en: 'AI Chat' },
  ai_assistant: { da: 'AI Assistent', en: 'AI Assistant' },
  leaderboard: { da: 'Rangliste', en: 'Leaderboard' },
  guide: { da: 'Guide', en: 'Guide' },
  profile: { da: 'Profil', en: 'Profile' },
  client_menu: { da: 'Client Menu', en: 'Client Menu' },
  progress: { da: 'Fremskridt', en: 'Progress' },
  chat: { da: 'Chat', en: 'Chat' },
  
  // Onboarding
  onboarding_title: { da: 'Velkommen! Lad os lære dig at kende.', en: 'Welcome! Let\'s get to know you.' },
  onboarding_back: { da: 'Tilbage', en: 'Back' },
  onboarding_next: { da: 'Næste', en: 'Next' },
  onboarding_save: { da: 'Gemmer...', en: 'Saving...' },
  onboarding_done: { da: 'Færdig', en: 'Done' },
  onboarding_abort: { da: 'Afbryd og log ud', en: 'Abort and log out' },

  step_lang_title: { da: 'Sprog', en: 'Language' },
  step_lang_desc: { da: 'Vælg dit sprog / Choose your language', en: 'Vælg dit sprog / Choose your language' },
  step_profile_title: { da: 'Profil', en: 'Profile' },
  step_profile_desc: { da: 'Bekræft dine oplysninger', en: 'Confirm your details' },
  step_goals_title: { da: 'Mål', en: 'Goals' },
  step_goals_desc: { da: 'Hvad vil du opnå?', en: 'What do you want to achieve?' },
  step_exp_title: { da: 'Erfaring', en: 'Experience' },
  step_exp_desc: { da: 'Din træningsbaggrund', en: 'Your training background' },
  step_diet_title: { da: 'Kost', en: 'Diet' },
  step_diet_desc: { da: 'Kostvaner og restriktioner', en: 'Dietary habits and restrictions' },
  step_life_title: { da: 'Livsstil', en: 'Lifestyle' },
  step_life_desc: { da: 'Arbejde, søvn & stress', en: 'Work, sleep & stress' },
  step_health_title: { da: 'Helbred', en: 'Health' },
  step_health_desc: { da: 'Skader og andet', en: 'Injuries and other' },

  // Profile Fields
  full_name_label: { da: 'Fulde navn *', en: 'Full name *' },
  full_name_placeholder: { da: 'Dit navn', en: 'Your name' },
  age_label: { da: 'Alder', en: 'Age' },
  age_placeholder: { da: 'F.eks. 28', en: 'E.g. 28' },
  phone_label: { da: 'Telefon', en: 'Phone' },
  phone_placeholder: { da: '+45 12 34 56 78', en: '+45 12 34 56 78' },
  
  // Goals
  fat_loss: { da: 'Fedttab', en: 'Fat loss' },
  muscle_gain: { da: 'Muskelvækst', en: 'Muscle gain' },
  recomp: { da: 'Recomp', en: 'Recomp' },
  general_health: { da: 'Generel sundhed', en: 'General health' },
  performance: { da: 'Præstation', en: 'Performance' },

  // Experience
  exp_level_label: { da: 'Erfaringsniveau *', en: 'Experience level *' },
  beginner: { da: 'Begynder', en: 'Beginner' },
  beginner_desc: { da: '0-6 måneder', en: '0-6 months' },
  intermediate: { da: 'Øvet', en: 'Intermediate' },
  intermediate_desc: { da: '6-24 måneder', en: '6-24 months' },
  advanced: { da: 'Avanceret', en: 'Advanced' },
  advanced_desc: { da: '2+ år', en: '2+ years' },
  equipment_label: { da: 'Udstyr (vælg alle der passer)', en: 'Equipment (select all that apply)' },
  gym: { da: '🏋️ Fitness center', en: '🏋️ Gym' },
  equipment_home: { da: '🏠 Hjemmetræning', en: '🏠 Home workout' },
  bands: { da: '🔗 Elastikker', en: '🔗 Resistance bands' },
  kettlebell: { da: '🫎 Kettlebells', en: '🫎 Kettlebells' },
  bodyweight: { da: '🤸 Kropsvægt', en: '🤸 Bodyweight' },

  // Diet
  diet_label: { da: 'Har du nogen kostrestriktioner eller allergier?', en: 'Do you have any dietary restrictions or allergies?' },
  diet_placeholder: { da: 'F.eks. laktoseintolerant, vegetar, glutenfri...', en: 'E.g. lactose intolerant, vegetarian, gluten-free...' },

  // Lifestyle
  work_label: { da: 'Arbejdssituation', en: 'Work situation' },
  work_placeholder: { da: 'F.eks. kontorarbejde, fysisk arbejde...', en: 'E.g. office work, physical labor...' },
  sleep_label: { da: 'Gennemsnitlig søvn (timer)', en: 'Average sleep (hours)' },
  sleep_placeholder: { da: 'F.eks. 7.5', en: 'E.g. 7.5' },
  stress_label: { da: 'Stressniveau', en: 'Stress level' },
  low: { da: 'Lavt', en: 'Low' },
  high: { da: 'Højt', en: 'High' },

  // Health
  injury_label: { da: 'Har du nogen skader eller fysiske begrænsninger?', en: 'Do you have any injuries or physical limitations?' },
  injury_placeholder: { da: 'F.eks. gammel knæskade, dårlig skulder...', en: 'E.g. old knee injury, bad shoulder...' },
  notes_label: { da: 'Andet du vil fortælle din coach?', en: 'Anything else you want to tell your coach?' },
  notes_placeholder: { da: 'Fri tekst – alt der kan hjælpe din coach...', en: 'Free text – anything that helps your coach...' },
  // Landing Page
  nav_features: { da: 'Features', en: 'Features' },
  nav_how_it_works: { da: 'Sådan virker det', en: 'How it Works' },
  nav_faq: { da: 'FAQ', en: 'FAQ' },
  nav_login: { da: 'Log ind', en: 'Log in' },
  
  hero_badge: { da: '🚀 AI-drevet coaching platform', en: '🚀 AI-Powered Coaching Platform' },
  hero_title: { da: 'Den coaching platform dine klienter elsker. Du bygger resultaterne.', en: 'The coaching platform your clients love. You build the results.' },
  hero_subtitle: { da: 'Komplet platform til online fitness coaches — AI-programmer, macro tracking, automatisk onboarding og meget mere. Alt samlet ét sted.', en: 'Complete platform for online fitness coaches — AI programs, macro tracking, automated onboarding and more. All in one place.' },
  hero_cta_start: { da: 'Kom i gang →', en: 'Get Started →' },
  hero_cta_demo: { da: 'Se hvordan det virker', en: 'See how it works' },

  stats_exercises: { da: 'øvelser i biblioteket', en: 'exercises in library' },
  stats_ai: { da: 'AI-drevet programmering', en: 'AI-powered programming' },
  stats_danish: { da: '100% dansk platform', en: '100% Danish platform' },
  stats_clients: { da: '∞ klienter du kan have', en: '∞ clients possible' },

  feature_ai_title: { da: '🤖 AI Program Builder', en: '🤖 AI Program Builder' },
  feature_ai_desc: { da: 'Generer komplette træningsprogrammer på sekunder. Skriv klientens mål — AI bygger resten.', en: 'Generate complete training programs in seconds. Write the client goal — AI builds the rest.' },
  feature_macro_title: { da: '🍽️ Macro Tracking', en: '🍽️ Macro Tracking' },
  feature_macro_desc: { da: 'Klienter logger mad, ser makrooversigt i realtid og modtager smart daglig guidance.', en: 'Clients log food, see real-time macro overview and receive smart daily guidance.' },
  feature_group_title: { da: '👥 Group Programs', en: '👥 Group Programs' },
  feature_group_desc: { da: 'Byg ét program og tildel det til alle klienter på én gang. Skaler din coaching.', en: 'Build one program and assign it to all clients at once. Scale your coaching.' },
  feature_calls_title: { da: '📅 Coaching Calls', en: '📅 Coaching Calls' },
  feature_calls_desc: { da: 'Book videoopkald med klienter direkte via Calendly integrationen. Ingen dobbeltbooking.', en: 'Book video calls with clients directly via Calendly integration. No double booking.' },
  feature_habits_title: { da: '🏆 Habit Coaching', en: '🏆 Habit Coaching' },
  feature_habits_desc: { da: 'Tildel daglige vaner med streaks, gamification og automatiske påmindelser.', en: 'Assign daily habits with streaks, gamification and automatic reminders.' },
  feature_analytics_title: { da: '📊 Analytics', en: '📊 Analytics' },
  feature_analytics_desc: { da: 'Se omsætning, retention rate, check-in completion og klientaktivitet i ét dashboard.', en: 'See revenue, retention rate, check-in completion and client activity in one dashboard.' },

  how_step_1_title: { da: 'Opret din klient', en: 'Create your client' },
  how_step_1_desc: { da: 'Send invitation. Klienten udfylder 6-trins onboarding automatisk.', en: 'Send invitation. Client completes 6-step onboarding automatically.' },
  how_step_2_title: { da: 'Byg programmet med AI', en: 'Build program with AI' },
  how_step_2_desc: { da: 'Skriv klientens mål. AI genererer træning og kost på sekunder.', en: 'Write client goals. AI generates training and diet in seconds.' },
  how_step_3_title: { da: 'Følg resultaterne', en: 'Follow the results' },
  how_step_3_desc: { da: 'Se progress, check-ins og analytik. Juster programmet løbende.', en: 'Follow progress, check-ins and analytics. Adjust program continuously.' },

  deep_ai_title: { da: 'AI der arbejder for dig', en: 'AI that works for you' },
  deep_ai_desc: { da: 'Paste en hel trænings- og kostplan ind — AI parser den, forstår den og tildeler den korrekt til klienten. Klienter kan også bytte et måltid ud med en ny AI-genereret opskrift med præcis samme makroer.', en: 'Paste an entire training and diet plan — AI parses it, understands it and assigns it correctly. Clients can also swap a meal for a new AI-generated recipe with exact same macros.' },
  deep_onboard_title: { da: 'Automatisk onboarding der sælger sig selv', en: 'Automated onboarding that sells itself' },
  deep_onboard_desc: { da: 'Ny klient betaler → automatisk velkomstmail → 6-trins onboarding wizard → program tildelt. Du behøver ikke løfte en finger.', en: 'New client pays → automatic welcome email → 6-step onboarding wizard → program assigned. No heavy lifting.' },

  testimonial_1: { da: 'Jeg har aldrig haft det så nemt med at følge min kost. Macro trackeren er genial.', en: 'Never been easier to follow my diet. The macro tracker is brilliant.' },
  testimonial_2: { da: 'Oliver sender mig mit program og det bare virker. Ingen forvirring, ingen fejl.', en: 'Oliver sends my program and it just works. No confusion, no errors.' },
  testimonial_3: { da: 'AI opskriftsgeneratoren er vildt fed — jeg bytter retter dagligt med de samme makroer.', en: 'AI recipe generator is awesome — I swap dishes daily with the same macros.' },

  faq_q1: { da: 'Hvordan kommer mine klienter i gang?', en: 'How do my clients get started?' },
  faq_a1: { da: 'Du opretter dem i platformen og sender en invitation. De modtager en email med login og gennemgår automatisk onboarding.', en: 'You create them in the platform and send an invitation. They receive an email with login and complete automated onboarding.' },
  faq_q2: { da: 'Virker platformen på mobil?', en: 'Does the platform work on mobile?' },
  faq_a2: { da: 'Ja, platformen er fuldt responsiv og optimeret til mobil for klienter.', en: 'Yes, the platform is fully responsive and optimized for mobile clients.' },
  faq_q3: { da: 'Hvad sker der når en klient betaler?', en: 'What happens when a client pays?' },
  faq_a3: { da: 'Betalingen går via Stripe. Klienten får automatisk adgang og en velkomstmail.', en: 'Payment goes through Stripe. Client gets immediate access and a welcome email.' },
  faq_q4: { da: 'Kan jeg have flere klienter?', en: 'Can I have multiple clients?' },
  faq_a4: { da: 'Ja, ingen grænse på antal klienter.', en: 'Yes, no limit on the number of clients.' },
  faq_q5: { da: 'Er data sikkert opbevaret?', en: 'Is data stored securely?' },
  faq_a5: { da: 'Ja, alt data er gemt sikkert med Supabase med row-level security.', en: 'Yes, all data is stored securely with Supabase using row-level security.' },

  cta_title: { da: 'Klar til at tage din coaching til næste niveau?', en: 'Ready to take your coaching to the next level?' },
  cta_subtitle: { da: 'Tilmeld dig i dag og giv dine klienter den bedste oplevelse på markedet.', en: 'Sign up today and give your clients the best experience on the market.' },
  cta_button: { da: 'Kom i gang nu →', en: 'Get started now →' },

  footer_platform: { da: 'Platform', en: 'Platform' },
  footer_account: { da: 'Konto', en: 'Account' },
  footer_contact: { da: 'Kontakt', en: 'Contact' },
  footer_rights: { da: '© 2026 Built By Borch. Alle rettigheder forbeholdes.', en: '© 2026 Built By Borch. All rights reserved.' },
  
  back_to_landing: { da: '← Tilbage til forsiden', en: '← Back to frontpage' },
  go_to_home: { da: 'Gå til forsiden', en: 'Go to frontpage' },
  page_not_found: { da: 'Siden blev ikke fundet', en: 'Page not found' },
  page_not_found_desc: { da: 'Beklager, we kunne ikke finde den side du ledte efter.', en: 'Sorry, we couldn\'t find the page you were looking for.' },

  // Login Page - Premium Experience
  login_premium_badge: { da: 'Premium Oplevelse', en: 'Premium Experience' },
  login_performance_title: { da: 'Performance Data', en: 'Performance Analytics' },
  login_email_label: { da: 'Din Email', en: 'Your Email' },
  login_password_label: { da: 'Din Nøgle', en: 'Your Key' },
  login_button_text: { da: 'Log Ind', en: 'Enter Sanctuary' },
  login_forgot_password: { da: 'Glemt din nøgle?', en: 'Forgot your key?' },
  login_request_access: { da: 'Anmod om adgang', en: 'Request access' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'da' || saved === 'en') ? saved : 'da';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

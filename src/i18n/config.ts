
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.input': 'Data Entry',
      'nav.optimization': 'Optimization',
      'nav.forecasting': 'Forecasting',
      'nav.analytics': 'Analytics',
      'nav.signOut': 'Sign Out',
      
      // Auth
      'auth.signIn': 'Sign In',
      'auth.signUp': 'Sign Up',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.fullName': 'Full Name',
      'auth.welcome': 'Welcome to Cold Chain Optimizer',
      'auth.subtitle': 'Smart Fish Route & Storage Planner',
      
      // Dashboard
      'dashboard.title': 'Cold Chain Dashboard',
      'dashboard.totalCatch': 'Total Catch Today',
      'dashboard.availableTrucks': 'Available Trucks',
      'dashboard.spoilageSaved': 'Spoilage Prevented',
      'dashboard.activeRoutes': 'Active Routes',
      
      // Fish Types
      'fish.tilapia': 'Tilapia',
      'fish.pomfret': 'Pomfret',
      'fish.mackerel': 'Mackerel',
      'fish.sardine': 'Sardine',
      'fish.tuna': 'Tuna',
      
      // Common
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.close': 'Close',
    }
  },
  ta: {
    translation: {
      // Navigation
      'nav.dashboard': 'டாஷ்போர்டு',
      'nav.input': 'தரவு உள்ளீடு',
      'nav.optimization': 'மேம்படுத்தல்',
      'nav.forecasting': 'முன்னறிவிப்பு',
      'nav.analytics': 'பகுப்பாய்வு',
      'nav.signOut': 'வெளியேறு',
      
      // Auth
      'auth.signIn': 'உள்நுழைய',
      'auth.signUp': 'பதிவு செய்',
      'auth.email': 'மின்னஞ்சல்',
      'auth.password': 'கடவுச்சொல்',
      'auth.fullName': 'முழு பெயர்',
      'auth.welcome': 'கோல்ட் சேன் ஆப்டிமைசர் வரவேற்கிறது',
      'auth.subtitle': 'ஸ்மார்ட் மீன் வழித்தடம் & சேமிப்பு திட்டமிடல்',
      
      // Dashboard
      'dashboard.title': 'கோல்ட் சேன் டாஷ்போர்டு',
      'dashboard.totalCatch': 'இன்றைய மொத்த மீன்பிடி',
      'dashboard.availableTrucks': 'கிடைக்கும் லாரிகள்',
      'dashboard.spoilageSaved': 'கேடுபிடிப்பு தடுக்கப்பட்டது',
      'dashboard.activeRoutes': 'செயலில் உள்ள வழிகள்',
      
      // Fish Types
      'fish.tilapia': 'திலாப்பியா',
      'fish.pomfret': 'பாம்ஃப்ரெட்',
      'fish.mackerel': 'மேக்ரல்',
      'fish.sardine': 'சார்டின்',
      'fish.tuna': 'டுனா',
      
      // Common
      'common.loading': 'ஏற்றுகிறது...',
      'common.save': 'சேமி',
      'common.cancel': 'ரத்து செய்',
      'common.delete': 'நீக்கு',
      'common.edit': 'திருத்து',
      'common.add': 'சேர்',
      'common.close': 'மூடு',
    }
  },
  ml: {
    translation: {
      // Navigation
      'nav.dashboard': 'ഡാഷ്ബോർഡ്',
      'nav.input': 'ഡാറ്റ എൻട്രി',
      'nav.optimization': 'ഒപ്റ്റിമൈസേഷൻ',
      'nav.forecasting': 'പ്രവചനം',
      'nav.analytics': 'അനലിറ്റിക്സ്',
      'nav.signOut': 'സൈൻ ഔട്ട്',
      
      // Auth
      'auth.signIn': 'സൈൻ ഇൻ',
      'auth.signUp': 'സൈൻ അപ്പ്',
      'auth.email': 'ഇമെയിൽ',
      'auth.password': 'പാസ്വേഡ്',
      'auth.fullName': 'പൂർണ്ണ നാമം',
      'auth.welcome': 'കോൾഡ് ചെയിൻ ഒപ്റ്റിമൈസറിലേക്ക് സ്വാഗതം',
      'auth.subtitle': 'സ്മാർട്ട് ഫിഷ് റൂട്ട് & സ്റ്റോറേജ് പ്ലാനർ',
      
      // Dashboard
      'dashboard.title': 'കോൾഡ് ചെയിൻ ഡാഷ്ബോർഡ്',
      'dashboard.totalCatch': 'ഇന്നത്തെ മൊത്തം മത്സ്യബന്ധനം',
      'dashboard.availableTrucks': 'ലഭ്യമായ ട്രക്കുകൾ',
      'dashboard.spoilageSaved': 'കേടാകുന്നത് തടഞ്ഞു',
      'dashboard.activeRoutes': 'സജീവ റൂട്ടുകൾ',
      
      // Fish Types
      'fish.tilapia': 'തിലാപ്പിയ',
      'fish.pomfret': 'പാമ്ഫ്രെറ്റ്',
      'fish.mackerel': 'മാക്രൽ',
      'fish.sardine': 'സാർഡിൻ',
      'fish.tuna': 'ട്യൂണ',
      
      // Common
      'common.loading': 'ലോഡുചെയ്യുന്നു...',
      'common.save': 'സേവ് ചെയ്യുക',
      'common.cancel': 'റദ്ദാക്കുക',
      'common.delete': 'ഇല്ലാതാക്കുക',
      'common.edit': 'എഡിറ്റ് ചെയ്യുക',
      'common.add': 'ചേർക്കുക',
      'common.close': 'അടയ്ക്കുക',
    }
  },
  te: {
    translation: {
      // Navigation
      'nav.dashboard': 'డాష్‌బోర్డ్',
      'nav.input': 'డేటా ఎంట్రీ',
      'nav.optimization': 'ఆప్టిమైజేషన్',
      'nav.forecasting': 'అంచనా',
      'nav.analytics': 'అనలిటిక్స్',
      'nav.signOut': 'సైన్ అవుట్',
      
      // Auth
      'auth.signIn': 'సైన్ ఇన్',
      'auth.signUp': 'సైన్ అప్',
      'auth.email': 'ఇమెయిల్',
      'auth.password': 'పాస్‌వర్డ్',
      'auth.fullName': 'పూర్తి పేరు',
      'auth.welcome': 'కోల్డ్ చైన్ ఆప్టిమైజర్‌కు స్వాగతం',
      'auth.subtitle': 'స్మార్ట్ ఫిష్ రూట్ & స్టోరేజ్ ప్లానర్',
      
      // Dashboard
      'dashboard.title': 'కోల్డ్ చైన్ డాష్‌బోర్డ్',
      'dashboard.totalCatch': 'నేటి మొత్తం చేపలు',
      'dashboard.availableTrucks': 'అందుబాటులో ఉన్న ట్రక్కులు',
      'dashboard.spoilageSaved': 'చెడిపోవడం నిరోధించబడింది',
      'dashboard.activeRoutes': 'చురుకైన రూట్లు',
      
      // Fish Types
      'fish.tilapia': 'తిలపియా',
      'fish.pomfret': 'పామ్‌ఫ్రెట్',
      'fish.mackerel': 'మాక్రెల్',
      'fish.sardine': 'సార్డిన్',
      'fish.tuna': 'ట్యూనా',
      
      // Common
      'common.loading': 'లోడవుతోంది...',
      'common.save': 'సేవ్ చేయండి',
      'common.cancel': 'రద్దు చేయండి',
      'common.delete': 'తొలగించండి',
      'common.edit': 'సవరించండి',
      'common.add': 'జోడించండి',
      'common.close': 'మూసివేయండి',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

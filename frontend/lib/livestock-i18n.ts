/**
 * PashuRaksha — Multilingual Labels (i18n)
 * =========================================
 * English, Hindi, and Marathi labels for Maharashtra-focused
 * livestock health surveillance UI.
 */

export type Lang = "en" | "hi" | "mr";

export const LANGUAGES: { code: Lang; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
];

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // App
    app_title: "PashuRaksha",
    app_subtitle: "Animal Health Surveillance — Maharashtra",
    app_tagline: "Early Warning • Rapid Response • Livestock Protection",

    // Navigation
    nav_home: "Home",
    nav_report: "Report",
    nav_map: "Risk Map",
    nav_dashboard: "Dashboard",
    nav_animals: "Animals",
    nav_lab: "Lab Referral",
    nav_alerts: "Alerts",

    // Species
    species_cattle: "Cattle",
    species_buffalo: "Buffalo",
    species_goat: "Goat",
    species_sheep: "Sheep",
    species_poultry: "Poultry",

    // Diseases
    disease_fmd: "Foot-and-Mouth Disease (FMD)",
    disease_lsd: "Lumpy Skin Disease (LSD)",
    disease_ppr: "PPR (Peste des Petits Ruminants)",
    disease_brucellosis: "Brucellosis",
    disease_ai_h5n1: "Avian Influenza (H5N1)",

    // Symptoms
    symptom_fever: "Fever",
    symptom_oral_lesions: "Oral Lesions / Blisters",
    symptom_lameness: "Lameness",
    symptom_salivation: "Excessive Salivation",
    symptom_vesicles_feet: "Vesicles on Feet",
    symptom_drop_in_milk: "Drop in Milk Production",
    symptom_skin_nodules: "Skin Nodules / Lumps",
    symptom_nasal_discharge: "Nasal Discharge",
    symptom_reduced_appetite: "Reduced Appetite",
    symptom_enlarged_lymph_nodes: "Enlarged Lymph Nodes",
    symptom_diarrhea: "Diarrhea",
    symptom_pneumonia: "Pneumonia / Respiratory",
    symptom_sudden_death: "Sudden Death",
    symptom_abortion: "Abortion",
    symptom_retained_placenta: "Retained Placenta",
    symptom_orchitis: "Orchitis (Testicular Swelling)",
    symptom_arthritis: "Arthritis / Joint Swelling",
    symptom_drop_in_eggs: "Drop in Egg Production",
    symptom_respiratory_distress: "Respiratory Distress",
    symptom_swollen_head: "Swollen Head / Wattles",
    symptom_cyanosis: "Cyanosis (Blue Comb)",
    symptom_bloody_stool: "Bloody Stool",
    symptom_dehydration: "Dehydration",
    symptom_weight_loss: "Weight Loss",
    symptom_itching_scratching: "Itching / Scratching",

    // Severity
    severity_mild: "Mild",
    severity_moderate: "Moderate",
    severity_severe: "Severe",
    severity_mass_mortality: "Mass Mortality",

    // Alert Severity
    alert_watch: "Watch",
    alert_warning: "Warning",
    alert_outbreak: "Outbreak",
    alert_emergency: "Emergency",

    // Form labels
    form_district: "District",
    form_block: "Block / Taluka",
    form_village: "Village",
    form_species: "Species",
    form_breed: "Breed",
    form_num_affected: "Number Affected",
    form_num_dead: "Number Dead",
    form_symptoms: "Symptoms",
    form_severity: "Severity",
    form_description: "Description / Notes",
    form_reporter_type: "Reporter Type",
    form_reporter_name: "Reporter Name",
    form_reporter_phone: "Phone Number",
    form_submit: "Submit Report",
    form_submitting: "Submitting...",
    form_success: "Report Submitted Successfully",
    form_offline_queued: "Report Queued (Offline)",

    // Reporter types
    reporter_farmer: "Farmer",
    reporter_para_vet: "Para-Veterinary Worker",
    reporter_field_vet: "Field Veterinarian",
    reporter_livestock_inspector: "Livestock Inspector",
    reporter_panchayat_member: "Panchayat Member",

    // Dashboard
    dashboard_reports_week: "Reports This Week",
    dashboard_active_alerts: "Active Alerts",
    dashboard_vacc_coverage: "Vaccination Coverage",
    dashboard_mortality_rate: "Mortality Rate",
    dashboard_pending_samples: "Pending Lab Samples",
    dashboard_total_animals: "Registered Animals",

    // Govt
    govt_helpline: "Maharashtra Animal Husbandry Helpline: 1800-233-0418",
    govt_dept: "Dept. of Animal Husbandry, Dairy Development & Fisheries, Govt. of Maharashtra",
  },
  hi: {
    app_title: "पशुरक्षा",
    app_subtitle: "पशु स्वास्थ्य निगरानी — महाराष्ट्र",
    app_tagline: "प्रारंभिक चेतावनी • त्वरित प्रतिक्रिया • पशुधन संरक्षण",

    nav_home: "होम",
    nav_report: "रिपोर्ट",
    nav_map: "जोखिम मानचित्र",
    nav_dashboard: "डैशबोर्ड",
    nav_animals: "पशु",
    nav_lab: "प्रयोगशाला",
    nav_alerts: "अलर्ट",

    species_cattle: "गाय",
    species_buffalo: "भैंस",
    species_goat: "बकरी",
    species_sheep: "भेड़",
    species_poultry: "मुर्गी",

    disease_fmd: "खुरपका-मुंहपका रोग",
    disease_lsd: "लम्पी त्वचा रोग",
    disease_ppr: "पीपीआर (पेस्ट डे पेटिट रूमिनैंट्स)",
    disease_brucellosis: "ब्रुसेलोसिस",
    disease_ai_h5n1: "एवियन इन्फ्लूएंजा (H5N1)",

    symptom_fever: "बुखार",
    symptom_oral_lesions: "मुंह में छाले",
    symptom_lameness: "लंगड़ापन",
    symptom_skin_nodules: "त्वचा पर गांठें",
    symptom_nasal_discharge: "नाक से बहना",
    symptom_diarrhea: "दस्त",
    symptom_sudden_death: "अचानक मृत्यु",
    symptom_drop_in_milk: "दूध में कमी",

    severity_mild: "हल्का",
    severity_moderate: "मध्यम",
    severity_severe: "गंभीर",
    severity_mass_mortality: "सामूहिक मृत्यु",

    form_submit: "रिपोर्ट दर्ज करें",
    form_submitting: "दर्ज हो रहा है...",
    form_success: "रिपोर्ट सफलतापूर्वक दर्ज",
    form_offline_queued: "रिपोर्ट कतार में (ऑफलाइन)",

    reporter_farmer: "किसान",
    reporter_para_vet: "पैरा-पशु चिकित्सा कर्मी",
    reporter_field_vet: "क्षेत्रीय पशु चिकित्सक",

    dashboard_reports_week: "इस सप्ताह रिपोर्ट",
    dashboard_active_alerts: "सक्रिय अलर्ट",
    dashboard_vacc_coverage: "टीकाकरण कवरेज",
    dashboard_mortality_rate: "मृत्यु दर",

    govt_helpline: "महाराष्ट्र पशुपालन हेल्पलाइन: 1800-233-0418",
  },
  mr: {
    app_title: "पशुरक्षा",
    app_subtitle: "पशु आरोग्य देखरेख — महाराष्ट्र",
    app_tagline: "आगाऊ इशारा • जलद प्रतिसाद • पशुधन संरक्षण",

    nav_home: "मुख्यपृष्ठ",
    nav_report: "अहवाल",
    nav_map: "जोखीम नकाशा",
    nav_dashboard: "डॅशबोर्ड",
    nav_animals: "जनावरे",
    nav_lab: "प्रयोगशाळा",
    nav_alerts: "सूचना",

    species_cattle: "गाय",
    species_buffalo: "म्हैस",
    species_goat: "शेळी",
    species_sheep: "मेंढी",
    species_poultry: "कोंबडी",

    disease_fmd: "खुरकत-लाळखुरकत आजार",
    disease_lsd: "गाठीदार त्वचा रोग",
    disease_ppr: "पीपीआर (शेळी-मेंढी प्लेग)",
    disease_brucellosis: "ब्रुसेलोसिस",
    disease_ai_h5n1: "एवियन इन्फ्लुएन्झा (H5N1)",

    symptom_fever: "ताप",
    symptom_oral_lesions: "तोंडात फोड",
    symptom_lameness: "लंगडणे",
    symptom_skin_nodules: "त्वचेवर गाठी",
    symptom_nasal_discharge: "नाकातून स्त्राव",
    symptom_diarrhea: "जुलाब",
    symptom_sudden_death: "अचानक मृत्यू",
    symptom_drop_in_milk: "दूध उत्पादनात घट",

    severity_mild: "सौम्य",
    severity_moderate: "मध्यम",
    severity_severe: "गंभीर",
    severity_mass_mortality: "सामूहिक मृत्यू",

    form_submit: "अहवाल नोंदवा",
    form_submitting: "नोंदणी होत आहे...",
    form_success: "अहवाल यशस्वीरित्या नोंदवला",
    form_offline_queued: "अहवाल रांगेत (ऑफलाइन)",

    reporter_farmer: "शेतकरी",
    reporter_para_vet: "पॅरा-पशुवैद्यकीय कर्मचारी",
    reporter_field_vet: "क्षेत्रीय पशुवैद्यक",

    dashboard_reports_week: "या आठवड्यातील अहवाल",
    dashboard_active_alerts: "सक्रिय सूचना",
    dashboard_vacc_coverage: "लसीकरण कव्हरेज",
    dashboard_mortality_rate: "मृत्यू दर",

    govt_helpline: "महाराष्ट्र पशुसंवर्धन हेल्पलाइन: 1800-233-0418",
    govt_dept: "पशुसंवर्धन, दुग्ध विकास व मत्स्यव्यवसाय विभाग, महाराष्ट्र शासन",
  },
};

/** Get a translated label, falling back to English if missing. */
export function t(lang: Lang, key: string): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

/** All recognized symptom keys for the report form. */
export const SYMPTOM_KEYS = [
  "fever", "oral_lesions", "lameness", "salivation", "vesicles_feet",
  "drop_in_milk", "skin_nodules", "nasal_discharge", "reduced_appetite",
  "enlarged_lymph_nodes", "diarrhea", "pneumonia", "sudden_death",
  "abortion", "retained_placenta", "orchitis", "arthritis",
  "drop_in_eggs", "respiratory_distress", "swollen_head", "cyanosis",
  "bloody_stool", "dehydration", "weight_loss", "itching_scratching",
];

/** Maharashtra district blocks for form dropdowns. */
export const MAHARASHTRA_BLOCKS: Record<string, string[]> = {
  PUNE: ["Haveli", "Mulshi", "Bhor", "Velhe", "Junnar", "Ambegaon", "Baramati", "Indapur"],
  AHMEDNAGAR: ["Rahuri", "Shrirampur", "Sangamner", "Kopargaon", "Nevasa", "Pathardi", "Parner"],
  NASHIK: ["Dindori", "Igatpuri", "Trimbakeshwar", "Sinnar", "Niphad", "Yeola", "Malegaon"],
  KOLHAPUR: ["Karveer", "Panhala", "Hatkanangle", "Shirol", "Gaganbawada", "Radhanagari"],
  SANGLI: ["Miraj", "Tasgaon", "Walwa", "Shirala", "Kadegaon", "Jath"],
  SOLAPUR: ["Barshi", "Madha", "Karmala", "Pandharpur", "Mangalvedhe", "Akkalkot"],
  NAGPUR: ["Kamptee", "Hingna", "Saoner", "Katol", "Narkhed", "Umred"],
  LATUR: ["Ausa", "Nilanga", "Renapur", "Chakur", "Shirur Anantpal", "Deoni"],
  JALGAON: ["Chopda", "Raver", "Yawal", "Erandol", "Pachora", "Bhusawal"],
};

/** Species options for the form. */
export const SPECIES_OPTIONS = ["cattle", "buffalo", "goat", "sheep", "poultry"];

/** Disease options. */
export const DISEASE_OPTIONS = [
  { id: "fmd", name_key: "disease_fmd" },
  { id: "lsd", name_key: "disease_lsd" },
  { id: "ppr", name_key: "disease_ppr" },
  { id: "brucellosis", name_key: "disease_brucellosis" },
  { id: "ai_h5n1", name_key: "disease_ai_h5n1" },
];

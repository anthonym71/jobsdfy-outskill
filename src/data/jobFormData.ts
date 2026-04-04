export const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina","Brazil","Brunei","Bulgaria",
  "Cambodia","Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Finland","France",
  "Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Latvia",
  "Lebanon","Libya","Lithuania","Luxembourg","Malaysia","Maldives","Malta","Mexico","Moldova","Monaco","Mongolia",
  "Montenegro","Morocco","Myanmar","Nepal","Netherlands","New Zealand","Nigeria","North Macedonia","Norway",
  "Oman","Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Saudi Arabia","Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka",
  "Sweden","Switzerland","Taiwan","Thailand","Tunisia","Turkey","UAE","Uganda","Ukraine","United Kingdom",
  "United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

export const CITIES: Record<string, string[]> = {
  "United States": ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","San Francisco","Seattle","Denver","Washington DC","Nashville","Oklahoma City","Boston","Portland","Las Vegas","Memphis","Louisville","Baltimore","Milwaukee","Albuquerque","Tucson","Fresno","Sacramento","Mesa","Kansas City","Atlanta","Omaha","Colorado Springs","Raleigh","Long Beach","Virginia Beach","Miami","Oakland","Minneapolis","Tampa","Tulsa","Arlington","New Orleans"],
  "United Kingdom": ["London","Manchester","Birmingham","Leeds","Glasgow","Liverpool","Bristol","Sheffield","Edinburgh","Leicester","Coventry","Bradford","Cardiff","Belfast","Nottingham","Kingston upon Hull","Newcastle upon Tyne","Stoke-on-Trent","Southampton","Derby","Portsmouth","Brighton","Plymouth","Northampton","Reading","Luton","Wolverhampton","Bolton","Aberdeen","Bournemouth","Norwich","Swindon","Swansea","Milton Keynes","Oxford","Cambridge"],
  "Germany": ["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dortmund","Essen","Bremen","Dresden","Hanover","Nuremberg","Duisburg"],
  "France": ["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Montpellier","Bordeaux","Lille","Rennes","Reims","Toulon","Le Havre","Saint-Étienne"],
  "Canada": ["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Winnipeg","Quebec City","Hamilton","Kitchener"],
  "Australia": ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Newcastle","Hobart","Darwin"],
  "India": ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Lucknow"],
  "UAE": ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Al Ain"],
  "Singapore": ["Singapore"],
  "Ireland": ["Dublin","Cork","Galway","Limerick","Waterford"],
  "Netherlands": ["Amsterdam","Rotterdam","The Hague","Utrecht","Eindhoven","Groningen"],
  "Switzerland": ["Zurich","Geneva","Basel","Bern","Lausanne"],
  "Spain": ["Madrid","Barcelona","Valencia","Seville","Zaragoza","Malaga","Bilbao"],
  "Italy": ["Rome","Milan","Naples","Turin","Palermo","Genoa","Bologna","Florence"],
  "Japan": ["Tokyo","Osaka","Yokohama","Nagoya","Sapporo","Kobe","Kyoto","Fukuoka"],
  "China": ["Shanghai","Beijing","Guangzhou","Shenzhen","Chengdu","Hangzhou","Wuhan"],
  "Brazil": ["São Paulo","Rio de Janeiro","Brasília","Salvador","Fortaleza","Belo Horizonte"],
  "South Korea": ["Seoul","Busan","Incheon","Daegu","Daejeon"],
  "Mexico": ["Mexico City","Guadalajara","Monterrey","Puebla","Cancún"],
  "South Africa": ["Johannesburg","Cape Town","Durban","Pretoria","Port Elizabeth"],
  "Saudi Arabia": ["Riyadh","Jeddah","Mecca","Medina","Dammam"],
  "Qatar": ["Doha","Al Wakrah","Al Khor"],
  "Bahrain": ["Manama","Muharraq","Riffa"],
  "Kuwait": ["Kuwait City","Hawalli","Salmiya"],
  "Oman": ["Muscat","Salalah","Sohar"],
};

export const JOB_LEVELS = [
  "C-Suite","Vice President","Director","Manager","Supervisor","Team Lead","Senior","Mid-Level","Junior","Intern/Graduate"
];

export const JOB_CATEGORIES: Record<string, string[]> = {
  "Sales": ["Telesales","Pre-Sales","Business Development","Account Management","Inside Sales","Field Sales","Sales Engineering","Channel Sales","Enterprise Sales","Retail Sales"],
  "Marketing": ["Digital Marketing","Content Marketing","SEO/SEM","Social Media","Brand Management","Product Marketing","Marketing Analytics","PR/Communications","Growth Marketing","Email Marketing"],
  "Finance": ["Accounting","Financial Analysis","Audit","Tax","Treasury","Risk Management","Investment Banking","Corporate Finance","Compliance","Payroll"],
  "IT / Technology": ["Software Development","DevOps","Data Engineering","Cybersecurity","Cloud Engineering","QA/Testing","System Administration","IT Support","Architecture","AI/ML"],
  "HR / People": ["Recruitment","HR Business Partner","Learning & Development","Compensation & Benefits","Employee Relations","People Operations","Talent Acquisition","HR Analytics"],
  "Operations": ["Supply Chain","Logistics","Procurement","Project Management","Business Analysis","Process Improvement","Facilities","Quality Assurance"],
  "Legal": ["Corporate Law","Compliance","Contract Management","Intellectual Property","Litigation","Regulatory","Privacy/Data Protection"],
  "Customer Success": ["Customer Support","Account Management","Onboarding","Technical Support","Client Relations","Customer Experience"],
  "Design": ["UI/UX Design","Graphic Design","Product Design","Visual Design","Motion Design","Research"],
  "Engineering": ["Mechanical","Electrical","Civil","Chemical","Manufacturing","Aerospace","Biomedical"],
  "Healthcare": ["Nursing","Medical Practice","Pharmacy","Lab Technician","Healthcare Admin","Physiotherapy"],
  "Education": ["Teaching","Training","Curriculum Development","Academic Research","Administration"],
  "Executive": ["CEO","COO","CFO","CTO","CMO","General Management","Board Advisory"],
  "Other": ["Other"]
};

export const BENEFITS_OPTIONS = [
  "Medical/Health Insurance","Dental Insurance","Vision Insurance","Life Insurance",
  "Pension/401k","Stock Options/Equity","Annual Bonus","Commission",
  "Ride to Work Scheme","Gym Membership","Professional Memberships",
  "Training Budget","Conference Budget","Home Office Allowance",
  "Company Car","Parking","Meal Allowance","Childcare Support",
  "Flexible Hours","Unlimited PTO","Parental Leave","Sabbatical",
  "Wellness Program","Employee Assistance Program","Tuition Reimbursement"
];

export const QUALIFICATION_OPTIONS = [
  "No formal requirement","High School Diploma","Associate Degree","Bachelor's Degree",
  "Master's Degree","MBA","PhD/Doctorate","Professional Certification",
  "Trade/Vocational Certificate","CPA","CFA","PMP","CISSP","AWS Certified",
  "Bar Admission","Medical License","Teaching License","Other"
];

export const CURRENCIES = [
  "USD","EUR","GBP","AED","SAR","QAR","BHD","KWD","OMR","INR","SGD","AUD","CAD",
  "CHF","JPY","CNY","KRW","BRL","MXN","ZAR","NGN","EGP","TRY","RUB","SEK","NOK","DKK","PLN","CZK","HUF"
];

export const LANGUAGE_OPTIONS = [
  "English","Spanish","French","German","Portuguese","Italian","Dutch","Russian","Chinese (Mandarin)",
  "Chinese (Cantonese)","Japanese","Korean","Arabic","Hindi","Bengali","Turkish","Vietnamese","Thai",
  "Polish","Czech","Swedish","Norwegian","Danish","Finnish","Greek","Hebrew","Malay","Indonesian",
  "Tagalog","Swahili","Urdu","Persian","Romanian","Hungarian","Ukrainian"
];

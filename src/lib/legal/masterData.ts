import { parseDateString } from '@/lib/formatters';

// Master data for Legal & Lawyer Portal (Circles, Divisions, Districts, and Court Complexes)

export interface CircleDivisionMap {
  [circle: string]: string[];
}

export interface DistrictCourtComplexMap {
  [district: string]: string[];
}

export const CIRCLE_OPTIONS = ['Chennai', 'Madurai', 'Salem'] as const;

export const CIRCLE_DIVISION_MAP: Record<string, string[]> = {
  Chennai: [
    'Chennai City Division',
    'Chengalpattu Division',
    'Tiruvallur Division',
  ],
  Madurai: [
    'Madurai Division',
    'Dindigul Division',
    'Theni Division',
  ],
  Salem: [
    'Salem Division',
    'Namakkal Division',
    'Dharmapuri Division',
  ],
};

export const TN_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Kanniyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'The Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivagangai',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
] as const;

export const DISTRICT_COURT_COMPLEX_MAP: Record<string, string[]> = {
  Ariyalur: [
    'DM cum JM Court Complex, Sendurai',
    'Combined Courts, Ariyalur',
    'Combined Courts, Jayankondam',
  ],
  Chengalpattu: [
    'DM cum JM Court, Sholinganallur',
    'Combined Courts, Maduranthakam',
    'Combined Courts, Alandur',
    'Combined Courts, Tambaram',
    'DM cum JM Court, Thiruporur',
    'DM cum JM Court, Cheyyur',
    'DM cum JM Court, Pallavaram',
    'DM cum JM Court, Thirukalukundram',
    'Combined Courts, Chengalpet',
    'Pocso Court, Chengalpet',
  ],
  Chennai: [
    'Singaravelar Maaligai Complex',
    'CMM Court, Egmore',
    'MM Courts, George Town',
    'MM Courts, Saidapet',
    'City Civil Court Complex, Chennai',
    'Court of Small Causes, Chennai',
    'Bomb Blast Court, Poonamallee',
    'MM Courts, Egmore at Allikulam',
  ],
  Coimbatore: [
    'Combined Courts, Sulur',
    'DM cum JM Court, Madukkaral',
    'Combined Courts, Coimbatore',
    'Combined Courts, Pollachi',
    'Sub Court, Pollachi',
    'Bomb Blast Court, Coimbatore',
    'Combined Courts, Mettupalayam',
    'DM cum JM Court, Valparai',
    'Commercial Courts, Coimbatore',
    'DM cum JM Court, Annur',
  ],
  Cuddalore: [
    'DM cum JM Court, Parangipettai',
    'District Court Complex, Cuddalore',
    'Combined Courts, Tittagudi',
    'Combined Courts, Chidambaram',
    'Combined Courts, Neyveli',
    'Combined Courts, Panruti',
    'Combined Courts, Virudhachalam',
    'DM cum JM Court, Kattumannarkoil',
    'New Combined Courts, Cuddalore',
    'DM cum JM Court, Kurunjipadi',
  ],
  Dharmapuri: [
    'Magistrate Court, Harur',
    'Combined Courts, Dharmapuri',
    'Combined Courts, Harur',
    'DM and JM Courts, Pappireddipatti',
    'DM cum JM Court, Pennagaram',
    'Combined Courts, Palacode',
    'Sub Court, Pappireddipatty',
    'DM cum JM Court, Karimangalam',
    'Special Courts to deal with MCOP Cases, Dharmapuri',
  ],
  Dindigul: [
    'DM cum JM Court, Natham',
    'DM cum JM Court, Athoor',
    'Combined Courts, Palani',
    'Combined Courts, Kodaikanal',
    'Combined Courts, Vedasandur',
    'Combined Courts, Dindigul',
    'Magistrate Court, Nilakkottai',
    'Munsif Court, Nilakkottai',
    'Combined Courts, Oddanchathiram',
    'DM cum JM Court, Guziliamparai',
  ],
  Erode: [
    'Combined Courts, Bhavani',
    'Combined Courts, Sathyamangalam',
    'Combined Courts, Perundurai',
    'New Combined Court Building, Erode',
    'Combined Courts, Erode',
    'District Munsif Court, Anthiyur',
    'Combined Courts, Gobichettipalayam',
    'Combined Courts, Kodumudi',
    'DM cum JM Court, Modakurichi',
  ],
  Kallakurichi: [
    'Combined Courts, Kallakurichi',
    'Combined Courts, Sankarapuram',
    'Combined Courts, Tirukkoyilur',
    'Combined Courts, Ulundurpet',
    'DM cum JM Court, Chinnasalem',
    'DM cum JM Court, Kalvarayan',
  ],
  Kancheepuram: [
    'Combined Courts, Kallakurichi',
    'Combined Courts, Sankarapuram',
    'Combined Courts, Tirukkoyilur',
    'Combined Courts, Ulundurpet',
    'DM cum JM Court, Chinnasalem',
    'DM cum JM Court, Kalvarayan',
  ],
  Kanniyakumari: [
    'Combined Courts, Kuzhithurai',
    'Combined Courts, Padmanabhapuram',
    'Combined Courts, Nagercoil',
    'Combined Courts, Eraniel',
    'DM cum JM Court, Boothapandy',
  ],
  Karur: [
    'DM cum JM Court, Aravakurichi',
    'Combined Courts, Kulithalai',
    'Combined Courts, Karur',
    'JM Mahila Court, Karur',
    'DM cum JM Court, Krishnarayapuram',
  ],
  Krishnagiri: [
    'DM cum JM Court, Pochampalli',
    'Combined Courts, Uthangarai',
    'Combined Courts, Krishnagiri',
    'Combined Courts, Denkanikottai',
    'Combined Courts, Hosur',
  ],
  Madurai: [
    'DM cum JM Court, Peraiyur',
    'Combined Courts, Vadipatti',
    'Combined Courts, Thirumangalam',
    'Munsif Court, Thirumangalam',
    'Combined Courts, Melur',
    'Magistrate Court, Melur',
    'Combined Courts, Usilampatti',
    'Combined Courts, Madurai',
  ],
  Mayiladuthurai: [
    'Combined Courts, Mayiladuthurai',
    'DM cum JM Court, Tharangambadi',
    'Combined Courts, Sirkali',
  ],
  Nagapattinam: [
    'DM cum JM Court, Vedaranyam',
    'Combined Courts, Nagapattinam',
    'DM cum JM Court, Kilvelur',
  ],
  Namakkal: [
    'Combined Courts, Namakkal',
    'Combined Courts, Rasipuram',
    'Combined Courts, Tiruchengode',
    'Combined Courts, Kumarapalayam',
    'Combined Courts, Sendamangalam',
    'Combined Courts, Paramathy',
  ],
  Perambalur: [
    'Combined Courts, Perambalur',
    'DM cum JM Court, Veppanthattai',
    'DM cum JM Court, Kunnam',
  ],
  Pudukkottai: [
    'Magistrate Court, Keeranur',
    'Combined Courts, Thirumayam',
    'Munsif Court, Keeranur',
    'District Court Complex, Pudukkottai',
    'Combined Courts, Aranthangi',
    'DM cum JM Court, Alangudi',
    'DM cum JM Court, Illuppur',
    'DM cum JM Court, Gandarvakkottai',
    'DM cum JM Court, Ponnamaravathi',
    'DM cum JM Court, Karambakkudi',
    'DM cum JM Court, Viralimalai',
    'DM cum JM Court, Avudaiyarkoil',
    'DM cum JM Court, Manalmelkudi',
  ],
  Ramanathapuram: [
    'DM cum JM Court, Rameswaram',
    'SCST JMMAHILA Courts, Ramanathapuram',
    'DM cum JM Court, Kadaladi',
    'Combined Courts, Paramakudi',
    'Combined Courts, Ramanathapuram',
    'Combined Courts, Mudukulathur',
    'Combined Courts, Thiruvadanai',
    'DM cum JM Court, Kamudhi',
  ],
  Ranipet: [
    'Combined Courts, Ranipet',
    'Combined Courts, Arakkonam',
    'Combined Courts, Sholinghur',
    'DM cum JM Court, Arcot',
    'Combined Courts, Walajah',
  ],
  Salem: [
    'Combined Courts, Mettur',
    'Combined Courts, Attur',
    'Combined Courts, Sankari',
    'Combined Courts, Omalur',
    'DM cum JM Court, Vazhapadi',
    'Combined Courts, Salem',
    'DM cum JM Court, Edappadi',
    'DM cum JM Court, Yercaud',
  ],
  Sivagangai: [
    'Combined Courts, Devakottai',
    'Old Combined Courts, Sivagangai',
    'DM cum JM Court, Tiruppathur',
    'DM cum JM Court, Ilayangudi',
    'Combined Courts, Karaikudi',
    'New Combined Courts, Sivagangai',
    'DM cum JM Court, Singampunari',
    'Combined Courts, Manamadurai',
    'DM cum JM Court, Thiruppuvanam',
  ],
  Tenkasi: [
    'Combined Courts, Tenkasi',
    'Munsif Court, Alangulam',
    'Magistrate Court, Alangulam',
    'Combined Courts, Sankarankovil',
    'Combined Courts, Shengottah',
    'Combined Courts, Sivagiri',
    'Additional Courts, Tenkasi',
  ],
  Thanjavur: [
    'Combined Courts, Thiruvaiyaru',
    'Combined Courts, Kumbakonam',
    'Combined Courts, Pattukkottai',
    'Combined Courts, Thanjavur',
    'DM cum JM Court, Thiruvidaimaruthur',
    'DM cum JM Court, Orathanadu',
    'DM cum JM Court, Papanasam',
    'DM cum JM Court, Peravurani',
  ],
  Theni: [
    'Combined Courts, Theni',
    'Combined Courts, Periyakulam',
    'Combined Courts, Uthamapalayam',
    'Combined Courts, Aundipatti',
    'Combined Courts, Bodinayakkanur',
  ],
  'The Nilgiris': [
    'DM cum JM Court, Kotagiri',
    'Magistrate Court, Panthalur',
    'Labour Court Complex, The Nilgiris',
    'Magistrate Court, Coonoor',
    'Combined Court Complex, The Nilgiris',
    'Combined Courts, Gudalur',
    'Combined Courts, Coonoor',
  ],
  Thoothukudi: [
    'DM cum JM Court, Vilathikulam',
    'Combined Courts, Tiruchendur',
    'Combined Courts, Srivaikuntam',
    'Combined Courts, Thoothukudi',
    'Combined Courts, Kovilpatti',
    'Combined Courts, Sathankulam',
    'DM cum JM Court, Ottapidaram',
  ],
  Tiruchirappalli: [
    'Combined Courts, Lalgudi',
    'Combined Courts, Tiruchirappalli',
    'Combined Courts, Manapparai',
    'Combined Courts, Musiri',
    'Combined Courts, Thuraiyur',
    'DM cum JM Court, Srirangam',
    'DM cum JM Court, Thottiyam',
    'Sub Court, Musiri',
  ],
  Tirunelveli: [
    'Combined Courts, Nanguneri',
    'Combined Courts, Tirunelveli',
    'DM cum JM Court, Rathapuram',
    'Combined Courts, Ambasamaduram',
    'Combined Courts, Cheranmahadevi',
    'Combined Courts, Valliyoor',
    'DM cum JM Court, Thisayanvilai',
  ],
  Tirupathur: [
    'Combined Courts, Tirupathur',
    'Combined Courts, Vaniyambadi',
    'Judicial Magistrate Court, Vaniyambadi',
    'Combined Courts, Ambur',
  ],
  Tiruppur: [
    'Combined Courts, Palladam',
    'Combined Courts, Kangeyam',
    'Combined Courts, Dharapuram',
    'Sub Court Complex, Avinashi',
    'Combined Courts, Avinashi',
    'Magistrate Court, Dharapuram',
    'Combined Courts Campus, Tiruppur',
    'DM cum JM Court, Madathukulam',
    'Combied Courts, Udumalpet',
    'I Magistrate Court, Udumalpet',
    'DM cum JM Court, Uthukuli',
  ],
  Tiruvallur: [
    'Combined Courts, Tiruvallur',
    'Combined Courts, Tiruttani',
    'Combined Courts, Poonamallee',
    'Sub Court Complex, Ponneri',
    'DM cum JM Court, Madhavaram',
    'Combined Courts, Ambattur',
    'Munsif Court, Ponneri',
    'Combined Courts, Tiruvottiyur',
    'DM cum JM Court, Pallipattu',
    'DM cum JM Court, Uthukottai',
    'I Magistrate Court, Ponneri',
    'II Magistrate Court, Ponneri',
    'DM cum JM Court, Gummidipoondi',
  ],
  Tiruvannamalai: [
    'Combined Courts, Arani',
    'Combined Courts, Cheyyar',
    'Combined Courts, Tiruvannamalai',
    'Combined Courts, Chengam',
    'DM cum JM Court, Kalasapakkam',
    'Combined Courts, Vandavasi',
    'DM cum JM Court, Thandarampattu',
    'Combined Courts, Polur',
    'Sub Court Complex, Vandavasi',
    'DM cum JM Court, Kilpennathur',
  ],
  Tiruvarur: [
    'Combined Courts, Mannargudi',
    'Munsif Court, Mannargudi',
    'DM cum JM Court, Nannilam',
    'DM cum JM Court, Needamangalam',
    'Magistrate Court, Mannargudi',
    'DM cum JM Court, Valangaiman',
    'Combined Courts, Tiruvarur',
    'Combined Courts, Thiruthuraipoondi',
    'Mahila Court and Scst Court, Tiruvarur',
    'DM cum JM Court, Kodavasal',
  ],
  Vellore: [
    'Combined Courts, Vellore',
    'Combined Courts, Katpadi',
    'Combined Courts, Gudiyatham',
    'DM cum JM Court Complex, Kilvaithinankuppam',
  ],
  Viluppuram: [
    'Combined Courts, Vanur',
    'Combined Courts, Viluppuram',
    'Combined Courts, Tindivanam',
    'Combined Courts, Gingee',
    'DM cum JM Court, Vikravandi',
    'DM cum JM Court, Thiruvennainallur',
  ],
  Virudhunagar: [
    'Combined Courts, Sivakasi',
    'Combined Courts, Virudhunagar',
    'Combined Courts, Sattur',
    'Combined Courts, Srivilliputtur',
    'Combined Courts, Aruppukkottai',
    'Combined Courts, Rajapalayam',
    'DM cum JM Court, Tiruchuli',
    'DM cum JM Court, Watrap',
    'DM cum JM Court, Kariapatti',
  ],
};

// Helper: Calculate Appeal Delay in Days
export function calculateAppealDelay(
  appealFilingDate?: string,
  limitationDueDate?: string
): { isDelayed: 'Yes' | 'No'; delayDays: number } {
  if (!appealFilingDate || !limitationDueDate) {
    return { isDelayed: 'No', delayDays: 0 };
  }

  const filing = parseDateString(appealFilingDate);
  const due = parseDateString(limitationDueDate);

  if (!filing || !due || isNaN(filing.getTime()) || isNaN(due.getTime())) {
    return { isDelayed: 'No', delayDays: 0 };
  }

  // Calculate day difference
  const diffTime = filing.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { isDelayed: 'Yes', delayDays: diffDays };
  }

  return { isDelayed: 'No', delayDays: 0 };
}



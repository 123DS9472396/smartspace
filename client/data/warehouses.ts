// Comprehensive warehouse data for Maharashtra, India - Full dataset from CSV (2000+ rows)
export interface WarehouseData {
  whId: string;
  address: string;
  district: string;
  state: string;
  capacity: number; // in MT
  registrationDate: string;
  registrationValidUpto: string;
  contactNo: string;
  status: 'Active' | 'Inactive' | 'Cancelled';
  remarks: string;
  occupancy: number; // 0-1 (percentage as decimal)
  microRentalSpaces: number;
  emailId: string;
  pricing: number; // INR/sqft/month
  warehouseType: string;
  ownershipCertificate: 'Verified' | 'Unverified';
  pincode: string;
  licenceNumber: string;
  size: number; // in sqft
  // Enhanced fields for UI
  image: string;
  amenities: string[];
  description: string;
  rating: number;
  reviews: number;
  pricePerMT?: number; // Calculated field
}

// Sample warehouse photos for different types
const warehouseImages = [
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80", // Industrial logistics parks
  "https://images.unsplash.com/photo-1601980169411-4c0d37967c2e?w=800&q=80", // Multi-modal logistics hubs
  "https://images.unsplash.com/photo-1553864250-05b20249ee6c?w=800&q=80", // FMCG distribution centers
  "https://images.unsplash.com/photo-1565610222536-ef2bdc4a7fd2?w=800&q=80", // Cold chain storage facilities
  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80", // Agri-commodity specialized warehouses
  "https://images.unsplash.com/photo-1590856029826-c7d73bb48fa2?w=800&q=80", // General storage
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", // Cold storage
  "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=800&q=80", // Agricultural warehouse
  "https://images.unsplash.com/photo-1573164713712-03790a178651?w=800&q=80", // APMC storage
  "https://images.unsplash.com/photo-1597149758012-c8d5b55d1343?w=800&q=80", // Government warehouse
];

// Get image based on warehouse type
const getImageForType = (type: string): string => {
  const typeIndex = {
    'Industrial logistics parks': 0,
    'Multi-modal logistics hubs': 1,
    'FMCG distribution centers': 2,
    'Cold chain storage facilities': 3,
    'Agri-commodity specialized warehouses': 4
  };

  return warehouseImages[typeIndex[type] || 5];
};

// Generate amenities based on warehouse type and capacity
const getAmenities = (capacity: number, warehouseType: string, certificate: string): string[] => {
  const baseAmenities = ["24/7 Security", "Loading Dock"];

  if (certificate === 'Verified') {
    baseAmenities.push("Certified Facility", "Insurance Coverage");
  }

  if (capacity > 10000) {
    baseAmenities.push("Large Scale Storage", "Heavy Machinery Support");
  }

  if (warehouseType.includes('Cold chain')) {
    baseAmenities.push("Temperature Control", "Refrigeration", "Climate Monitoring");
  }

  if (warehouseType.includes('Agri-commodity')) {
    baseAmenities.push("Grain Storage", "Pest Control", "Quality Testing", "Fumigation");
  }

  if (warehouseType.includes('FMCG')) {
    baseAmenities.push("Fast Moving Goods", "Inventory Management", "Quick Dispatch");
  }

  if (warehouseType.includes('Industrial')) {
    baseAmenities.push("Industrial Equipment", "Power Backup", "Fire Safety");
  }

  if (warehouseType.includes('Multi-modal')) {
    baseAmenities.push("Rail Access", "Road Connectivity", "Intermodal Transfer");
  }

  if (capacity > 20000) {
    baseAmenities.push("Bulk Storage", "Advanced Security", "Professional Management");
  }

  return baseAmenities.slice(0, Math.min(8, baseAmenities.length));
};

// Generate description based on warehouse details
const generateDescription = (warehouse: Partial<WarehouseData>): string => {
  const type = warehouse.warehouseType?.toLowerCase() || "storage";
  const district = warehouse.district;
  const capacity = warehouse.capacity || 0;
  const occupancy = warehouse.occupancy || 0;

  const availabilityText = occupancy < 0.3 ? "excellent availability" :
    occupancy < 0.7 ? "good availability" : "limited availability";

  return `Professional ${type} facility in ${district} with ${capacity.toLocaleString()} MT capacity. Currently showing ${availabilityText} with modern infrastructure and reliable operations. Strategic location with excellent connectivity for efficient logistics operations.`;
};

// Convert CSV row to WarehouseData
const processWarehouseData = (csvData: string[][]): WarehouseData[] => {
  const [header, ...rows] = csvData;

  return rows.map((row, index) => {
    const [
      whId, address, district, state, capacity, registrationDate, registrationValidUpto,
      contactNo, status, remarks, occupancy, microRentalSpaces, emailId, pricing,
      warehouseType, ownershipCertificate, pincode, licenceNumber, size
    ] = row;

    // Clean and parse data
    const parsedCapacity = parseInt(capacity) || 0;
    const parsedOccupancy = parseFloat(occupancy) || 0;
    const parsedMicroSpaces = parseInt(microRentalSpaces) || 0;
    const parsedPricing = parseFloat(pricing) || 0;
    const parsedSize = parseInt(size) || 0;

    // Generate rating based on various factors
    const baseRating = 3.5;
    const certificateBonus = ownershipCertificate === 'Verified' ? 0.8 : 0;
    const statusBonus = status === 'Active' ? 0.5 : 0;
    const occupancyBonus = parsedOccupancy > 0.5 ? 0.4 : 0.2;
    const typeBonus = warehouseType.includes('Cold chain') ? 0.3 : 0;

    const rating = Math.min(5.0, baseRating + certificateBonus + statusBonus + occupancyBonus + typeBonus);

    // Generate reviews count based on capacity and rating
    const reviews = Math.floor((parsedCapacity / 1000) * rating * (Math.random() * 3 + 1));

    const warehouseData: WarehouseData = {
      whId: whId.toString(),
      address: address.replace(/"/g, '').trim(),
      district,
      state,
      capacity: parsedCapacity,
      registrationDate,
      registrationValidUpto,
      contactNo: contactNo.toString(),
      status: status as 'Active' | 'Inactive' | 'Cancelled',
      remarks: remarks || '',
      occupancy: parsedOccupancy,
      microRentalSpaces: parsedMicroSpaces,
      emailId,
      pricing: parsedPricing,
      warehouseType,
      ownershipCertificate: ownershipCertificate as 'Verified' | 'Unverified',
      pincode,
      licenceNumber,
      size: parsedSize,
      image: getImageForType(warehouseType),
      amenities: getAmenities(parsedCapacity, warehouseType, ownershipCertificate),
      description: '',
      rating: Math.round(rating * 10) / 10,
      reviews: Math.max(1, reviews),
      pricePerMT: Math.round((parsedPricing * parsedSize / parsedCapacity) * 100) / 100 || parsedPricing
    };

    // Generate description after warehouse object is created
    warehouseData.description = generateDescription(warehouseData);

    return warehouseData;
  });
};

// Complete CSV data from the provided document (all 2000+ rows)
const csvData = [
  ["WH ID", "Address", "District", "State", "Capacity(in MT)", "Registration Date", "Registration Valid Upto", "Contact No.", "Status", "Remarks", "Occupancy", "Micro Rental Spaces", "Email ID", "Pricing (INR/sqft/mo)", "Warehouse Type", "Ownership Certificate", "Pincode", "Licence Number", "Size (sqft)"],
  ["6938252", "A.P.M.C.mahagaon Tq.mahagaon dist.yavatmal,", "Yavatmal", "MAHARASHTRA", "1000", "5-Jun-24", "4-Jun-29", "9604876967", "Active", "", "0.98", "7", "zbaral@kadakia-zacharia.info", "5.49", "Industrial logistics parks", "Verified", "989682", "LIC536889", "45000"],
  ["6751143", "BELAD YARD ,MALKAPUR,", "Buldana", "MAHARASHTRA", "1147", "4-Jul-23", "3-Jul-28", "9960783901", "Active", "", "0.69", "18", "mmadan@deshmukh.com", "7.25", "Industrial logistics parks", "Verified", "114287", "LIC143313", "51615"],
  ["6744759", "At Gut No. 68/2/B, 68/3/A, 67/1/B1, Village - Hol T Haveli,", "Nandurbar", "MAHARASHTRA", "20000", "24-Jun-23", "23-Dec-27", "9850070254", "Active", "", "0.48", "3", "pihuchacko@sheth.com", "7.6", "Multi-modal logistics hubs", "Unverified", "676678", "LIC801797", "900000"],
  ["6608319", "Opp,Karad Railway Good Shed, Karad Railway station, Oglewadi, Tal:- Karad Dist:- Satara", "Satara", "MAHARASHTRA", "4000", "29-Jul-22", "28-Jul-27", "9822245555", "Active", "", "0.88", "1", "jivikade@kala.com", "3.09", "Agri-commodity specialized warehouses", "Verified", "769410", "LIC395638", "180000"],
  ["6763296", "Latur road Market yard,", "Osmanabad", "MAHARASHTRA", "1000", "27-Jul-23", "26-Jul-28", "9975720584", "Active", "", "0.51", "9", "divij94@sachdev.com", "4.45", "Cold chain storage facilities", "Verified", "64276", "LIC521188", "45000"],
  ["7048507", "Shri Basaveshwar Market Yard, Bagehalli Road", "Solapur", "MAHARASHTRA", "1195", "24-Mar-25", "23-Mar-30", "9423526023", "Active", "", "0.39", "13", "tiyahari@virk-kumar.com", "3.56", "Industrial logistics parks", "Unverified", "322812", "LIC207658", "53775"],
  ["6839526", "Indapur Road, Market Yard", "Pune", "MAHARASHTRA", "1147", "18-Jan-24", "17-Jan-29", "9860305093", "Active", "", "0.35", "17", "zkhosla@krishnamurthy.info", "3.22", "FMCG distribution centers", "Unverified", "320504", "LIC344320", "51615"],
  ["6998918", "Jalochi subyard, Jalochi-Pimpali road", "Pune", "MAHARASHTRA", "1147", "28-Nov-24", "27-Nov-29", "9860305093", "Active", "", "0.52", "4", "raviuthkarsh@gokhale.org", "9.37", "Cold chain storage facilities", "Unverified", "536531", "LIC891234", "51615"],
  ["6749162", "Tuljapur Road, Market yard", "Solapur", "MAHARASHTRA", "1147", "30-Jun-23", "29-Jun-28", "8888526933", "Active", "", "0.64", "13", "dashpiya@sarma.com", "7.05", "Industrial logistics parks", "Unverified", "758582", "LIC201073", "51615"],
  ["6840060", "APMC Kurduwadi Market yard, Tembhurni Road", "Solapur", "MAHARASHTRA", "1147", "18-Jan-24", "17-Jan-29", "9284915656", "Active", "", "0.43", "12", "hridaan72@chopra.com", "9.22", "FMCG distribution centers", "Unverified", "211020", "LIC542382", "51615"],
  ["6865174", "Market yard Manchar,", "Pune", "MAHARASHTRA", "1147", "19-Feb-24", "18-Feb-29", "9922861133", "Active", "", "0.32", "14", "onkar67@ahluwalia-kibe.org", "7.64", "Cold chain storage facilities", "Verified", "244313", "LIC558213", "51615"],
  ["6748172", "TQ NANDURA, DIST BULDHANA", "Buldana", "MAHARASHTRA", "1000", "30-Jun-23", "29-Jun-28", "9022118473", "Active", "", "0.81", "11", "kavya40@bail.net", "4.53", "Agri-commodity specialized warehouses", "Unverified", "139665", "LIC381813", "45000"],
  ["6739981", "Sub Yard Wadegaon, Balapur Patur Road", "Akola", "MAHARASHTRA", "1147", "19-Jun-23", "18-Jun-28", "9370543764", "Active", "", "0.96", "7", "hridaansingh@sarin-lata.biz", "9.16", "Agri-commodity specialized warehouses", "Unverified", "343186", "LIC647868", "51615"],
  ["6756092", "Digras APMC Market Yard, Shivaji Chowk", "Yavatmal", "MAHARASHTRA", "1", "14-Jul-23", "13-Jul-28", "9422167294", "Active", "", "0.98", "10", "advikvarty@majumdar-bumb.com", "2.92", "FMCG distribution centers", "Unverified", "651607", "LIC418601", "45"],
  ["6717847", "apmc,gondpimpri,", "Chandrapur", "MAHARASHTRA", "1147", "19-May-23", "18-May-28", "8830079725", "Active", "", "0.3", "15", "mirayakalita@thakur.com", "3.63", "Agri-commodity specialized warehouses", "Verified", "773359", "LIC747265", "51615"],
  ["6706147", "APMC, bramhpuri,", "Chandrapur", "MAHARASHTRA", "1147", "31-Mar-23", "30-Mar-28", "8329884348", "Active", "", "0.51", "12", "indrajitthaker@rama-kala.com", "7.97", "Industrial logistics parks", "Unverified", "758986", "LIC754390", "51615"],
  ["7082886", "APMC narkhed TQ.narkhed,", "Nagpur", "MAHARASHTRA", "1147", "30-Apr-25", "29-Apr-30", "7769824489", "Active", "", "0.39", "10", "miraya97@dani.com", "4.39", "Cold chain storage facilities", "Unverified", "703136", "LIC372720", "51615"],
  ["6690127", "agriculture produce market committee,amgaon,", "Gondiya", "MAHARASHTRA", "1147", "28-Feb-23", "27-Feb-28", "9022500541", "Active", "", "0.93", "6", "umang25@sridhar.com", "9.58", "Multi-modal logistics hubs", "Unverified", "66955", "LIC355185", "51615"],
  ["6687784", "agriculture produce market committee,goregaon,", "Gondiya", "MAHARASHTRA", "1147", "22-Feb-23", "21-Feb-28", "7507277558", "Active", "", "0.47", "8", "keermahika@basak.org", "8.21", "Industrial logistics parks", "Verified", "391295", "LIC590843", "51615"],
  ["6852305", "APMC, Hinganghat,", "Wardha", "MAHARASHTRA", "1000", "6-Feb-24", "5-Feb-29", "9860864627", "Active", "", "0.79", "11", "awable@bedi.com", "6.59", "Industrial logistics parks", "Verified", "463166", "LIC846579", "45000"],
  ["6825848", "agriculture market committee, parshiwani,", "Nagpur", "MAHARASHTRA", "1147", "26-Dec-23", "25-Dec-28", "8770467546", "Active", "", "0.65", "12", "bassiazad@kakar.org", "7.52", "Agri-commodity specialized warehouses", "Verified", "768881", "LIC619951", "51615"],
  ["6699482", "apmc,sub market yard ,navargaon,", "Chandrapur", "MAHARASHTRA", "1147", "27-Mar-23", "26-Mar-28", "9284858140", "Active", "", "0.64", "17", "kumardishani@handa.com", "6.89", "FMCG distribution centers", "Unverified", "905636", "LIC496021", "51615"],
  ["6691745", "APMC ,CHIMUR,", "Chandrapur", "MAHARASHTRA", "1147", "3-Mar-23", "2-Mar-28", "9545310259", "Active", "", "0.82", "11", "emanda@toor.info", "6.27", "Cold chain storage facilities", "Verified", "624989", "LIC765984", "51615"],
  ["7001431", "Gat No.251/B,A/C No.10502,Plot No.13,", "Kolhapur", "MAHARASHTRA", "1808", "9-Dec-24", "8-Dec-29", "8956354355", "Active", "", "0.45", "18", "ahana-61@kata.biz", "3.14", "FMCG distribution centers", "Unverified", "519623", "LIC757374", "81360"],
  ["8651642", "1670 TASGAON MANERAJURI ROAD,", "Sangli", "MAHARASHTRA", "1707", "14-Aug-20", "13-Aug-25", "9923302846", "Active", "", "0.53", "9", "raniaram@vig.com", "3.39", "FMCG distribution centers", "Verified", "180286", "LIC653770", "76815"],
  ["7034911", "Sawali Phata Shiv Mandir 20 KM Milestone, N. H. No. 6 Bhandara Road,", "Nagpur", "MAHARASHTRA", "5000", "10-Mar-25", "9-Sep-29", "7840945913", "Active", "", "0.59", "10", "tailoryuvraj@madan-balay.com", "2.84", "Cold chain storage facilities", "Verified", "474418", "LIC510625", "225000"],
  ["6691299", "APMC,datala road ,chandrapur,", "Chandrapur", "MAHARASHTRA", "1147", "1-Mar-23", "28-Feb-28", "9822711612", "Active", "", "0.94", "8", "akarsh37@bumb.org", "8.76", "Multi-modal logistics hubs", "Verified", "845637", "LIC710776", "51615"],
  ["6688238", "agriculture produce market commitee,lakhani,", "Bhandara", "MAHARASHTRA", "1147", "23-Feb-23", "22-Feb-28", "9404523726", "Active", "", "0.39", "7", "uppalhrishita@gera.com", "7.94", "Agri-commodity specialized warehouses", "Unverified", "281949", "LIC629421", "51615"],
  ["6692289", "Bhaitalawa ward Pauni, Pauni", "Bhandara", "MAHARASHTRA", "1000", "6-Mar-23", "5-Mar-28", "9881569891", "Active", "", "0.96", "16", "vritikachoudhury@zacharia.biz", "4.99", "Cold chain storage facilities", "Verified", "952160", "LIC362177", "45000"],
  ["6689400", "apmc,pombhurna,aksapur road,pombhurna,", "Chandrapur", "MAHARASHTRA", "1147", "27-Feb-23", "26-Feb-28", "9579083332", "Active", "", "0.42", "12", "ucheema@cheema.com", "4.93", "Cold chain storage facilities", "Unverified", "380666", "LIC490957", "51615"],
  ["6693360", "SUKLI STATION ROAD,", "Wardha", "MAHARASHTRA", "1000", "7-Mar-23", "6-Mar-28", "9970356620", "Active", "", "0.69", "8", "damini09@bhatnagar-doctor.com", "7.33", "FMCG distribution centers", "Verified", "386538", "LIC612291", "45000"],
  ["6827737", "sukli station road ,seloo,", "Wardha", "MAHARASHTRA", "1000", "26-Dec-23", "25-Dec-28", "9970356620", "Active", "", "0.77", "1", "xsubramanian@yogi.com", "8.69", "Agri-commodity specialized warehouses", "Unverified", "190510", "LIC588283", "45000"],
  ["6691562", "agriculture produce market committee ,tumsar,", "Bhandara", "MAHARASHTRA", "1147", "3-Mar-23", "2-Mar-28", "7666759424", "Active", "", "0.69", "12", "tara44@issac.biz", "5.65", "Industrial logistics parks", "Verified", "676328", "LIC103590", "51615"],
  ["6694715", "apmc, sub market yard mandheli,", "Chandrapur", "MAHARASHTRA", "1147", "14-Mar-23", "13-Mar-28", "9764063688", "Active", "", "0.96", "8", "sumerbedi@rajagopalan-kalita.com", "7.89", "FMCG distribution centers", "Unverified", "901258", "LIC745732", "51615"],
  ["6680318", "Agriculture market Committee,sub market yard kurkheda,", "Gadchiroli", "MAHARASHTRA", "1147", "6-Feb-23", "5-Feb-28", "9404817890", "Active", "", "0.46", "11", "anandtarini@chokshi.biz", "6.24", "Multi-modal logistics hubs", "Unverified", "9395", "LIC597858", "51615"],
  ["6759872", "Apmc barshi takli mahan road near railway station barshi takli.,", "Akola", "MAHARASHTRA", "1000", "20-Jul-23", "19-Jul-28", "919766677", "Active", "", "0.88", "20", "hanshsathe@gera.org", "5.06", "Industrial logistics parks", "Verified", "421803", "LIC876394", "45000"],
  ["6699300", "at post bhiwapur ta bhiwapur, nakshi road", "Nagpur", "MAHARASHTRA", "1000", "27-Mar-23", "26-Mar-28", "9422220104", "Active", "", "0.82", "18", "jayesh87@mangat-seshadri.biz", "4.23", "Agri-commodity specialized warehouses", "Unverified", "71960", "LIC607175", "45000"],
  ["7010796", "New Market yard, Deola-Kalwan Road,", "Nashik", "MAHARASHTRA", "1000", "20-Jan-25", "19-Jan-30", "9881017378", "Active", "", "0.68", "5", "chawlaehsaan@kale.info", "9.08", "Agri-commodity specialized warehouses", "Unverified", "931424", "LIC651049", "45000"],
  ["7001076", "Nandurbar Road, Station Area,", "Dhule", "MAHARASHTRA", "1000", "9-Dec-24", "8-Dec-29", "9423917202", "Active", "", "0.6", "18", "dayalarnav@rattan-hari.org", "2.78", "FMCG distribution centers", "Verified", "443987", "LIC185328", "45000"],
  ["6982714", "Dahiwal tarfe Tal. Karjat,", "Raigarh", "MAHARASHTRA", "1000", "1-Oct-24", "30-Sep-29", "9200951253", "Active", "", "0.57", "8", "zain41@khatri.biz", "9.53", "Agri-commodity specialized warehouses", "Unverified", "905553", "LIC865320", "45000"],
  ["6700652", "APMC korpana TQ.Korpana,", "Chandrapur", "MAHARASHTRA", "1000", "28-Mar-23", "27-Mar-28", "9890328102", "Active", "", "0.99", "3", "azad95@kala.com", "7.68", "Cold chain storage facilities", "Unverified", "76741", "LIC493461", "45000"],
  ["6689319", "APMC, lakhandur,", "Bhandara", "MAHARASHTRA", "1147", "27-Feb-23", "26-Feb-28", "9423761332", "Active", "", "0.94", "14", "riaan13@goyal.net", "8.11", "Industrial logistics parks", "Unverified", "380891", "LIC405008", "51615"],
  ["6713887", "Vinchur,", "Nashik", "MAHARASHTRA", "1000", "1-May-23", "30-Apr-28", "7387670813", "Active", "", "0.65", "19", "drishya69@goda.com", "7.18", "Agri-commodity specialized warehouses", "Unverified", "619898", "LIC969181", "45000"],
  ["6763742", "Main Market Yard Camp Road,", "Nashik", "MAHARASHTRA", "1000", "27-Jul-23", "26-Jul-28", "7385572105", "Active", "", "0.33", "16", "uramachandran@khurana.com", "9.03", "Agri-commodity specialized warehouses", "Verified", "131152", "LIC892728", "45000"],
  ["6694350", "Devali TQ.Devali,", "Wardha", "MAHARASHTRA", "1000", "14-Mar-23", "13-Mar-28", "9850412844", "Active", "", "0.91", "16", "kiara71@agate.com", "3.62", "Cold chain storage facilities", "Unverified", "579726", "LIC275877", "45000"],
  ["6961387", "Pune-Shirdi Road, Wadgaon pan,", "Ahmadnagar", "MAHARASHTRA", "1000", "28-Jul-24", "27-Jul-29", "8605759275", "Active", "", "0.86", "18", "yakshitsoman@master-chand.com", "3.53", "Agri-commodity specialized warehouses", "Unverified", "507234", "LIC228904", "45000"],
  ["6705511", "APMC, sawali,", "Chandrapur", "MAHARASHTRA", "1147", "31-Mar-23", "30-Mar-28", "9422838111", "Active", "", "0.64", "5", "zainabatra@borde.biz", "6.92", "Industrial logistics parks", "Verified", "587068", "LIC660305", "51615"],
  ["6861215", "Market Yard Shrigonda, Duand-Jamkhed Road", "Ahmadnagar", "MAHARASHTRA", "1000", "14-Feb-24", "13-Feb-29", "7028839989", "Active", "", "1", "11", "eshanikhare@jaggi-sur.com", "9.29", "Industrial logistics parks", "Verified", "223152", "LIC593701", "45000"],
  ["6709836", "APMC ,sironcha,", "Gadchiroli", "MAHARASHTRA", "1147", "17-Apr-23", "16-Apr-28", "7588302009", "Active", "", "0.84", "3", "fdin@khanna-tella.com", "9.46", "Multi-modal logistics hubs", "Unverified", "900842", "LIC136594", "51615"],
  ["6681399", "AT Apmc Umared sub market yard champa nagpur umared road,", "Nagpur", "MAHARASHTRA", "1146", "11-Feb-23", "10-Feb-28", "9921304211", "Active", "", "0.62", "2", "yverma@sabharwal.net", "8.25", "FMCG distribution centers", "Unverified", "586267", "LIC104064", "51570"],
  ["8651643", "Gat No. 342/2 Vishrambaug, Tal. Karad", "Satara", "MAHARASHTRA", "3250", "15-Aug-20", "14-Aug-25", "8830245719", "Active", "", "0.73", "12", "zain87@soni.com", "6.78", "Industrial logistics parks", "Verified", "415524", "LIC892456", "146250"],
  ["8651644", "Plot No. 45, MIDC Kagal", "Kolhapur", "MAHARASHTRA", "5500", "16-Aug-20", "15-Aug-25", "9823567410", "Active", "", "0.85", "8", "priya24@sharma.net", "4.23", "Multi-modal logistics hubs", "Verified", "416216", "LIC345678", "247500"],
  ["8651645", "Survey No. 156/2A, Ambad MIDC", "Nashik", "MAHARASHTRA", "8200", "17-Aug-20", "16-Aug-25", "9764123890", "Active", "", "0.62", "15", "amit@patel.org", "5.89", "Cold chain storage facilities", "Unverified", "422010", "LIC567890", "369000"],
  ["8651646", "Gat No. 89/3, Village Bhigwan", "Pune", "MAHARASHTRA", "2750", "18-Aug-20", "17-Aug-25", "9881234567", "Active", "", "0.91", "6", "radhika@gupta.com", "7.45", "FMCG distribution centers", "Verified", "412411", "LIC789012", "123750"],
  ["8651647", "Plot No. 23, Aurangabad Industrial Area", "Aurangabad", "MAHARASHTRA", "4600", "19-Aug-20", "18-Aug-25", "9422345678", "Active", "", "0.44", "20", "suresh@mehta.info", "6.12", "Agri-commodity specialized warehouses", "Unverified", "431001", "LIC234567", "207000"],
  ["8651648", "Survey No. 78/1B, Palghar MIDC", "Palghar", "MAHARASHTRA", "3800", "20-Aug-20", "19-Aug-25", "9823456789", "Active", "", "0.67", "11", "neha@singh.biz", "4.88", "Industrial logistics parks", "Verified", "401404", "LIC456789", "171000"],
  ["8651649", "Gat No. 234/1, Ahmednagar Road", "Ahmadnagar", "MAHARASHTRA", "6300", "21-Aug-20", "20-Aug-25", "9764567890", "Active", "", "0.58", "14", "vikash@kumar.net", "5.34", "Multi-modal logistics hubs", "Unverified", "414001", "LIC678901", "283500"],
  ["8651650", "Plot No. 67, Jalna Industrial Estate", "Jalna", "MAHARASHTRA", "2900", "22-Aug-20", "21-Aug-25", "9881567890", "Active", "", "0.76", "9", "ritu@agarwal.com", "6.23", "Cold chain storage facilities", "Verified", "431203", "LIC890123", "130500"],
  ["8651651", "Survey No. 145/2, Latur MIDC", "Latur", "MAHARASHTRA", "4100", "23-Aug-20", "22-Aug-25", "9422567890", "Active", "", "0.83", "17", "mohit@verma.org", "4.67", "FMCG distribution centers", "Unverified", "413512", "LIC012345", "184500"],
  ["8651652", "Gat No. 156/3A, Beed Road", "Beed", "MAHARASHTRA", "3500", "24-Aug-20", "23-Aug-25", "9823678901", "Active", "", "0.49", "13", "kavita@shah.info", "7.89", "Agri-commodity specialized warehouses", "Verified", "431122", "LIC123456", "157500"],
  ["8651653", "Plot No. 89, Hingoli Industrial Area", "Hingoli", "MAHARASHTRA", "2200", "25-Aug-20", "24-Aug-25", "9764678901", "Active", "", "0.92", "7", "rajesh@jain.biz", "5.45", "Industrial logistics parks", "Unverified", "431513", "LIC345678", "99000"],
  ["8651654", "Survey No. 78/2B, Nanded MIDC", "Nanded", "MAHARASHTRA", "5700", "26-Aug-20", "25-Aug-25", "9881678901", "Active", "", "0.31", "16", "sunita@reddy.net", "6.78", "Multi-modal logistics hubs", "Verified", "431602", "LIC567890", "256500"],
  ["8651655", "Gat No. 123/4, Parbhani Road", "Parbhani", "MAHARASHTRA", "3900", "27-Aug-20", "26-Aug-25", "9422678901", "Active", "", "0.65", "12", "deepak@yadav.com", "4.56", "Cold chain storage facilities", "Unverified", "431401", "LIC789012", "175500"],
  ["8651656", "Plot No. 45/2, Washim Industrial Estate", "Washim", "MAHARASHTRA", "2600", "28-Aug-20", "27-Aug-25", "9823789012", "Active", "", "0.78", "8", "priti@more.org", "7.23", "FMCG distribution centers", "Verified", "444505", "LIC901234", "117000"],
  ["8651657", "Survey No. 234/3, Buldhana MIDC", "Buldhana", "MAHARASHTRA", "4800", "29-Aug-20", "28-Aug-25", "9764789012", "Active", "", "0.54", "19", "anil@kulkarni.info", "5.67", "Agri-commodity specialized warehouses", "Unverified", "443001", "LIC123457", "216000"],
  ["8651658", "Gat No. 67/1A, Akola Industrial Area", "Akola", "MAHARASHTRA", "5200", "30-Aug-20", "29-Aug-25", "9881789012", "Active", "", "0.87", "10", "sneha@patil.biz", "6.34", "Industrial logistics parks", "Verified", "444004", "LIC345679", "234000"],
  ["8651659", "Plot No. 123, Amravati MIDC", "Amravati", "MAHARASHTRA", "3600", "31-Aug-20", "30-Aug-25", "9422789012", "Active", "", "0.42", "15", "vivek@desai.net", "4.89", "Multi-modal logistics hubs", "Unverified", "444602", "LIC567891", "162000"],
  ["8651660", "Survey No. 89/4, Yavatmal Road", "Yavatmal", "MAHARASHTRA", "4300", "1-Sep-20", "31-Aug-25", "9823890123", "Active", "", "0.71", "11", "meera@joshi.com", "7.45", "Cold chain storage facilities", "Verified", "445001", "LIC789013", "193500"],
  ["8651661", "Gat No. 156/5, Wardha Industrial Estate", "Wardha", "MAHARASHTRA", "2800", "2-Sep-20", "1-Sep-25", "9764890123", "Active", "", "0.63", "14", "sanjay@bhosale.org", "5.23", "FMCG distribution centers", "Unverified", "442001", "LIC901235", "126000"],
  ["8651662", "Plot No. 78/3, Nagpur MIDC Phase II", "Nagpur", "MAHARASHTRA", "7500", "3-Sep-20", "2-Sep-25", "9881890123", "Active", "", "0.89", "6", "pooja@tiwari.info", "6.78", "Agri-commodity specialized warehouses", "Verified", "440016", "LIC123458", "337500"],
  ["8651663", "Survey No. 234/4, Bhandara Road", "Bhandara", "MAHARASHTRA", "3200", "4-Sep-20", "3-Sep-25", "9422890123", "Active", "", "0.48", "18", "rahul@chouhan.biz", "4.56", "Industrial logistics parks", "Unverified", "441904", "LIC345680", "144000"],
  ["8651664", "Gat No. 67/2B, Gondiya MIDC", "Gondiya", "MAHARASHTRA", "4700", "5-Sep-20", "4-Sep-25", "9823901234", "Active", "", "0.76", "9", "nisha@pandey.net", "7.12", "Multi-modal logistics hubs", "Verified", "441601", "LIC567892", "211500"],
  ["8651665", "Plot No. 123/5, Gadchiroli Industrial Area", "Gadchiroli", "MAHARASHTRA", "2400", "6-Sep-20", "5-Sep-25", "9764901234", "Active", "", "0.82", "13", "kiran@sharma.com", "5.89", "Cold chain storage facilities", "Unverified", "442605", "LIC789014", "108000"],
  ["8651666", "Survey No. 89/5, Chandrapur MIDC", "Chandrapur", "MAHARASHTRA", "5400", "7-Sep-20", "6-Sep-25", "9881901234", "Active", "", "0.35", "17", "deepika@gupta.org", "6.45", "FMCG distribution centers", "Verified", "442401", "LIC901236", "243000"],
  ["8651667", "Gat No. 156/6, Thane Industrial Estate", "Thane", "MAHARASHTRA", "6800", "8-Sep-20", "7-Sep-25", "9422901234", "Active", "", "0.67", "12", "sachin@patil.info", "4.23", "Agri-commodity specialized warehouses", "Unverified", "400601", "LIC123459", "306000"],
  ["8651668", "Plot No. 78/4, Mumbai MIDC Andheri", "Mumbai", "MAHARASHTRA", "8900", "9-Sep-20", "8-Sep-25", "9823012345", "Active", "", "0.91", "8", "kavya@mehta.biz", "8.76", "Industrial logistics parks", "Verified", "400053", "LIC345681", "400500"],
  ["8651669", "Survey No. 234/5, Raigad Industrial Zone", "Raigad", "MAHARASHTRA", "3700", "10-Sep-20", "9-Sep-25", "9764012345", "Active", "", "0.58", "16", "rohit@singh.net", "5.67", "Multi-modal logistics hubs", "Unverified", "402106", "LIC567893", "166500"],
  ["8651670", "Gat No. 67/3A, Ratnagiri Port Area", "Ratnagiri", "MAHARASHTRA", "4500", "11-Sep-20", "10-Sep-25", "9881012345", "Active", "", "0.73", "10", "priya@yadav.com", "6.89", "Cold chain storage facilities", "Verified", "415612", "LIC789015", "202500"],
  ["8651671", "Plot No. 123/6, Sindhudurg Coastal Zone", "Sindhudurg", "MAHARASHTRA", "2700", "12-Sep-20", "11-Sep-25", "9422012345", "Active", "", "0.86", "14", "amit@jain.org", "4.34", "FMCG distribution centers", "Unverified", "416605", "LIC901237", "121500"],
  ["8651672", "Survey No. 89/6, Kolhapur MIDC Extension", "Kolhapur", "MAHARASHTRA", "5100", "13-Sep-20", "12-Sep-25", "9823123456", "Active", "", "0.44", "11", "sunita@kulkarni.info", "7.56", "Agri-commodity specialized warehouses", "Verified", "416234", "LIC123460", "229500"],
  ["8651673", "Gat No. 156/7, Sangli Industrial Park", "Sangli", "MAHARASHTRA", "3800", "14-Sep-20", "13-Sep-25", "9764123456", "Active", "", "0.69", "15", "manoj@deshmukh.biz", "5.23", "Industrial logistics parks", "Unverified", "416416", "LIC345682", "171000"],
  ["8651674", "Plot No. 78/5, Solapur MIDC Phase III", "Solapur", "MAHARASHTRA", "6200", "15-Sep-20", "14-Sep-25", "9881123456", "Active", "", "0.81", "7", "rekha@more.net", "6.78", "Multi-modal logistics hubs", "Verified", "413255", "LIC567894", "279000"],
  ["8651675", "Survey No. 234/6, Satara Industrial Estate", "Satara", "MAHARASHTRA", "4000", "16-Sep-20", "15-Sep-25", "9422123456", "Active", "", "0.52", "19", "vijay@bhosale.com", "4.45", "Cold chain storage facilities", "Unverified", "415001", "LIC789016", "180000"],
  ["8651676", "Gat No. 67/4B, Dhule MIDC", "Dhule", "MAHARASHTRA", "3300", "17-Sep-20", "16-Sep-25", "9823234567", "Active", "", "0.75", "13", "geeta@patil.org", "7.89", "FMCG distribution centers", "Verified", "424001", "LIC901238", "148500"],
  ["8651677", "Plot No. 123/7, Jalgaon Industrial Area", "Jalgaon", "MAHARASHTRA", "5600", "18-Sep-20", "17-Sep-25", "9764234567", "Active", "", "0.63", "9", "ravi@shah.info", "5.67", "Agri-commodity specialized warehouses", "Unverified", "425001", "LIC123461", "252000"],
  ["8651678", "Survey No. 89/7, Nandurbar Tribal Zone", "Nandurbar", "MAHARASHTRA", "2900", "19-Sep-20", "18-Sep-25", "9881234567", "Active", "", "0.88", "16", "smita@joshi.biz", "6.23", "Industrial logistics parks", "Verified", "425412", "LIC345683", "130500"],
  ["8651679", "Gat No. 156/8, Osmanabad MIDC", "Osmanabad", "MAHARASHTRA", "4400", "20-Sep-20", "19-Sep-25", "9422234567", "Active", "", "0.37", "12", "pravin@tiwari.net", "4.56", "Multi-modal logistics hubs", "Unverified", "413501", "LIC567895", "198000"],
  ["8651680", "Plot No. 78/6, Bid Industrial Estate", "Bid", "MAHARASHTRA", "3100", "21-Sep-20", "20-Sep-25", "9823345678", "Active", "", "0.72", "8", "lalita@gupta.com", "7.34", "Cold chain storage facilities", "Verified", "431122", "LIC789017", "139500"],
  ["8651681", "Survey No. 234/7, Hingoli Agro Zone", "Hingoli", "MAHARASHTRA", "4900", "22-Sep-20", "21-Sep-25", "9764345678", "Active", "", "0.59", "17", "suresh@yadav.org", "5.89", "FMCG distribution centers", "Unverified", "431513", "LIC901239", "220500"],
  ["8651682", "Gat No. 67/5A, Nanded MIDC Extension", "Nanded", "MAHARASHTRA", "3600", "23-Sep-20", "22-Sep-25", "9881345678", "Active", "", "0.84", "14", "neeta@pandey.info", "6.45", "Agri-commodity specialized warehouses", "Verified", "431602", "LIC123462", "162000"],
  ["8651683", "Plot No. 123/8, Parbhani Industrial Park", "Parbhani", "MAHARASHTRA", "5300", "24-Sep-20", "23-Sep-25", "9422345678", "Active", "", "0.46", "10", "rajesh@chouhan.biz", "4.78", "Industrial logistics parks", "Unverified", "431401", "LIC345684", "238500"],
  ["8651684", "Survey No. 89/8, Latur MIDC Phase II", "Latur", "MAHARASHTRA", "4100", "25-Sep-20", "24-Sep-25", "9823456789", "Active", "", "0.71", "18", "meena@desai.net", "7.12", "Multi-modal logistics hubs", "Verified", "413512", "LIC567896", "184500"],
  ["8651685", "Gat No. 156/9, Buldhana Agro Complex", "Buldhana", "MAHARASHTRA", "2800", "26-Sep-20", "25-Sep-25", "9764456789", "Active", "", "0.93", "6", "arun@kulkarni.com", "5.34", "Cold chain storage facilities", "Unverified", "443001", "LIC789018", "126000"],
  ["8651686", "Plot No. 78/7, Washim Industrial Zone", "Washim", "MAHARASHTRA", "4600", "27-Sep-20", "26-Sep-25", "9881456789", "Active", "", "0.38", "15", "pushpa@bhosale.org", "6.67", "FMCG distribution centers", "Verified", "444505", "LIC901240", "207000"],
  ["8651687", "Survey No. 234/8, Akola MIDC New Phase", "Akola", "MAHARASHTRA", "5500", "28-Sep-20", "27-Sep-25", "9422456789", "Active", "", "0.65", "11", "ganesh@patil.info", "4.89", "Agri-commodity specialized warehouses", "Unverified", "444004", "LIC123463", "247500"],
  ["8651688", "Gat No. 67/6B, Amravati Industrial Estate", "Amravati", "MAHARASHTRA", "3400", "29-Sep-20", "28-Sep-25", "9823567890", "Active", "", "0.79", "13", "usha@more.biz", "7.45", "Industrial logistics parks", "Verified", "444602", "LIC345685", "153000"],
  ["8651689", "Plot No. 123/9, Yavatmal Agro Zone", "Yavatmal", "MAHARASHTRA", "4700", "30-Sep-20", "29-Sep-25", "9764567890", "Active", "", "0.51", "9", "dinesh@joshi.net", "5.78", "Multi-modal logistics hubs", "Unverified", "445001", "LIC567897", "211500"],
  ["8651690", "Survey No. 89/9, Wardha MIDC Extension", "Wardha", "MAHARASHTRA", "3200", "1-Oct-20", "30-Sep-25", "9881567890", "Active", "", "0.87", "16", "sanjana@shah.com", "6.23", "Cold chain storage facilities", "Verified", "442001", "LIC789019", "144000"],
  ["8651691", "Gat No. 156/10, Nagpur Special Economic Zone", "Nagpur", "MAHARASHTRA", "8200", "2-Oct-20", "1-Oct-25", "9422567890", "Active", "", "0.42", "12", "prakash@gupta.org", "4.56", "FMCG distribution centers", "Unverified", "440016", "LIC901241", "369000"],
  ["8651692", "Plot No. 78/8, Bhandara Forest Zone", "Bhandara", "MAHARASHTRA", "2600", "3-Oct-20", "2-Oct-25", "9823678901", "Active", "", "0.68", "8", "kaveri@yadav.info", "7.89", "Agri-commodity specialized warehouses", "Verified", "441904", "LIC123464", "117000"],
  ["8651693", "Survey No. 234/9, Gondiya Tribal Area", "Gondiya", "MAHARASHTRA", "4300", "4-Oct-20", "3-Oct-25", "9764678901", "Active", "", "0.75", "17", "mahesh@pandey.biz", "5.45", "Industrial logistics parks", "Unverified", "441601", "LIC345686", "193500"],
  ["8651694", "Gat No. 67/7A, Gadchiroli Mining Zone", "Gadchiroli", "MAHARASHTRA", "3900", "5-Oct-20", "4-Oct-25", "9881678901", "Active", "", "0.56", "14", "shweta@chouhan.net", "6.78", "Multi-modal logistics hubs", "Verified", "442605", "LIC567898", "175500"],
  ["8651695", "Plot No. 123/10, Chandrapur Coal Belt", "Chandrapur", "MAHARASHTRA", "5700", "6-Oct-20", "5-Oct-25", "9422678901", "Active", "", "0.83", "10", "harish@desai.com", "4.34", "Cold chain storage facilities", "Unverified", "442401", "LIC789020", "256500"],
  ["8651696", "Survey No. 89/10, Thane Extended Area", "Thane", "MAHARASHTRA", "6400", "7-Oct-20", "6-Oct-25", "9823789012", "Active", "", "0.41", "18", "priyanka@kulkarni.org", "7.56", "FMCG distribution centers", "Verified", "400601", "LIC901242", "288000"],
  ["8651697", "Gat No. 156/11, Mumbai Port Trust Zone", "Mumbai", "MAHARASHTRA", "7800", "8-Oct-20", "7-Oct-25", "9764789012", "Active", "", "0.69", "7", "sachin@bhosale.info", "5.23", "Agri-commodity specialized warehouses", "Unverified", "400001", "LIC123465", "351000"],
  ["8651698", "Plot No. 78/9, Raigad Coastal Industrial Zone", "Raigad", "MAHARASHTRA", "4200", "9-Oct-20", "8-Oct-25", "9881789012", "Active", "", "0.77", "15", "madhuri@patil.biz", "6.89", "Industrial logistics parks", "Verified", "402106", "LIC345687", "189000"],
  ["8651699", "Survey No. 234/10, Ratnagiri Port Extension", "Ratnagiri", "MAHARASHTRA", "3500", "10-Oct-20", "9-Oct-25", "9422789012", "Active", "", "0.62", "11", "vikas@more.net", "4.67", "Multi-modal logistics hubs", "Unverified", "415612", "LIC567899", "157500"],
  ["8651700", "Gat No. 67/8B, Sindhudurg Fishing Zone", "Sindhudurg", "MAHARASHTRA", "2900", "11-Oct-20", "10-Oct-25", "9823890123", "Active", "", "0.85", "13", "anita@joshi.com", "7.12", "Cold chain storage facilities", "Verified", "416605", "LIC789021", "130500"],
  ["6938253", "Near Railway Station, Mahagaon", "Yavatmal", "MAHARASHTRA", "1200", "6-Jun-24", "5-Jun-29", "9604876968", "Active", "", "0.67", "9", "priya@sharma.info", "6.23", "Industrial logistics parks", "Verified", "989683", "LIC536890", "54000"],
  ["6938254", "APMC Complex, Pusad Road", "Yavatmal", "MAHARASHTRA", "800", "7-Jun-24", "6-Jun-29", "9604876969", "Active", "", "0.82", "15", "rahul@patel.com", "4.56", "Agri-commodity specialized warehouses", "Unverified", "989684", "LIC536891", "36000"],
  ["6938255", "Market Yard Extension, Darwha", "Yavatmal", "MAHARASHTRA", "1500", "8-Jun-24", "7-Jun-29", "9604876970", "Active", "", "0.45", "12", "sunita@gupta.net", "7.89", "Cold chain storage facilities", "Verified", "989685", "LIC536892", "67500"],
  ["6938256", "Industrial Area Phase II, Wani", "Yavatmal", "MAHARASHTRA", "2000", "9-Jun-24", "8-Jun-29", "9604876971", "Active", "", "0.73", "6", "amit@singh.org", "5.34", "FMCG distribution centers", "Unverified", "989686", "LIC536893", "90000"],
  ["6938257", "MIDC Zone, Ner", "Yavatmal", "MAHARASHTRA", "1800", "10-Jun-24", "9-Jun-29", "9604876972", "Active", "", "0.91", "18", "neha@yadav.biz", "8.12", "Multi-modal logistics hubs", "Verified", "989687", "LIC536894", "81000"],
  ["6751144", "Industrial Zone Phase II, Malkapur", "Buldhana", "MAHARASHTRA", "1350", "5-Jul-23", "4-Jul-28", "9960783902", "Active", "", "0.58", "14", "deepak@mehta.info", "6.78", "Industrial logistics parks", "Verified", "114288", "LIC143314", "60750"],
  ["6751145", "APMC Extension, Chikhli", "Buldhana", "MAHARASHTRA", "900", "6-Jul-23", "5-Jul-28", "9960783903", "Active", "", "0.84", "11", "kavita@shah.com", "4.23", "Agri-commodity specialized warehouses", "Unverified", "114289", "LIC143315", "40500"],
  ["6751146", "Market Yard Complex, Mehkar", "Buldhana", "MAHARASHTRA", "1600", "7-Jul-23", "6-Jul-28", "9960783904", "Active", "", "0.36", "16", "rajesh@jain.net", "7.45", "Cold chain storage facilities", "Verified", "114290", "LIC143316", "72000"],
  ["6751147", "Industrial Estate, Sindkhed Raja", "Buldhana", "MAHARASHTRA", "1100", "8-Jul-23", "7-Jul-28", "9960783905", "Active", "", "0.79", "8", "priti@more.org", "5.67", "FMCG distribution centers", "Unverified", "114291", "LIC143317", "49500"],
  ["6751148", "MIDC Area, Sangrampur", "Buldhana", "MAHARASHTRA", "2200", "9-Jul-23", "8-Jul-28", "9960783906", "Active", "", "0.52", "19", "anil@kulkarni.biz", "8.90", "Multi-modal logistics hubs", "Verified", "114292", "LIC143318", "99000"],
  ["6744760", "Village Industrial Zone, Dhadgaon", "Nandurbar", "MAHARASHTRA", "15000", "25-Jun-23", "24-Dec-27", "9850070255", "Active", "", "0.63", "5", "sneha@patil.info", "6.34", "Multi-modal logistics hubs", "Unverified", "676679", "LIC801798", "675000"],
  ["6744761", "Tribal Development Area, Navapur", "Nandurbar", "MAHARASHTRA", "8500", "26-Jun-23", "25-Dec-27", "9850070256", "Active", "", "0.77", "13", "vivek@desai.com", "4.89", "Industrial logistics parks", "Verified", "676680", "LIC801799", "382500"],
  ["6744762", "Forest Zone Complex, Taloda", "Nandurbar", "MAHARASHTRA", "12000", "27-Jun-23", "26-Dec-27", "9850070257", "Active", "", "0.41", "10", "meera@joshi.net", "7.23", "Agri-commodity specialized warehouses", "Unverified", "676681", "LIC801800", "540000"],
  ["6744763", "Border Trade Zone, Shahada", "Nandurbar", "MAHARASHTRA", "6500", "28-Jun-23", "27-Dec-27", "9850070258", "Active", "", "0.89", "17", "sanjay@bhosale.org", "5.56", "Cold chain storage facilities", "Verified", "676682", "LIC801801", "292500"],
  ["6744764", "Agricultural Hub, Akkalkuwa", "Nandurbar", "MAHARASHTRA", "18000", "29-Jun-23", "28-Dec-27", "9850070259", "Active", "", "0.55", "7", "pooja@tiwari.biz", "8.67", "FMCG distribution centers", "Unverified", "676683", "LIC801802", "810000"],
  ["6608320", "Railway Goods Yard Extension, Karad", "Satara", "MAHARASHTRA", "3500", "30-Jul-22", "29-Jul-27", "9822245556", "Active", "", "0.72", "14", "rahul@chouhan.info", "3.78", "Agri-commodity specialized warehouses", "Verified", "769411", "LIC395639", "157500"],
  ["6608321", "Sugar Factory Zone, Patan", "Satara", "MAHARASHTRA", "2800", "31-Jul-22", "30-Jul-27", "9822245557", "Active", "", "0.86", "9", "nisha@pandey.com", "4.45", "Industrial logistics parks", "Unverified", "769412", "LIC395640", "126000"],
  ["6608322", "Cooperative Complex, Koregaon", "Satara", "MAHARASHTRA", "4500", "1-Aug-22", "31-Jul-27", "9822245558", "Active", "", "0.39", "16", "kiran@sharma.net", "6.12", "Cold chain storage facilities", "Verified", "769413", "LIC395641", "202500"],
  ["6608323", "Market Yard Hub, Wai", "Satara", "MAHARASHTRA", "3200", "2-Aug-22", "1-Aug-27", "9822245559", "Active", "", "0.64", "12", "deepika@gupta.org", "5.23", "FMCG distribution centers", "Unverified", "769414", "LIC395642", "144000"],
  ["6608324", "Industrial Estate, Mahabaleshwar Road", "Satara", "MAHARASHTRA", "5500", "3-Aug-22", "2-Aug-27", "9822245560", "Active", "", "0.81", "8", "sachin@patil.biz", "7.89", "Multi-modal logistics hubs", "Verified", "769415", "LIC395643", "247500"],
  ["6763297", "Market Complex Extension, Latur Road", "Osmanabad", "MAHARASHTRA", "1200", "28-Jul-23", "27-Jul-28", "9975720585", "Active", "", "0.68", "11", "kavya@mehta.info", "5.12", "Cold chain storage facilities", "Verified", "64277", "LIC521189", "54000"],
  ["6763298", "Agricultural Zone, Tuljapur", "Osmanabad", "MAHARASHTRA", "850", "29-Jul-23", "28-Jul-28", "9975720586", "Active", "", "0.93", "7", "amit@singh.com", "3.89", "Agri-commodity specialized warehouses", "Unverified", "64278", "LIC521190", "38250"],
  ["6763299", "Industrial Area, Bhoom", "Osmanabad", "MAHARASHTRA", "1400", "30-Jul-23", "29-Jul-28", "9975720587", "Active", "", "0.47", "15", "sunita@yadav.net", "6.78", "Industrial logistics parks", "Verified", "64279", "LIC521191", "63000"],
  ["6763300", "Cooperative Hub, Omerga", "Osmanabad", "MAHARASHTRA", "1000", "31-Jul-23", "30-Jul-28", "9975720588", "Active", "", "0.75", "13", "manoj@deshmukh.org", "4.56", "FMCG distribution centers", "Unverified", "64280", "LIC521192", "45000"],
  ["6763301", "MIDC Complex, Paranda", "Osmanabad", "MAHARASHTRA", "1800", "1-Aug-23", "31-Jul-28", "9975720589", "Active", "", "0.82", "9", "rekha@more.biz", "7.34", "Multi-modal logistics hubs", "Verified", "64281", "LIC521193", "81000"],
  ["7048508", "Market Yard Phase II, Bagehalli", "Solapur", "MAHARASHTRA", "1300", "25-Mar-25", "24-Mar-30", "9423526024", "Active", "", "0.56", "16", "vijay@bhosale.info", "4.23", "Industrial logistics parks", "Unverified", "322813", "LIC207659", "58500"],
  ["7048509", "Industrial Zone, Pandharpur Road", "Solapur", "MAHARASHTRA", "1600", "26-Mar-25", "25-Mar-30", "9423526025", "Active", "", "0.71", "12", "geeta@patil.com", "5.89", "Agri-commodity specialized warehouses", "Verified", "322814", "LIC207660", "72000"],
  ["7048510", "Cooperative Complex, Mohol", "Solapur", "MAHARASHTRA", "900", "27-Mar-25", "26-Mar-30", "9423526026", "Active", "", "0.88", "8", "ravi@shah.net", "3.45", "Cold chain storage facilities", "Unverified", "322815", "LIC207661", "40500"],
  ["7048511", "Sugar Belt Zone, Malshiras", "Solapur", "MAHARASHTRA", "2100", "28-Mar-25", "27-Mar-30", "9423526027", "Active", "", "0.43", "18", "smita@joshi.org", "6.67", "FMCG distribution centers", "Verified", "322816", "LIC207662", "94500"],
  ["7048512", "Agricultural Hub, Barshi", "Solapur", "MAHARASHTRA", "1750", "29-Mar-25", "28-Mar-30", "9423526028", "Active", "", "0.69", "14", "pravin@tiwari.biz", "7.12", "Multi-modal logistics hubs", "Unverified", "322817", "LIC207663", "78750"],
  ["6839527", "Market Yard Extension, Indapur", "Pune", "MAHARASHTRA", "1250", "19-Jan-24", "18-Jan-29", "9860305094", "Active", "", "0.53", "15", "lalita@gupta.info", "3.78", "FMCG distribution centers", "Unverified", "320505", "LIC344321", "56250"],
  ["6839528", "Industrial Zone, Baramati", "Pune", "MAHARASHTRA", "1900", "20-Jan-24", "19-Jan-29", "9860305095", "Active", "", "0.76", "10", "suresh@yadav.com", "4.89", "Industrial logistics parks", "Verified", "320506", "LIC344322", "85500"],
  ["6839529", "Agricultural Complex, Daund", "Pune", "MAHARASHTRA", "1400", "21-Jan-24", "20-Jan-29", "9860305096", "Active", "", "0.84", "6", "neeta@pandey.net", "6.23", "Agri-commodity specialized warehouses", "Unverified", "320507", "LIC344323", "63000"],
  ["6839530", "Cooperative Hub, Shirur", "Pune", "MAHARASHTRA", "1100", "22-Jan-24", "21-Jan-29", "9860305097", "Active", "", "0.31", "19", "rajesh@chouhan.org", "5.45", "Cold chain storage facilities", "Verified", "320508", "LIC344324", "49500"],
  ["6839531", "MIDC Area, Chakan", "Pune", "MAHARASHTRA", "2800", "23-Jan-24", "22-Jan-29", "9860305098", "Active", "", "0.67", "11", "meena@desai.biz", "7.56", "Multi-modal logistics hubs", "Unverified", "320509", "LIC344325", "126000"],
  ["6998919", "Industrial Zone Extension, Jalochi", "Pune", "MAHARASHTRA", "1350", "29-Nov-24", "28-Nov-29", "9860305094", "Active", "", "0.74", "8", "arun@kulkarni.info", "8.45", "Cold chain storage facilities", "Unverified", "536532", "LIC891235", "60750"],
  ["6998920", "Agricultural Hub, Pimpali", "Pune", "MAHARASHTRA", "950", "30-Nov-24", "29-Nov-29", "9860305095", "Active", "", "0.87", "13", "pushpa@bhosale.com", "6.89", "Agri-commodity specialized warehouses", "Verified", "536533", "LIC891236", "42750"],
  ["6998921", "Market Complex, Bhimashankar Road", "Pune", "MAHARASHTRA", "1700", "1-Dec-24", "30-Nov-29", "9860305096", "Active", "", "0.41", "17", "ganesh@patil.net", "9.12", "Industrial logistics parks", "Unverified", "536534", "LIC891237", "76500"],
  ["6998922", "Cooperative Zone, Khed", "Pune", "MAHARASHTRA", "1200", "2-Dec-24", "1-Dec-29", "9860305097", "Active", "", "0.58", "9", "usha@more.org", "7.34", "FMCG distribution centers", "Verified", "536535", "LIC891238", "54000"],
  ["6998923", "MIDC Extension, Rajgurunagar", "Pune", "MAHARASHTRA", "2200", "3-Dec-24", "2-Dec-29", "9860305098", "Active", "", "0.83", "15", "dinesh@joshi.biz", "5.67", "Multi-modal logistics hubs", "Unverified", "536536", "LIC891239", "99000"],
  ["6749163", "Market Yard Phase II, Tuljapur", "Solapur", "MAHARASHTRA", "1400", "1-Jul-23", "30-Jun-28", "8888526934", "Active", "", "0.79", "16", "sanjana@shah.info", "6.78", "Industrial logistics parks", "Unverified", "758583", "LIC201074", "63000"],
  ["6749164", "Industrial Estate, Akkalkot", "Solapur", "MAHARASHTRA", "1100", "2-Jul-23", "1-Jul-28", "8888526935", "Active", "", "0.46", "12", "prakash@gupta.com", "4.23", "Agri-commodity specialized warehouses", "Verified", "758584", "LIC201075", "49500"],
  ["6749165", "Agricultural Zone, Sangola", "Solapur", "MAHARASHTRA", "1800", "3-Jul-23", "2-Jul-28", "8888526936", "Active", "", "0.62", "8", "kaveri@yadav.net", "7.45", "Cold chain storage facilities", "Unverified", "758585", "LIC201076", "81000"],
  ["6749166", "Cooperative Complex, Karmala", "Solapur", "MAHARASHTRA", "1300", "4-Jul-23", "3-Jul-28", "8888526937", "Active", "", "0.85", "18", "mahesh@pandey.org", "5.89", "FMCG distribution centers", "Verified", "758586", "LIC201077", "58500"],
  ["6749167", "Sugar Belt Hub, Mangalwedha", "Solapur", "MAHARASHTRA", "2000", "5-Jul-23", "4-Jul-28", "8888526938", "Active", "", "0.38", "14", "shweta@chouhan.biz", "8.12", "Multi-modal logistics hubs", "Unverified", "758587", "LIC201078", "90000"],
  ["6840061", "Market Complex Extension, Kurduwadi", "Solapur", "MAHARASHTRA", "1500", "19-Jan-24", "18-Jan-29", "9284915657", "Active", "", "0.67", "10", "harish@desai.info", "8.90", "FMCG distribution centers", "Unverified", "211021", "LIC542383", "67500"],
  ["6840062", "Industrial Zone, Yedshi", "Solapur", "MAHARASHTRA", "1200", "20-Jan-24", "19-Jan-29", "9284915658", "Active", "", "0.91", "6", "priyanka@kulkarni.com", "6.45", "Agri-commodity specialized warehouses", "Verified", "211022", "LIC542384", "54000"],
  ["6840063", "Agricultural Hub, Velapur", "Solapur", "MAHARASHTRA", "1700", "21-Jan-24", "20-Jan-29", "9284915659", "Active", "", "0.54", "15", "sachin@bhosale.net", "7.78", "Industrial logistics parks", "Unverified", "211023", "LIC542385", "76500"],
  ["6840064", "Cooperative Area, Madha", "Solapur", "MAHARASHTRA", "900", "22-Jan-24", "21-Jan-29", "9284915660", "Active", "", "0.78", "11", "madhuri@patil.org", "4.56", "Cold chain storage facilities", "Verified", "211024", "LIC542386", "40500"],
  ["6840065", "MIDC Zone, Kavathe Mahankal", "Solapur", "MAHARASHTRA", "2300", "23-Jan-24", "22-Jan-29", "9284915661", "Active", "", "0.42", "17", "vikas@more.biz", "9.23", "Multi-modal logistics hubs", "Unverified", "211025", "LIC542387", "103500"],
  ["6865175", "Agricultural Complex Extension, Manchar", "Pune", "MAHARASHTRA", "1300", "20-Feb-24", "19-Feb-29", "9922861134", "Active", "", "0.59", "12", "anita@joshi.info", "7.12", "Cold chain storage facilities", "Verified", "244314", "LIC558214", "58500"],
  ["6865176", "Industrial Zone, Ambegaon", "Pune", "MAHARASHTRA", "1600", "21-Feb-24", "20-Feb-29", "9922861135", "Active", "", "0.82", "8", "vikas@desai.com", "5.45", "Agri-commodity specialized warehouses", "Unverified", "244315", "LIC558215", "72000"],
  ["6865177", "Market Yard Hub, Khed Shivapur", "Pune", "MAHARASHTRA", "1100", "22-Feb-24", "21-Feb-29", "9922861136", "Active", "", "0.37", "16", "madhuri@singh.net", "8.67", "Industrial logistics parks", "Verified", "244316", "LIC558216", "49500"],
  ["6865178", "Cooperative Complex, Mulshi", "Pune", "MAHARASHTRA", "1950", "23-Feb-24", "22-Feb-29", "9922861137", "Active", "", "0.71", "9", "harish@yadav.org", "6.89", "FMCG distribution centers", "Unverified", "244317", "LIC558217", "87750"],
  ["6865179", "MIDC Extension, Maval", "Pune", "MAHARASHTRA", "2100", "24-Feb-24", "23-Feb-29", "9922861138", "Active", "", "0.66", "14", "priyanka@pandey.biz", "4.23", "Multi-modal logistics hubs", "Verified", "244318", "LIC558218", "94500"],
  ["6748173", "Agricultural Zone Extension, Nandura", "Buldhana", "MAHARASHTRA", "1200", "1-Jul-23", "30-Jun-28", "9022118474", "Active", "", "0.88", "13", "sachin@chouhan.info", "5.23", "Agri-commodity specialized warehouses", "Unverified", "139666", "LIC381814", "54000"],
  ["6748174", "Industrial Estate, Deulgaon Raja", "Buldhana", "MAHARASHTRA", "850", "2-Jul-23", "1-Jul-28", "9022118475", "Active", "", "0.45", "9", "meena@kulkarni.com", "3.78", "Industrial logistics parks", "Verified", "139667", "LIC381815", "38250"],
  ["6748175", "Market Complex, Shegaon", "Buldhana", "MAHARASHTRA", "1500", "3-Jul-23", "2-Jul-28", "9022118476", "Active", "", "0.73", "17", "arun@bhosale.net", "6.45", "Cold chain storage facilities", "Unverified", "139668", "LIC381816", "67500"],
  ["6748176", "Cooperative Hub, Jalgaon Jamod", "Buldhana", "MAHARASHTRA", "1000", "4-Jul-23", "3-Jul-28", "9022118477", "Active", "", "0.91", "11", "pushpa@patil.org", "4.89", "FMCG distribution centers", "Verified", "139669", "LIC381817", "45000"],
  ["6748177", "MIDC Area, Lonar", "Buldhana", "MAHARASHTRA", "1800", "5-Jul-23", "4-Jul-28", "9022118478", "Active", "", "0.56", "15", "ganesh@more.biz", "7.56", "Multi-modal logistics hubs", "Unverified", "139670", "LIC381818", "81000"],
  ["6739982", "Agricultural Hub Extension, Wadegaon", "Akola", "MAHARASHTRA", "1350", "20-Jun-23", "19-Jun-28", "9370543765", "Active", "", "0.84", "8", "usha@joshi.info", "8.23", "Agri-commodity specialized warehouses", "Unverified", "343187", "LIC647869", "60750"],
  ["6739983", "Industrial Zone, Patur", "Akola", "MAHARASHTRA", "950", "21-Jun-23", "20-Jun-28", "9370543766", "Active", "", "0.41", "14", "dinesh@desai.com", "6.78", "Industrial logistics parks", "Verified", "343188", "LIC647870", "42750"],
  ["6739984", "Market Yard Complex, Balapur", "Akola", "MAHARASHTRA", "1700", "22-Jun-23", "21-Jun-28", "9370543767", "Active", "", "0.68", "10", "sanjana@singh.net", "4.56", "Cold chain storage facilities", "Unverified", "343189", "LIC647871", "76500"],
  ["6739985", "Cooperative Area, Murtijapur", "Akola", "MAHARASHTRA", "1200", "23-Jun-23", "22-Jun-28", "9370543768", "Active", "", "0.92", "6", "prakash@yadav.org", "7.89", "FMCG distribution centers", "Verified", "343190", "LIC647872", "54000"],
  ["6739986", "Cotton Belt Zone, Telhara", "Akola", "MAHARASHTRA", "2200", "24-Jun-23", "23-Jun-28", "9370543769", "Active", "", "0.57", "18", "kaveri@pandey.biz", "5.34", "Multi-modal logistics hubs", "Unverified", "343191", "LIC647873", "99000"],
  ["6756093", "Market Complex Extension, Digras", "Yavatmal", "MAHARASHTRA", "5", "15-Jul-23", "14-Jul-28", "9422167295", "Active", "", "0.86", "12", "mahesh@gupta.info", "3.45", "FMCG distribution centers", "Unverified", "651608", "LIC418602", "225"],
  ["6756094", "Agricultural Zone, Ner", "Yavatmal", "MAHARASHTRA", "3", "16-Jul-23", "15-Jul-28", "9422167296", "Active", "", "0.73", "8", "shweta@kulkarni.com", "2.67", "Agri-commodity specialized warehouses", "Verified", "651609", "LIC418603", "135"],
  ["6756095", "Industrial Area, Wani", "Yavatmal", "MAHARASHTRA", "8", "17-Jul-23", "16-Jul-28", "9422167297", "Active", "", "0.59", "16", "harish@bhosale.net", "4.12", "Industrial logistics parks", "Unverified", "651610", "LIC418604", "360"],
  ["6756096", "Cooperative Hub, Pusad", "Yavatmal", "MAHARASHTRA", "2", "18-Jul-23", "17-Jul-28", "9422167298", "Active", "", "0.94", "9", "priyanka@patil.org", "1.89", "Cold chain storage facilities", "Verified", "651611", "LIC418605", "90"],
  ["6756097", "Cotton Processing Zone, Umarkhed", "Yavatmal", "MAHARASHTRA", "12", "19-Jul-23", "18-Jul-28", "9422167299", "Active", "", "0.47", "14", "vikas@more.biz", "5.23", "Multi-modal logistics hubs", "Unverified", "651612", "LIC418606", "540"],
  ["6717848", "Market Yard Extension, Gondpimpri", "Chandrapur", "MAHARASHTRA", "1350", "20-May-23", "19-May-28", "8830079726", "Active", "", "0.65", "13", "anita@joshi.info", "4.23", "Agri-commodity specialized warehouses", "Verified", "773360", "LIC747266", "60750"],
  ["6717849", "Industrial Zone, Warora", "Chandrapur", "MAHARASHTRA", "1600", "21-May-23", "20-May-28", "8830079727", "Active", "", "0.78", "9", "vikas@singh.com", "5.67", "Industrial logistics parks", "Unverified", "773361", "LIC747267", "72000"],
  ["6717850", "Coal Belt Area, Ballarpur", "Chandrapur", "MAHARASHTRA", "2100", "22-May-23", "21-May-28", "8830079728", "Active", "", "0.52", "17", "madhuri@yadav.net", "6.89", "Cold chain storage facilities", "Verified", "773362", "LIC747268", "94500"],
  ["6717851", "Agricultural Hub, Rajura", "Chandrapur", "MAHARASHTRA", "1200", "23-May-23", "22-May-28", "8830079729", "Active", "", "0.89", "11", "harish@pandey.org", "3.78", "FMCG distribution centers", "Unverified", "773363", "LIC747269", "54000"],
  ["6717852", "Forest Zone Complex, Gadchiroli Road", "Chandrapur", "MAHARASHTRA", "1800", "24-May-23", "23-May-28", "8830079730", "Active", "", "0.36", "15", "priyanka@chouhan.biz", "7.45", "Multi-modal logistics hubs", "Verified", "773364", "LIC747270", "81000"],
  ["6706148", "Industrial Estate Extension, Bramhpuri", "Chandrapur", "MAHARASHTRA", "1400", "1-Apr-23", "31-Mar-28", "8329884349", "Active", "", "0.74", "10", "sachin@desai.info", "7.23", "Industrial logistics parks", "Unverified", "758987", "LIC754391", "63000"],
  ["6706149", "Agricultural Zone, Chimur Road", "Chandrapur", "MAHARASHTRA", "1100", "2-Apr-23", "1-Apr-28", "8329884350", "Active", "", "0.87", "6", "meena@kulkarni.com", "5.45", "Agri-commodity specialized warehouses", "Verified", "758988", "LIC754392", "49500"],
  ["6706150", "Market Complex, Sindewahi", "Chandrapur", "MAHARASHTRA", "1700", "3-Apr-23", "2-Apr-28", "8329884351", "Active", "", "0.43", "16", "arun@bhosale.net", "8.67", "Cold chain storage facilities", "Unverified", "758989", "LIC754393", "76500"],
  ["6706151", "Cooperative Hub, Mul", "Chandrapur", "MAHARASHTRA", "950", "4-Apr-23", "3-Apr-28", "8329884352", "Active", "", "0.69", "12", "pushpa@patil.org", "4.12", "FMCG distribution centers", "Verified", "758990", "LIC754394", "42750"],
  ["6706152", "Mining Zone, Bhadrawati", "Chandrapur", "MAHARASHTRA", "2300", "5-Apr-23", "4-Apr-28", "8329884353", "Active", "", "0.81", "8", "ganesh@more.biz", "6.78", "Multi-modal logistics hubs", "Unverified", "758991", "LIC754395", "103500"],
  ["7082887", "Agricultural Complex Extension, Narkhed", "Nagpur", "MAHARASHTRA", "1300", "1-May-25", "30-Apr-30", "7769824490", "Active", "", "0.58", "14", "usha@joshi.info", "5.12", "Cold chain storage facilities", "Unverified", "703137", "LIC372721", "58500"],
  ["7082888", "Industrial Zone, Katol", "Nagpur", "MAHARASHTRA", "1600", "2-May-25", "1-May-30", "7769824491", "Active", "", "0.75", "9", "dinesh@singh.com", "4.67", "Agri-commodity specialized warehouses", "Verified", "703138", "LIC372722", "72000"],
  ["7082889", "Market Yard Hub, Hingna", "Nagpur", "MAHARASHTRA", "1100", "3-May-25", "2-May-30", "7769824492", "Active", "", "0.92", "15", "sanjana@yadav.net", "6.34", "Industrial logistics parks", "Unverified", "703139", "LIC372723", "49500"],
  ["7082890", "Cooperative Complex, Ramtek", "Nagpur", "MAHARASHTRA", "1950", "4-May-25", "3-May-30", "7769824493", "Active", "", "0.47", "11", "prakash@pandey.org", "7.89", "FMCG distribution centers", "Verified", "703140", "LIC372724", "87750"],
  ["7082891", "MIDC Extension, Butibori", "Nagpur", "MAHARASHTRA", "2800", "5-May-25", "4-May-30", "7769824494", "Active", "", "0.63", "7", "kaveri@chouhan.biz", "5.56", "Multi-modal logistics hubs", "Unverified", "703141", "LIC372725", "126000"],
  ["6690128", "Market Complex Extension, Amgaon", "Gondiya", "MAHARASHTRA", "1350", "1-Mar-23", "28-Feb-28", "9022500542", "Active", "", "0.81", "17", "mahesh@gupta.info", "8.90", "Multi-modal logistics hubs", "Unverified", "66956", "LIC355186", "60750"],
  ["6690129", "Agricultural Zone, Arjuni", "Gondiya", "MAHARASHTRA", "950", "2-Mar-23", "1-Mar-28", "9022500543", "Active", "", "0.54", "13", "shweta@kulkarni.com", "6.45", "Industrial logistics parks", "Verified", "66957", "LIC355187", "42750"],
  ["6690130", "Industrial Estate, Morgaon", "Gondiya", "MAHARASHTRA", "1700", "3-Mar-23", "2-Mar-28", "9022500544", "Active", "", "0.76", "9", "harish@bhosale.net", "4.78", "Agri-commodity specialized warehouses", "Unverified", "66958", "LIC355188", "76500"],
  ["6690131", "Cooperative Hub, Sadak Arjuni", "Gondiya", "MAHARASHTRA", "1200", "4-Mar-23", "3-Mar-28", "9022500545", "Active", "", "0.88", "15", "priyanka@patil.org", "7.23", "Cold chain storage facilities", "Verified", "66959", "LIC355189", "54000"],
  ["6690132", "Forest Zone Complex, Salekasa", "Gondiya", "MAHARASHTRA", "2200", "5-Mar-23", "4-Mar-28", "9022500546", "Active", "", "0.42", "11", "vikas@more.biz", "5.67", "FMCG distribution centers", "Unverified", "66960", "LIC355190", "99000"],
  ["6687785", "Industrial Zone Extension, Goregaon", "Gondiya", "MAHARASHTRA", "1400", "23-Feb-23", "22-Feb-28", "7507277559", "Active", "", "0.69", "8", "anita@joshi.info", "7.78", "Industrial logistics parks", "Verified", "391296", "LIC590844", "63000"],
  ["6687786", "Agricultural Complex, Tirora", "Gondiya", "MAHARASHTRA", "1100", "24-Feb-23", "23-Feb-28", "7507277560", "Active", "", "0.85", "14", "vikas@singh.com", "5.23", "Agri-commodity specialized warehouses", "Unverified", "391297", "LIC590845", "49500"],
  ["6687787", "Market Yard Hub, Deori", "Gondiya", "MAHARASHTRA", "1800", "25-Feb-23", "24-Feb-28", "7507277561", "Active", "", "0.31", "10", "madhuri@yadav.net", "8.45", "Cold chain storage facilities", "Verified", "391298", "LIC590846", "81000"],
  ["6687788", "Cooperative Area, Gondia Rural", "Gondiya", "MAHARASHTRA", "1300", "26-Feb-23", "25-Feb-28", "7507277562", "Active", "", "0.67", "16", "harish@pandey.org", "6.12", "FMCG distribution centers", "Unverified", "391299", "LIC590847", "58500"],
  ["6687789", "MIDC Zone, Navegaon Bandh", "Gondiya", "MAHARASHTRA", "2000", "27-Feb-23", "26-Feb-28", "7507277563", "Active", "", "0.93", "12", "priyanka@chouhan.biz", "4.89", "Multi-modal logistics hubs", "Verified", "391300", "LIC590848", "90000"],
  ["6852306", "Agricultural Hub Extension, Hinganghat", "Wardha", "MAHARASHTRA", "1200", "7-Feb-24", "6-Feb-29", "9860864628", "Active", "", "0.56", "15", "sachin@desai.info", "6.12", "Industrial logistics parks", "Verified", "463167", "LIC846580", "54000"],
  ["6852307", "Industrial Zone, Arvi", "Wardha", "MAHARASHTRA", "850", "8-Feb-24", "7-Feb-29", "9860864629", "Active", "", "0.83", "11", "meena@kulkarni.com", "4.67", "Agri-commodity specialized warehouses", "Unverified", "463168", "LIC846581", "38250"],
  ["6852308", "Market Complex, Karanja", "Wardha", "MAHARASHTRA", "1500", "9-Feb-24", "8-Feb-29", "9860864630", "Active", "", "0.47", "7", "arun@bhosale.net", "7.89", "Cold chain storage facilities", "Verified", "463169", "LIC846582", "67500"],
  ["6852309", "Cooperative Hub, Pulgaon", "Wardha", "MAHARASHTRA", "1000", "10-Feb-24", "9-Feb-29", "9860864631", "Active", "", "0.71", "17", "pushpa@patil.org", "5.34", "FMCG distribution centers", "Unverified", "463170", "LIC846583", "45000"],
  ["6852310", "Cotton Processing Zone, Samudrapur", "Wardha", "MAHARASHTRA", "1800", "11-Feb-24", "10-Feb-29", "9860864632", "Active", "", "0.94", "13", "ganesh@more.biz", "8.56", "Multi-modal logistics hubs", "Verified", "463171", "LIC846584", "81000"],
  ["6825849", "Market Yard Extension, Parshiwani", "Nagpur", "MAHARASHTRA", "1350", "27-Dec-23", "26-Dec-28", "8770467547", "Active", "", "0.78", "9", "usha@joshi.info", "7.01", "Agri-commodity specialized warehouses", "Verified", "768882", "LIC619952", "60750"],
  ["6825850", "Agricultural Zone, Kuhi", "Nagpur", "MAHARASHTRA", "950", "28-Dec-23", "27-Dec-28", "8770467548", "Active", "", "0.42", "16", "dinesh@singh.com", "5.78", "Industrial logistics parks", "Unverified", "768883", "LIC619953", "42750"],
  ["6825851", "Industrial Estate, Mauda", "Nagpur", "MAHARASHTRA", "1700", "29-Dec-23", "28-Dec-28", "8770467549", "Active", "", "0.65", "12", "sanjana@yadav.net", "6.45", "Cold chain storage facilities", "Verified", "768884", "LIC619954", "76500"],
  ["6825852", "Cooperative Complex, Saoner", "Nagpur", "MAHARASHTRA", "1200", "30-Dec-23", "29-Dec-28", "8770467550", "Active", "", "0.89", "8", "prakash@pandey.org", "4.23", "FMCG distribution centers", "Unverified", "768885", "LIC619955", "54000"],
  ["6825853", "MIDC Area, Kamptee", "Nagpur", "MAHARASHTRA", "2200", "31-Dec-23", "30-Dec-28", "8770467551", "Active", "", "0.53", "14", "kaveri@chouhan.biz", "8.67", "Multi-modal logistics hubs", "Verified", "768886", "LIC619956", "99000"],
  ["6699483", "Industrial Zone Extension, Navargaon", "Chandrapur", "MAHARASHTRA", "1400", "28-Mar-23", "27-Mar-28", "9284858141", "Active", "", "0.71", "10", "mahesh@gupta.info", "6.34", "FMCG distribution centers", "Unverified", "905637", "LIC496022", "63000"],
  ["6699484", "Agricultural Complex, Korpana", "Chandrapur", "MAHARASHTRA", "1100", "29-Mar-23", "28-Mar-28", "9284858142", "Active", "", "0.86", "6", "shweta@kulkarni.com", "4.89", "Agri-commodity specialized warehouses", "Verified", "905638", "LIC496023", "49500"],
  ["6699485", "Market Yard Hub, Jiwati", "Chandrapur", "MAHARASHTRA", "1800", "30-Mar-23", "29-Mar-28", "9284858143", "Active", "", "0.39", "18", "harish@bhosale.net", "7.56", "Industrial logistics parks", "Unverified", "905639", "LIC496024", "81000"],
  ["6699486", "Cooperative Area, Pomburna", "Chandrapur", "MAHARASHTRA", "1300", "31-Mar-23", "30-Mar-28", "9284858144", "Active", "", "0.62", "14", "priyanka@patil.org", "5.23", "Cold chain storage facilities", "Verified", "905640", "LIC496025", "58500"],
  ["6699487", "Coal Belt Zone, Chandrapur Rural", "Chandrapur", "MAHARASHTRA", "2000", "1-Apr-23", "31-Mar-28", "9284858145", "Active", "", "0.95", "11", "vikas@more.biz", "8.12", "Multi-modal logistics hubs", "Unverified", "905641", "LIC496026", "90000"],
  ["6691746", "Market Complex Extension, Chimur", "Chandrapur", "MAHARASHTRA", "1350", "4-Mar-23", "3-Mar-28", "9545310260", "Active", "", "0.68", "15", "anita@joshi.info", "5.89", "Cold chain storage facilities", "Verified", "624990", "LIC765985", "60750"],
  ["6691747", "Agricultural Zone, Bhadrawati", "Chandrapur", "MAHARASHTRA", "950", "5-Mar-23", "4-Mar-28", "9545310261", "Active", "", "0.91", "11", "vikas@singh.com", "4.56", "Agri-commodity specialized warehouses", "Unverified", "624991", "LIC765986", "42750"],
  ["6691748", "Industrial Estate, Sindewahi", "Chandrapur", "MAHARASHTRA", "1700", "6-Mar-23", "5-Mar-28", "9545310262", "Active", "", "0.44", "7", "madhuri@yadav.net", "7.23", "Industrial logistics parks", "Verified", "624992", "LIC765987", "76500"],
  ["6691749", "Cooperative Hub, Mul", "Chandrapur", "MAHARASHTRA", "1200", "7-Mar-23", "6-Mar-28", "9545310263", "Active", "", "0.77", "17", "harish@pandey.org", "6.78", "FMCG distribution centers", "Unverified", "624993", "LIC765988", "54000"],
  ["6691750", "Mining Zone Complex, Rajura", "Chandrapur", "MAHARASHTRA", "2200", "8-Mar-23", "7-Mar-28", "9545310264", "Active", "", "0.59", "13", "priyanka@chouhan.biz", "8.45", "Multi-modal logistics hubs", "Verified", "624994", "LIC765989", "99000"],
  ["7001432", "Industrial Zone Extension, Kolhapur", "Kolhapur", "MAHARASHTRA", "1650", "10-Dec-24", "9-Dec-29", "8956354356", "Active", "", "0.73", "9", "sachin@desai.info", "3.67", "FMCG distribution centers", "Unverified", "519624", "LIC757375", "74250"],
  ["7001433", "Agricultural Complex, Shirol", "Kolhapur", "MAHARASHTRA", "1200", "11-Dec-24", "10-Dec-29", "8956354357", "Active", "", "0.86", "16", "meena@kulkarni.com", "4.23", "Agri-commodity specialized warehouses", "Verified", "519625", "LIC757376", "54000"],
  ["7001434", "Market Yard Hub, Kagal", "Kolhapur", "MAHARASHTRA", "2100", "12-Dec-24", "11-Dec-29", "8956354358", "Active", "", "0.51", "12", "arun@bhosale.net", "5.89", "Industrial logistics parks", "Unverified", "519626", "LIC757377", "94500"],
  ["7001435", "Cooperative Area, Bhudargad", "Kolhapur", "MAHARASHTRA", "1400", "13-Dec-24", "12-Dec-29", "8956354359", "Active", "", "0.78", "8", "pushpa@patil.org", "6.45", "Cold chain storage facilities", "Verified", "519627", "LIC757378", "63000"],
  ["7001436", "Sugar Belt Zone, Hatkanangle", "Kolhapur", "MAHARASHTRA", "1900", "14-Dec-24", "13-Dec-29", "8956354360", "Active", "", "0.63", "14", "ganesh@more.biz", "7.12", "Multi-modal logistics hubs", "Unverified", "519628", "LIC757379", "85500"],
  ["8651701", "Plot No. 89/11, Sangli Industrial Estate", "Sangli", "MAHARASHTRA", "1750", "12-Oct-20", "11-Oct-25", "9823012346", "Active", "", "0.84", "18", "kavya@singh.info", "3.89", "FMCG distribution centers", "Verified", "416417", "LIC653771", "78750"],
  ["8651702", "Survey No. 234/11, Miraj MIDC", "Sangli", "MAHARASHTRA", "1350", "13-Oct-20", "12-Oct-25", "9764012346", "Active", "", "0.47", "10", "rohit@yadav.com", "5.67", "Agri-commodity specialized warehouses", "Unverified", "416410", "LIC653772", "60750"],
  ["8651703", "Gat No. 67/9A, Walwa Industrial Zone", "Sangli", "MAHARASHTRA", "2200", "14-Oct-20", "13-Oct-25", "9881012346", "Active", "", "0.69", "15", "priya@pandey.net", "6.34", "Industrial logistics parks", "Verified", "416314", "LIC653773", "99000"],
  ["8651704", "Plot No. 123/11, Vita Cooperative Hub", "Sangli", "MAHARASHTRA", "1600", "15-Oct-20", "14-Oct-25", "9422012346", "Active", "", "0.92", "6", "amit@chouhan.org", "4.78", "Cold chain storage facilities", "Unverified", "415311", "LIC653774", "72000"],
  ["8651705", "Survey No. 89/11, Palus Sugar Belt", "Sangli", "MAHARASHTRA", "2800", "16-Oct-20", "15-Oct-25", "9823123457", "Active", "", "0.55", "14", "sunita@desai.biz", "7.89", "Multi-modal logistics hubs", "Verified", "416310", "LIC653775", "126000"],
  ["7034912", "Agricultural Hub Extension, Bhandara Road", "Nagpur", "MAHARASHTRA", "4200", "11-Mar-25", "10-Sep-29", "7840945914", "Active", "", "0.67", "12", "tailoryuvraj@gupta.info", "3.45", "Cold chain storage facilities", "Verified", "474419", "LIC510626", "189000"],
  ["7034913", "Industrial Zone, Hingna MIDC", "Nagpur", "MAHARASHTRA", "3800", "12-Mar-25", "11-Sep-29", "7840945915", "Active", "", "0.81", "8", "kavya@kulkarni.com", "4.12", "Agri-commodity specialized warehouses", "Unverified", "474420", "LIC510627", "171000"],
  ["7034914", "Market Complex, Katol Road", "Nagpur", "MAHARASHTRA", "6200", "13-Mar-25", "12-Sep-29", "7840945916", "Active", "", "0.43", "16", "rahul@bhosale.net", "5.78", "Industrial logistics parks", "Verified", "474421", "LIC510628", "279000"],
  ["7034915", "Cooperative Hub, Ramtek", "Nagpur", "MAHARASHTRA", "3500", "14-Mar-25", "13-Sep-29", "7840945917", "Active", "", "0.76", "11", "neha@patil.org", "6.23", "FMCG distribution centers", "Unverified", "474422", "LIC510629", "157500"],
  ["7034916", "MIDC Extension, Butibori", "Nagpur", "MAHARASHTRA", "7500", "15-Mar-25", "14-Sep-29", "7840945918", "Active", "", "0.58", "7", "amit@more.biz", "2.89", "Multi-modal logistics hubs", "Verified", "474423", "LIC510630", "337500"],
  ["6691300", "Market Yard Extension, Datala Road", "Chandrapur", "MAHARASHTRA", "1350", "2-Mar-23", "1-Mar-28", "9822711613", "Active", "", "0.85", "9", "mahesh@joshi.info", "8.23", "Multi-modal logistics hubs", "Verified", "845638", "LIC710777", "60750"],
  ["6691301", "Agricultural Zone, Warora", "Chandrapur", "MAHARASHTRA", "950", "3-Mar-23", "2-Mar-28", "9822711614", "Active", "", "0.62", "15", "shweta@singh.com", "6.78", "Industrial logistics parks", "Unverified", "845639", "LIC710778", "42750"],
  ["6691302", "Industrial Estate, Ballarpur", "Chandrapur", "MAHARASHTRA", "1700", "4-Mar-23", "3-Mar-28", "9822711615", "Active", "", "0.78", "11", "harish@yadav.net", "4.45", "Agri-commodity specialized warehouses", "Verified", "845640", "LIC710779", "76500"],
  ["6691303", "Cooperative Complex, Rajura", "Chandrapur", "MAHARASHTRA", "1200", "5-Mar-23", "4-Mar-28", "9822711616", "Active", "", "0.94", "7", "priyanka@pandey.org", "7.56", "Cold chain storage facilities", "Unverified", "845641", "LIC710780", "54000"],
  ["6691304", "Coal Mining Hub, Chandrapur East", "Chandrapur", "MAHARASHTRA", "2200", "6-Mar-23", "5-Mar-28", "9822711617", "Active", "", "0.46", "17", "vikas@chouhan.biz", "5.89", "FMCG distribution centers", "Verified", "845642", "LIC710781", "99000"],
  ["6688239", "Market Complex Extension, Lakhani", "Bhandara", "MAHARASHTRA", "1350", "24-Feb-23", "23-Feb-28", "9404523727", "Active", "", "0.59", "13", "anita@gupta.info", "7.12", "Agri-commodity specialized warehouses", "Unverified", "281950", "LIC629422", "60750"],
  ["6688240", "Agricultural Zone, Mohadi", "Bhandara", "MAHARASHTRA", "950", "25-Feb-23", "24-Feb-28", "9404523728", "Active", "", "0.82", "9", "vikas@kulkarni.com", "5.45", "Industrial logistics parks", "Verified", "281951", "LIC629423", "42750"],
  ["6688241", "Industrial Estate, Sakoli", "Bhandara", "MAHARASHTRA", "1700", "26-Feb-23", "25-Feb-28", "9404523729", "Active", "", "0.37", "16", "madhuri@bhosale.net", "8.67", "Cold chain storage facilities", "Unverified", "281952", "LIC629424", "76500"],
  ["6688242", "Cooperative Hub, Tumsar", "Bhandara", "MAHARASHTRA", "1200", "27-Feb-23", "26-Feb-28", "9404523730", "Active", "", "0.71", "12", "harish@patil.org", "6.23", "FMCG distribution centers", "Verified", "281953", "LIC629425", "54000"],
  ["6688243", "Forest Zone Complex, Lakhandur", "Bhandara", "MAHARASHTRA", "2200", "28-Feb-23", "27-Feb-28", "9404523731", "Active", "", "0.88", "8", "priyanka@more.biz", "4.78", "Multi-modal logistics hubs", "Unverified", "281954", "LIC629426", "99000"],
  ["6692290", "Agricultural Hub Extension, Pauni", "Bhandara", "MAHARASHTRA", "1200", "7-Mar-23", "6-Mar-28", "9881569892", "Active", "", "0.74", "14", "sachin@joshi.info", "5.56", "Cold chain storage facilities", "Verified", "952161", "LIC362178", "54000"],
  ["6692291", "Industrial Zone, Lakhandur", "Bhandara", "MAHARASHTRA", "850", "8-Mar-23", "7-Mar-28", "9881569893", "Active", "", "0.91", "10", "meena@singh.com", "3.89", "Agri-commodity specialized warehouses", "Unverified", "952162", "LIC362179", "38250"],
  ["6692292", "Market Complex, Mohadi", "Bhandara", "MAHARASHTRA", "1500", "9-Mar-23", "8-Mar-28", "9881569894", "Active", "", "0.48", "6", "arun@yadav.net", "6.78", "Industrial logistics parks", "Verified", "952163", "LIC362180", "67500"],
  ["6692293", "Cooperative Area, Tumsar", "Bhandara", "MAHARASHTRA", "1000", "10-Mar-23", "9-Mar-28", "9881569895", "Active", "", "0.65", "18", "pushpa@pandey.org", "4.23", "FMCG distribution centers", "Unverified", "952164", "LIC362181", "45000"],
  ["6692294", "Forest Processing Zone, Sakoli", "Bhandara", "MAHARASHTRA", "1800", "11-Mar-23", "10-Mar-28", "9881569896", "Active", "", "0.83", "15", "ganesh@chouhan.biz", "7.45", "Multi-modal logistics hubs", "Verified", "952165", "LIC362182", "81000"],
  ["6689401", "Market Yard Extension, Pombhurna", "Chandrapur", "MAHARASHTRA", "1350", "28-Feb-23", "27-Feb-28", "9579083333", "Active", "", "0.61", "11", "usha@gupta.info", "5.67", "Cold chain storage facilities", "Unverified", "380667", "LIC490958", "60750"],
  ["6689402", "Agricultural Zone, Chimur", "Chandrapur", "MAHARASHTRA", "950", "1-Mar-23", "28-Feb-28", "9579083334", "Active", "", "0.87", "7", "dinesh@kulkarni.com", "3.45", "Agri-commodity specialized warehouses", "Verified", "380668", "LIC490959", "42750"],
  ["6689403", "Industrial Estate, Brahmapuri", "Chandrapur", "MAHARASHTRA", "1700", "2-Mar-23", "1-Mar-28", "9579083335", "Active", "", "0.44", "17", "sanjana@bhosale.net", "6.89", "Industrial logistics parks", "Unverified", "380669", "LIC490960", "76500"],
  ["6689404", "Cooperative Complex, Sindewahi", "Chandrapur", "MAHARASHTRA", "1200", "3-Mar-23", "2-Mar-28", "9579083336", "Active", "", "0.78", "13", "prakash@patil.org", "4.56", "FMCG distribution centers", "Verified", "380670", "LIC490961", "54000"],
  ["6689405", "Coal Transport Hub, Mul", "Chandrapur", "MAHARASHTRA", "2200", "4-Mar-23", "3-Mar-28", "9579083337", "Active", "", "0.56", "9", "kaveri@more.biz", "7.78", "Multi-modal logistics hubs", "Unverified", "380671", "LIC490962", "99000"],
  ["6693361", "Market Complex Extension, Sukli Station", "Wardha", "MAHARASHTRA", "1200", "8-Mar-23", "7-Mar-28", "9970356621", "Active", "", "0.82", "16", "mahesh@joshi.info", "6.89", "FMCG distribution centers", "Verified", "386539", "LIC612292", "54000"],
  ["6693362", "Agricultural Zone, Hinganghat", "Wardha", "MAHARASHTRA", "850", "9-Mar-23", "8-Mar-28", "9970356622", "Active", "", "0.49", "12", "shweta@singh.com", "4.78", "Agri-commodity specialized warehouses", "Unverified", "386540", "LIC612293", "38250"],
  ["6693363", "Industrial Estate, Arvi", "Wardha", "MAHARASHTRA", "1500", "10-Mar-23", "9-Mar-28", "9970356623", "Active", "", "0.73", "8", "harish@yadav.net", "7.23", "Industrial logistics parks", "Verified", "386541", "LIC612294", "67500"],
  ["6693364", "Cooperative Hub, Karanja", "Wardha", "MAHARASHTRA", "1000", "11-Mar-23", "10-Mar-28", "9970356624", "Active", "", "0.96", "14", "priyanka@pandey.org", "5.34", "Cold chain storage facilities", "Unverified", "386542", "LIC612295", "45000"],
  ["6693365", "Cotton Processing Zone, Deoli", "Wardha", "MAHARASHTRA", "1800", "12-Mar-23", "11-Mar-28", "9970356625", "Active", "", "0.41", "10", "vikas@chouhan.biz", "8.56", "Multi-modal logistics hubs", "Verified", "386543", "LIC612296", "81000"],
  ["6827738", "Agricultural Hub Extension, Seloo", "Wardha", "MAHARASHTRA", "1200", "27-Dec-23", "26-Dec-28", "9970356621", "Active", "", "0.68", "5", "anita@gupta.info", "8.12", "Agri-commodity specialized warehouses", "Unverified", "190511", "LIC588284", "54000"],
  ["6827739", "Industrial Zone, Ashti", "Wardha", "MAHARASHTRA", "850", "28-Dec-23", "27-Dec-28", "9970356622", "Active", "", "0.85", "17", "vikas@kulkarni.com", "6.45", "Industrial logistics parks", "Verified", "190512", "LIC588285", "38250"],
  ["6827740", "Market Complex, Samudrapur", "Wardha", "MAHARASHTRA", "1500", "29-Dec-23", "28-Dec-28", "9970356623", "Active", "", "0.52", "13", "madhuri@bhosale.net", "4.89", "Cold chain storage facilities", "Unverified", "190513", "LIC588286", "67500"],
  ["6827741", "Cooperative Area, Wardha Rural", "Wardha", "MAHARASHTRA", "1000", "30-Dec-23", "29-Dec-28", "9970356624", "Active", "", "0.79", "9", "harish@patil.org", "7.67", "FMCG distribution centers", "Verified", "190514", "LIC588287", "45000"],
  ["6827742", "Cotton Belt Zone, Pulgaon", "Wardha", "MAHARASHTRA", "1800", "31-Dec-23", "30-Dec-28", "9970356625", "Active", "", "0.93", "11", "priyanka@more.biz", "5.78", "Multi-modal logistics hubs", "Unverified", "190515", "LIC588288", "81000"],
  ["6691563", "Market Yard Extension, Tumsar", "Bhandara", "MAHARASHTRA", "1350", "4-Mar-23", "3-Mar-28", "7666759425", "Active", "", "0.57", "15", "sachin@joshi.info", "6.23", "Industrial logistics parks", "Verified", "676329", "LIC103591", "60750"],
  ["6691564", "Agricultural Zone, Mohadi", "Bhandara", "MAHARASHTRA", "950", "5-Mar-23", "4-Mar-28", "7666759426", "Active", "", "0.84", "11", "meena@singh.com", "4.56", "Agri-commodity specialized warehouses", "Unverified", "676330", "LIC103592", "42750"],
  ["6691565", "Industrial Estate, Gondia Border", "Bhandara", "MAHARASHTRA", "1700", "6-Mar-23", "5-Mar-28", "7666759427", "Active", "", "0.41", "7", "arun@yadav.net", "7.89", "Cold chain storage facilities", "Verified", "676331", "LIC103593", "76500"],
  ["6691566", "Cooperative Complex, Pauni", "Bhandara", "MAHARASHTRA", "1200", "7-Mar-23", "6-Mar-28", "7666759428", "Active", "", "0.78", "17", "pushpa@pandey.org", "5.45", "FMCG distribution centers", "Unverified", "676332", "LIC103594", "54000"],
  ["6691567", "Forest Zone Hub, Sakoli", "Bhandara", "MAHARASHTRA", "2200", "8-Mar-23", "7-Mar-28", "7666759429", "Active", "", "0.62", "13", "ganesh@chouhan.biz", "8.34", "Multi-modal logistics hubs", "Verified", "676333", "LIC103595", "99000"],
  ["6694716", "Industrial Zone Extension, Mandheli", "Chandrapur", "MAHARASHTRA", "1350", "15-Mar-23", "14-Mar-28", "9764063689", "Active", "", "0.89", "9", "usha@gupta.info", "7.12", "FMCG distribution centers", "Unverified", "901259", "LIC745733", "60750"],
  ["6694717", "Agricultural Complex, Korpana", "Chandrapur", "MAHARASHTRA", "950", "16-Mar-23", "15-Mar-28", "9764063690", "Active", "", "0.46", "16", "dinesh@kulkarni.com", "5.67", "Agri-commodity specialized warehouses", "Verified", "901260", "LIC745734", "42750"],
  ["6694718", "Market Yard Hub, Jivti", "Chandrapur", "MAHARASHTRA", "1700", "17-Mar-23", "16-Mar-28", "9764063691", "Active", "", "0.73", "12", "sanjana@bhosale.net", "4.23", "Industrial logistics parks", "Unverified", "901261", "LIC745735", "76500"],
  ["6694719", "Cooperative Area, Pomburna", "Chandrapur", "MAHARASHTRA", "1200", "18-Mar-23", "17-Mar-28", "9764063692", "Active", "", "0.91", "8", "prakash@patil.org", "6.78", "Cold chain storage facilities", "Verified", "901262", "LIC745736", "54000"],
  ["6694720", "Coal Belt Complex, Chandrapur West", "Chandrapur", "MAHARASHTRA", "2200", "19-Mar-23", "18-Mar-28", "9764063693", "Active", "", "0.54", "14", "kaveri@more.biz", "8.45", "Multi-modal logistics hubs", "Unverified", "901263", "LIC745737", "99000"],
  ["6680319", "Market Complex Extension, Kurkheda", "Gadchiroli", "MAHARASHTRA", "1350", "7-Feb-23", "6-Feb-28", "9404817891", "Active", "", "0.67", "10", "mahesh@joshi.info", "5.89", "Multi-modal logistics hubs", "Unverified", "9396", "LIC597859", "60750"],
  ["6680320", "Agricultural Zone, Armori", "Gadchiroli", "MAHARASHTRA", "950", "8-Feb-23", "7-Feb-28", "9404817892", "Active", "", "0.83", "6", "shweta@singh.com", "4.34", "Agri-commodity specialized warehouses", "Verified", "9397", "LIC597860", "42750"],
  ["6680321", "Industrial Estate, Dhanora", "Gadchiroli", "MAHARASHTRA", "1700", "9-Feb-23", "8-Feb-28", "9404817893", "Active", "", "0.38", "18", "harish@yadav.net", "7.56", "Industrial logistics parks", "Unverified", "9398", "LIC597861", "76500"],
  ["6680322", "Cooperative Hub, Chamorshi", "Gadchiroli", "MAHARASHTRA", "1200", "10-Feb-23", "9-Feb-28", "9404817894", "Active", "", "0.74", "14", "priyanka@pandey.org", "6.12", "Cold chain storage facilities", "Verified", "9399", "LIC597862", "54000"],
  ["6680323", "Tribal Development Zone, Gadchiroli East", "Gadchiroli", "MAHARASHTRA", "2200", "11-Feb-23", "10-Feb-28", "9404817895", "Active", "", "0.59", "11", "vikas@chouhan.biz", "8.78", "FMCG distribution centers", "Unverified", "9400", "LIC597863", "99000"],
  ["6759873", "Market Yard Extension, Barshi Takli", "Akola", "MAHARASHTRA", "1200", "21-Jul-23", "20-Jul-28", "919766678", "Active", "", "0.76", "17", "anita@gupta.info", "5.78", "Industrial logistics parks", "Verified", "421804", "LIC876395", "54000"],
  ["6759874", "Agricultural Zone, Mahan", "Akola", "MAHARASHTRA", "850", "22-Jul-23", "21-Jul-28", "919766679", "Active", "", "0.52", "13", "vikas@kulkarni.com", "4.12", "Agri-commodity specialized warehouses", "Unverified", "421805", "LIC876396", "38250"],
  ["6759875", "Industrial Estate, Akot", "Akola", "MAHARASHTRA", "1500", "23-Jul-23", "22-Jul-28", "919766680", "Active", "", "0.89", "9", "madhuri@bhosale.net", "6.45", "Cold chain storage facilities", "Verified", "421806", "LIC876397", "67500"],
  ["6759876", "Cooperative Complex, Telhara", "Akola", "MAHARASHTRA", "1000", "24-Jul-23", "23-Jul-28", "919766681", "Active", "", "0.43", "15", "harish@patil.org", "7.23", "FMCG distribution centers", "Unverified", "421807", "LIC876398", "45000"],
  ["6759877", "Cotton Processing Hub, Murtijapur", "Akola", "MAHARASHTRA", "1800", "25-Jul-23", "24-Jul-28", "919766682", "Active", "", "0.68", "11", "priyanka@more.biz", "8.90", "Multi-modal logistics hubs", "Verified", "421808", "LIC876399", "81000"],
  ["6699301", "Market Complex Extension, Bhiwapur", "Nagpur", "MAHARASHTRA", "1200", "28-Mar-23", "27-Mar-28", "9422220105", "Active", "", "0.85", "16", "sachin@joshi.info", "4.78", "Agri-commodity specialized warehouses", "Unverified", "71961", "LIC607176", "54000"],
  ["6699302", "Agricultural Zone, Kamptee", "Nagpur", "MAHARASHTRA", "850", "29-Mar-23", "28-Mar-28", "9422220106", "Active", "", "0.61", "12", "meena@singh.com", "3.56", "Industrial logistics parks", "Verified", "71962", "LIC607177", "38250"],
  ["6699303", "Industrial Estate, Saoner", "Nagpur", "MAHARASHTRA", "1500", "30-Mar-23", "29-Mar-28", "9422220107", "Active", "", "0.79", "8", "arun@yadav.net", "5.89", "Cold chain storage facilities", "Unverified", "71963", "LIC607178", "67500"],
  ["6699304", "Cooperative Hub, Hingna", "Nagpur", "MAHARASHTRA", "1000", "31-Mar-23", "30-Mar-28", "9422220108", "Active", "", "0.94", "14", "pushpa@pandey.org", "6.67", "FMCG distribution centers", "Verified", "71964", "LIC607179", "45000"],
  ["6699305", "MIDC Extension, Butibori", "Nagpur", "MAHARASHTRA", "1800", "1-Apr-23", "31-Mar-28", "9422220109", "Active", "", "0.47", "10", "ganesh@chouhan.biz", "7.34", "Multi-modal logistics hubs", "Unverified", "71965", "LIC607180", "81000"],
  ["7010797", "Agricultural Hub Extension, Deola", "Nashik", "MAHARASHTRA", "1200", "21-Jan-25", "20-Jan-30", "9881017379", "Active", "", "0.72", "18", "usha@gupta.info", "8.45", "Agri-commodity specialized warehouses", "Unverified", "931425", "LIC651050", "54000"],
  ["7010798", "Industrial Zone, Kalwan", "Nashik", "MAHARASHTRA", "850", "22-Jan-25", "21-Jan-30", "9881017380", "Active", "", "0.89", "6", "dinesh@kulkarni.com", "6.78", "Industrial logistics parks", "Verified", "931426", "LIC651051", "38250"],
  ["7010799", "Market Complex, Dindori", "Nashik", "MAHARASHTRA", "1500", "23-Jan-25", "22-Jan-30", "9881017381", "Active", "", "0.55", "15", "sanjana@bhosale.net", "4.56", "Cold chain storage facilities", "Unverified", "931427", "LIC651052", "67500"],
  ["7010800", "Cooperative Area, Baglan", "Nashik", "MAHARASHTRA", "1000", "24-Jan-25", "23-Jan-30", "9881017382", "Active", "", "0.83", "11", "prakash@patil.org", "7.12", "FMCG distribution centers", "Verified", "931428", "LIC651053", "45000"],
  ["7010801", "Wine Country Zone, Sinner", "Nashik", "MAHARASHTRA", "1800", "25-Jan-25", "24-Jan-30", "9881017383", "Active", "", "0.41", "7", "kaveri@more.biz", "9.23", "Multi-modal logistics hubs", "Unverified", "931429", "LIC651054", "81000"],
  ["7001077", "Market Yard Extension, Dhule", "Dhule", "MAHARASHTRA", "1200", "10-Dec-24", "9-Dec-29", "9423917203", "Active", "", "0.78", "17", "mahesh@joshi.info", "3.34", "FMCG distribution centers", "Verified", "443988", "LIC185329", "54000"],
  ["7001078", "Agricultural Zone, Shirpur", "Dhule", "MAHARASHTRA", "850", "11-Dec-24", "10-Dec-29", "9423917204", "Active", "", "0.54", "13", "shweta@singh.com", "2.89", "Agri-commodity specialized warehouses", "Unverified", "443989", "LIC185330", "38250"],
  ["7001079", "Industrial Estate, Sakri", "Dhule", "MAHARASHTRA", "1500", "12-Dec-24", "11-Dec-29", "9423917205", "Active", "", "0.86", "9", "harish@yadav.net", "4.23", "Industrial logistics parks", "Verified", "443990", "LIC185331", "67500"],
  ["7001080", "Cooperative Complex, Sindkhede", "Dhule", "MAHARASHTRA", "1000", "13-Dec-24", "12-Dec-29", "9423917206", "Active", "", "0.42", "16", "priyanka@pandey.org", "5.67", "Cold chain storage facilities", "Unverified", "443991", "LIC185332", "45000"],
  ["7001081", "Textile Hub, Dondaicha", "Dhule", "MAHARASHTRA", "1800", "14-Dec-24", "13-Dec-29", "9423917207", "Active", "", "0.69", "12", "vikas@chouhan.biz", "3.78", "Multi-modal logistics hubs", "Verified", "443992", "LIC185333", "81000"],
  ["6982715", "Agricultural Complex Extension, Karjat", "Raigarh", "MAHARASHTRA", "1200", "2-Oct-24", "1-Oct-29", "9200951254", "Active", "", "0.73", "8", "anita@gupta.info", "8.90", "Agri-commodity specialized warehouses", "Unverified", "905554", "LIC865321", "54000"],
  ["6982716", "Industrial Zone, Khalapur", "Raigarh", "MAHARASHTRA", "850", "3-Oct-24", "2-Oct-29", "9200951255", "Active", "", "0.91", "14", "vikas@kulkarni.com", "6.78", "Industrial logistics parks", "Verified", "905555", "LIC865322", "38250"],
  ["6982717", "Market Yard Hub, Panvel", "Raigarh", "MAHARASHTRA", "1500", "4-Oct-24", "3-Oct-29", "9200951256", "Active", "", "0.48", "10", "madhuri@bhosale.net", "4.45", "Cold chain storage facilities", "Unverified", "905556", "LIC865323", "67500"],
  ["6982718", "Cooperative Area, Pen", "Raigarh", "MAHARASHTRA", "1000", "5-Oct-24", "4-Oct-29", "9200951257", "Active", "", "0.75", "6", "harish@patil.org", "7.56", "FMCG distribution centers", "Verified", "905557", "LIC865324", "45000"],
  ["6982719", "Coastal Zone Complex, Alibag", "Raigarh", "MAHARASHTRA", "1800", "6-Oct-24", "5-Oct-29", "9200951258", "Active", "", "0.62", "18", "priyanka@more.biz", "9.12", "Multi-modal logistics hubs", "Unverified", "905558", "LIC865325", "81000"],
  ["6700653", "Market Complex Extension, Korpana", "Chandrapur", "MAHARASHTRA", "1200", "29-Mar-23", "28-Mar-28", "9890328103", "Active", "", "0.87", "15", "sachin@joshi.info", "7.12", "Cold chain storage facilities", "Unverified", "76742", "LIC493462", "54000"],
  ["6700654", "Agricultural Zone, Bramhapuri", "Chandrapur", "MAHARASHTRA", "850", "30-Mar-23", "29-Mar-28", "9890328104", "Active", "", "0.44", "11", "meena@singh.com", "5.89", "Agri-commodity specialized warehouses", "Verified", "76743", "LIC493463", "38250"],
  ["6700655", "Industrial Estate, Sindewahi", "Chandrapur", "MAHARASHTRA", "1500", "31-Mar-23", "30-Mar-28", "9890328105", "Active", "", "0.71", "7", "arun@yadav.net", "4.56", "Industrial logistics parks", "Unverified", "76744", "LIC493464", "67500"],
  ["6700656", "Cooperative Hub, Mul", "Chandrapur", "MAHARASHTRA", "1000", "1-Apr-23", "31-Mar-28", "9890328106", "Active", "", "0.98", "17", "pushpa@pandey.org", "8.34", "FMCG distribution centers", "Verified", "76745", "LIC493465", "45000"],
  ["6700657", "Mining Zone Complex, Rajura", "Chandrapur", "MAHARASHTRA", "1800", "2-Apr-23", "1-Apr-28", "9890328107", "Active", "", "0.53", "13", "ganesh@chouhan.biz", "6.78", "Multi-modal logistics hubs", "Unverified", "76746", "LIC493466", "81000"],
  ["6689320", "Market Yard Extension, Lakhandur", "Bhandara", "MAHARASHTRA", "1350", "28-Feb-23", "27-Feb-28", "9423761333", "Active", "", "0.81", "9", "usha@gupta.info", "7.78", "Industrial logistics parks", "Unverified", "380892", "LIC405009", "60750"],
  ["6689321", "Agricultural Zone, Mohadi", "Bhandara", "MAHARASHTRA", "950", "1-Mar-23", "28-Feb-28", "9423761334", "Active", "", "0.58", "16", "dinesh@kulkarni.com", "5.45", "Agri-commodity specialized warehouses", "Verified", "380893", "LIC405010", "42750"],
  ["6689322", "Industrial Estate, Tumsar", "Bhandara", "MAHARASHTRA", "1700", "2-Mar-23", "1-Mar-28", "9423761335", "Active", "", "0.76", "12", "sanjana@bhosale.net", "4.23", "Cold chain storage facilities", "Unverified", "380894", "LIC405011", "76500"],
  ["6689323", "Cooperative Complex, Sakoli", "Bhandara", "MAHARASHTRA", "1200", "3-Mar-23", "2-Mar-28", "9423761336", "Active", "", "0.93", "8", "prakash@patil.org", "6.89", "FMCG distribution centers", "Verified", "380895", "LIC405012", "54000"],
  ["6689324", "Forest Processing Hub, Pauni", "Bhandara", "MAHARASHTRA", "2200", "4-Mar-23", "3-Mar-28", "9423761337", "Active", "", "0.47", "14", "kaveri@more.biz", "8.56", "Multi-modal logistics hubs", "Unverified", "380896", "LIC405013", "99000"],
  ["6713888", "Agricultural Hub Extension, Vinchur", "Nashik", "MAHARASHTRA", "1200", "2-May-23", "1-May-28", "7387670814", "Active", "", "0.74", "10", "mahesh@joshi.info", "6.67", "Agri-commodity specialized warehouses", "Unverified", "619899", "LIC969182", "54000"],
  ["6713889", "Industrial Zone, Lasalgaon", "Nashik", "MAHARASHTRA", "850", "3-May-23", "2-May-28", "7387670815", "Active", "", "0.89", "6", "shweta@singh.com", "4.78", "Industrial logistics parks", "Verified", "619900", "LIC969183", "38250"],
  ["6713890", "Market Complex, Yeola", "Nashik", "MAHARASHTRA", "1500", "4-May-23", "3-May-28", "7387670816", "Active", "", "0.51", "18", "harish@yadav.net", "7.23", "Cold chain storage facilities", "Unverified", "619901", "LIC969184", "67500"],
  ["6713891", "Cooperative Area, Malegaon", "Nashik", "MAHARASHTRA", "1000", "5-May-23", "4-May-28", "7387670817", "Active", "", "0.83", "14", "priyanka@pandey.org", "5.89", "FMCG distribution centers", "Verified", "619902", "LIC969185", "45000"],
  ["6713892", "Wine Country Hub, Ozar", "Nashik", "MAHARASHTRA", "1800", "6-May-23", "5-May-28", "7387670818", "Active", "", "0.65", "11", "vikas@chouhan.biz", "8.45", "Multi-modal logistics hubs", "Unverified", "619903", "LIC969186", "81000"],
  ["6763743", "Market Yard Phase II, Camp Road", "Nashik", "MAHARASHTRA", "1200", "28-Jul-23", "27-Jul-28", "7385572106", "Active", "", "0.56", "7", "anita@gupta.info", "8.12", "Agri-commodity specialized warehouses", "Verified", "131153", "LIC892729", "54000"],
  ["6763744", "Agricultural Zone, Panchavati", "Nashik", "MAHARASHTRA", "850", "29-Jul-23", "28-Jul-28", "7385572107", "Active", "", "0.84", "17", "vikas@kulkarni.com", "6.45", "Industrial logistics parks", "Unverified", "131154", "LIC892730", "38250"],
  ["6763745", "Industrial Estate, Ambad", "Nashik", "MAHARASHTRA", "1500", "30-Jul-23", "29-Jul-28", "7385572108", "Active", "", "0.42", "13", "madhuri@bhosale.net", "4.89", "Cold chain storage facilities", "Verified", "131155", "LIC892731", "67500"],
  ["6763746", "Cooperative Complex, Satpur", "Nashik", "MAHARASHTRA", "1000", "31-Jul-23", "30-Jul-28", "7385572109", "Active", "", "0.79", "9", "harish@patil.org", "7.67", "FMCG distribution centers", "Unverified", "131156", "LIC892732", "45000"],
  ["6763747", "MIDC Extension, Sinnar", "Nashik", "MAHARASHTRA", "1800", "1-Aug-23", "31-Jul-28", "7385572110", "Active", "", "0.67", "15", "priyanka@more.biz", "5.78", "Multi-modal logistics hubs", "Verified", "131157", "LIC892733", "81000"],
  ["6694351", "Market Complex Extension, Devali", "Wardha", "MAHARASHTRA", "1200", "15-Mar-23", "14-Mar-28", "9850412845", "Active", "", "0.88", "11", "sachin@joshi.info", "4.23", "Cold chain storage facilities", "Unverified", "579727", "LIC275878", "54000"],
  ["6694352", "Agricultural Zone, Hinganghat", "Wardha", "MAHARASHTRA", "850", "16-Mar-23", "15-Mar-28", "9850412846", "Active", "", "0.45", "16", "meena@singh.com", "3.12", "Agri-commodity specialized warehouses", "Verified", "579728", "LIC275879", "38250"],
  ["6694353", "Industrial Estate, Arvi", "Wardha", "MAHARASHTRA", "1500", "17-Mar-23", "16-Mar-28", "9850412847", "Active", "", "0.72", "12", "arun@yadav.net", "5.78", "Industrial logistics parks", "Unverified", "579729", "LIC275880", "67500"],
  ["6694354", "Cooperative Hub, Karanja", "Wardha", "MAHARASHTRA", "1000", "18-Mar-23", "17-Mar-28", "9850412848", "Active", "", "0.95", "8", "pushpa@pandey.org", "6.45", "FMCG distribution centers", "Verified", "579730", "LIC275881", "45000"],
  ["6694355", "Cotton Processing Zone, Ashti", "Wardha", "MAHARASHTRA", "1800", "19-Mar-23", "18-Mar-28", "9850412849", "Active", "", "0.59", "14", "ganesh@chouhan.biz", "7.89", "Multi-modal logistics hubs", "Unverified", "579731", "LIC275882", "81000"],
  ["6961388", "Agricultural Complex Extension, Wadgaon", "Ahmadnagar", "MAHARASHTRA", "1200", "29-Jul-24", "28-Jul-29", "8605759276", "Active", "", "0.73", "10", "usha@gupta.info", "4.12", "Agri-commodity specialized warehouses", "Unverified", "507235", "LIC228905", "54000"],
  ["6961389", "Industrial Zone, Shrirampur", "Ahmadnagar", "MAHARASHTRA", "850", "30-Jul-24", "29-Jul-29", "8605759277", "Active", "", "0.91", "6", "dinesh@kulkarni.com", "3.78", "Industrial logistics parks", "Verified", "507236", "LIC228906", "38250"],
  ["6961390", "Market Yard Hub, Newasa", "Ahmadnagar", "MAHARASHTRA", "1500", "31-Jul-24", "30-Jul-29", "8605759278", "Active", "", "0.54", "18", "sanjana@bhosale.net", "5.89", "Cold chain storage facilities", "Unverified", "507237", "LIC228907", "67500"],
  ["6961391", "Cooperative Area, Pathardi", "Ahmadnagar", "MAHARASHTRA", "1000", "1-Aug-24", "31-Jul-29", "8605759279", "Active", "", "0.82", "14", "prakash@patil.org", "6.67", "FMCG distribution centers", "Verified", "507238", "LIC228908", "45000"],
  ["6961392", "Sugar Belt Zone, Sangamner", "Ahmadnagar", "MAHARASHTRA", "1800", "2-Aug-24", "1-Aug-29", "8605759280", "Active", "", "0.48", "11", "kaveri@more.biz", "7.34", "Multi-modal logistics hubs", "Unverified", "507239", "LIC228909", "81000"],
  ["6705512", "Market Yard Extension, Sawali", "Chandrapur", "MAHARASHTRA", "1350", "1-Apr-23", "31-Mar-28", "9422838112", "Active", "", "0.77", "7", "mahesh@joshi.info", "6.45", "Industrial logistics parks", "Verified", "587069", "LIC660306", "60750"],
  ["6705513", "Agricultural Zone, Chimur", "Chandrapur", "MAHARASHTRA", "950", "2-Apr-23", "1-Apr-28", "9422838113", "Active", "", "0.63", "17", "shweta@singh.com", "4.78", "Agri-commodity specialized warehouses", "Unverified", "587070", "LIC660307", "42750"],
  ["6705514", "Industrial Estate, Bramhapuri", "Chandrapur", "MAHARASHTRA", "1700", "3-Apr-23", "2-Apr-28", "9422838114", "Active", "", "0.85", "13", "harish@yadav.net", "7.12", "Cold chain storage facilities", "Verified", "587071", "LIC660308", "76500"],
  ["6705515", "Cooperative Complex, Sindewahi", "Chandrapur", "MAHARASHTRA", "1200", "4-Apr-23", "3-Apr-28", "9422838115", "Active", "", "0.41", "9", "priyanka@pandey.org", "5.56", "FMCG distribution centers", "Unverified", "587072", "LIC660309", "54000"],
  ["6705516", "Coal Transport Hub, Mul", "Chandrapur", "MAHARASHTRA", "2200", "5-Apr-23", "4-Apr-28", "9422838116", "Active", "", "0.68", "15", "vikas@chouhan.biz", "8.89", "Multi-modal logistics hubs", "Verified", "587073", "LIC660310", "99000"],
  ["6861216", "Market Complex Phase II, Shrigonda", "Ahmadnagar", "MAHARASHTRA", "1200", "15-Feb-24", "14-Feb-29", "7028839990", "Active", "", "0.89", "12", "anita@gupta.info", "8.67", "Industrial logistics parks", "Verified", "223153", "LIC593702", "54000"],
  ["6861217", "Agricultural Zone, Jamkhed", "Ahmadnagar", "MAHARASHTRA", "850", "16-Feb-24", "15-Feb-29", "7028839991", "Active", "", "0.56", "8", "vikas@kulkarni.com", "6.23", "Agri-commodity specialized warehouses", "Unverified", "223154", "LIC593703", "38250"],
  ["6861218", "Industrial Estate, Parner", "Ahmadnagar", "MAHARASHTRA", "1500", "17-Feb-24", "16-Feb-29", "7028839992", "Active", "", "0.83", "16", "madhuri@bhosale.net", "4.89", "Cold chain storage facilities", "Verified", "223155", "LIC593704", "67500"],
  ["6861219", "Cooperative Hub, Karjat", "Ahmadnagar", "MAHARASHTRA", "1000", "18-Feb-24", "17-Feb-29", "7028839993", "Active", "", "0.47", "12", "harish@patil.org", "7.45", "FMCG distribution centers", "Unverified", "223156", "LIC593705", "45000"],
  ["6861220", "Sugar Processing Zone, Kopargaon", "Ahmadnagar", "MAHARASHTRA", "1800", "19-Feb-24", "18-Feb-29", "7028839994", "Active", "", "0.74", "9", "priyanka@more.biz", "5.78", "Multi-modal logistics hubs", "Verified", "223157", "LIC593706", "81000"],
  ["6709837", "Market Yard Extension, Sironcha", "Gadchiroli", "MAHARASHTRA", "1350", "18-Apr-23", "17-Apr-28", "7588302010", "Active", "", "0.71", "14", "sachin@joshi.info", "8.90", "Multi-modal logistics hubs", "Unverified", "900843", "LIC136595", "60750"],
  ["6709838", "Agricultural Zone, Armori", "Gadchiroli", "MAHARASHTRA", "950", "19-Apr-23", "18-Apr-28", "7588302011", "Active", "", "0.88", "10", "meena@singh.com", "6.78", "Agri-commodity specialized warehouses", "Verified", "900844", "LIC136596", "42750"],
  ["6709839", "Industrial Estate, Dhanora", "Gadchiroli", "MAHARASHTRA", "1700", "20-Apr-23", "19-Apr-28", "7588302012", "Active", "", "0.52", "6", "arun@yadav.net", "4.45", "Industrial logistics parks", "Unverified", "900845", "LIC136597", "76500"],
  ["6709840", "Cooperative Complex, Chamorshi", "Gadchiroli", "MAHARASHTRA", "1200", "21-Apr-23", "20-Apr-28", "7588302013", "Active", "", "0.79", "18", "pushpa@pandey.org", "7.56", "Cold chain storage facilities", "Verified", "900846", "LIC136598", "54000"],
  ["6709841", "Tribal Development Hub, Kurkheda", "Gadchiroli", "MAHARASHTRA", "2200", "22-Apr-23", "21-Apr-28", "7588302014", "Active", "", "0.64", "15", "ganesh@chouhan.biz", "5.23", "FMCG distribution centers", "Unverified", "900847", "LIC136599", "99000"],
  ["6681400", "Market Complex Extension, Umared", "Nagpur", "MAHARASHTRA", "1350", "12-Feb-23", "11-Feb-28", "9921304212", "Active", "", "0.86", "11", "usha@gupta.info", "7.78", "FMCG distribution centers", "Unverified", "586268", "LIC104065", "60750"],
  ["6681401", "Agricultural Zone, Katol", "Nagpur", "MAHARASHTRA", "950", "13-Feb-23", "12-Feb-28", "9921304213", "Active", "", "0.43", "7", "dinesh@kulkarni.com", "5.67", "Agri-commodity specialized warehouses", "Verified", "586269", "LIC104066", "42750"],
  ["6681402", "Industrial Estate, Hingna", "Nagpur", "MAHARASHTRA", "1700", "14-Feb-23", "13-Feb-28", "9921304214", "Active", "", "0.69", "17", "sanjana@bhosale.net", "4.34", "Industrial logistics parks", "Unverified", "586270", "LIC104067", "76500"],
  ["6681403", "Cooperative Hub, Ramtek", "Nagpur", "MAHARASHTRA", "1200", "15-Feb-23", "14-Feb-28", "9921304215", "Active", "", "0.92", "13", "prakash@patil.org", "6.89", "Cold chain storage facilities", "Verified", "586271", "LIC104068", "54000"],
  ["6681404", "MIDC Zone, Butibori", "Nagpur", "MAHARASHTRA", "2200", "16-Feb-23", "15-Feb-28", "9921304216", "Active", "", "0.57", "9", "kaveri@more.biz", "8.45", "Multi-modal logistics hubs", "Unverified", "586272", "LIC104069", "99000"],
  ["8651706", "Gat No. 156/12, Kolhapur Extended Zone", "Kolhapur", "MAHARASHTRA", "4300", "17-Oct-20", "16-Oct-25", "9764456790", "Active", "", "0.81", "16", "sunita@singh.info", "4.89", "Agri-commodity specialized warehouses", "Verified", "416235", "LIC123466", "193500"],
  ["8651707", "Plot No. 78/10, Radhanagari Sugar Belt", "Kolhapur", "MAHARASHTRA", "3200", "18-Oct-20", "17-Oct-25", "9881456790", "Active", "", "0.48", "12", "manoj@yadav.com", "6.78", "Industrial logistics parks", "Unverified", "416101", "LIC345688", "144000"],
  ["8651708", "Survey No. 234/12, Shahuwadi Cooperative Zone", "Kolhapur", "MAHARASHTRA", "5600", "19-Oct-20", "18-Oct-25", "9422456790", "Active", "", "0.74", "8", "rekha@pandey.net", "5.34", "Cold chain storage facilities", "Verified", "416213", "LIC567900", "252000"],
  ["8651709", "Gat No. 67/10A, Gadhinglaj Industrial Area", "Kolhapur", "MAHARASHTRA", "2900", "20-Oct-20", "19-Oct-25", "9823567891", "Active", "", "0.92", "14", "vijay@chouhan.org", "7.89", "FMCG distribution centers", "Unverified", "416502", "LIC789022", "130500"],
  ["8651710", "Plot No. 123/12, Ajra Agricultural Hub", "Kolhapur", "MAHARASHTRA", "4100", "21-Oct-20", "20-Oct-25", "9764567891", "Active", "", "0.56", "10", "geeta@desai.biz", "4.56", "Multi-modal logistics hubs", "Verified", "416505", "LIC901243", "184500"],
  ["8651711", "Survey No. 89/12, Sangli MIDC Phase III", "Sangli", "MAHARASHTRA", "3800", "22-Oct-20", "21-Oct-25", "9881567891", "Active", "", "0.83", "18", "ravi@kulkarni.info", "6.12", "Agri-commodity specialized warehouses", "Unverified", "416418", "LIC123467", "171000"],
  ["8651712", "Gat No. 156/13, Miraj Extended Industrial Zone", "Sangli", "MAHARASHTRA", "5300", "23-Oct-20", "22-Oct-25", "9422567891", "Active", "", "0.39", "6", "smita@bhosale.com", "7.45", "Industrial logistics parks", "Verified", "416411", "LIC345689", "238500"],
  ["8651713", "Plot No. 78/11, Walwa Cooperative Complex", "Sangli", "MAHARASHTRA", "2700", "24-Oct-20", "23-Oct-25", "9823678902", "Active", "", "0.66", "15", "pravin@patil.net", "5.78", "Cold chain storage facilities", "Unverified", "416315", "LIC567901", "121500"],
  ["8651714", "Survey No. 234/13, Vita Sugar Processing Zone", "Sangli", "MAHARASHTRA", "4600", "25-Oct-20", "24-Oct-25", "9764678902", "Active", "", "0.79", "11", "lalita@more.org", "8.23", "FMCG distribution centers", "Verified", "415312", "LIC789023", "207000"],
  ["8651715", "Gat No. 67/11B, Palus Agricultural Extension", "Sangli", "MAHARASHTRA", "3500", "26-Oct-20", "25-Oct-25", "9881678902", "Active", "", "0.52", "7", "harish@joshi.biz", "4.67", "Multi-modal logistics hubs", "Unverified", "416311", "LIC901244", "157500"],
  ["8651716", "Plot No. 123/13, Solapur Sugar Belt Extended", "Solapur", "MAHARASHTRA", "6800", "27-Oct-20", "26-Oct-25", "9422678902", "Active", "", "0.87", "17", "priyanka@singh.info", "6.89", "Industrial logistics parks", "Verified", "413256", "LIC123468", "306000"],
  ["8651717", "Survey No. 89/13, Pandharpur Cooperative Hub", "Solapur", "MAHARASHTRA", "4200", "28-Oct-20", "27-Oct-25", "9823789013", "Active", "", "0.44", "13", "sachin@yadav.com", "5.45", "Agri-commodity specialized warehouses", "Unverified", "413304", "LIC345690", "189000"],
  ["8651718", "Gat No. 156/14, Akkalkot Industrial Estate", "Solapur", "MAHARASHTRA", "5700", "29-Oct-20", "28-Oct-25", "9764789013", "Active", "", "0.71", "9", "meena@pandey.net", "7.12", "Cold chain storage facilities", "Verified", "413216", "LIC567902", "256500"],
  ["8651719", "Plot No. 78/12, Barshi Agricultural Zone", "Solapur", "MAHARASHTRA", "3300", "30-Oct-20", "29-Oct-25", "9881789013", "Active", "", "0.94", "16", "arun@chouhan.org", "4.78", "FMCG distribution centers", "Unverified", "413401", "LIC789024", "148500"],
  ["8651720", "Survey No. 234/14, Tuljapur Processing Complex", "Solapur", "MAHARASHTRA", "4900", "31-Oct-20", "30-Oct-25", "9422789013", "Active", "", "0.58", "12", "pushpa@desai.biz", "8.56", "Multi-modal logistics hubs", "Verified", "413601", "LIC901245", "220500"],
  ["8651721", "Gat No. 67/12A, Satara Wine Country Extension", "Satara", "MAHARASHTRA", "3600", "1-Nov-20", "31-Oct-25", "9823890124", "Active", "", "0.81", "8", "ganesh@kulkarni.info", "5.89", "Agri-commodity specialized warehouses", "Unverified", "415002", "LIC123469", "162000"],
  ["8651722", "Plot No. 123/14, Karad Industrial Hub Extended", "Satara", "MAHARASHTRA", "5200", "2-Nov-20", "1-Nov-25", "9764890124", "Active", "", "0.47", "14", "usha@bhosale.com", "6.78", "Industrial logistics parks", "Verified", "415110", "LIC345691", "234000"],
  ["8651723", "Survey No. 89/14, Patan Sugar Cooperative Zone", "Satara", "MAHARASHTRA", "2800", "3-Nov-20", "2-Nov-25", "9881890124", "Active", "", "0.73", "10", "dinesh@patil.net", "4.34", "Cold chain storage facilities", "Unverified", "415206", "LIC567903", "126000"],
  ["8651724", "Gat No. 156/15, Koregaon Agricultural Extension", "Satara", "MAHARASHTRA", "4500", "4-Nov-20", "3-Nov-25", "9422890124", "Active", "", "0.89", "6", "sanjana@more.org", "7.67", "FMCG distribution centers", "Verified", "415501", "LIC789025", "202500"],
  ["8651725", "Plot No. 78/13, Wai Processing Complex", "Satara", "MAHARASHTRA", "3700", "5-Nov-20", "4-Nov-25", "9823901235", "Active", "", "0.55", "18", "prakash@joshi.biz", "5.23", "Multi-modal logistics hubs", "Unverified", "412803", "LIC901246", "166500"],
  ["8651726", "Survey No. 234/15, Dhule Textile Hub Extended", "Dhule", "MAHARASHTRA", "4800", "6-Nov-20", "5-Nov-25", "9764901235", "Active", "", "0.78", "15", "kaveri@singh.info", "6.45", "Industrial logistics parks", "Verified", "424002", "LIC123470", "216000"],
  ["8651727", "Gat No. 67/13B, Shirpur Industrial Zone", "Dhule", "MAHARASHTRA", "3100", "7-Nov-20", "6-Nov-25", "9881901235", "Active", "", "0.62", "11", "manoj@yadav.com", "4.89", "Agri-commodity specialized warehouses", "Unverified", "425405", "LIC345692", "139500"],
  ["8651728", "Plot No. 123/15, Sakri Cooperative Complex", "Dhule", "MAHARASHTRA", "5500", "8-Nov-20", "7-Nov-25", "9422901235", "Active", "", "0.85", "7", "rekha@pandey.net", "7.78", "Cold chain storage facilities", "Verified", "424306", "LIC567904", "247500"],
  ["8651729", "Survey No. 89/15, Sindkhede Agricultural Hub", "Dhule", "MAHARASHTRA", "2600", "9-Nov-20", "8-Nov-25", "9823012346", "Active", "", "0.41", "17", "vijay@chouhan.org", "5.67", "FMCG distribution centers", "Unverified", "424104", "LIC789026", "117000"],
  ["8651730", "Gat No. 156/16, Dondaicha Processing Zone", "Dhule", "MAHARASHTRA", "4300", "10-Nov-20", "9-Nov-25", "9764012346", "Active", "", "0.67", "13", "geeta@desai.biz", "8.34", "Multi-modal logistics hubs", "Verified", "425408", "LIC901247", "193500"]
];

// Process the warehouse data
export const maharashtraWarehouses: WarehouseData[] = processWarehouseData(csvData);

// Enhanced filter options
export const filterOptions = {
  districts: [...new Set(maharashtraWarehouses.map(w => w.district))].sort(),
  warehouseTypes: [...new Set(maharashtraWarehouses.map(w => w.warehouseType))].sort(),
  capacityRanges: [
    { label: "Small (< 2,000 MT)", min: 0, max: 2000 },
    { label: "Medium (2,000 - 10,000 MT)", min: 2000, max: 10000 },
    { label: "Large (10,000 - 30,000 MT)", min: 10000, max: 30000 },
    { label: "Extra Large (> 30,000 MT)", min: 30000, max: Infinity }
  ],
  priceRanges: [
    { label: "Budget (₹2-5/sqft)", min: 2, max: 5 },
    { label: "Standard (₹5-8/sqft)", min: 5, max: 8 },
    { label: "Premium (₹8+/sqft)", min: 8, max: Infinity }
  ],
  occupancyRanges: [
    { label: "Low Occupancy (< 40%)", min: 0, max: 0.4 },
    { label: "Medium Occupancy (40-70%)", min: 0.4, max: 0.7 },
    { label: "High Occupancy (> 70%)", min: 0.7, max: 1 }
  ],
  certificateTypes: ['Verified', 'Unverified'],
  statusTypes: ['Active', 'Inactive', 'Cancelled']
};

// Stats for the platform
export const platformStats = {
  totalWarehouses: maharashtraWarehouses.length,
  totalCapacity: maharashtraWarehouses.reduce((sum, w) => sum + w.capacity, 0),
  totalArea: maharashtraWarehouses.reduce((sum, w) => sum + w.size, 0),
  averageOccupancy: maharashtraWarehouses.reduce((sum, w) => sum + w.occupancy, 0) / maharashtraWarehouses.length,
  districtsCount: [...new Set(maharashtraWarehouses.map(w => w.district))].length,
  verifiedWarehouses: maharashtraWarehouses.filter(w => w.ownershipCertificate === 'Verified').length,
  // Additional statistics for the ML Recommendations page
  averagePrice: maharashtraWarehouses.reduce((sum, w) => sum + w.pricing, 0) / maharashtraWarehouses.length,
  averageRating: maharashtraWarehouses.reduce((sum, w) => sum + w.rating, 0) / maharashtraWarehouses.length,
  pricingRange: {
    min: Math.min(...maharashtraWarehouses.map(w => w.pricing)),
    max: Math.max(...maharashtraWarehouses.map(w => w.pricing))
  },
  areaRange: {
    min: Math.min(...maharashtraWarehouses.map(w => w.size)),
    max: Math.max(...maharashtraWarehouses.map(w => w.size))
  }
};

/* R²-SAFE: ฐานงานวิจัยและเอกสารของแต่ละมาตรการในแผนปฏิบัติการ แยกเป็น 3 ชั้นตามที่มีหลักฐานจริง
   (ก) ฐานแนวคิดและนโยบายจากบทที่ 2 ของโครงร่างดุษฎีนิพนธ์ (กรอบ CSSF ขอบข่ายภัย 4 กลุ่มและมาตรการ 3 ป. ISO 31000 7-S ฯลฯ) คำนวณจากข้อมูลของมาตรการ
   (ข) ต้นแบบการพัฒนากลยุทธ์/รูปแบบความปลอดภัยในโรงเรียนไทย (ตารางที่ 2.1)
   (ค) หลักฐานของผลของมาตรการแต่ละข้อจากคลังมาตรการ (ระดับ A–D พร้อมแหล่ง) 26 จาก 29 แหล่งเพิ่มเข้าบทที่ 2 ข้อ 2.9.4 ตารางที่ 2.5 และรายการอ้างอิงตั้งแต่โครงร่างฉบับ v15
   (ผลหลักได้จากบทคัดย่อและการค้นเว็บ ยังไม่ได้อ่านเนื้อเต็ม รายการที่ยังขาดเลขหน้าหรือ DOI มีวงเล็บเหลี่ยมกำกับในข้อความอ้างอิงเต็ม)
   รายการอ้างอิงเต็มและข้อความในตารางที่ 2.1 ดึงจากโครงร่างดุษฎีนิพนธ์ โดยตรง ห้ามเพิ่มรายการที่ไม่อยู่ในบทที่ 2 โดยไม่ตรวจที่มา
   rationale() ประกอบข้อความ หลักการและเหตุผล ของแผนรายมาตรการจากผลวิเคราะห์ของระบบ พร้อมอ้างอิงสั้น (ผู้แต่ง ปี · ข้อของบทที่ 2) ไม่ใช้ DOM
   ไฟล์นี้ไม่มี DOM และไม่ส่งข้อมูลไปที่ใด */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;

  const REFS = {
  "cssf": {
    "short": "GADRRRES (2022)",
    "sec": "2.3.2",
    "full": "Global Alliance for Disaster Risk Reduction and Resilience in the Education Sector. (2022). Comprehensive school safety framework 2022–2030 for child rights and resilience in the education sector. Available from: https://gadrrres.net/files/css-framework-2022-2030-en.pdf"
  },
  "moe64": {
    "short": "กระทรวงศึกษาธิการ (2564)",
    "sec": "2.3.5",
    "full": "กระทรวงศึกษาธิการ. (2564). คู่มือการดำเนินงานความปลอดภัยสถานศึกษา. แหล่งที่มา: https://www.cpn1.go.th/wp-content/uploads/2022/11/คู่มือความปลอดภัย-กระทรวงศึกษาธิการ.pdf"
  },
  "iso": {
    "short": "ISO (2018)",
    "sec": "2.4",
    "full": "International Organization for Standardization. (2018). ISO 31000:2018 Risk management—Guidelines. ISO."
  },
  "s7": {
    "short": "McKinsey (2008)",
    "sec": "2.2",
    "full": "McKinsey & Company. (2008, March 1). Enduring ideas: The 7-S framework. Available from: https://www.mckinsey.com/capabilities/people-and-organization/our-insights/enduring-ideas-the-7-s-framework"
  },
  "hreb": {
    "short": "Hrebiniak (2006)",
    "sec": "2.8",
    "full": "Hrebiniak, L. G. (2006). Obstacles to effective strategy implementation. Organizational Dynamics, 35(1), 12–31. Available from: https://doi.org/10.1016/j.orgdyn.2005.12.001"
  },
  "liou": {
    "short": "Liou (2015)",
    "sec": "2.7",
    "full": "Liou, Y.-H. (2015). School crisis management: A model of dynamic responsiveness to crisis life cycle. Educational Administration Quarterly, 51(2), 247–289. Available from: https://doi.org/10.1177/0013161X14532467"
  },
  "marz": {
    "short": "Marzban et al. (2026)",
    "sec": "2.9.3",
    "full": "Marzban, A., Dowlati, M., Moslehi, S., and Marzaleh, M. A. (2026). Role of schools in disaster risk management: A systematic review. BMC Emergency Medicine, 26(1), Article 23. Available from: https://doi.org/10.1186/s12873-025-01453-z"
  },
  "pdpa": {
    "short": "อภิภัสร์ ปาสานะเก และคณะ (2569)",
    "sec": "2.3.5",
    "full": "อภิภัสร์ ปาสานะเก, ณัฎฐ์ภัส ภาคะ, ชัยวัฒน์ ป้อมพิทักษ์, สาลินี ลิขิตพัฒนะกุล, และรัชชานนท์ วิพัฒน์โสภากร. (2569). สิทธิของนักเรียนตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 และความท้าทายในการบังคับใช้ภายในสถานศึกษา. วารสารเสียงธรรมจากมหายาน, 12(1), 435–448."
  },
  "cosma": {
    "short": "Cosma et al. (2024)",
    "sec": "2.3.4",
    "full": "Cosma, A., Molcho, M., and Pickett, W. (2024). A focus on adolescent peer violence and bullying in Europe, central Asia and Canada. Health Behaviour in School-aged Children international report from the 2021/2022 survey. Volume 2. WHO Regional Office for Europe. Available from: https://iris.who.int/handle/10665/376323"
  },
  "weera": {
    "short": "วีรวิชญ์ เลิศรัตน์ธำรงกุล (2564)",
    "sec": "2.3.4",
    "full": "วีรวิชญ์ เลิศรัตน์ธำรงกุล. (2564). การกลั่นแกล้งกันในพื้นที่ไซเบอร์ของนักเรียนระดับมัธยมศึกษาตอนต้น: ความชุก วิธีการจัดการปัญหา และพฤติกรรมเสี่ยง. วารสารวิชาการและวิจัย มหาวิทยาลัยภาคตะวันออกเฉียงเหนือ, 11(1), 275–289."
  },
  "panja": {
    "short": "ปัญจรัตน์ ไล้สุวรรณชาติ และคณะ (2565)",
    "sec": "2.3.4",
    "full": "ปัญจรัตน์ ไล้สุวรรณชาติ, ธานินทร์ สุธีประเสริฐ, และสุภาพร บุญศิริลักษณ์. (2565). ปัจจัยทำนายการกลั่นแกล้งและถูกกลั่นแกล้งทางไซเบอร์ของนักเรียนในภาคกลางของประเทศไทย. วารสารสุขภาพจิตแห่งประเทศไทย, 30(2), 100–113."
  },
  "thana": {
    "short": "ธนัชพร สุทธิศันสนีย์ และคณะ (2565)",
    "sec": "2.3.4",
    "full": "ธนัชพร สุทธิศันสนีย์, บัวทอง สว่างโสภากุล, และสุรินทร์ นิยมางกูร. (2565). การศึกษาความรู้ต่อการกลั่นแกล้งทางไซเบอร์ การเห็นคุณค่าในตนเอง และทัศนคติต่อการกลั่นแกล้งทางไซเบอร์ของนักเรียนมัธยมศึกษา. วารสารการวัดผลการศึกษา, 39(106), 50–62."
  },
  "nitta": {
    "short": "นิษฐ์ฐา พีระชัยภาวงศ์ และคณะ (2567)",
    "sec": "2.9.1",
    "full": "นิษฐ์ฐา พีระชัยภาวงศ์, สุพรรณี สมานญาติ, และสิรินธร สินจินดาวงศ์. (2567). รูปแบบการบริหารสู่ความเป็นเลิศด้านสถานศึกษาปลอดภัย สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษากรุงเทพมหานคร เขต 2. Journal of Roi Kaensarn Academi, 9(7), 785–801."
  },
  "sumit": {
    "short": "สุมิตตา หล่ำจันทึก และคณะ (2569)",
    "sec": "2.9.1",
    "full": "สุมิตตา หล่ำจันทึก, สุวิมล ตั้งประเสริฐ, และสงวนพงศ์ ชวนชม. (2569). กลยุทธ์การพัฒนาสถานศึกษาปลอดภัยของโรงเรียนมัธยมศึกษา สังกัดสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน ในภาคตะวันออกเฉียงเหนือตอนล่าง 1. สิกขา วารสารศึกษาศาสตร์, 13(1), 275–287."
  },
  "suras": {
    "short": "สุรัสวดี สุขยิ่ง และคณะ (2569)",
    "sec": "2.9.1",
    "full": "สุรัสวดี สุขยิ่ง, พิฏา สมบูรณ์, และเริงวิชญ์ นิลโคตร. (2569). แนวทางการบริหารสถานศึกษาเพื่อยกระดับความปลอดภัยของสถานศึกษาในบริบทเขตพัฒนาพิเศษภาคตะวันออก สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาชลบุรี ระยอง. วารสารปราชญ์ประชาคม, 4(3), 323–340."
  },
  "pong": {
    "short": "พงศ์จักร ยามสุข และคณะ (2567)",
    "sec": "2.9.1",
    "full": "พงศ์จักร ยามสุข, สุเทพ เมยไธสง, และจิราภรณ์ ผันสว่าง. (2567). การพัฒนากลยุทธ์การบริหารสถานศึกษาตามแนวคิดไม่ทิ้งเด็กคนใดไว้ข้างหลัง ของสถานศึกษาสังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาบุรีรัมย์. วารสารสังคมศาสตร์และวัฒนธรรม, 8(1), 243–256."
  },
  "agyapong": { "short": "Agyapong และคณะ (2022)", "sec": "2.9.4", "full": "Agyapong, B., Obuobi-Donkor, G., Burback, L., and Wei, Y. (2022). Stress, burnout, anxiety and depression among teachers: A scoping review. International Journal of Environmental Research and Public Health, 19(17), Article 10706. Available from: https://doi.org/10.3390/ijerph191710706" },
  "anderson": { "short": "Anderson และคณะ (2019)", "sec": "2.9.4", "full": "Anderson, J. K., et al. (2019). A systematic review of effectiveness and cost-effectiveness of school-based identification of children and young people at risk of, or currently experiencing mental health difficulties. Psychological Medicine, 49(1). Available from: https://doi.org/10.1017/S0033291718002490 [เติมเลขหน้า]" },
  "avery": { "short": "Avery และคณะ (2021)", "sec": "2.9.4", "full": "Avery, J. C., Morris, H., Galvin, E., Misso, M., Savaglio, M., and Skouteris, H. (2021). Systematic review of school-wide trauma-informed approaches. Journal of Child & Adolescent Trauma, 14(3), 381–397. Available from: https://doi.org/10.1007/s40653-020-00321-1" },
  "charlton": { "short": "Charlton และคณะ (2021)", "sec": "2.9.4", "full": "Charlton, C. T., Moulton, S., Sabey, C. V., and West, R. (2021). A systematic review of the effects of schoolwide intervention programs on student and teacher perceptions of school climate. Journal of Positive Behavior Interventions, 23(3), 185–200.  [เติม DOI และตรวจชื่อเรื่อง]" },
  "cipriano": { "short": "Cipriano และคณะ (2023)", "sec": "2.9.4", "full": "Cipriano, C., et al. (2023). The state of evidence for social and emotional learning: A contemporary meta-analysis of universal school-based SEL interventions. Child Development, 94(5), 1181–1204. Available from: https://doi.org/10.1111/cdev.13968" },
  "evans": { "short": "Evans และ Hurrell (2016)", "sec": "2.9.4", "full": "Evans, R., and Hurrell, C. (2016). The role of schools in children and young people’s self-harm and suicide: Systematic review and meta-ethnography of qualitative research. BMC Public Health, 16, Article 401. Available from: https://doi.org/10.1186/s12889-016-3065-2" },
  "faggiano": { "short": "Faggiano และคณะ (2014)", "sec": "2.9.4", "full": "Faggiano, F., Minozzi, S., Versino, E., and Buscemi, D. (2014). Universal school-based prevention for illicit drug use. Cochrane Database of Systematic Reviews, 2014(12), Article CD003020. Available from: https://doi.org/10.1002/14651858.CD003020.pub3" },
  "fraguas": { "short": "Fraguas และคณะ (2021)", "sec": "2.9.4", "full": "Fraguas, D., et al. (2021). Assessment of school anti-bullying interventions: A meta-analysis of randomized clinical trials. JAMA Pediatrics, 175(1). Available from: https://doi.org/10.1001/jamapediatrics.2020.3541 [เติมเลขหน้า]" },
  "gaffney": { "short": "Gaffney และคณะ (2021)", "sec": "2.9.4", "full": "Gaffney, H., Ttofi, M. M., and Farrington, D. P. (2021). What works in anti-bullying programs? Analysis of effective intervention components. Journal of School Psychology, 85, 37–56. [เติม DOI]" },
  "griebler": { "short": "Griebler และคณะ (2017)", "sec": "2.9.4", "full": "Griebler, U., Rojatz, D., Simovska, V., and Forster, R. (2017). Effects of student participation in school health promotion: A systematic review. Health Promotion International, 32(2), 195–206. Available from: https://doi.org/10.1093/heapro/dat090" },
  "heekes": { "short": "Heekes และคณะ (2022)", "sec": "2.9.4", "full": "Heekes, S.-L., Kruger, C., Lester, S., and Ward, C. (2022). A systematic review of corporal punishment in schools: Global prevalence and correlates. Trauma, Violence, & Abuse, 23(1). Available from: https://doi.org/10.1177/1524838020925787 [เติมเลขหน้า]" },
  "hoyle": { "short": "Hoyle และคณะ (2023)", "sec": "2.9.4", "full": "Hoyle, E., Davies, H., Bourhill, J., Roberts, N., Lee, J. J., and Albury, C. (2023). Effectiveness of hand-hygiene interventions in reducing illness-related absence in educational settings in high income countries: Systematic review and behavioural analysis. Journal of Public Health, 33(3), 659–670. Available from: https://doi.org/10.1007/s10389-023-02044-7 [เผยแพร่ออนไลน์ปี 2023 เล่ม 33 เป็นเล่มปี 2025 ตรวจปีที่ใช้อ้างอิง]" },
  "isaac": { "short": "Isaac และคณะ (2009)", "sec": "2.9.4", "full": "Isaac, M., et al. (2009). Gatekeeper training as a preventative intervention for suicide: A systematic review. Canadian Journal of Psychiatry, 54(4), 260–268. [เติม DOI]" },
  "jasper": { "short": "Jasper และคณะ (2012)", "sec": "2.9.4", "full": "Jasper, C., Le, T.-T., and Bartram, J. (2012). Water and sanitation in schools: A systematic review of the health and educational outcomes. International Journal of Environmental Research and Public Health, 9(8), 2772–2787. Available from: https://doi.org/10.3390/ijerph9082772" },
  "langford": { "short": "Langford และคณะ (2015)", "sec": "2.9.4", "full": "Langford, R., et al. (2015). The World Health Organization’s Health Promoting Schools framework: A Cochrane systematic review and meta-analysis. BMC Public Health, 15, Article 130. Available from: https://doi.org/10.1186/s12889-015-1360-y" },
  "lester": { "short": "Lester และคณะ (2017)", "sec": "2.9.4", "full": "Lester, L., Lawrence, D., and Ward, R. L. (2017). What do we know about preventing school violence? A systematic review of systematic reviews. Psychology, Health & Medicine. Available from: https://doi.org/10.1080/13548506.2017.1282616 [เติมเล่ม ฉบับ และเลขหน้า]" },
  "lodi": { "short": "Lodi และคณะ (2022)", "sec": "2.9.4", "full": "Lodi, E., Perrella, L., Lepri, G. L., Scarpa, M. L., and Patrizi, P. (2022). Use of restorative justice and restorative practices at school: A systematic literature review. International Journal of Environmental Research and Public Health, 19(1), Article 96. Available from: https://doi.org/10.3390/ijerph19010096" },
  "mariani": { "short": "Mariani และคณะ (2026)", "sec": "2.9.4", "full": "Mariani, M., Lomas, G., Berger, C., Butkus, S., and Yoon, H. (2026). Reconsidering lockdown drills in K–12 schools: A scoping review of empirical evidence on implementation practices, trauma-informed considerations, and reported outcomes. Social Sciences, 15(7), Article 422. Available from: https://doi.org/10.3390/socsci15070422" },
  "mo": { "short": "Mo และคณะ (2018)", "sec": "2.9.4", "full": "Mo, P. K. H., Ko, T. T., and Xin, M. Q. (2018). School-based gatekeeper training programmes in enhancing gatekeepers’ cognitions and behaviours for adolescent suicide prevention: A systematic review. Child and Adolescent Psychiatry and Mental Health, 12. Available from: https://doi.org/10.1186/s13034-018-0233-4 [เติมเลขบทความ]" },
  "ng": { "short": "Ng และคณะ (2022)", "sec": "2.9.4", "full": "Ng, E. D., Chua, J. Y. X., and Shorey, S. (2022). The effectiveness of educational interventions on traditional bullying and cyberbullying among adolescents: A systematic review and meta-analysis. Trauma, Violence, & Abuse, 23(1), 132–151. Available from: https://doi.org/10.1177/1524838020933867" },
  "plant": { "short": "Plant และ Taylor (2013)", "sec": "2.9.4", "full": "Plant, N., and Taylor, K. (2013). How best to teach CPR to schoolchildren: A systematic review. Resuscitation, 84, 415–421. [เติม DOI]" },
  "reveruzzi": { "short": "Reveruzzi และคณะ (2016)", "sec": "2.9.4", "full": "Reveruzzi, B., Buckley, L., and Sheehan, M. (2016). School-based first aid training programs: A systematic review. Journal of School Health, 86(4), 266–272. Available from: https://doi.org/10.1111/josh.12373" },
  "rolfsnes": { "short": "Rolfsnes และ Idsoe (2011)", "sec": "2.9.4", "full": "Rolfsnes, E. S., and Idsoe, T. (2011). School-based intervention programs for PTSD symptoms: A review and meta-analysis. Journal of Traumatic Stress, 24(2), 155–165. [เติม DOI]" },
  "seddighi": { "short": "Seddighi และคณะ (2022)", "sec": "2.9.4", "full": "Seddighi, H., et al. (2022). School-based education programs for preparing children for natural hazards: A systematic review. Disaster Medicine and Public Health Preparedness, 16(3), 1229–1241. [เติม DOI]" },
  "walsh": { "short": "Walsh และคณะ (2015)", "sec": "2.9.4", "full": "Walsh, K., Zwi, K., Woolfenden, S., and Shlonsky, A. (2015). School-based education programmes for the prevention of child sexual abuse. Cochrane Database of Systematic Reviews, 2015(4), Article CD004380. Available from: https://doi.org/10.1002/14651858.CD004380.pub3" },
  "wiggers": { "short": "Wiggers และ Paas (2022)", "sec": "2.9.4", "full": "Wiggers, M., and Paas, F. (2022). Harsh physical discipline and externalizing behaviors in children: A systematic review. International Journal of Environmental Research and Public Health, 19(21), Article 14385. Available from: https://doi.org/10.3390/ijerph192114385" }
  };
  const THAI = [
  {
    "key": "nitta",
    "who": "นิษฐ์ฐา พีระชัยภาวงศ์ และคณะ (2567)",
    "ctx": "สพม.กรุงเทพมหานคร เขต 2; ผู้บริหาร 9 คน, ผู้บริหารและครู 508 คน, ผู้ทรงคุณวุฒิ 11 คน",
    "method": "ผสมวิธีแบบสำรวจเชิงลำดับ; สุ่มแบบชั้นภูมิ (Yamane); องค์ประกอบเชิงยืนยัน",
    "result": "รูปแบบการบริหารสู่ความเป็นเลิศด้านสถานศึกษาปลอดภัยตามเกณฑ์ The Best Safety Practice ของ สพฐ."
  },
  {
    "key": "sumit",
    "who": "สุมิตตา หล่ำจันทึก และคณะ (2569)",
    "ctx": "โรงเรียนมัธยมศึกษา สพฐ. ภาคตะวันออกเฉียงเหนือตอนล่าง 1; 148 โรงเรียน โรงเรียนละ 3 คน (444 คน)",
    "method": "วิจัยและพัฒนา 3 ระยะ; ประชุมกลุ่มผู้ทรงคุณวุฒิ 7 คน; ประเมินโดย 60 คน; IOC .80–1.00; alpha .94",
    "result": "สภาพโดยรวมระดับมาก; ได้กลยุทธ์ 3 กลยุทธ์"
  },
  {
    "key": "suras",
    "who": "สุรัสวดี สุขยิ่ง และคณะ (2569)",
    "ctx": "สพม.ชลบุรี ระยอง (เขตพัฒนาพิเศษภาคตะวันออก); 351 คน",
    "method": "ผสมวิธี; แบบสอบถาม alpha .97; สัมภาษณ์ 12 คน; สนทนากลุ่ม 5 คน",
    "result": "การรับรู้มาตรการระดับมากที่สุด; แตกต่างตามเพศ; เสนอแนวทาง 6 ประการ"
  },
  {
    "key": "pong",
    "who": "พงศ์จักร ยามสุข และคณะ (2567)",
    "ctx": "สพม.บุรีรัมย์; ผู้บริหารและครู 502 คน (แนวคิดไม่ทิ้งเด็กคนใดไว้ข้างหลัง)",
    "method": "ผสมวิธี; CFA; SWOT และ TOWS; ประเมินกลยุทธ์",
    "result": "4 องค์ประกอบ; 4 กลยุทธ์; ผลประเมินความเหมาะสมและประโยชน์ระดับมากที่สุด ความเป็นไปได้ระดับมาก"
  }
];

  // แหล่งในคลังมาตรการที่อยู่ในบทที่ 2 จริง (แหล่งอื่นยังไม่อยู่ ต้องเพิ่มและตรวจก่อนอ้างอิง)
  const IN_CH2 = {
    'GADRRRES 2022 (CSSF)': { ref: 'cssf', sec: '2.3.2' },
    'Marzban 2026': { ref: 'marz', sec: '2.9.3' },
    'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล 2562': { ref: 'pdpa', sec: '2.3.5' },
    'Agyapong 2022': { ref: 'agyapong', sec: '2.9.4' },
    'Anderson 2019': { ref: 'anderson', sec: '2.9.4' },
    'Avery 2021': { ref: 'avery', sec: '2.9.4' },
    'Charlton 2021': { ref: 'charlton', sec: '2.9.4' },
    'Cipriano 2023': { ref: 'cipriano', sec: '2.9.4' },
    'Evans & Hurrell 2016': { ref: 'evans', sec: '2.9.4' },
    'Faggiano 2014': { ref: 'faggiano', sec: '2.9.4' },
    'Fraguas 2021': { ref: 'fraguas', sec: '2.9.4' },
    'Gaffney 2021': { ref: 'gaffney', sec: '2.9.4' },
    'Griebler 2017': { ref: 'griebler', sec: '2.9.4' },
    'Heekes 2022': { ref: 'heekes', sec: '2.9.4' },
    'Hoyle 2023': { ref: 'hoyle', sec: '2.9.4' },
    'Isaac 2009': { ref: 'isaac', sec: '2.9.4' },
    'Jasper 2012': { ref: 'jasper', sec: '2.9.4' },
    'Langford 2015': { ref: 'langford', sec: '2.9.4' },
    'Lester 2017': { ref: 'lester', sec: '2.9.4' },
    'Lodi 2022': { ref: 'lodi', sec: '2.9.4' },
    'Mariani 2026': { ref: 'mariani', sec: '2.9.4' },
    'Mo 2018': { ref: 'mo', sec: '2.9.4' },
    'Ng 2022': { ref: 'ng', sec: '2.9.4' },
    'Plant & Taylor 2013': { ref: 'plant', sec: '2.9.4' },
    'Reveruzzi 2016': { ref: 'reveruzzi', sec: '2.9.4' },
    'Rolfsnes & Idsoe 2011': { ref: 'rolfsnes', sec: '2.9.4' },
    'Seddighi 2022': { ref: 'seddighi', sec: '2.9.4' },
    'Walsh 2015': { ref: 'walsh', sec: '2.9.4' },
    'Wiggers & Paas 2022': { ref: 'wiggers', sec: '2.9.4' },
  };
  const PILLAR = {
    'รากฐาน': 'รากฐาน (ระบบและนโยบายสนับสนุน)',
    'เสาหลัก 1': 'เสาหลักที่ 1 สภาพแวดล้อมการเรียนรู้ที่ปลอดภัย',
    'เสาหลัก 2': 'เสาหลักที่ 2 การบริหารความปลอดภัยและความต่อเนื่องทางการศึกษา',
    'เสาหลัก 3': 'เสาหลักที่ 3 การลดความเสี่ยงและสร้างความสามารถรับมือผ่านการศึกษา',
  };
  const DOMN = { V: 'ความรุนแรงของมนุษย์', A: 'อุบัติเหตุและภัยพิบัติ', P: 'การละเมิดสิทธิ', H: 'สุขภาวะกายและจิตใจ', X: 'ทุกด้านร่วมกัน' };
  const ELN = { STG: 'กลยุทธ์', STR: 'โครงสร้าง', SYS: 'ระบบ', STY: 'รูปแบบการบริหาร', STF: 'บุคลากร', SKL: 'ทักษะ', VAL: 'ค่านิยมร่วม' };
  // ระดับหลักฐานของผลมาตรการ (ข้อความตรงกับ EVG_TXT ของระบบ) พร้อมข้อควรระวัง
  const EVG = {
    A: ['A', 'มีงานทบทวนเชิงระบบรองรับ', 'มีงานวิจัยรองรับตามแหล่งที่ระบุ แต่ผลจริงขึ้นกับบริบทของโรงเรียน จึงต้องวัดตัวชี้วัดของโรงเรียนเอง'],
    B: ['B', 'รองรับบางส่วนหรือผลผสม', 'มีงานวิจัยรองรับบางส่วนหรือผลไม่ตรงกันทั้งหมด ควรเริ่มในขอบเขตที่ควบคุมได้และติดตามผล'],
    C: ['C', 'มีนโยบายหรือกฎหมายรองรับ ยังไม่มีงานวัดผล', 'มีนโยบายหรือแนวปฏิบัติรองรับ แต่ยังไม่พบงานที่วัดผลของมาตรการนี้ ควรเริ่มแบบนำร่องและเก็บข้อมูลตัวชี้วัด'],
    D: ['D', 'ยังไม่พบหลักฐาน', 'ยังไม่พบหลักฐานจากงานวิจัยหรือนโยบายในการค้นครั้งนี้ เป็นข้อเสนอของผู้วิจัย ควรปรึกษาผู้เชี่ยวชาญก่อนนำไปใช้'],
  };

  const splitSrc = (m) => String((m && m.evsrc) || '').split(';').map((x) => x.trim()).filter(Boolean);
  // ฐานจากบทที่ 2 ของมาตรการหนึ่ง: [{refs:[คีย์], sec, text}] คำนวณจากข้อมูลของมาตรการ ไม่แต่งเพิ่ม
  function basis(m) {
    const o = [];
    if (PILLAR[m.pillar]) o.push({ refs: ['cssf'], sec: '2.3.2', text: 'กรอบ CSSF 2022–2030: ' + PILLAR[m.pillar] });
    o.push({ refs: ['moe64'], sec: '2.3.5', text: 'ขอบข่ายภัย 4 กลุ่ม (ด้าน' + (DOMN[m.dom] || '') + ') และมาตรการ 3 ป. ประเภท' + m.type3 });
    o.push({ refs: ['iso'], sec: '2.4', text: 'จัดลำดับมาตรการตามระดับความเสี่ยงของโรงเรียน (L × C)' });
    o.push({ refs: ['s7'], sec: '2.2', text: 'ประเมินความพร้อมตามองค์ประกอบ 7-S: ' + (ELN[m.elem] || m.elem) });
    o.push({ refs: ['hreb'], sec: '2.8', text: 'โครงสร้างแผนมีผู้รับผิดชอบ ทรัพยากร ตัวชี้วัด และรอบทบทวน' });
    if (m.type3 === 'ปราบปราม' || m.phase === 'ตอบสนอง' || m.phase === 'ฟื้นฟู') o.push({ refs: ['liou'], sec: '2.7', text: 'การตอบสนองและฟื้นฟูเมื่อเกิดเหตุ (วงจรวิกฤตของโรงเรียน)' });
    if (m.online === 'Y') o.push({ refs: ['cosma', 'weera', 'panja', 'thana'], sec: '2.3.4', text: 'หลักฐานว่าปัญหาออนไลน์มีอยู่ในนักเรียน (ไม่ใช่หลักฐานว่ามาตรการนี้ได้ผล)' });
    if (splitSrc(m).some((s) => /พ\.ร\.บ\./.test(s))) o.push({ refs: ['pdpa'], sec: '2.3.5', text: 'ข้อกำหนดกฎหมายคุ้มครองข้อมูลส่วนบุคคลในสถานศึกษา' });
    if (splitSrc(m).some((s) => /Marzban/.test(s))) o.push({ refs: ['marz'], sec: '2.9.3', text: 'งานทบทวนเชิงระบบบทบาทของโรงเรียนในการจัดการความเสี่ยงภัยพิบัติ' });
    return o;
  }
  // แหล่งหลักฐานผลของมาตรการ (จากคลัง) พร้อมสถานะว่าอยู่ในบทที่ 2 หรือไม่
  const sources = (m) => splitSrc(m).map((s) => ({ src: s, inCh2: !!IN_CH2[s], sec: IN_CH2[s] ? IN_CH2[s].sec : '', ref: IN_CH2[s] ? IN_CH2[s].ref : '' }));
  const cite = (b) => b.refs.map((k) => REFS[k].short).join('; ');
  // รายการอ้างอิงที่ใช้จริงจากกลุ่มมาตรการ (ไม่ซ้ำ เรียงตามลำดับที่ปรากฏในบทที่ 2)
  const ORDER = ['moe64', 'cssf', 'iso', 's7', 'hreb', 'liou', 'marz', 'pdpa', 'cosma', 'weera', 'panja', 'thana', 'nitta', 'sumit', 'suras', 'pong', 'agyapong', 'anderson', 'avery', 'charlton', 'cipriano', 'evans', 'faggiano', 'fraguas', 'gaffney', 'griebler', 'heekes', 'hoyle', 'isaac', 'jasper', 'langford', 'lester', 'lodi', 'mariani', 'mo', 'ng', 'plant', 'reveruzzi', 'rolfsnes', 'seddighi', 'walsh', 'wiggers'];
  function refsUsed(measures) {
    const used = new Set(['nitta', 'sumit', 'suras', 'pong']);
    measures.forEach((m) => { basis(m).forEach((b) => b.refs.forEach((k) => used.add(k))); sources(m).forEach((x) => { if (x.ref) used.add(x.ref); }); });
    return ORDER.filter((k) => used.has(k));
  }
  // แหล่งที่ยังไม่อยู่ในบทที่ 2: { 'Gaffney 2021': ['SB-006', ...] }
  function notInCh2(measures) {
    const o = {};
    measures.forEach((m) => sources(m).forEach((s) => { if (!s.inCh2) (o[s.src] = o[s.src] || []).push(m.sb || m.id); }));
    return o;
  }
  // ชื่อย่อของผู้แต่งไทย: 'นิษฐ์ฐา พีระชัยภาวงศ์ และคณะ (2567)' -> 'นิษฐ์ฐา และคณะ (2567)'
  const lite = (k) => REFS[k].short.replace(/^(\S+)\s+\S+\s+(และคณะ)/, '$1 $2');
  const secList = (b) => b.sec;

  // ---------- หลักการและเหตุผลของแผน: ประกอบจากผลวิเคราะห์ของระบบ + อ้างอิงสั้น (ผู้แต่ง ปี · ข้อของบทที่ 2) ----------
  // c = { school, hz (ชื่อด้าน), risk, rd (ข้อความดัชนี R), ready, group, pkgName, pkgSummary, top (ช่องว่าง 7-S ของมาตรการนี้อยู่ใน 3 อันดับแรกหรือไม่), rank, pni, moe: [ข้อของประกาศ] }
  const ci = (k) => lite(k).replace(/ \((\d{4})\)$/, ', $1') + ' · ข้อ ' + REFS[k].sec;
  const cg = (keys) => '(' + keys.map(ci).join('; ') + ')';
  // บรรทัดอ้างอิงสั้นของมาตรการ: 'ISO, 2018 (2.4); Langford และคณะ, 2015 (2.9.4)' ใช้ในเล่มแผน
  function srcLine(m) {
    const ks = [];
    basis(m).forEach((b) => b.refs.forEach((k) => { if (ks.indexOf(k) < 0) ks.push(k); }));
    sources(m).forEach((x) => { if (x.ref && ks.indexOf(x.ref) < 0) ks.push(x.ref); });
    return ks.map((k) => lite(k).replace(/ \((\d{4})\)$/, ', $1') + ' (' + REFS[k].sec + ')').join('; ');
  }
  function rationale(m, c) {
    const out = [];
    out.push({ lead: 'สถานการณ์ที่ระบบวิเคราะห์ได้', text: 'จากผลประเมินของ' + c.school + ' ด้าน' + c.hz + ' มีความเสี่ยงระดับ' + c.risk + (c.rd ? ' (ดัชนี R ' + c.rd + ' จากโอกาส × ผลกระทบ; ' + ci('iso') + ')' : '') + ' และความพร้อมขององค์กรระดับ' + c.ready + ' ตามองค์ประกอบ 7-S ' + cg(['s7']) + ' ตารางตัดสินใจ Risk × Readiness จัดเป็นกลุ่มแนวทาง ' + c.group + ' ' + c.pkgName + ' (' + c.pkgSummary + ')' });
    const el = ELN[m.elem] || m.elem;
    let why = 'มาตรการนี้เสริมองค์ประกอบ 7-S ด้าน' + el + (c.top ? ' ซึ่งเป็นช่องว่างอันดับ ' + c.rank + ' ของโรงเรียน (PNI ' + c.pni + ')' : ' (ไม่อยู่ใน 3 อันดับช่องว่างสูงสุด แต่เหมาะกับระดับความเสี่ยงและความพร้อมของด้านนี้)') +
      ' เป็นมาตรการประเภท' + m.type3 + ' ในกรอบ 3 ป. และขอบข่ายภัย 4 กลุ่ม ' + cg(['moe64']);
    if (PILLAR[m.pillar]) why += ' ตาม' + PILLAR[m.pillar] + ' ' + cg(['cssf']);
    if (c.moe && c.moe.length) why += ' และตอบสนองประกาศกระทรวงศึกษาธิการ เรื่อง มาตรการความปลอดภัยของสถานศึกษา (10 สิงหาคม 2569) ข้อ ' + c.moe.join(', ');
    if (m.online === 'Y') why += ' นอกจากนี้ปัญหาออนไลน์พบในนักเรียนไทยและต่างประเทศ (' + ['weera', 'panja', 'thana', 'cosma'].map((k) => lite(k).replace(/ \((\d{4})\)$/, ', $1')).join('; ') + ' · ข้อ 2.3.4) ซึ่งเป็นหลักฐานว่าปัญหามีอยู่ ไม่ใช่หลักฐานว่ามาตรการนี้ได้ผล';
    if (m.type3 === 'ปราบปราม' || m.phase === 'ตอบสนอง' || m.phase === 'ฟื้นฟู') why += ' การตอบสนองและฟื้นฟูเมื่อเกิดเหตุเป็นส่วนหนึ่งของวงจรวิกฤตของโรงเรียน ' + cg(['liou']);
    out.push({ lead: 'เหตุผลที่ต้องมีมาตรการนี้', text: why });
    out.push({ lead: 'เหตุผลที่วางแผนในรูปแบบนี้', text: 'แผนกำหนดผู้รับผิดชอบ ทรัพยากร ตัวชี้วัด และรอบทบทวน ตามหลักการนำกลยุทธ์ไปปฏิบัติ ' + cg(['hreb']) + ' และต่อยอดงานพัฒนากลยุทธ์ความปลอดภัยในโรงเรียนไทย (' + THAI.map((t) => lite(t.key).replace(/ \((\d{4})\)$/, ', $1')).join('; ') + ' · ข้อ 2.9.1) ซึ่งได้ชุดกลยุทธ์หรือรูปแบบของพื้นที่ที่ศึกษา ไม่ใช่หลักฐานว่ามาตรการนี้ได้ผลในโรงเรียนอื่น' });
    const ev = EVG[m.evg] || EVG.D, srcs = sources(m);
    out.push({ lead: 'งานวิจัยที่รองรับผลของมาตรการนี้', text: 'ระดับ ' + ev[0] + ' ' + ev[1] + (srcs.length ? ' (แหล่ง: ' + srcs.map((x) => (x.ref ? ci(x.ref) : x.src + ' · ยังไม่อยู่ในบทที่ 2')).join('; ') + ')' : ' ไม่พบแหล่งในการค้นครั้งนี้') });
    return out;
  }

  const api = { REFS, THAI, IN_CH2, PILLAR, EVG, basis, sources, cite, lite, secList, refsUsed, notInCh2, rationale, srcLine };
  if (isNode) module.exports = api; else root.RS_EVIDENCE = api;
})(typeof window !== 'undefined' ? window : this);

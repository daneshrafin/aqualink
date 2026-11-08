/** Demo worksheet values informed by the references below; not live/local procurement quotes. */
export const SANITATION_CATEGORY = 'Sanitation & hygiene';
export const sanitationPrices = [
  {id:'san_latrine_ring',en:'Latrine ring — RCC example',bn:'ল্যাট্রিনের আরসিসি রিং',unit:'ring',price:600,
    source:'https://wash.dphe.online/bn/estimate-for-raised-single-direct-pour-flush-latrine-made-with-ring-slab-itn-buet/',sourceName:'DPHE / ITN-BUET estimate',
    note:'Example based on a published component estimate (৳600/ring), not a current seller quote. Confirm dimensions and site requirements.',bnNote:'প্রকাশিত উপকরণ প্রাক্কলনে রিংপ্রতি ৳৬০০; বর্তমান দোকানের দর নয়। মাপ ও স্থানের প্রয়োজন যাচাই করুন।'},
  {id:'san_latrine_slab',en:'Latrine slab — precast cover example',bn:'ল্যাট্রিনের প্রিকাস্ট ঢাকনা স্ল্যাব',unit:'slab',price:1650,
    source:'https://wash.dphe.online/bn/estimate-for-raised-single-direct-pour-flush-latrine-made-with-ring-slab-itn-buet/',sourceName:'DPHE / ITN-BUET estimate',
    note:'Example cover-slab component, not a complete toilet floor, pan or latrine. Published estimate ৳1,650; confirm compatible specifications.',bnNote:'এটি ঢাকনা স্ল্যাবের উদাহরণ; সম্পূর্ণ মেঝে, প্যান বা ল্যাট্রিন নয়। প্রকাশিত প্রাক্কলন ৳১,৬৫০; উপযুক্ত মাপ যাচাই করুন।'},
  {id:'san_latrine_pan',en:'Latrine pan — ceramic example',bn:'ল্যাট্রিনের সিরামিক প্যান',unit:'pan',price:550,
    source:'https://documents1.worldbank.org/curated/en/127201565075655499/pdf/Bangladesh-OBA-Microfinance-Sanitation-Project-Evaluation-Report.pdf',sourceName:'World Bank evaluation · historical',
    note:'Historical 2016 component estimate (৳550), reported in the 2018 evaluation, used only as a demo value. No current retail quote verified.',bnNote:'২০১৮ সালের মূল্যায়নে উল্লিখিত ২০১৬ সালের ৳৫৫০ প্রাক্কলন শুধু ডেমোর জন্য। বর্তমান দোকানের দর যাচাই করা হয়নি।'},
  {id:'san_handwashing_station',en:'Handwashing station — tippy-tap example',bn:'হাত ধোয়ার স্টেশন — টিপি-ট্যাপ',unit:'station',price:3900,
    source:'https://wash.dphe.online/bn/estimate-for-tippy-tap-handwashing-station-itn-buet/',sourceName:'DPHE / ITN-BUET estimate',
    note:'Rounded demo value from the published ৳3,890.70 station estimate. Confirm components, installation and transport in a local quote.',bnNote:'প্রকাশিত ৳৩,৮৯০.৭০ স্টেশন প্রাক্কলন থেকে পূর্ণসংখ্যায় ডেমো দাম। উপকরণ, স্থাপন ও পরিবহন স্থানীয় কোটেশনে যাচাই করুন।'},
  {id:'san_soap',en:'Soap — Savlon Mild, 100 g example',bn:'সাবান — স্যাভলন মাইল্ড, ১০০ গ্রাম',unit:'100 g bar',price:70,
    source:'https://chaldal.com/aci-savlon-mild-antiseptic-soap-100-gm',sourceName:'Chaldal listing',
    note:'Observed online listing: ৳70 for one 100 g bar. Demo worksheet value; stock, price and delivery charges may vary.',bnNote:'অনলাইন তালিকায় একটি ১০০ গ্রাম বারের দাম ৳৭০। ডেমো হিসাব; মজুত, দাম ও ডেলিভারি চার্জ বদলাতে পারে।'},
  {id:'san_purification_tablets',en:'Water purification tablets — Aquatabs 33 mg, 500-pack',bn:'পানি পরিশোধন ট্যাবলেট — অ্যাকুয়াট্যাবস ৩৩ মিগ্রা, ৫০০টির প্যাক',unit:'pack of 500 tablets',price:1750,
    source:'https://bdwaterpurifier.com/product/aquatabs-water-purification-tablets/',sourceName:'BD Water Purifier listing',
    note:'Observed listing: ৳1,750 per 500-pack; courier extra. Confirm strength, expiry and product label before use. Listing is not a water-safety certification.',bnNote:'অনলাইন তালিকায় ৫০০টির প্যাক ৳১,৭৫০; কুরিয়ার আলাদা। ব্যবহার আগে শক্তি, মেয়াদ ও পণ্যের নির্দেশনা যাচাই করুন। তালিকা পানির নিরাপত্তার সনদ নয়।'},
].map(item => ({...item,category:SANITATION_CATEGORY,kind:'demo' as const,date:'2026-11-07'}));

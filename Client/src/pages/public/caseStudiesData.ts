export const STUDIES = [
  {
    category: 'Healthcare',
    subcategory: 'Dermatology Clinic (Bengaluru)',
    icon: '🏥',
    metric: '+42%',
    metricLabel: 'More Bookings',
    badgeColor: '#10B981',
    challenge: 'Missed booking calls, after-hours enquiries, manual scheduling errors, high no-show rates.',
    solutions: [
      { icon: '📞', label: 'AI Voice Receptionist' },
      { icon: '📅', label: 'Smart Appointment Booking' },
      { icon: '💬', label: 'WhatsApp Confirmations & Reminders' },
    ],
    results: [
      { value: '+42%', label: 'Confirmed Bookings', color: '#10B981' },
      { value: '-89%', label: 'Missed Calls', color: '#2563EB' },
      { value: '-54%', label: 'No-Show Rate', color: '#f97316' },
    ],
    story: {
      challenge: {
        title: 'The Challenge',
        points: [
          { title: 'Missed Booking Calls', desc: 'Every unanswered call is a direct revenue loss. Patients who cannot get through on the first attempt rarely call back — they simply book elsewhere.' },
          { title: 'After-Hours Enquiries', desc: 'A significant portion of booking intent happens outside working hours — evenings, early mornings and weekends. Without a system to capture these, businesses turn away customers.' },
          { title: 'Manual Scheduling Errors', desc: 'Double bookings, missed entries and delayed confirmations are common when scheduling is handled manually under pressure.' },
          { title: 'No-Show Appointments', desc: 'Without automated reminders, no-show rates stay high and valuable appointment slots go to waste.' },
        ],
      },
      solution: {
        title: 'The Autoniv Solution',
        description: 'The clinic deployed Autoniv\'s AI Voice Receptionist to handle all incoming booking calls automatically — day and night.',
        steps: [
          'Answers instantly — no ringing out, no voicemail, no missed calls',
          'Understands the service requirement — doctor preference, consultation type',
          'Collects patient details — name, contact number, reason for visit',
          'Checks preferred timing — offers available slots based on live calendar',
          'Confirms the appointment — sends instant confirmation via WhatsApp or SMS',
          'Triggers reminders automatically — 24 hours and 2 hours before appointment',
        ],
      },
      impact: {
        title: 'Business Impact',
        metrics: [
          { metric: 'Missed booking calls per day', before: '18–22', after: 'Under 2' },
          { metric: 'After-hours bookings captured', before: '0', after: '31 per month' },
          { metric: 'Confirmed bookings per month', before: '190', after: '271 (+42%)' },
          { metric: 'No-show rate', before: '24%', after: '11%' },
          { metric: 'Front desk time on calls', before: '~5 hours/day', after: 'Under 1 hour/day' },
        ],
      },
      quote: {
        text: 'We were losing patients every evening after we closed. Now Autoniv handles those calls and we wake up to a full appointment list. It has genuinely changed how we run the clinic.',
        author: 'Clinic Manager, Dermatology Practice, Bengaluru',
      },
      faqs: [
        { q: 'Can Autoniv check real-time availability and book slots automatically?', a: 'Yes. Autoniv integrates with your scheduling system and offers available slots in real time during the call. Appointments are confirmed and logged instantly without any manual input from your team.' },
        { q: 'Does Autoniv send booking confirmations to customers?', a: 'Yes. As soon as an appointment is confirmed, Autoniv sends an instant confirmation via WhatsApp or SMS with all the relevant details — date, time, location and any preparation instructions.' },
        { q: 'How does Autoniv reduce no-shows?', a: 'Autoniv sends automated reminders at 24 hours and 2 hours before every scheduled appointment. Customers can confirm, reschedule or cancel directly through the reminder message.' },
        { q: 'Can Autoniv handle bookings for multiple doctors or service providers?', a: 'Yes. Whether you have one doctor or ten, Autoniv manages individual calendars and routes each booking to the right person based on preference and availability.' },
        { q: 'Is Autoniv suitable for businesses other than clinics?', a: 'Absolutely. Autoniv works for any appointment-based business — salons, spas, law firms, financial advisors, fitness studios, diagnostic centres and more.' },
      ],
    },
  },
  {
    category: 'Real Estate',
    subcategory: 'Residential Developer (Pune)',
    icon: '🏠',
    metric: '+40%',
    metricLabel: 'Qualified Leads',
    badgeColor: '#2563EB',
    challenge: 'Slow lead response time, poor lead qualification, missed follow-ups, low site visit conversion.',
    solutions: [
      { icon: '📞', label: 'AI Voice Agent' },
      { icon: '🎯', label: 'Lead Qualification' },
      { icon: '📅', label: 'Site Visit Scheduling' },
    ],
    results: [
      { value: '+40%', label: 'Qualified Leads', color: '#2563EB' },
      { value: '-55%', label: 'Manual Calling Effort', color: '#10B981' },
      { value: '+32%', label: 'Site Visit Bookings', color: '#f97316' },
    ],
    story: {
      challenge: {
        title: 'The Challenge',
        points: [
          { title: 'Slow Response Time', desc: 'New leads were not contacted within the critical first 5-minute window. First outreach was happening 3 to 5 hours after enquiry submission.' },
          { title: 'Poor Lead Qualification', desc: 'Sales executives were spending nearly 60% of their calling time on low-intent, irrelevant, or duplicate leads.' },
          { title: 'Missed Follow-ups', desc: 'Manual follow-up tracking through spreadsheets meant warm leads often went cold simply because no one called back on time.' },
          { title: 'Low Site Visit Conversion', desc: 'Without a structured qualification conversation, sales reps had no context on budget, timeline or location preference before calling.' },
        ],
      },
      solution: {
        title: 'The Autoniv Solution',
        description: 'The developer deployed Autoniv\'s AI Voice Agent — a system that activates automatically the moment a new lead is submitted.',
        steps: [
          'Calls the lead within 60 seconds of enquiry submission',
          'Covers property preference — type, configuration',
          'Collects budget range — to filter serious buyers',
          'Identifies preferred location or micro-market',
          'Determines buying timeline — ready now, within 6 months, or exploring',
          'Tags leads as Hot, Warm, or Cold and pushes to CRM with full call summary',
        ],
      },
      impact: {
        title: 'Business Impact',
        metrics: [
          { metric: 'Average lead response time', before: '3–5 hours', after: 'Under 60 seconds' },
          { metric: 'Qualified lead rate', before: '28%', after: '68%' },
          { metric: 'Manual calling effort', before: '100% manual', after: 'Reduced by 55%' },
          { metric: 'Site visit bookings per month', before: '38', after: '61 (+32 more)' },
          { metric: 'Hot leads identified per month', before: '40–45', after: '110–120' },
        ],
      },
      quote: {
        text: 'The leads are coming in. The budget is being spent. Autoniv fixed the speed and sorting problem we did not know how to solve manually.',
        author: 'Sales Director, Residential Developer, Pune',
      },
      faqs: [
        { q: 'How quickly does Autoniv contact a new lead?', a: 'The moment a lead submits an enquiry — whether it is 11am or 11pm — Autoniv calls them within 60 seconds.' },
        { q: 'Can Autoniv pull leads from Google, Meta and property portals all at once?', a: 'Yes. Autoniv connects with all major lead sources including Google Ads, Meta Lead Forms, and portals like 99acres, MagicBricks and Housing.com.' },
        { q: 'Will this replace my sales team?', a: 'Not at all. Think of Autoniv as the first point of contact that does the groundwork before your salesperson picks up the phone.' },
        { q: 'What if the lead does not pick up?', a: 'Autoniv automatically retries at 3 different time intervals. If there is still no response, the lead is flagged for manual follow-up.' },
        { q: 'Is Autoniv practical for a small sales team?', a: 'That is exactly who it is built for. Autoniv makes sure your smallest team can perform like a much larger one.' },
      ],
    },
  },
  {
    category: 'E-Commerce',
    subcategory: 'D2C Skincare Brand (Delhi)',
    icon: '🛒',
    metric: '+38%',
    metricLabel: 'Cart Recovery',
    badgeColor: '#f97316',
    challenge: 'Abandoned carts, COD verification issues, manual calling workload, lost revenue opportunities.',
    solutions: [
      { icon: '📞', label: 'AI Voice Follow-up' },
      { icon: '🛒', label: 'Cart Recovery Calls' },
      { icon: '✅', label: 'COD Order Verification' },
    ],
    results: [
      { value: '+38%', label: 'Cart Recovery Revenue', color: '#f97316' },
      { value: '-44%', label: 'COD Cancellations', color: '#10B981' },
      { value: '₹4.9L', label: 'Monthly Revenue Recovered', color: '#2563EB' },
    ],
    story: {
      challenge: {
        title: 'The Challenge',
        points: [
          { title: 'Abandoned Carts', desc: 'Customers browse, show genuine buying intent, add products to their cart — and then disappear. Without a fast, personalised follow-up, that intent evaporates within hours.' },
          { title: 'COD Verification Issues', desc: 'Unverified COD orders carry significant risk — fake orders, address errors, low-intent purchases and customers who simply refuse delivery.' },
          { title: 'Manual Calling Workload', desc: 'Following up on every abandoned cart and verifying every COD order manually is simply not scalable for a small team.' },
          { title: 'Lost Revenue Opportunities', desc: 'The window to recover an abandoned cart is narrow — typically 1 to 3 hours after drop-off.' },
        ],
      },
      solution: {
        title: 'The Autoniv Solution',
        description: 'The brand deployed Autoniv\'s AI Voice Agent across two critical points — cart abandonment and COD order confirmation.',
        steps: [
          'Triggers outbound call within 30 to 60 minutes of cart abandonment',
          'Reconnects with shopper — addresses by name, references exact cart items',
          'Understands drop-off reason — price concern, payment issue, product doubt',
          'Answers product questions — ingredients, sizing, delivery timelines',
          'Shares direct checkout link via WhatsApp or SMS during the call',
          'For COD orders — confirms details, verifies intent, flags low-intent orders',
        ],
      },
      impact: {
        title: 'Business Impact',
        metrics: [
          { metric: 'Cart recovery rate', before: '6%', after: '21% (+38% revenue)' },
          { metric: 'COD cancellation rate', before: '31%', after: '17% (44% reduction)' },
          { metric: 'Average follow-up response time', before: '4–6 hours', after: 'Under 60 minutes' },
          { metric: 'Manual calling hours per week', before: '28 hours', after: 'Under 6 hours' },
          { metric: 'Monthly revenue recovered from carts', before: '₹1.8L', after: '₹4.9L' },
        ],
      },
      quote: {
        text: 'We always knew abandoned carts were a problem but we never had the manpower to chase every one of them. Autoniv does it automatically and the recovery numbers genuinely surprised us.',
        author: 'Founder, D2C Skincare Brand, Delhi',
      },
      faqs: [
        { q: 'How quickly does Autoniv follow up on an abandoned cart?', a: 'Autoniv triggers the follow-up call within 30 to 60 minutes of cart abandonment — well within the window where recovery rates are highest.' },
        { q: 'Can Autoniv reference the specific products a customer left in their cart?', a: 'Yes. Autoniv integrates with your e-commerce platform and pulls cart data in real time.' },
        { q: 'How does Autoniv verify COD orders without annoying genuine customers?', a: 'The verification call is short, friendly and focused on confirming the order details. Most genuine customers appreciate the confirmation.' },
        { q: 'Which e-commerce platforms does Autoniv integrate with?', a: 'Autoniv integrates with major Indian e-commerce platforms including Shopify, WooCommerce, Unicommerce and custom-built storefronts via API.' },
        { q: 'Is Autoniv useful for brands with a large COD order volume?', a: 'Especially so. The higher your COD volume, the greater your exposure to return costs and fulfilment waste.' },
      ],
    },
  },
  {
    category: 'Customer Support',
    subcategory: 'Consumer Electronics Retailer (Mumbai)',
    icon: '🎧',
    metric: '-72%',
    metricLabel: 'Repetitive Queries',
    badgeColor: '#8b5cf6',
    challenge: 'High repetitive call volume, missed calls during peak hours, longer waiting times, unstructured call data.',
    solutions: [
      { icon: '📞', label: 'AI Voice Assistance' },
      { icon: '🤖', label: 'Query Resolution' },
      { icon: '📈', label: 'Call Data Logging' },
    ],
    results: [
      { value: '-72%', label: 'Repetitive Queries', color: '#8b5cf6' },
      { value: '-97%', label: 'Wait Time', color: '#10B981' },
      { value: '38hrs', label: 'Saved per Week', color: '#2563EB' },
    ],
    story: {
      challenge: {
        title: 'The Challenge',
        points: [
          { title: 'High Repetitive Call Volume', desc: 'Nearly 70% of all incoming calls were about pricing, order status, service availability and basic product queries.' },
          { title: 'Missed Calls During Peak Hours', desc: 'Between 11am-2pm and 6pm-9pm, call volume would spike beyond the team\'s capacity. Customers rarely called back.' },
          { title: 'Longer Waiting Times', desc: 'Average hold time stretched to 12–18 minutes during busy periods, directly hurting customer satisfaction scores.' },
          { title: 'Unstructured Call Data', desc: 'Support calls were not being logged consistently. Important complaints and feedback were getting lost.' },
        ],
      },
      solution: {
        title: 'The Autoniv Solution',
        description: 'The retailer deployed Autoniv\'s AI Voice Agent across their inbound support line. Every call is answered within the first ring.',
        steps: [
          'Identifies the customer\'s intent — billing, order status, product info, complaint',
          'Resolves common queries instantly — pricing, availability, store timings, return policy',
          'Collects and logs caller details — name, contact, query type, conversation summary',
          'Escalates complex cases — transfers to the right human agent with full context',
          'Operates 24/7 — peak hours, weekends, public holidays, every call answered',
        ],
      },
      impact: {
        title: 'Business Impact',
        metrics: [
          { metric: 'Daily calls handled by human team', before: '300+', after: 'Reduced to ~90 complex cases' },
          { metric: 'Average customer wait time', before: '12–18 minutes', after: 'Under 30 seconds' },
          { metric: 'Repetitive queries resolved by AI', before: '0%', after: '72% fully automated' },
          { metric: 'Missed calls during peak hours', before: '~85 per day', after: 'Near zero' },
          { metric: 'Support team hours saved per week', before: '—', after: '38 hours per week' },
        ],
      },
      quote: {
        text: 'Our team was exhausted answering the same five questions all day. Autoniv took that off their plate completely. Now they actually enjoy their work.',
        author: 'Customer Support Manager, Consumer Electronics Retailer, Mumbai',
      },
      faqs: [
        { q: 'Can Autoniv handle calls across different types of customer queries?', a: 'Yes. Autoniv is trained to identify intent across a wide range of query types — pricing, order status, availability, complaints, booking and general information.' },
        { q: 'What happens when a customer has a complex issue the AI cannot resolve?', a: 'Autoniv recognizes when a query needs human attention and transfers the call immediately with a full summary.' },
        { q: 'Does Autoniv work outside business hours?', a: 'Yes. Autoniv operates 24 hours a day, 7 days a week including weekends and public holidays.' },
        { q: 'Will customers know they are speaking to an AI?', a: 'Autoniv is designed to be transparent. It introduces itself clearly and focuses on resolving the customer\'s need quickly.' },
        { q: 'Is call data stored and accessible to the support team?', a: 'Yes. Every interaction is automatically logged with caller details, query type and conversation summary.' },
      ],
    },
  },
];

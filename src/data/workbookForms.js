export const workbookData = [
  {
    moduleId: 1,
    title: "Module 1: Redefining Your Pain Experience",
    exerciseTitle: "My Biopsychosocial Pain Map",
    sections: [
      {
        sectionTitle: 'Section 1: The "Bio" (My Body)',
        fields: [
          { id: 'm1_s1_q1', type: 'textarea', label: 'What are the physical sensations you experience (e.g., burning, aching, throbbing, stabbing)?' },
          { id: 'm1_s1_q2', type: 'textarea', label: 'In which parts of your body do you feel these sensations?' },
          { id: 'm1_s1_q3', type: 'textarea', label: 'What physical factors seem to make your pain worse?' },
          { id: 'm1_s1_q4', type: 'textarea', label: 'What physical factors seem to make your pain better?' },
          { id: 'm1_s1_q5', type: 'textarea', label: 'What other physical symptoms often accompany your pain?' }
        ]
      },
      {
        sectionTitle: 'Section 2: The "Psycho" (My Thoughts and Feelings)',
        fields: [
          { id: 'm1_s2_q1', type: 'textarea', label: 'What are the most common thoughts or beliefs you have about your pain?' },
          { id: 'm1_s2_q2', type: 'textarea', label: 'What emotions does your pain typically bring up for you?' },
          { id: 'm1_s2_q3', type: 'textarea', label: 'What are your biggest worries or fears related to your pain?' },
          { id: 'm1_s2_q4', type: 'textarea', label: 'What coping strategies do you currently use to manage the emotional side of pain?' }
        ]
      },
      {
        sectionTitle: 'Section 3: The "Social" (My World)',
        fields: [
          { id: 'm1_s3_q1', type: 'textarea', label: 'How does your pain affect your relationships with close family?' },
          { id: 'm1_s3_q2', type: 'textarea', label: 'How does your pain affect your friendships and social life?' },
          { id: 'm1_s3_q3', type: 'textarea', label: 'How does your pain impact your work, school, or ability to volunteer?' },
          { id: 'm1_s3_q4', type: 'textarea', label: 'Who in your life seems to understand what you\'re going through? Who struggles to understand?' },
          { id: 'm1_s3_q5', type: 'textarea', label: 'What are some social or environmental factors that make your pain harder to manage?' }
        ]
      }
    ]
  },
  {
    moduleId: 2,
    title: "Module 2: The Science of Your Hurt",
    exerciseTitle: "Translating the Science to You",
    sections: [
      {
        sectionTitle: '1. Allodynia Checklist',
        fields: [
          { id: 'm2_s1_q1', type: 'checkbox', label: 'The light touch of clothing or bedsheets on your skin.' },
          { id: 'm2_s1_q2', type: 'checkbox', label: 'The sensation of water from a shower hitting your body.' },
          { id: 'm2_s1_q3', type: 'checkbox', label: 'A gentle breeze or change in temperature on your skin.' },
          { id: 'm2_s1_q4', type: 'checkbox', label: 'A gentle pat or hug from a loved one.' },
          { id: 'm2_s1_q5_text', type: 'text', label: 'Other examples? Please describe:' }
        ]
      },
      {
        sectionTitle: '2. Hyperalgesia Checklist',
        fields: [
          { id: 'm2_s2_q1', type: 'checkbox', label: 'Do you find that minor bumps, scrapes, or pressure feel much more painful than expected?' },
          { id: 'm2_s2_q2', type: 'checkbox', label: 'When you get a paper cut or stub your toe, does the pain seem unusually intense or last exceptionally long?' },
          { id: 'm2_s2_q3_text', type: 'text', label: 'Other examples? Please describe:' }
        ]
      },
      {
        sectionTitle: '3. Spreading Pain Reflection',
        fields: [
          { id: 'm2_s3_q1', type: 'textarea', label: 'Think back to when your pain first started. Was it confined to one specific area?' },
          { id: 'm2_s3_q2', type: 'textarea', label: 'Has your pain spread beyond that original area over time? If so, describe where the pain has spread.' }
        ]
      }
    ]
  },
  {
    moduleId: 3,
    title: "Module 3: When Your Alarm System Goes Wrong",
    exerciseTitle: "Identifying Your Vicious Cycles",
    sections: [
      {
        sectionTitle: 'Trace Your Pain Cycle',
        fields: [
          { id: 'm3_s1_q1', type: 'textarea', label: '1. The Initial Pain: Describe the pain you first felt. Where was it? What did it feel like?' },
          { id: 'm3_s1_q2', type: 'textarea', label: '2. The Body\'s Reaction (Muscle Guarding): How did your body react to that pain? Did you notice your muscles tensing up?' },
          { id: 'm3_s1_q3', type: 'textarea', label: '3. The New Pain (From the Spasm): How did that muscle tension or spasm feel? Did it create its own separate pain?' },
          { id: 'm3_s1_q4', type: 'textarea', label: '4. The Overall Effect: How did this new pain affect your original pain and emotional state?' }
        ]
      },
      {
        sectionTitle: 'Reflection Prompt',
        fields: [
          { id: 'm3_s2_q1', type: 'textarea', label: 'What is one small, gentle step you could take to interrupt this cycle the next time you feel it starting? (e.g., using heat, deep breathing, distraction)' }
        ]
      }
    ]
  },
  {
    moduleId: 4,
    title: "Module 4: Naming Your Pain",
    exerciseTitle: "Your Pain's Vocabulary",
    sections: [
      {
        sectionTitle: 'Check all the words that describe the sensations you experience:',
        fields: [
          { id: 'm4_s1_q1', type: 'checkbox', label: 'Aching' },
          { id: 'm4_s1_q2', type: 'checkbox', label: 'Burning' },
          { id: 'm4_s1_q3', type: 'checkbox', label: 'Widespread' },
          { id: 'm4_s1_q4', type: 'checkbox', label: 'Throbbing' },
          { id: 'm4_s1_q5', type: 'checkbox', label: 'Shooting' },
          { id: 'm4_s1_q6', type: 'checkbox', label: 'Diffuse' },
          { id: 'm4_s1_q7', type: 'checkbox', label: 'Cramping' },
          { id: 'm4_s1_q8', type: 'checkbox', label: 'Stabbing' },
          { id: 'm4_s1_q9', type: 'checkbox', label: 'Deep aching' },
          { id: 'm4_s1_q10', type: 'checkbox', label: 'Sharp with movement' },
          { id: 'm4_s1_q11', type: 'checkbox', label: 'Electric shocks' },
          { id: 'm4_s1_q12', type: 'checkbox', label: 'Heightened sensitivity to touch/pressure/sound/light' },
          { id: 'm4_s1_q13', type: 'checkbox', label: 'Dull' },
          { id: 'm4_s1_q14', type: 'checkbox', label: 'Tingling / Pins and needles / Numbness' },
          { id: 'm4_s1_q15', type: 'checkbox', label: 'Accompanied by severe fatigue or brain fog' }
        ]
      }
    ]
  },
  {
    moduleId: 5,
    title: "Module 5: The Physical Toll",
    exerciseTitle: "The Weekly Symptom and Activity Tracker",
    sections: [
      {
        sectionTitle: 'Weekly Observation Reflection',
        fields: [
          { id: 'm5_s1_q1', type: 'textarea', label: 'After a night of poor sleep, what typically happens to your pain and fatigue levels the next day?' },
          { id: 'm5_s1_q2', type: 'textarea', label: 'On days when your pain is higher, how does that affect your mood and your activity levels?' },
          { id: 'm5_s1_q3', type: 'textarea', label: 'Are there any activities or foods that consistently seem to make you feel better or worse?' },
          { id: 'm5_s1_q4', type: 'textarea', label: 'Write down one key pattern you observed this week:' }
        ]
      }
    ]
  },
  {
    moduleId: 6,
    title: "Module 6: Navigating the Emotional Storm",
    exerciseTitle: "The 'Thoughts-Feelings-Body-Actions' Cycle",
    sections: [
      {
        sectionTitle: 'Trace Your Emotional Cycle',
        fields: [
          { id: 'm6_s1_q1', type: 'textarea', label: '1. The situation: Briefly describe the situation or flare-up.' },
          { id: 'm6_s1_q2', type: 'textarea', label: '2. The automatic thought: What was the very first thought or belief that popped into your head about the pain?' },
          { id: 'm6_s1_q3', type: 'textarea', label: '3. The resulting feeling(s) and body sensations: What emotion(s) did that thought create? What happened in your body?' },
          { id: 'm6_s1_q4', type: 'textarea', label: '4. The subsequent action: What did you do as a result of these thoughts and feelings?' }
        ]
      },
      {
        sectionTitle: 'Intervention Plan',
        fields: [
          { id: 'm6_s2_q1', type: 'textarea', label: 'What is a more helpful, balanced thought you could practice next time?' },
          { id: 'm6_s2_q2', type: 'textarea', label: 'What is one small action you could take that would align more with your values, even with the pain?' }
        ]
      }
    ]
  },
  {
    moduleId: 7,
    title: "Module 7: Clearing the 'Pain Fog'",
    exerciseTitle: "My Cognitive Tool Kit",
    sections: [
      {
        sectionTitle: 'Brainstorm Strategies',
        fields: [
          { id: 'm7_s1_q1', type: 'textarea', label: 'My Biggest Challenge #1:' },
          { id: 'm7_s1_q2', type: 'textarea', label: 'My strategy to try for Challenge #1 (e.g., use a calendar, single-tasking):' },
          { id: 'm7_s1_q3', type: 'textarea', label: 'My Biggest Challenge #2:' },
          { id: 'm7_s1_q4', type: 'textarea', label: 'My strategy to try for Challenge #2 (e.g., turn off TV to focus, take mental breaks):' }
        ]
      }
    ]
  },
  {
    moduleId: 8,
    title: "Module 8: Pain in Your World",
    exerciseTitle: "Relationship and Role Mapping",
    sections: [
      {
        sectionTitle: 'Roles & Core Values',
        fields: [
          { id: 'm8_s1_q1', type: 'textarea', label: 'List 3-5 roles that were central to your identity before chronic pain (e.g., marathon runner, project manager).' },
          { id: 'm8_s1_q2', type: 'textarea', label: 'How have these roles changed? What has been lost or modified?' },
          { id: 'm8_s1_q3', type: 'text', label: 'Identify a Core Value from a lost role:' },
          { id: 'm8_s1_q4', type: 'textarea', label: 'A new, adapted way to express this Core Value with your current abilities:' }
        ]
      },
      {
        sectionTitle: 'Key Relationships',
        fields: [
          { id: 'm8_s2_q1', type: 'textarea', label: 'Describe the dynamics of 1-2 key relationships before chronic pain.' },
          { id: 'm8_s2_q2', type: 'textarea', label: 'Describe how chronic pain has affected these dynamics.' }
        ]
      }
    ]
  },
  {
    moduleId: 9,
    title: "Module 9: Building Your Healthcare Alliance",
    exerciseTitle: "Appointment Preparation Kit",
    sections: [
      {
        sectionTitle: 'Before Your Next Visit',
        fields: [
          { id: 'm9_s1_q1', type: 'textarea', label: 'My top 3 goals for this visit (what are the most important things to accomplish):' },
          { id: 'm9_s1_q2', type: 'textarea', label: 'Symptom update: Average pain level, better/worse/same, words that describe it, what makes it better/worse.' },
          { id: 'm9_s1_q3', type: 'textarea', label: 'Function update: Sleep, energy, mood, ability to do daily activities.' },
          { id: 'm9_s1_q4', type: 'textarea', label: 'Medication update: Are current logic helping? Any side effects?' },
          { id: 'm9_s1_q5', type: 'textarea', label: 'My specific questions for the doctor:' }
        ]
      }
    ]
  },
  {
    moduleId: 10,
    title: "Module 10: Your Medication Tool Kit",
    exerciseTitle: "Medication Reflection",
    sections: [
      {
        sectionTitle: 'Assessing Your Regimen',
        fields: [
          { id: 'm10_s1_q1', type: 'textarea', label: 'Are there any side effects you\'ve experienced that you haven\'t discussed with your doctor yet?' },
          { id: 'm10_s1_q2', type: 'textarea', label: 'Are your medications helping you meet functional goals (sleeping better, walking, hobbies)?' },
          { id: 'm10_s1_q3', type: 'textarea', label: 'Any questions about medications to add to your Appointment Prep Kit?' }
        ]
      }
    ]
  },
  {
    moduleId: 11,
    title: "Module 11: Exploring Interventional Options",
    exerciseTitle: "Shared Decision-Making",
    sections: [
      {
        sectionTitle: 'Evaluating a Procedure',
        fields: [
          { id: 'm11_s1_q1', type: 'textarea', label: '1. The goal: What is the specific goal of this procedure for me?' },
          { id: 'm11_s1_q2', type: 'textarea', label: '2. Potential benefits: What are the potential positive outcomes?' },
          { id: 'm11_s1_q3', type: 'textarea', label: '3. Risks and alternatives: What are the common/rare risks and alternative options?' },
          { id: 'm11_s1_q4', type: 'textarea', label: '4. Likelihood of success and duration of relief:' }
        ]
      },
      {
        sectionTitle: 'Final Thoughts',
        fields: [
          { id: 'm11_s2_q1', type: 'textarea', label: 'Considering benefits against risks, what is your initial feeling? What are your biggest hopes and fears?' },
          { id: 'm11_s2_q2', type: 'textarea', label: 'What other questions do you need answered before making a final decision?' }
        ]
      }
    ]
  },
  {
    moduleId: 12,
    title: "Module 12: Movement as Your Medicine",
    exerciseTitle: "Overcoming Fear of Movement",
    sections: [
      {
        sectionTitle: 'Graded Activity Reflection',
        fields: [
          { id: 'm12_s1_q1', type: 'text', label: 'My chosen gentle activity (e.g., walking, stretching):' },
          { id: 'm12_s1_q2', type: 'text', label: 'My baseline (time/reps I can do without causing a flare):' }
        ]
      },
      {
        sectionTitle: 'Confronting Kinesiophobia (Fear of Movement)',
        fields: [
          { id: 'm12_s2_q1', type: 'textarea', label: 'What movement or activity do you avoid out of fear?' },
          { id: 'm12_s2_q2', type: 'textarea', label: 'What is your "worst-case scenario" thought when considering it?' },
          { id: 'm12_s2_q3', type: 'textarea', label: 'What is a more realistic/balanced "hurt vs. harm" thought you can replace it with?' },
          { id: 'm12_s2_q4', type: 'textarea', label: 'What is one incredibly small, safe version of this movement you could try as a first step?' }
        ]
      }
    ]
  },
  {
    moduleId: 13,
    title: "Module 13: Fueling Your Body for Resilience",
    exerciseTitle: "Food and Symptom Diary",
    sections: [
      {
        sectionTitle: 'Weekly Observations',
        fields: [
          { id: 'm13_s1_q1', type: 'textarea', label: 'Do you feel more pain/fatigue the day after eating sugar or processed foods?' },
          { id: 'm13_s1_q2', type: 'textarea', label: 'Which anti-inflammatory foods (vegetables, lean protein, healthy fats) will you add to your plate?' }
        ]
      }
    ]
  },
  {
    moduleId: 14,
    title: "Module 14: Harnessing Your Mind's Power",
    exerciseTitle: "Psychological Approaches",
    sections: [
      {
        sectionTitle: 'CBT Thought Record',
        fields: [
          { id: 'm14_s1_q1', type: 'textarea', label: 'Situation (What was happening?)' },
          { id: 'm14_s1_q2', type: 'textarea', label: 'Automatic negative thought (What went through my mind?)' },
          { id: 'm14_s1_q3', type: 'textarea', label: 'Emotion(s) (How did that thought make me feel?)' },
          { id: 'm14_s1_q4', type: 'textarea', label: 'Balanced/alternative thought (What is a more helpful or realistic way to see this?)' }
        ]
      },
      {
        sectionTitle: 'ACT Values Compass',
        fields: [
          { id: 'm14_s2_q1', type: 'text', label: 'Pick one life domain that is high importance but lower satisfaction (e.g., Social Life, Work, Health):' },
          { id: 'm14_s2_q2', type: 'textarea', label: 'What is one small, committed action you could take this week to move closer to that value?' }
        ]
      }
    ]
  },
  {
    moduleId: 15,
    title: "Module 15: Reclaiming Your Nights",
    exerciseTitle: "Sleep Hygiene Checklist",
    sections: [
      {
        sectionTitle: 'Habits to Improve',
        fields: [
          { id: 'm15_s1_q1', type: 'checkbox', label: 'I go to bed and wake up at roughly the same time every day.' },
          { id: 'm15_s1_q2', type: 'checkbox', label: 'My bedroom is dark, quiet, and cool.' },
          { id: 'm15_s1_q3', type: 'checkbox', label: 'I avoid bright screens for at least an hour before bed.' },
          { id: 'm15_s1_q4', type: 'checkbox', label: 'I avoid caffeine for at least six to eight hours before bedtime.' },
          { id: 'm15_s1_q5', type: 'checkbox', label: 'I get exposure to natural light in the morning.' },
          { id: 'm15_s1_q6', type: 'textarea', label: 'Look at the boxes you did not check. Pick one or two habits to work on this week:' }
        ]
      }
    ]
  },
  {
    moduleId: 16,
    title: "Module 16: Beyond the Clinic: Complementary Therapies",
    exerciseTitle: "My Complementary Therapy Evaluation",
    sections: [
      {
        sectionTitle: 'Therapy Evaluation',
        fields: [
          { id: 'm16_s1_q1', type: 'text', label: 'Therapy I am considering (e.g., Acupuncture, Yoga, Massage):' },
          { id: 'm16_s1_q2', type: 'textarea', label: '1. The evidence: What does scientific research say about this therapy for my condition?' },
          { id: 'm16_s1_q3', type: 'textarea', label: '2. The logistics & risks: What is the cost, and what are the potential side effects?' },
          { id: 'm16_s1_q4', type: 'textarea', label: '3. Communication: Have I discussed this with my primary doctor? What is their feedback?' },
          { id: 'm16_s1_q5', type: 'textarea', label: 'My decision and rationale:' }
        ]
      }
    ]
  },
  {
    moduleId: 17,
    title: "Module 17: The Art of Pacing and Planning",
    exerciseTitle: "Activity Baseline Finder",
    sections: [
      {
        sectionTitle: 'Finding Your Safe Starting Point',
        fields: [
          { id: 'm17_s1_q1', type: 'text', label: 'My chosen activity to pace better (e.g., reading, computer work):' },
          { id: 'm17_s1_q2', type: 'text', label: 'The Test: Time/reps when I stopped before pain increased:' },
          { id: 'm17_s1_q3', type: 'text', label: 'My Calculated Baseline (80% of the stop time):' },
          { id: 'm17_s1_q4', type: 'textarea', label: 'How will you build proactive rest into your weekly schedule?' }
        ]
      }
    ]
  },
  {
    moduleId: 18,
    title: "Module 18: Creating a Pain-Friendly Environment",
    exerciseTitle: "Ergonomic Improvements",
    sections: [
      {
        sectionTitle: 'My Ergonomic Action Plan',
        fields: [
          { id: 'm18_s1_q1', type: 'textarea', label: 'Kitchen: What changes can you make (e.g., anti-fatigue mat, stool)?' },
          { id: 'm18_s1_q2', type: 'textarea', label: 'Bedroom & Bathroom: What changes can you make (e.g., grab bars, specialized pillows)?' },
          { id: 'm18_s1_q3', type: 'textarea', label: 'Office/Workspace: What changes can you make (e.g., lumbar support, screen at eye level)?' },
          { id: 'm18_s1_q4', type: 'textarea', label: 'Based on these concepts, what is ONE change you can make this week to improve your environment?' }
        ]
      }
    ]
  },
  {
    moduleId: 19,
    title: "Module 19: Weaving Your Web of Support",
    exerciseTitle: "My Support Map",
    sections: [
      {
        sectionTitle: 'Analyzing Your Network',
        fields: [
          { id: 'm19_s1_q1', type: 'textarea', label: 'What are the strengths of your support system? Who are your key pillars of support?' },
          { id: 'm19_s1_q2', type: 'textarea', label: 'Are there any gaps? Is there a type of support you feel you\'re missing?' },
          { id: 'm19_s1_q3', type: 'textarea', label: 'What is one small step you could take to strengthen a connection or fill a gap?' }
        ]
      }
    ]
  },
  {
    moduleId: 20,
    title: "Module 20: Finding Your Voice: Self-Advocacy",
    exerciseTitle: "Advocacy Script Builder",
    sections: [
      {
        sectionTitle: 'Building Your Scripts',
        fields: [
          { id: 'm20_s1_q1', type: 'textarea', label: 'Script for Describing Your Pain Clearly (Location, quality, functional impact):' },
          { id: 'm20_s1_q2', type: 'textarea', label: 'Script for Requesting a Referral or Discussing Treatment Options:' }
        ]
      }
    ]
  },
  {
    moduleId: 21,
    title: "Module 21: Breaking Free from Unhelpful Habits",
    exerciseTitle: "My Habit Change Planner",
    sections: [
      {
        sectionTitle: 'Plan for Change',
        fields: [
          { id: 'm21_s1_q1', type: 'text', label: 'The habit I want to change:' },
          { id: 'm21_s1_q2', type: 'textarea', label: '1. My "why": What are my deepest reasons for making this change?' },
          { id: 'm21_s1_q3', type: 'textarea', label: '2. My support system for this change & My triggers:' },
          { id: 'm21_s1_q4', type: 'textarea', label: '3. My coping plan for cravings and temptation (What will I do instead?):' },
          { id: 'm21_s1_q5', type: 'textarea', label: '4. My reward for milestones:' }
        ]
      }
    ]
  },
  {
    moduleId: 22,
    title: "Module 22: Building Your Resilience",
    exerciseTitle: "Gratitude and Self-Compassion Journal",
    sections: [
      {
        sectionTitle: 'Daily Reflection',
        fields: [
          { id: 'm22_s1_q1', type: 'textarea', label: '1. Today, I am grateful for (list three things, no matter how small):' },
          { id: 'm22_s1_q2', type: 'textarea', label: '2. One small success or effort I can acknowledge today is:' },
          { id: 'm22_s1_q3', type: 'textarea', label: '3. A compassionate message I can give myself about today\'s struggles is:' }
        ]
      }
    ]
  },
  {
    moduleId: 23,
    title: "Module 23: Finding Meaning and Purpose",
    exerciseTitle: "My Contribution Brainstorm",
    sections: [
      {
        sectionTitle: 'Sharing Your Gifts',
        fields: [
          { id: 'm23_s1_q1', type: 'textarea', label: '1. My skills, passions, and interests (What are you good at or care about?):' },
          { id: 'm23_s1_q2', type: 'textarea', label: '2. My idea for contribution (How could you use one of those skills in a small way?):' }
        ]
      }
    ]
  },
  {
    moduleId: 24,
    title: "Module 24: Your Path to Inner Peace",
    exerciseTitle: "Spirituality and Personal Meaning",
    sections: [
      {
        sectionTitle: 'Finding Connection',
        fields: [
          { id: 'm24_s1_q1', type: 'textarea', label: 'What activities, places, or practices bring you a sense of peace, awe, or connection?' },
          { id: 'm24_s1_q2', type: 'textarea', label: 'How can you intentionally incorporate one of these into your life this week, even for just five minutes?' }
        ]
      }
    ]
  },
  {
    moduleId: 25,
    title: "Module 25: Your Flare-Up Plan & Hopeful Future",
    exerciseTitle: "My Personalized Flare-Up Plan",
    sections: [
      {
        sectionTitle: 'The Plan',
        fields: [
          { id: 'm25_s1_q1', type: 'textarea', label: '1. My early warning signs (how I know a flare is starting):' },
          { id: 'm25_s1_q2', type: 'text', label: '2. My go-to calming phrase (e.g., "This is temporary. I can handle this"): ' },
          { id: 'm25_s1_q3', type: 'textarea', label: '3. My comfort tool kit (Movements, heat/cold, relaxation, distraction):' },
          { id: 'm25_s1_q4', type: 'textarea', label: '4. My pacing plan (Activities to cancel, reduced activity goals):' },
          { id: 'm25_s1_q5', type: 'textarea', label: '5. I will contact my doctor if (list your specific red flags):' }
        ]
      },
      {
        sectionTitle: 'My Hopeful Future',
        fields: [
          { id: 'm25_s2_q1', type: 'textarea', label: 'What are the two or three most important tools or insights you will carry forward from this workbook?' },
          { id: 'm25_s2_q2', type: 'textarea', label: 'What is one hopeful goal you have for your well-being in the next three months?' },
          { id: 'm25_s2_q3', type: 'textarea', label: 'What is one small, concrete step you can take today to move toward that goal?' }
        ]
      }
    ]
  }
];

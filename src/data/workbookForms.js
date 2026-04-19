export const workbookData = [
  {
    moduleId: 1,
    title: "Module 1: Redefining Your Pain Experience",
    summary: "Welcome to the first step in transforming your understanding of pain. This module introduces the modern, holistic definition of pain: it is a personal sensory and emotional experience influenced by biological, psychological, and social factors. Validating your experience is the foundation for your resilient path forward.",
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
    summary: "Understanding how you hurt helps move from fearing pain to managing it. This module explores how your nervous system can become over-reactive (central sensitization), turning up the 'volume' on signals even without new damage. Understanding 'hurt vs. harm' is a powerful shift in perspective.",
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
      },
      {
        sectionTitle: 'Reflection Prompt',
        fields: [
          { id: 'm2_s4_q1', type: 'textarea', label: 'How does understanding the difference between allodynia and hyperalgesia change how you view your pain?' }
        ]
      }
    ]
  },
  {
    moduleId: 3,
    title: "Module 3: When Your Alarm System Goes Wrong",
    summary: "Chronic pain can become a self-perpetuating vicious cycle, where initial pain leads to muscle guarding (splinting), which then creates more pain. This module helps you identify and interrupt these patterns, preventing your nervous system from remaining stuck on high alert.",
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
        sectionTitle: 'Reflection Prompts',
        fields: [
          { id: 'm3_s2_q0', type: 'textarea', label: 'What triggers your vicious cycles, and how can you break them?' },
          { id: 'm3_s2_q1', type: 'textarea', label: 'What is one small, gentle step you could take to interrupt this cycle the next time you feel it starting? (e.g., using heat, deep breathing, distraction)' }
        ]
      }
    ]
  },
  {
    moduleId: 4,
    title: "Module 4: Naming Your Pain",
    summary: "Pain isn't just one thing—it has different 'flavors' (nociceptive, neuropathic, and nociplastic). Understanding the specific type of pain you are experiencing is crucial for choosing the most effective treatments and communicating clearly with your healthcare team.",
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
          { id: 'm4_s1_q15', type: 'checkbox', label: 'Accompanied by severe fatigue or brain fog' },
          { id: 'm4_s1_q16', type: 'checkbox', label: 'Tender' },
          { id: 'm4_s1_q17', type: 'checkbox', label: 'Nagging' },
          { id: 'm4_s1_q18', type: 'checkbox', label: 'Exhausting' },
          { id: 'm4_s1_q19', type: 'checkbox', label: 'Penetrating' }
        ]
      },
      {
        sectionTitle: 'Action Prompt',
        fields: [
          { id: 'm4_s2_q1', type: 'textarea', label: 'Circle or list the top 3 words you would use to communicate your pain to your doctor.' }
        ]
      }
    ]
  },
  {
    moduleId: 5,
    title: "Module 5: The Physical Toll",
    summary: "Chronic pain often carries a heavy physical burden beyond the pain itself, including profound fatigue and sleep disruption. This module helps you track the interconnected patterns of pain, sleep, and activity to find ways to break these exhausting physical cycles.",
    exerciseTitle: "The Weekly Symptom and Activity Tracker",
    sections: [
      {
        sectionTitle: 'Weekly Symptom Tracker (1-10)',
        fields: [
          { id: 'm5_trk_s1', type: 'text', label: 'Monday (Pain/Fatigue/Mood):' },
          { id: 'm5_trk_s2', type: 'text', label: 'Tuesday (Pain/Fatigue/Mood):' },
          { id: 'm5_trk_s3', type: 'text', label: 'Wednesday (Pain/Fatigue/Mood):' },
          { id: 'm5_trk_s4', type: 'text', label: 'Thursday (Pain/Fatigue/Mood):' },
          { id: 'm5_trk_s5', type: 'text', label: 'Friday (Pain/Fatigue/Mood):' },
          { id: 'm5_trk_s6', type: 'text', label: 'Saturday (Pain/Fatigue/Mood):' },
          { id: 'm5_trk_s7', type: 'text', label: 'Sunday (Pain/Fatigue/Mood):' }
        ]
      },
      {
        sectionTitle: 'Weekly Activity Tracker',
        fields: [
          { id: 'm5_act_s1', type: 'text', label: 'Monday Activities:' },
          { id: 'm5_act_s2', type: 'text', label: 'Tuesday Activities:' },
          { id: 'm5_act_s3', type: 'text', label: 'Wednesday Activities:' },
          { id: 'm5_act_s4', type: 'text', label: 'Thursday Activities:' },
          { id: 'm5_act_s5', type: 'text', label: 'Friday Activities:' },
          { id: 'm5_act_s6', type: 'text', label: 'Saturday Activities:' },
          { id: 'm5_act_s7', type: 'text', label: 'Sunday Activities:' }
        ]
      },
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
    summary: "Emotions like fear, sadness, and frustration are normal responses to pain. This module uses CBT principles to show how your thoughts can trigger cycles of emotional and physical suffering, helping you build more helpful, balanced ways of thinking.",
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
          { id: 'm6_s2_q0', type: 'textarea', label: '1. What was the initial trigger or situation for your emotional storm?' },
          { id: 'm6_s2_q1', type: 'textarea', label: '2. What is a more helpful, balanced thought you could practice next time?' },
          { id: 'm6_s2_q2', type: 'textarea', label: '3. What is one small action you could take that would align more with your values, even with the pain?' },
          { id: 'm6_s2_q3', type: 'textarea', label: '4. How do you feel after practicing this new thought and action?' }
        ]
      }
    ]
  },
  {
    moduleId: 7,
    title: "Module 7: Clearing the 'Pain Fog'",
    summary: "'Pain fog' is a real physiological consequence of your brain's limited resources being consumed by pain. This module identifies your specific cognitive challenges and helps you build a practical toolkit of strategies to manage them effectively.",
    exerciseTitle: "My Cognitive Tool Kit",
    sections: [
      {
        sectionTitle: 'Pain Fog Tracker',
        fields: [
          { id: 'm7_fog_1', type: 'text', label: 'Monday (Brain Fog level / Cognitive challenges):' },
          { id: 'm7_fog_2', type: 'text', label: 'Tuesday (Brain Fog level / Cognitive challenges):' },
          { id: 'm7_fog_3', type: 'text', label: 'Wednesday (Brain Fog level / Cognitive challenges):' },
          { id: 'm7_fog_4', type: 'text', label: 'Thursday (Brain Fog level / Cognitive challenges):' },
          { id: 'm7_fog_5', type: 'text', label: 'Friday (Brain Fog level / Cognitive challenges):' },
          { id: 'm7_fog_6', type: 'text', label: 'Saturday (Brain Fog level / Cognitive challenges):' },
          { id: 'm7_fog_7', type: 'text', label: 'Sunday (Brain Fog level / Cognitive challenges):' }
        ]
      },
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
    summary: "Chronic pain ripples through your relationships, work, and identity. Acknowledging what has changed is the first step toward forging a new, meaningful identity that incorporates the reality of pain and expresses your core values in adapted ways.",
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
          { id: 'm8_s2_q2', type: 'textarea', label: 'Describe how chronic pain has affected these dynamics. How have these key relationships and interactions been impacted?' }
        ]
      }
    ]
  },
  {
    moduleId: 9,
    title: "Module 9: Building Your Healthcare Alliance",
    summary: "You are the captain of your professional care team. This module provides tools to organize your medical information and make every appointment more productive through clear preparation and assertive, prepared communication.",
    exerciseTitle: "Appointment Preparation Kit",
    sections: [
      {
        sectionTitle: 'Before Your Next Visit',
        fields: [
          { id: 'm9_s1_q1', type: 'textarea', label: 'My top 3 goals for this visit (what are the most important things to accomplish):' },
          { id: 'm9_s1_q2', type: 'textarea', label: 'Symptom update: Average pain level, better/worse/same, words that describe it, what makes it better/worse.' },
          { id: 'm9_s1_q3', type: 'textarea', label: 'Function update: Sleep, energy, mood, ability to do daily activities.' },
          { id: 'm9_s1_q4', type: 'textarea', label: 'Medication update: Are current medications helping? Any side effects?' },
          { id: 'm9_s1_q5', type: 'textarea', label: 'My specific questions for the doctor:' }
        ]
      }
    ]
  },
  {
    moduleId: 10,
    title: "Module 10: Your Medication Tool Kit",
    summary: "Medications are just one tool in your management plan. This module helps you track your prescriptions and supplements accurately, focusing on finding the right balance of benefit and functional improvement while identifying potential side effects.",
    exerciseTitle: "Medication Reflection",
    sections: [
      {
        sectionTitle: 'Medication Log',
        fields: [
          { id: 'm10_log_1', type: 'text', label: 'Medication 1: Name, Dose, and Time' },
          { id: 'm10_log_2', type: 'text', label: 'Medication 1: Effectiveness/Notes' },
          { id: 'm10_log_3', type: 'text', label: 'Medication 2: Name, Dose, and Time' },
          { id: 'm10_log_4', type: 'text', label: 'Medication 2: Effectiveness/Notes' },
          { id: 'm10_log_5', type: 'text', label: 'Medication 3: Name, Dose, and Time' },
          { id: 'm10_log_6', type: 'text', label: 'Medication 3: Effectiveness/Notes' }
        ]
      },
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
    summary: "Procedures like injections or implanted devices can target the source of pain more directly. This module helps you approach these options with realistic expectations and ensures you have all the information needed for shared decision-making with your specialist.",
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
        sectionTitle: 'Correction Process and Recovery',
        fields: [
          { id: 'm11_s2_q1', type: 'textarea', label: 'What is the exact correction process or procedure being considered or performed?' },
          { id: 'm11_s2_q2', type: 'textarea', label: 'What are the post-procedure recovery steps or limitations you need to plan for?' }
        ]
      },
      {
        sectionTitle: 'Final Thoughts',
        fields: [
          { id: 'm11_s3_q1', type: 'textarea', label: 'Considering benefits against risks, what is your initial feeling? What are your biggest hopes and fears?' },
          { id: 'm11_s3_q2', type: 'textarea', label: 'What other questions do you need answered before making a final decision?' }
        ]
      }
    ]
  },
  {
    moduleId: 12,
    title: "Module 12: Movement as Your Medicine",
    summary: "Appropriate movement is a potent medicine for chronic pain. Understanding the difference between 'hurt' and 'harm' helps you use pacing and graded activity to gradually teach your body and brain that movement is safe and beneficial for long-term health.",
    exerciseTitle: "Overcoming Fear of Movement",
    sections: [
      {
        sectionTitle: 'Weekly Activity Log',
        fields: [
          { id: 'm12_act_1', type: 'text', label: 'Monday Activity Log:' },
          { id: 'm12_act_2', type: 'text', label: 'Tuesday Activity Log:' },
          { id: 'm12_act_3', type: 'text', label: 'Wednesday Activity Log:' },
          { id: 'm12_act_4', type: 'text', label: 'Thursday Activity Log:' },
          { id: 'm12_act_5', type: 'text', label: 'Friday Activity Log:' },
          { id: 'm12_act_6', type: 'text', label: 'Saturday Activity Log:' },
          { id: 'm12_act_7', type: 'text', label: 'Sunday Activity Log:' }
        ]
      },
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
      },
      {
        sectionTitle: 'End of Week Reflection Log',
        fields: [
          { id: 'm12_s3_q1', type: 'textarea', label: 'Looking back at this week, what did you successfully accomplish and how did your body respond?' }
        ]
      }
    ]
  },
  {
    moduleId: 13,
    title: "Module 13: Fueling Your Body for Resilience",
    summary: "Your nutrition can either fuel the flames of inflammation or help to tame them. This module explores the gut-brain axis and helps you build an anti-inflammatory diet that supports your overall well-being and long-term health.",
    exerciseTitle: "Food and Symptom Diary",
    sections: [
      {
        sectionTitle: 'Detailed Food and Symptom Diary',
        fields: [
          { id: 'm13_log_1', type: 'text', label: 'Day 1: Breakfast, Lunch, Dinner' },
          { id: 'm13_log_2', type: 'text', label: 'Day 1: Snacks & Corresponding Symptoms' },
          { id: 'm13_log_3', type: 'text', label: 'Day 2: Breakfast, Lunch, Dinner' },
          { id: 'm13_log_4', type: 'text', label: 'Day 2: Snacks & Corresponding Symptoms' },
          { id: 'm13_log_5', type: 'text', label: 'Day 3: Breakfast, Lunch, Dinner' },
          { id: 'm13_log_6', type: 'text', label: 'Day 3: Snacks & Corresponding Symptoms' },
          { id: 'm13_log_7', type: 'text', label: 'Day 4: Breakfast, Lunch, Dinner' },
          { id: 'm13_log_8', type: 'text', label: 'Day 4: Snacks & Corresponding Symptoms' }
        ]
      },
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
    summary: "Your mind is a powerful ally in managing pain. This module introduces evidence-based psychological tools like Cognitive Behavioral Therapy (CBT) and Acceptance and Commitment Therapy (ACT) to help you build a life guided by your core values.",
    exerciseTitle: "Psychological Approaches",
    sections: [
      {
        sectionTitle: 'Why a CBT Record?',
        fields: [
          { id: 'm14_s0_q1', type: 'text', label: 'Description: A CBT Thought Record helps you identify and pause automatic negative thoughts, allowing you to reframe them to reduce emotional suffering.' }
        ]
      },
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
      },
      {
        sectionTitle: 'ACT Values Chart',
        fields: [
          { id: 'm14_s3_q1', type: 'text', label: 'Domain: Family/Relationships -> Current Value rating (1-10)' },
          { id: 'm14_s3_q2', type: 'text', label: 'Domain: Career/Education -> Current Value rating (1-10)' },
          { id: 'm14_s3_q3', type: 'text', label: 'Domain: Personal Growth/Health -> Current Value rating (1-10)' }
        ]
      },
      {
        sectionTitle: 'Guided Mindfulness Reflection',
        fields: [
          { id: 'm14_s4_q1', type: 'textarea', label: 'After completing a brief mindfulness exercise, what did you notice about your breathing and your body tension?' }
        ]
      }
    ]
  },
  {
    moduleId: 15,
    title: "Module 15: Reclaiming Your Nights",
    summary: "Sleep is a biological superpower for healing and pain management. This module focuses on improving your sleep hygiene—the essential habits and environmental factors that can break the cycle of sleep disruption and increased pain.",
    exerciseTitle: "Sleep Hygiene Checklist",
    sections: [
      {
        sectionTitle: 'Habits to Improve',
        fields: [
          { id: 'm15_s1_q1', type: 'checkbox', label: 'I go to bed and wake up at roughly the same time every day, even on weekends.' },
          { id: 'm15_s1_q2', type: 'checkbox', label: 'My bedroom is dark, quiet, and cool.' },
          { id: 'm15_s1_q2b', type: 'checkbox', label: 'I use my bed only for sleep and intimacy (not for work, watching TV, etc.).' },
          { id: 'm15_s1_q2c', type: 'checkbox', label: 'I have a relaxing wind-down routine for the hour before bed.' },
          { id: 'm15_s1_q3', type: 'checkbox', label: 'I avoid bright screens (phone, TV, computer) for at least an hour before bed.' },
          { id: 'm15_s1_q4', type: 'checkbox', label: 'I avoid caffeine for at least 6-8 hours before bedtime.' },
          { id: 'm15_s1_q4a', type: 'checkbox', label: 'I avoid heavy meals within 2-3 hours of bedtime.' },
          { id: 'm15_s1_q4b', type: 'checkbox', label: 'I limit or avoid alcohol, especially in the evening.' },
          { id: 'm15_s1_q5a', type: 'checkbox', label: 'I get some form of gentle physical activity most days.' },
          { id: 'm15_s1_q5b', type: 'checkbox', label: 'I get exposure to natural light in the morning.' },
          { id: 'm15_s1_q5c', type: 'checkbox', label: 'If I nap, I keep it short (under 30 mins) and early in the day.' },
          { id: 'm15_s1_q5d', type: 'checkbox', label: 'If I can\'t fall asleep after 20-30 minutes, I get out of bed and do something relaxing until I feel sleepy.' },
          { id: 'm15_s1_q6', type: 'textarea', label: 'Look at the boxes you did not check. Pick one or two habits to work on this week:' }
        ]
      },
      {
        sectionTitle: 'Sleep Diary',
        fields: [
          { id: 'm15_diary_1', type: 'text', label: 'Day 1: Time to bed, time to sleep, awakenings, wake time, waking feel (0-10), notes' },
          { id: 'm15_diary_2', type: 'text', label: 'Day 2: Time to bed, time to sleep, awakenings, wake time, waking feel (0-10), notes' },
          { id: 'm15_diary_3', type: 'text', label: 'Day 3: Time to bed, time to sleep, awakenings, wake time, waking feel (0-10), notes' },
          { id: 'm15_diary_4', type: 'text', label: 'Day 4: Time to bed, time to sleep, awakenings, wake time, waking feel (0-10), notes' },
          { id: 'm15_diary_5', type: 'text', label: 'Day 5: Time to bed, time to sleep, awakenings, wake time, waking feel (0-10), notes' },
          { id: 'm15_diary_6', type: 'text', label: 'Day 6: Time to bed, time to sleep, awakenings, wake time, waking feel (0-10), notes' },
          { id: 'm15_diary_7', type: 'text', label: 'Day 7: Time to bed, time to sleep, awakenings, wake time, waking feel (0-10), notes' }
        ]
      }
    ]
  },
  {
    moduleId: 16,
    title: "Module 16: Beyond the Clinic: Complementary Therapies",
    summary: "Complementary and integrative therapies, such as acupuncture, massage, or yoga, can be valuable additions to your health plan. This module helps you be an informed consumer by providing a structured way to research and evaluate these options safely and effectively.",
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
    summary: "Escaping the 'boom-bust' cycle requires active management of your energy. This module teaches the principles of pacing—breaking down tasks and scheduling proactive rest—to help you regain a sense of control and predictability in your daily life.",
    exerciseTitle: "Activity Baseline Finder",
    sections: [
      {
        sectionTitle: 'Purpose of Pacing',
        fields: [
          { id: 'm17_desc', type: 'text', label: 'Pacing ensures you stop an activity before you hit a painful limit. It breaks the cycle of over-activity followed by a crash, creating a steady, reliable routine.' }
        ]
      },
      {
        sectionTitle: 'Finding Your Safe Starting Point',
        fields: [
          { id: 'm17_s1_q1', type: 'text', label: 'My chosen activity to pace better (e.g., reading, computer work):' },
          { id: 'm17_s1_q2', type: 'text', label: 'The Test: Time/reps when I stopped before pain increased:' },
          { id: 'm17_s1_q3', type: 'text', label: 'My Calculated Baseline (80% of the stop time):' },
          { id: 'm17_s1_q4', type: 'textarea', label: 'How will you build proactive rest into your weekly schedule?' }
        ]
      },
      {
        sectionTitle: 'My Pacing Plan Concept',
        fields: [
          { id: 'm17_s2_q1', type: 'textarea', label: 'Overall Strategy: Detail the daily approach for breaking tasks into smaller components.' },
          { id: 'm17_s2_q2', type: 'textarea', label: 'What is a specific task you will pace this week, and how?' }
        ]
      }
    ]
  },
  {
    moduleId: 18,
    title: "Module 18: Creating a Pain-Friendly Environment",
    summary: "Applying the principles of ergonomics (fitting the environment to the person) can dramatically reduce physical strain and conserve energy. This module provides a detailed 'walk-through' of your surroundings to identify opportunities for health-supporting improvements.",
    exerciseTitle: "Ergonomic Improvements",
    sections: [
      {
        sectionTitle: 'Purpose of an Ergonomic Action Plan',
        fields: [
          { id: 'm18_desc', type: 'text', label: 'The goal of an ergonomic action plan is to modify your environment so that your body spends less energy and encounters less physical stress doing daily tasks.' }
        ]
      },
      {
        sectionTitle: 'Ergonomic Checklists',
        fields: [
          { id: 'm18_chk_k1', type: 'checkbox', label: 'Kitchen: Frequently used items are stored between shoulder and hip height.' },
          { id: 'm18_chk_k2', type: 'checkbox', label: 'Kitchen: An anti-fatigue mat is in front of the sink/stove.' },
          { id: 'm18_chk_k3', type: 'checkbox', label: 'Kitchen: A stool is available for seated tasks.' },
          { id: 'm18_chk_k4', type: 'checkbox', label: 'Kitchen: I have ergonomic tools (e.g., large-grip utensils, jar opener).' },
          { id: 'm18_chk_k5', type: 'checkbox', label: 'Kitchen: I use lightweight pots and pans.' },
          { id: 'm18_chk_b1', type: 'checkbox', label: 'Bedroom: My mattress is supportive and comfortable.' },
          { id: 'm18_chk_b2', type: 'checkbox', label: 'Bedroom: My pillows support my head and neck in a neutral position.' },
          { id: 'm18_chk_b3', type: 'checkbox', label: 'Bedroom: The bed height allows me to get in and out easily.' },
          { id: 'm18_chk_b4', type: 'checkbox', label: 'Bedroom: Essential items are within easy reach on a bedside table.' },
          { id: 'm18_chk_b5', type: 'checkbox', label: 'Bedroom: The room is dark, quiet, and cool for sleep.' },
          { id: 'm18_chk_ba1', type: 'checkbox', label: 'Bathroom: There are non-slip mats in and out of the tub/shower.' },
          { id: 'm18_chk_ba2', type: 'checkbox', label: 'Bathroom: There are securely installed grab bars.' },
          { id: 'm18_chk_ba3', type: 'checkbox', label: 'Bathroom: I have a shower chair or bath bench.' },
          { id: 'm18_chk_ba4', type: 'checkbox', label: 'Bathroom: I have a long-handled brush or sponge.' },
          { id: 'm18_chk_ba5', type: 'checkbox', label: 'Bathroom: I have a raised toilet seat or safety frame if needed.' },
          { id: 'm18_chk_o1', type: 'checkbox', label: 'Office: My chair is adjustable and provides good lumbar support.' },
          { id: 'm18_chk_o2', type: 'checkbox', label: 'Office: My feet are flat on the floor (or a footrest).' },
          { id: 'm18_chk_o3', type: 'checkbox', label: 'Office: My keyboard and mouse are close, with wrists straight.' },
          { id: 'm18_chk_o4', type: 'checkbox', label: 'Office: The top of my monitor is at or just below eye level.' },
          { id: 'm18_chk_o5', type: 'checkbox', label: 'Office: I have adequate lighting and minimal screen glare.' },
          { id: 'm18_chk_o6', type: 'checkbox', label: 'Office: I take short stretch breaks every 20-30 minutes.' }
        ]
      },
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
    summary: "A strong support system is an essential lifeline when navigating chronic pain. This module helps you visualize your current network of family, friends, and peers, identifying strengths and gaps so you can take active steps to strengthen your vital connections.",
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
    summary: "Self-advocacy is the skill of using your voice to ensure your needs are heard and met. This module provides scripts to help you communicate clearly and assertively with your healthcare team, transforming you into an empowered partner in your own care.",
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
    summary: "Building resilience involves removing habits that actively undermine your progress. This module provides a structured planner to help you tackle roadblocks like smoking or excessive alcohol use, which can fuel inflammation and interfere with your pain management.",
    exerciseTitle: "My Habit Change Planner",
    sections: [
      {
        sectionTitle: 'Plan for Change',
        fields: [
          { id: 'm21_s1_q1', type: 'text', label: 'The habit I want to change:' },
          { id: 'm21_s1_q0a', type: 'text', label: 'Start Date:' },
          { id: 'm21_s1_q0b', type: 'text', label: 'Target Quit/Goal Date:' },
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
    summary: "Resilience is your ability to adapt well in the face of adversity. This module focuses on cultivating inner strength through realistic optimism and self-efficacy, using daily practices like gratitude and self-compassion to shift your focus toward success and hope.",
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
    summary: "Chronic pain can challenge our sense of purpose, but finding meaning remains a powerful source of healing. This module helps you identify your core values and brainstorm small, manageable ways to contribute to your world and maintain a fulfilling identity.",
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
    summary: "Spirituality and personal meaning are profound sources of strength and comfort. Whether through faith, nature, art, or meditation, this module encourages you to explore what brings you a sense of awe and peace and to intentionally nurture that connection.",
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
    summary: "Setbacks are a normal part of the journey. This module helps you create a concrete, step-by-step plan for your 'tough days,' transforming fear of the unknown into a feeling of preparedness and control as you walk toward a hopeful future.",
    exerciseTitle: "My Personalized Flare-Up Plan",
    sections: [
      {
        sectionTitle: 'The Plan',
        fields: [
          { id: 'm25_s1_q1', type: 'textarea', label: '1. My early warning signs (how I know a flare is starting):' },
          { id: 'm25_s1_q2', type: 'text', label: '2. My go-to calming phrase (e.g., "This is temporary. I can handle this"): ' },
          { id: 'm25_s1_q3', type: 'textarea', label: '3. My comfort tool kit (Movements, heat/cold, relaxation, distraction):' },
          { id: 'm25_s1_q4', type: 'textarea', label: '4. My pacing plan (Activities to cancel, reduced activity goals):' },
          { id: 'm25_s1_q5', type: 'textarea', label: '5. I will contact my doctor if (list your specific red flags):' },
          { id: 'm25_s1_q6', type: 'textarea', label: '6. My Support System to Contact (Names/Numbers):' }
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

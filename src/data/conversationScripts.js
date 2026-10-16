/**
 * Hard Conversations — starting scripts by audience and need.
 *
 * Built on the book's guidance: teach people how to help ("It would be
 * really helpful if you could…"), set boundaries to protect limited
 * energy, focus on solutions with employers, and use Module 20's advocacy
 * scripts with clinicians. [Brackets] are for the person to fill in.
 *
 * `workbookField` points at a Module 20 answer; when the person has written
 * it, their own words replace the starter script.
 */

export const AUDIENCES = [
  { id: 'partner', label: 'Partner or family' },
  { id: 'work', label: 'Boss or HR' },
  { id: 'doctor', label: 'Doctor or specialist' },
  { id: 'friend', label: 'Friend' },
];

export const SCRIPTS = {
  partner: [
    {
      need: 'decline', label: 'Say no or cancel plans',
      text: 'I really want to be there, and I also know my body. If I go to [event] today, I’ll likely pay for it for days. I’m going to sit this one out. Could we [do something smaller together / call later] instead?',
    },
    {
      need: 'help', label: 'Ask for help',
      text: 'It would be really helpful if you could [take over cooking tonight / drive me to my appointment]. That one thing would let me save my energy for [what matters to me today].',
    },
    {
      need: 'explain', label: 'Explain invisible pain or fatigue',
      text: 'I know I look fine. Chronic pain is mostly invisible. On a lot of days I’m managing it quietly, not free of it. When I say I’m at my limit, I’m asking you to believe me, not to fix it.',
    },
    {
      need: 'boundary', label: 'Set a boundary',
      text: 'I love that you care about me. Advice about cures and treatments is hard for me to hear right now; my care team and I have a plan. What helps most is [just listening / your company / help with one task].',
    },
  ],
  work: [
    {
      need: 'help', label: 'Ask for accommodations',
      text: 'I’d like to talk about a change that would help me do my job well. Because of a health condition, [task, e.g. sitting for long stretches] is difficult for me. [A sit-stand desk / a flexible start time / working from home on flare days] would let me keep doing [my core duties] effectively. Could we set up a time to discuss it, or should I start with HR?',
      tips: [
        'Focus on what you need to do the job, not on medical details.',
        'In the US, the Americans with Disabilities Act (ADA) gives you the right to ask for reasonable accommodations.',
        'Follow up in writing so there is a record of what you asked for.',
      ],
    },
    {
      need: 'decline', label: 'Say no to extra work',
      text: 'I’m not able to take on [project / extra shift] right now without it affecting the quality of my core work. I can [help with one part of it / revisit this in two weeks].',
    },
    {
      need: 'explain', label: 'Explain a variable condition',
      text: 'My condition varies from day to day. On some days I may need [a short break / to work from home]. That doesn’t change my commitment. It’s how I keep doing good work over time.',
    },
    {
      need: 'boundary', label: 'Protect your hours',
      text: 'I’m going to keep to my regular hours this week; working late sets off my symptoms. I’ll have [task] to you by [day and time].',
    },
  ],
  doctor: [
    {
      need: 'explain', label: 'Describe my pain clearly', workbookField: 'm20_s1_q1',
      text: 'My pain is in my [location]. It feels [sharp / burning / aching], usually around [0–10] out of 10. The biggest effect on my life is [what I can’t do], and that’s what I most want help with.',
    },
    {
      need: 'help', label: 'Ask for a referral or option', workbookField: 'm20_s1_q2',
      text: 'I’d like to discuss whether a referral to [a pain specialist / physical therapy] might help me. What would the next step be?',
    },
    {
      need: 'dismissed', label: 'When I feel dismissed', workbookField: 'm20_s1_q3',
      text: 'I appreciate your input. I want to make sure we’ve explored all the options. Can we talk about [my specific concern] before we finish today?',
    },
    {
      need: 'decline', label: 'Ask for time before deciding',
      text: 'Before I decide, could you help me understand the benefits, the risks, and the alternatives, including waiting? I’d like some time to think it over.',
    },
  ],
  friend: [
    {
      need: 'decline', label: 'Cancel or say no',
      text: 'I have to cancel. My pain is flaring and I need to rest. I’m really sorry to miss it, and it isn’t about you. Can we find another time soon?',
    },
    {
      need: 'help', label: 'Ask for help',
      text: 'It would be really helpful if you could [pick up a few groceries / come sit with me for an hour]. No pressure if you can’t.',
    },
    {
      need: 'explain', label: 'Explain invisible pain or fatigue',
      text: 'Even when I look fine, I’m often managing pain in the background. If I leave early or cancel, it’s my body, not our friendship.',
    },
    {
      need: 'boundary', label: 'Keep visits manageable',
      text: 'I’d love to see you. I can do [lunch] but I’ll need to head home by [time]. Shorter visits mean I can keep seeing you.',
    },
  ],
};

// The same three moves under every script.
export const SCRIPT_SHAPE = [
  'Say what’s true, briefly.',
  'Say what you need, specifically.',
  'Offer what you can do instead.',
];

// LevelUp - Game Data
// Categories, quests, XP values, and weekly credit system

export type DifficultyClass = 'easy' | 'standard' | 'challenging' | 'stretch';

export interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  characterXp: number;
  weeklyCredits: number;
  difficulty: DifficultyClass;
  dailyLimit: number;
  durationMinutes?: number;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  weeklyTargetCredits: {
    light: number;
    standard: number;
    focused: number;
  };
  intensityLabels?: { light: string; standard: string; focused: string };
}

export const CATEGORIES: Category[] = [
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Build physical strength, endurance, and consistent movement habits.',
    icon: 'fitness-center',
    color: '#FF6B35',
    weeklyTargetCredits: { light: 5, standard: 8, focused: 12 },
    intensityLabels: { light: 'Light', standard: 'Standard', focused: 'Training-Focused' },
  },
  {
    id: 'health',
    name: 'Health',
    description: 'Fuel your body, recover intentionally, and build sustainable daily habits.',
    icon: 'favorite',
    color: '#3DD68C',
    weeklyTargetCredits: { light: 5, standard: 8, focused: 10 },
    intensityLabels: { light: 'Gentle', standard: 'Standard', focused: 'Committed' },
  },
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Protect your recovery, build sleep discipline, and wake sharp.',
    icon: 'bedtime',
    color: '#7B68EE',
    weeklyTargetCredits: { light: 4, standard: 7, focused: 9 },
    intensityLabels: { light: 'Light', standard: 'Standard', focused: 'Strict' },
  },
  {
    id: 'learning',
    name: 'Learning',
    description: 'Sharpen your mind, build skills, and invest in intellectual growth.',
    icon: 'school',
    color: '#5E9BFF',
    weeklyTargetCredits: { light: 5, standard: 8, focused: 12 },
    intensityLabels: { light: 'Casual', standard: 'Standard', focused: 'Intensive' },
  },
  {
    id: 'reading',
    name: 'Reading',
    description: 'Build a reading habit that expands your thinking and focus.',
    icon: 'menu-book',
    color: '#A78BFA',
    weeklyTargetCredits: { light: 4, standard: 7, focused: 10 },
    intensityLabels: { light: 'Light', standard: 'Standard', focused: 'Deep' },
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Train deep work, eliminate distraction, and build elite concentration.',
    icon: 'center-focus-strong',
    color: '#F5C842',
    weeklyTargetCredits: { light: 5, standard: 8, focused: 12 },
    intensityLabels: { light: 'Starter', standard: 'Standard', focused: 'Elite' },
  },
  {
    id: 'discipline',
    name: 'Discipline',
    description: 'Show up consistently, do the hard thing first, and build unshakeable habits.',
    icon: 'bolt',
    color: '#FF5757',
    weeklyTargetCredits: { light: 4, standard: 7, focused: 10 },
    intensityLabels: { light: 'Building', standard: 'Standard', focused: 'Iron' },
  },
  {
    id: 'order',
    name: 'Order',
    description: 'Clear your space, clear your mind. Environment drives performance.',
    icon: 'checklist',
    color: '#4ECDC4',
    weeklyTargetCredits: { light: 4, standard: 6, focused: 9 },
    intensityLabels: { light: 'Light', standard: 'Standard', focused: 'Thorough' },
  },
  {
    id: 'career',
    name: 'Career',
    description: 'Invest in your growth, visibility, and professional relationships.',
    icon: 'trending-up',
    color: '#F5A623',
    weeklyTargetCredits: { light: 4, standard: 6, focused: 9 },
    intensityLabels: { light: 'Casual', standard: 'Standard', focused: 'Ambitious' },
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Build clarity, confidence, and intentional communication skills.',
    icon: 'record-voice-over',
    color: '#FF8FAB',
    weeklyTargetCredits: { light: 4, standard: 6, focused: 9 },
    intensityLabels: { light: 'Light', standard: 'Standard', focused: 'Sharp' },
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Build awareness, control, and financial discipline one action at a time.',
    icon: 'account-balance-wallet',
    color: '#98D4A3',
    weeklyTargetCredits: { light: 3, standard: 5, focused: 8 },
    intensityLabels: { light: 'Aware', standard: 'Standard', focused: 'Committed' },
  },
  {
    id: 'social',
    name: 'Social',
    description: 'Strengthen relationships, build your network, and show up for the people who matter.',
    icon: 'people',
    color: '#FFA07A',
    weeklyTargetCredits: { light: 3, standard: 5, focused: 8 },
    intensityLabels: { light: 'Light', standard: 'Standard', focused: 'Connected' },
  },
];

export const QUEST_TEMPLATES: QuestTemplate[] = [
  // FITNESS
  { id: 'fit_1', name: '20-Min Workout', description: 'Complete a focused 20-minute workout session.', categoryId: 'fitness', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1, durationMinutes: 20 },
  { id: 'fit_2', name: '45-Min Workout', description: 'Push through a full 45-minute training session.', categoryId: 'fitness', characterXp: 20, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1, durationMinutes: 45 },
  { id: 'fit_3', name: '60-Min Gym Session', description: 'Complete a full gym session — warm up, lift, cool down.', categoryId: 'fitness', characterXp: 24, weeklyCredits: 1.5, difficulty: 'stretch', dailyLimit: 1, durationMinutes: 60 },
  { id: 'fit_4', name: '10,000 Steps', description: 'Hit 10,000 steps today. Walks, errands, anything counts.', categoryId: 'fitness', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'fit_5', name: 'Mobility Session', description: 'Spend 15+ minutes on mobility, stretching, or flexibility work.', categoryId: 'fitness', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1, durationMinutes: 15 },
  { id: 'fit_6', name: 'Outdoor Run', description: 'Complete an outdoor run, any distance or pace.', categoryId: 'fitness', characterXp: 16, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'fit_7', name: 'Bike Instead of Drive', description: 'Choose cycling over driving for a trip today.', categoryId: 'fitness', characterXp: 13, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'fit_8', name: 'Active Recovery Day', description: 'Do light movement — walk, yoga, or a casual swim. No hard training.', categoryId: 'fitness', characterXp: 8, weeklyCredits: 0.5, difficulty: 'easy', dailyLimit: 1 },
  { id: 'fit_9', name: '5K Run Completed', description: 'Run a full 5K at any pace. Just finish it.', categoryId: 'fitness', characterXp: 22, weeklyCredits: 1.5, difficulty: 'challenging', dailyLimit: 1, durationMinutes: 30 },

  // HEALTH
  { id: 'health_1', name: '2L Water Intake', description: 'Drink at least 2 liters of water throughout the day.', categoryId: 'health', characterXp: 8, weeklyCredits: 1.0, difficulty: 'easy', dailyLimit: 1 },
  { id: 'health_2', name: 'Healthy Meal Prepared', description: 'Prepare a nutritious, home-cooked meal from whole foods.', categoryId: 'health', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'health_3', name: 'Alcohol-Free Day', description: 'Complete the day without any alcohol.', categoryId: 'health', characterXp: 10, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'health_4', name: 'No Junk Food Day', description: 'No processed junk, fast food, or sugar-heavy snacks today.', categoryId: 'health', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'health_5', name: '20-Min Fresh Air Break', description: 'Step outside for at least 20 minutes of fresh air.', categoryId: 'health', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2, durationMinutes: 20 },
  { id: 'health_6', name: 'Intentional Workday Break', description: 'Take a conscious pause between work blocks — no screens.', categoryId: 'health', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2 },
  { id: 'health_7', name: 'Screen Break Completed', description: 'Take a deliberate break from all screens for 20+ minutes.', categoryId: 'health', characterXp: 7, weeklyCredits: 0.5, difficulty: 'easy', dailyLimit: 2, durationMinutes: 20 },
  { id: 'health_8', name: 'Vitamins or Medication Taken', description: 'Take your daily vitamins or prescribed medication on time.', categoryId: 'health', characterXp: 6, weeklyCredits: 0.5, difficulty: 'easy', dailyLimit: 1 },
  { id: 'health_9', name: 'Workday Reset', description: 'Log a true reset moment: walk, breathe, stretch — no agenda.', categoryId: 'health', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1 },

  // SLEEP
  { id: 'sleep_1', name: '7+ Hours Sleep', description: 'Get at least 7 hours of sleep last night.', categoryId: 'sleep', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'sleep_2', name: '8+ Hours Sleep', description: 'Get at least 8 hours of quality sleep.', categoryId: 'sleep', characterXp: 15, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'sleep_3', name: 'In Bed Before 11PM', description: 'Lights out before 11:00 PM — no exceptions.', categoryId: 'sleep', characterXp: 10, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'sleep_4', name: 'No Phone 30 Min Before Sleep', description: 'Put the phone away at least 30 minutes before you sleep.', categoryId: 'sleep', characterXp: 10, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'sleep_5', name: 'Useful Power Nap', description: 'Take a deliberate 20-minute power nap at an intentional time.', categoryId: 'sleep', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1, durationMinutes: 20 },
  { id: 'sleep_6', name: 'No Snooze', description: 'Wake up at your alarm. No snooze, no delay.', categoryId: 'sleep', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'sleep_7', name: 'Caffeine Cutoff Respected', description: 'No caffeine after your set cutoff time today.', categoryId: 'sleep', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1 },
  { id: 'sleep_8', name: 'Wind-Down Routine Done', description: 'Complete a deliberate wind-down routine before bed.', categoryId: 'sleep', characterXp: 10, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },

  // LEARNING
  { id: 'learn_1', name: '15-Min Learning Session', description: 'Spend 15 focused minutes learning something new.', categoryId: 'learning', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2, durationMinutes: 15 },
  { id: 'learn_2', name: 'Online Course Progress', description: 'Complete at least one module or lesson in an online course.', categoryId: 'learning', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'learn_3', name: 'Notes Taken and Reviewed', description: 'Take structured notes on what you learned and review them.', categoryId: 'learning', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2 },
  { id: 'learn_4', name: 'Professional Article Studied', description: 'Read and digest a high-quality professional article or essay.', categoryId: 'learning', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'learn_5', name: 'Skill Module Completed', description: 'Finish a structured skill-building module or exercise.', categoryId: 'learning', characterXp: 16, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 2 },
  { id: 'learn_6', name: 'Language Learning Session', description: 'Practice a foreign language for 15+ focused minutes.', categoryId: 'learning', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2, durationMinutes: 15 },
  { id: 'learn_7', name: '30-Min Deep Learning Block', description: 'Uninterrupted 30-minute learning session on a key topic.', categoryId: 'learning', characterXp: 18, weeklyCredits: 1.5, difficulty: 'challenging', dailyLimit: 1, durationMinutes: 30 },
  { id: 'learn_8', name: 'Concept Summarized', description: 'Write a clear summary of something you learned recently.', categoryId: 'learning', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2 },

  // READING
  { id: 'read_1', name: '10-Min Reading', description: 'Read for at least 10 uninterrupted minutes.', categoryId: 'reading', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2, durationMinutes: 10 },
  { id: 'read_2', name: '20-Min Reading', description: 'Read for at least 20 uninterrupted minutes.', categoryId: 'reading', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2, durationMinutes: 20 },
  { id: 'read_3', name: '20 Pages Read', description: 'Read at least 20 pages of a book today.', categoryId: 'reading', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'read_4', name: 'Chapter Completed', description: 'Finish a full chapter of your current book.', categoryId: 'reading', characterXp: 16, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 2 },
  { id: 'read_5', name: 'Read Instead of Scrolling', description: 'Replace a usual phone scroll session with reading.', categoryId: 'reading', characterXp: 10, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'read_6', name: '30-Min Reading Block', description: 'Read for a full uninterrupted 30-minute block.', categoryId: 'reading', characterXp: 18, weeklyCredits: 1.5, difficulty: 'challenging', dailyLimit: 1, durationMinutes: 30 },
  { id: 'read_7', name: 'Book Summary or Review Written', description: 'Write a short reflection or summary on a book you finished.', categoryId: 'reading', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'read_8', name: 'Non-Fiction Chapter Done', description: 'Complete a chapter in a non-fiction or professional book.', categoryId: 'reading', characterXp: 16, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 2 },

  // FOCUS
  { id: 'focus_1', name: 'Eat the Frog', description: 'Complete your hardest or most dreaded task first thing.', categoryId: 'focus', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'focus_2', name: '25-Min Focus Block', description: 'Complete a full 25-minute focused work block with no interruptions.', categoryId: 'focus', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 3, durationMinutes: 25 },
  { id: 'focus_3', name: '50-Min Deep Work Block', description: 'Complete a full 50-minute deep work session on a single task.', categoryId: 'focus', characterXp: 16, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 2, durationMinutes: 50 },
  { id: 'focus_4', name: 'Top Priority Completed', description: 'Finish the single most important task on your list today.', categoryId: 'focus', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'focus_5', name: 'No Multitasking Block', description: 'Work on one thing only for 30+ minutes — no switching.', categoryId: 'focus', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2, durationMinutes: 30 },
  { id: 'focus_6', name: 'Phone Away During Work Block', description: 'Work with phone face-down or in another room for 30+ minutes.', categoryId: 'focus', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2, durationMinutes: 30 },
  { id: 'focus_7', name: '90-Min Deep Work Session', description: 'Hit a 90-minute distraction-free work block on a single priority.', categoryId: 'focus', characterXp: 22, weeklyCredits: 1.75, difficulty: 'stretch', dailyLimit: 1, durationMinutes: 90 },
  { id: 'focus_8', name: 'Day Planning Done', description: 'Write out your priorities and plan for the day before starting work.', categoryId: 'focus', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1 },

  // DISCIPLINE
  { id: 'disc_1', name: 'Morning Routine Completed', description: 'Complete your morning routine fully as planned, no shortcuts.', categoryId: 'discipline', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'disc_2', name: 'Got Up Without Snoozing', description: 'Wake up at your alarm immediately. No snooze, no delay.', categoryId: 'discipline', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'disc_3', name: 'Unpleasant Task Done First', description: 'Tackle the task you least want to do — before anything else.', categoryId: 'discipline', characterXp: 14, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'disc_4', name: 'Routine Kept on Schedule', description: 'Follow your planned routine with no major deviations today.', categoryId: 'discipline', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'disc_5', name: 'Habit Done Despite Low Motivation', description: 'Complete your planned habit even when you did not feel like it.', categoryId: 'discipline', characterXp: 16, weeklyCredits: 1.5, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'disc_6', name: 'No Social Media Before Noon', description: 'Keep social media closed until midday.', categoryId: 'discipline', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1 },
  { id: 'disc_7', name: 'Evening Reflection Done', description: 'Spend 10 minutes reviewing what went well and what to improve.', categoryId: 'discipline', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1, durationMinutes: 10 },
  { id: 'disc_8', name: 'Cold Start Day', description: 'Begin the day without checking phone or email for 30+ minutes.', categoryId: 'discipline', characterXp: 14, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1 },

  // ORDER
  { id: 'order_1', name: '10-Min Tidy Up', description: 'Spend 10 focused minutes tidying your living or work space.', categoryId: 'order', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2, durationMinutes: 10 },
  { id: 'order_2', name: 'Desk Cleaned and Organized', description: 'Clear, clean, and organize your entire desk surface.', categoryId: 'order', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'order_3', name: 'Trash Taken Out', description: 'Empty all trash cans and take them out today.', categoryId: 'order', characterXp: 6, weeklyCredits: 0.5, difficulty: 'easy', dailyLimit: 1 },
  { id: 'order_4', name: 'Laundry Done and Put Away', description: 'Complete a full laundry cycle and actually put everything away.', categoryId: 'order', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'order_5', name: 'Dishes Cleared', description: 'Clear, wash, and put away all dishes in the sink.', categoryId: 'order', characterXp: 7, weeklyCredits: 0.5, difficulty: 'easy', dailyLimit: 1 },
  { id: 'order_6', name: 'Car Cleaned', description: 'Clean the interior and/or exterior of your car.', categoryId: 'order', characterXp: 14, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'order_7', name: 'Bag or Backpack Organized', description: 'Empty, sort, and repack your bag so it is fully organized.', categoryId: 'order', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1 },
  { id: 'order_8', name: 'Paperwork or Admin Sorted', description: 'Handle a backlog of paperwork, files, or administrative tasks.', categoryId: 'order', characterXp: 14, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1 },

  // CAREER
  { id: 'career_1', name: 'Coffee with Someone New', description: 'Have a real coffee or call with someone outside your usual circle.', categoryId: 'career', characterXp: 16, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'career_2', name: 'Lunch with a Senior or Leader', description: 'Have lunch or a meal with someone who has more experience.', categoryId: 'career', characterXp: 18, weeklyCredits: 1.5, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'career_3', name: 'LinkedIn Profile Updated', description: 'Update or improve your LinkedIn profile in a meaningful way.', categoryId: 'career', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'career_4', name: 'Worked on Career Goal', description: 'Spend 20+ minutes on a specific career growth goal or project.', categoryId: 'career', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2, durationMinutes: 20 },
  { id: 'career_5', name: 'Visibility-Building Action', description: 'Post, publish, speak, or take an action that increases your visibility.', categoryId: 'career', characterXp: 16, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'career_6', name: 'Internal Networking', description: 'Have a meaningful professional conversation inside your organization.', categoryId: 'career', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'career_7', name: 'Growth Conversation Prepared', description: 'Prepare a clear pitch, proposal, or agenda for a career growth conversation.', categoryId: 'career', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'career_8', name: 'Applied to Opportunity', description: 'Apply for a job, grant, speaking slot, or professional opportunity.', categoryId: 'career', characterXp: 20, weeklyCredits: 1.5, difficulty: 'stretch', dailyLimit: 2 },

  // COMMUNICATION
  { id: 'comm_1', name: '10-Min Mirror Speaking Practice', description: 'Speak out loud to a mirror for 10 minutes to build confidence.', categoryId: 'communication', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1, durationMinutes: 10 },
  { id: 'comm_2', name: 'Difficult Message Written Carefully', description: 'Draft and send a challenging message with intentional clarity and tone.', categoryId: 'communication', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'comm_3', name: 'Conflict Addressed Intentionally', description: 'Face and address a conflict or tension with clear communication.', categoryId: 'communication', characterXp: 18, weeklyCredits: 1.5, difficulty: 'stretch', dailyLimit: 1 },
  { id: 'comm_4', name: 'Feedback Given Clearly', description: 'Give clear, specific, and constructive feedback to someone.', categoryId: 'communication', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'comm_5', name: '20-Min Message Reply Block', description: 'Batch and respond to messages in a focused 20-minute block.', categoryId: 'communication', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2, durationMinutes: 20 },
  { id: 'comm_6', name: 'Presentation Practice', description: 'Practice a presentation or pitch for 15+ minutes out loud.', categoryId: 'communication', characterXp: 16, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1, durationMinutes: 15 },
  { id: 'comm_7', name: 'Active Listening Used Intentionally', description: 'In a conversation today, focus entirely on listening before responding.', categoryId: 'communication', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'comm_8', name: 'Focused Email Reply Block', description: 'Process and reply to emails in a single focused 25-minute block.', categoryId: 'communication', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2, durationMinutes: 25 },

  // FINANCE
  { id: 'fin_1', name: 'Budget Reviewed', description: 'Open your budget tracker and review your current spending.', categoryId: 'finance', characterXp: 10, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'fin_2', name: 'Expenses Logged', description: 'Log all of today\'s expenses in your tracker or app.', categoryId: 'finance', characterXp: 8, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 1 },
  { id: 'fin_3', name: 'Unnecessary Purchase Avoided', description: 'Identify and skip an unnecessary or impulsive purchase today.', categoryId: 'finance', characterXp: 10, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'fin_4', name: 'Account Balance Checked', description: 'Log in and review all account balances and recent activity.', categoryId: 'finance', characterXp: 7, weeklyCredits: 0.5, difficulty: 'easy', dailyLimit: 1 },
  { id: 'fin_5', name: 'Bill Paid on Time', description: 'Pay a bill before its due date.', categoryId: 'finance', characterXp: 10, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'fin_6', name: 'Savings Transfer Completed', description: 'Transfer money to your savings or investment account today.', categoryId: 'finance', characterXp: 14, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'fin_7', name: 'Unused Subscription Canceled', description: 'Find and cancel one subscription you no longer use.', categoryId: 'finance', characterXp: 12, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 2 },
  { id: 'fin_8', name: '15-Min Finance Review', description: 'Spend 15 focused minutes reviewing your overall financial picture.', categoryId: 'finance', characterXp: 14, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 1, durationMinutes: 15 },

  // SOCIAL
  { id: 'social_1', name: 'Lunch Meeting', description: 'Have a real, in-person lunch with a friend, family member, or colleague.', categoryId: 'social', characterXp: 14, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'social_2', name: 'Family or Friend Outreach', description: 'Reach out to a family member or friend you have not spoken to recently.', categoryId: 'social', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2 },
  { id: 'social_3', name: 'Network Event Attended', description: 'Show up to a professional or social networking event.', categoryId: 'social', characterXp: 18, weeklyCredits: 1.5, difficulty: 'challenging', dailyLimit: 1 },
  { id: 'social_4', name: 'Met Someone New', description: 'Have a real conversation with someone you did not know before today.', categoryId: 'social', characterXp: 14, weeklyCredits: 1.25, difficulty: 'challenging', dailyLimit: 2 },
  { id: 'social_5', name: 'Initiated a Plan', description: 'Take the initiative to schedule and organize a social plan.', categoryId: 'social', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1 },
  { id: 'social_6', name: 'Meaningful Conversation', description: 'Have a real, deep, or meaningful conversation with someone today.', categoryId: 'social', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 2 },
  { id: 'social_7', name: 'Phone Away During Conversation', description: 'Put your phone completely away during a social interaction.', categoryId: 'social', characterXp: 10, weeklyCredits: 0.75, difficulty: 'easy', dailyLimit: 2 },
  { id: 'social_8', name: 'Reduced Screen Time in Social Setting', description: 'Spend 60+ minutes in a social setting without checking your phone.', categoryId: 'social', characterXp: 12, weeklyCredits: 1.0, difficulty: 'standard', dailyLimit: 1, durationMinutes: 60 },
];

export const STARTER_CATEGORIES = ['fitness', 'focus', 'discipline'];

export const AVATAR_OPTIONS = {
  genderPresentation: [
    { id: 'masculine', label: 'Masculine' },
    { id: 'feminine', label: 'Feminine' },
    { id: 'neutral', label: 'Neutral' },
  ],
  skinTones: [
    { id: 'tone1', color: '#FDDBB4' },
    { id: 'tone2', color: '#F0C27F' },
    { id: 'tone3', color: '#C68642' },
    { id: 'tone4', color: '#8D5524' },
    { id: 'tone5', color: '#5C3317' },
    { id: 'tone6', color: '#3B1F0B' },
  ],
  hairstyles: [
    { id: 'short', label: 'Short' },
    { id: 'medium', label: 'Medium' },
    { id: 'long', label: 'Long' },
    { id: 'buzz', label: 'Buzz Cut' },
    { id: 'bald', label: 'Bald' },
  ],
  clothingStyles: [
    { id: 'casual', label: 'Casual' },
    { id: 'athletic', label: 'Athletic' },
    { id: 'business', label: 'Business' },
    { id: 'streetwear', label: 'Streetwear' },
  ],
  bodyTypes: [
    { id: 'lean', label: 'Lean' },
    { id: 'average', label: 'Average' },
    { id: 'athletic', label: 'Athletic' },
    { id: 'broad', label: 'Broad' },
  ],
};

export const LEVEL_THRESHOLDS: number[] = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10000,
];

export const BADGE_DEFINITIONS = [
  { id: 'first_100xp', name: 'First 100 XP', description: 'Earn your first 100 Character XP.', icon: 'stars' },
  { id: 'streak_7', name: '7-Day Streak', description: 'Maintain a streak for 7 consecutive days.', icon: 'local-fire-department' },
  { id: 'balanced_week', name: 'Balanced Week', description: 'Complete all active categories in a single week.', icon: 'balance' },
  { id: 'category_complete', name: 'Category Completed', description: 'Reach 100% in any category for the week.', icon: 'check-circle' },
  { id: 'comeback_week', name: 'Comeback Week', description: 'Return after missing 3+ days and hit 50%+ weekly score.', icon: 'refresh' },
  { id: 'no_zero_days', name: 'No Zero Days', description: 'Complete at least one quest every day for a full week.', icon: 'emoji-events' },
];

export const getQuestsByCategory = (categoryId: string): QuestTemplate[] =>
  QUEST_TEMPLATES.filter((q) => q.categoryId === categoryId);

export const getCategoryById = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);

export const getLevelFromXp = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

export const getXpForNextLevel = (level: number): number =>
  LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] || 10000;

export const getXpProgress = (xp: number): { level: number; current: number; next: number; progress: number } => {
  const level = getLevelFromXp(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || 10000;
  const current = xp - currentThreshold;
  const next = nextThreshold - currentThreshold;
  return { level, current, next, progress: current / next };
};

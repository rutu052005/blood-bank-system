import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'blood_bank_super_secret_jwt_key_2026',
  demoPassword: process.env.DEMO_PASSWORD || 'demo123',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  
  // Engine Default Configurations
  scheduler: {
    loopIntervalSeconds: 10,
    holdTTLMinutes: 30,
    maxPreemptionsPerRequest: 2,
    agingIntervalMinutes: 5,
    agingStepPoints: 5,
    agingCapPoints: 50,
    emergencyBaseWeight: 100,
    urgentBaseWeight: 60,
    routineBaseWeight: 20,
    urgentPromotionThreshold: 60,
  },
  
  matching: {
    profiles: {
      FASTEST: { w_expiry: 0.25, w_distance: 0.60, w_fit: 0.15 },
      BALANCED: { w_expiry: 0.35, w_distance: 0.50, w_fit: 0.15 },
    },
    safetyBufferHours: 4,
    avgTransportSpeedKmh: 40,
  },

  eventQueue: {
    maxBufferDepth: 100,
    maxRetries: 3,
  },

  escalation: {
    warningMinutes: 15,
    criticalMinutes: 30,
  },
};

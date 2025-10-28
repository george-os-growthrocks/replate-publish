import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ReactGA from 'react-ga4';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Google Analytics Setup
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX';

export const initGA = () => {
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.initialize(GA_MEASUREMENT_ID);
  }
};

export const logPageView = (path: string) => {
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const logEvent = (category: string, action: string, label?: string, value?: number) => {
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
  }
};

export const trackFeatureUsage = (feature: string, credits: number) => {
  logEvent('Feature', 'Used', `${feature} (${credits} credits)`, credits);
};

export const trackConversion = (plan: string, amount: number) => {
  ReactGA.event({
    category: 'Purchase',
    action: 'Subscription',
    label: plan,
    value: amount
  });
};

export const trackSignup = () => {
  logEvent('User', 'Signup', 'New User Registration');
};

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
  category: 'Hiring' | 'Sales' | 'Research' | 'Founders';
  metric: string;
}

export interface SolutionPillar {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  stats: string;
  highlights: string[];
}

export interface ContactFormData {
  fullName: string;
  workEmail: string;
  company: string;
  role: string;
  inquiryType: string;
  message: string;
}

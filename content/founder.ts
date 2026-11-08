export type Portrait = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Founder = {
  name: string;
  hero: string;
  intro: string;
  bio: string[];
  built: string[];
  education: string[];
  linkedin: string;
  portrait: Portrait | null;
};

export const founder: Founder = {
  name: "Sai Vignesh Golla",
  hero: "Sai Vignesh Golla finds what stops the work, and builds the way through.",
  intro:
    "Sai is a software engineer and the founder of SAVIGN. He has spent six years on security, payments and AI systems that companies depend on, and he started SAVIGN to build tools that help AI agents do real work.",
  bio: [
    "Sai trained as an electronics engineer first. He earned a B.Tech in Electronics and Communication Engineering at Vellore Institute of Technology, then a master's in Computer Science at Stevens Institute of Technology.",
    "He likes the part of a system that has to be right. At Intuit he worked on QuickBooks, where payroll and banking data leave little room for error. He built services for earned wage access, a production AI agent, and the partner experiences behind the retirement benefits offering.",
    "At BackOps AI, enterprise deals were waiting on sign in and access rules the product did not have yet. Sai built the company's identity and security platform on his own in about three months. It brought single sign on, multi factor login and one access policy that every core service enforced, and he built its controls to SOC 2 Type 2, ISO and GDPR requirements.",
    "SAVIGN carries that habit forward. The name comes from his own, and Vignesh comes from Vighnesha, the one who removes obstacles. He measures his tools before he trusts them, and keeps the code plain enough for anyone to check his work.",
  ],
  built: [
    "An identity and security platform for BackOps AI, built on his own, with single sign on, multi factor login and multi tenant access control. It unblocked more than $1.5M in enterprise contracts.",
    "A production AI agent at Intuit that answers from enterprise data, built in Python on LangGraph. It cut manual HR effort by 60%.",
    "The React and TypeScript experiences for retirement benefits partners at Intuit, adopted across QuickBooks. They enabled more than $10M in FY25 revenue.",
    "Structured logging and Splunk dashboards for production services at Intuit, which cut the time to resolve production issues by 30%.",
    "A Trailer Locator service for Utility Trailer on Node.js and Redis. It cut trailer retrieval time from about 2 hours to 15 minutes.",
  ],
  education: [
    "MS in Computer Science, Stevens Institute of Technology.",
    "B.Tech in Electronics and Communication Engineering, Vellore Institute of Technology.",
  ],
  linkedin: "https://www.linkedin.com/in/saivigneshgolla/",
  // Set to { src: "/founder/<file>", alt, width, height } once the owner sends a photo.
  portrait: null,
};

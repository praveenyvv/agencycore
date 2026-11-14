export function getEmailReminderTemplate({
  clientName,
  projectName,
  contactName,
  meetingDate,
  stage,
}: {
  clientName: string;
  projectName: string;
  contactName: string;
  meetingDate?: string;
  stage?: 'meeting' | 'proposal' | 'draft';
}): { subject: string; body: string } {
  if (stage === 'proposal') {
    return {
      subject: `Friendly follow-up: Proposal for ${projectName} (${clientName})`,
      body: `Hi ${contactName || 'there'},\n\nHope you're having a productive week!\n\nI wanted to follow up on the custom proposal we prepared for ${projectName}. We put together the workflow, team schedule, and commercial breakdown based on our recent discussions.\n\nPlease let us know if your team had a chance to review it, or if you'd like to jump on a quick 15-minute sync to address any questions or adjust scope.\n\nLooking forward to hearing your thoughts.\n\nWarm regards,\nThe AgencyCore Team`,
    };
  }

  return {
    subject: `Touching base: Discovery & Next Steps for ${projectName}`,
    body: `Hi ${contactName || 'there'},\n\nI hope you are doing well!\n\nI am checking in regarding our conversation around ${projectName} for ${clientName}${
      meetingDate ? ` (our session on ${meetingDate})` : ''
    }.\n\nWe would love to know if you would like to continue exploring the solutions we mapped out or if you need any additional insights from our engineering & design team.\n\nPlease let us know when works best for a brief touchpoint.\n\nBest regards,\nThe AgencyCore Team`,
  };
}

export function getWhatsAppReminderTemplate({
  clientName,
  projectName,
  contactName,
  stage,
}: {
  clientName: string;
  projectName: string;
  contactName: string;
  stage?: 'meeting' | 'proposal' | 'draft';
}): string {
  if (stage === 'proposal') {
    return `Hi ${contactName}! 👋 Following up on the proposal sent for *${projectName}* (${clientName}). Did you get a chance to look it over? Happy to answer any questions or hop on a quick call whenever you're ready!`;
  }
  return `Hi ${contactName}! 👋 Checking in from the AgencyCore team regarding *${projectName}*. Wanted to see how things are progressing on your side and if you'd like to schedule our next discussion. Let us know what time works best for you!`;
}

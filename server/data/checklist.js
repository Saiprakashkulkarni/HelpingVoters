/**
 * @fileoverview Default Checklist Data for Voter Registration
 */

const DEFAULT_CHECKLIST = [
  { key: 'check_eligibility', label: 'Check Voter Eligibility', description: 'Verify you meet the age and citizenship requirements to vote.' },
  { key: 'register', label: 'Register as a Voter', description: 'Apply for voter registration through Form 6 on the NVSP portal.' },
  { key: 'get_voter_id', label: 'Get Voter ID Card (EPIC)', description: 'Receive or download your Voter ID card after registration approval.' },
  { key: 'verify_details', label: 'Verify Your Details in Voter List', description: 'Check that your name, address, and photo are correct in the electoral roll.' },
  { key: 'find_booth', label: 'Find Your Polling Booth', description: 'Locate your assigned polling station using the Electoral Search portal.' },
  { key: 'prepare_documents', label: 'Prepare Required Documents', description: 'Keep your Voter ID and one additional photo ID ready for election day.' },
  { key: 'vote', label: 'Cast Your Vote', description: 'Visit your polling booth on election day and cast your vote on the EVM.' },
];

module.exports = { DEFAULT_CHECKLIST };

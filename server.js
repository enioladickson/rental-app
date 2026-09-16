// server.js
// Serves the rental application website and handles form submissions:
// every submission is printed to the Node.js console AND emailed to you.

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Email transporter ----------
// Configure these in a .env file (see .env.example).
// Works with Gmail (using an App Password), Outlook, or any SMTP provider.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465, false for 587/others
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Builds a readable plain-text summary of the application
function formatApplication(data) {
  const line = (label, value) => `${label}: ${value || '—'}`;

  return [
    '=== NEW RENTAL APPLICATION ===',
    '',
    '--- Contact ---',
    line('Full name', data.fullName),
    line('Email', data.email),
    line('Phone', data.phone),
    line('Preferred contact method', data.contactMethod),
    '',
    '--- Tour request ---',
    line('Preferred date', data.tourDate),
    line('Preferred time', data.tourTime),
    line('Tour type', data.tourType),
    line('Alternate date', data.tourAltDate),
    '',
    '--- Move-in & lease ---',
    line('Preferred move-in date', data.moveInDate),
    line('Earliest possible date', data.moveInEarliest),
    line('Lease duration', data.leaseDuration),
    '',
    '--- Household income ---',
    line('Annual household income (before taxes)', data.householdIncome && `$${data.householdIncome}`),
    line('Has housing voucher', data.hasVoucher ? 'Yes' : 'No'),
    line('Voucher program', data.voucherProgram),
    line('Voucher amount (monthly)', data.voucherAmount && `$${data.voucherAmount}`),
    '',
    '--- Household size ---',
    line('Number of occupants', data.occupantCount),
    line('Bedrooms needed', data.bedrooms),
    line('Other occupants', data.occupantDetails),
    '',
    '--- Pets ---',
    line('Has pet', data.hasPet),
    line('Pet type', data.petType),
    line('Breed', data.petBreed),
    line('Weight', data.petWeight),
    line('Number of pets', data.petCount),
    '',
    '--- Personal details ---',
    line('Current address', data.currentAddress),
    line('Date of birth', data.dob),
    line('Relationship status', data.relationshipStatus),
    '',
    '--- Rental & background history ---',
    line('Current landlord', data.landlordName),
    line('Landlord phone', data.landlordPhone),
    line('Reason for moving', data.reasonForMoving),
    line('Criminal record', data.hasCrimeRecord),
    line('Explanation', data.crimeExplanation),
    '',
    '--- Employment ---',
    line('Employer', data.employerName),
    line('Job title', data.jobTitle),
    line('Length of employment', data.employmentLength),
    line('Additional income source', data.additionalIncomeSource),
    '',
    '--- Emergency contact ---',
    line('Name', data.emergencyName),
    line('Relationship', data.emergencyRelationship),
    line('Phone', data.emergencyPhone),
    '',
    '--- Payment method ---',
    line('Preferred method', data.paymentMethod),
    line('Handle / username', data.paymentHandle),
    '',
    '--- Consent & signature ---',
    line('Certified accurate', data.consentAccuracy ? 'Yes' : 'No'),
    line('Authorized screening', data.consentScreening ? 'Yes' : 'No'),
    line('Signature', data.signature),
    line('Date signed', data.signatureDate),
  ].join('\n');
}

// ---------- Route: receive a submission ----------
app.post('/submit-application', async (req, res) => {
  const data = req.body;

  if (!data || !data.fullName || !data.email) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }

  const summary = formatApplication(data);

  // 1) Show it in the Node.js console
  console.log('\n' + summary + '\n');

  // 2) Email it to you
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: data.email,
      subject: `New rental application — ${data.fullName}`,
      text: summary,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to send email:', err.message);
    // The submission was still logged above, so we don't lose it —
    // but tell the browser something went wrong so it can inform the applicant.
    res.status(500).json({ ok: false, error: 'Email delivery failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Rental application server running at http://localhost:${PORT}`);
});

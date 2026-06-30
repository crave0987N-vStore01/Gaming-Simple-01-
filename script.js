// =========================================================
// CYBER DEFENDER - GAME LOGIC
// =========================================================

// game state
const gameState = {
  currentScreen: 'splash',
  currentLevel: 1,
  currentDifficulty: 'easy',
  score: 0,
  xp: 0,
  lives: 3,
  combo: 1,
  bestCombo: 1,
  questionIndex: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  isPaused: false,
  timerInterval: null,
  timeRemaining: 30,
  playerName: 'Player',
  soundEnabled: true,
  musicEnabled: true,
  skipAnimations: false,
  stats: {
    gamesPlayed: 0,
    totalXP: 0,
    totalCorrect: 0,
    totalMistakes: 0,
    bestScore: 0,
  },
  highScores: [],
  achievements: {},
  unlockedLevels: [1],
};

// all level definitions and questions
const levelsData = {
  1: {
    title: 'Phishing Email Detection',
    icon: '📧',
    description: 'Spot phishing emails before they trick you',
    questions: [
      {
        type: 'phishing',
        text: 'You receive an email from "your.bank.security@confirms-identity.com" asking you to verify your account by clicking a link. Is this email safe?',
        extra: {
          from: 'your.bank.security@confirms-identity.com',
          subject: 'URGENT: Verify Your Account',
          body: 'Click here to confirm your identity: [LINK]',
        },
        answers: [
          { text: 'Safe - Banks communicate this way', correct: false },
          { text: 'Phishing - Suspicious sender domain', correct: true },
          { text: 'Safe - Email address looks legitimate', correct: false },
          { text: 'Cannot determine', correct: false },
        ],
        tip: 'Real banks never ask you to verify identity via email links. Check the sender domain carefully - "confirms-identity.com" is not your bank\'s official domain.',
      },
      {
        type: 'phishing',
        text: 'You get an email from support@paypal.com saying your account will be limited. Click here to restore access. Safe or Phishing?',
        extra: {
          from: 'support@paypal.com',
          subject: 'Account Limited - Action Required',
          body: 'Your account has been limited. Click to restore: [LINK]',
        },
        answers: [
          { text: 'Phishing - Creates urgency', correct: true },
          { text: 'Safe - Official PayPal email', correct: false },
          { text: 'Safe - Legitimate warning', correct: false },
          { text: 'Depends on the link', correct: false },
        ],
        tip: 'Phishing emails create artificial urgency ("Act now!" "Limited time!"). Never click email links - go directly to the website by typing the URL yourself.',
      },
      {
        type: 'phishing',
        text: 'Your colleague forwards you an email about a system update. The email has a strange formatting, multiple typos, and asks for login credentials. Is this safe?',
        extra: {
          from: 'admin@companysystem.fake',
          subject: 'SYSEM UPDATE - URGENT',
          body: 'Plese update your credentails: [FORM]',
        },
        answers: [
          { text: 'Safe - From a colleague', correct: false },
          { text: 'Phishing - Poor grammar, asks for credentials', correct: true },
          { text: 'Safe - About system update', correct: false },
          { text: 'Legitimate company communication', correct: false },
        ],
        tip: 'Real IT teams never ask for passwords via email. Legitimate companies use proper grammar and spelling. Phishing emails often have multiple red flags.',
      },
      {
        type: 'phishing',
        text: 'You receive an email from Apple Support (support@apple.com) saying your iCloud account needs updating. Safe or Phishing?',
        extra: {
          from: 'support@apple.com',
          subject: 'Update Your iCloud Account',
          body: 'Your iCloud needs updating: [LINK]',
        },
        answers: [
          { text: 'Phishing - Official but suspicious request', correct: true },
          { text: 'Safe - Apple official domain', correct: false },
          { text: 'Safe - iCloud updates are normal', correct: false },
          { text: 'Safe - Legitimate email', correct: false },
        ],
        tip: 'Even if the sender appears official, Apple never requests account updates via email. Always access account settings directly through the official app or website.',
      },
      {
        type: 'phishing',
        text: 'Your bank sends an email from banking.support.verification@yourbankname.com asking for recent transactions for fraud verification. Safe or Phishing?',
        extra: {
          from: 'banking.support.verification@yourbankname.com',
          subject: 'Fraud Verification Required',
          body: 'Provide recent transaction details for verification',
        },
        answers: [
          { text: 'Safe - Bank needs fraud verification', correct: false },
          { text: 'Phishing - Banks never ask for transaction details via email', correct: true },
          { text: 'Safe - Legitimate security measure', correct: false },
          { text: 'Must verify first', correct: false },
        ],
        tip: 'Banks NEVER ask for account details, transaction history, or credentials via email. If in doubt, call your bank directly using the number on your card.',
      },
      {
        type: 'phishing',
        text: 'You get an email about winning a prize you never entered. Links to claim your free gift card. Is this safe?',
        extra: {
          from: 'promotions@freegifts.site',
          subject: 'You\'ve Won! Claim Your $500 Gift Card NOW!',
          body: 'Congratulations! Click to claim your prize immediately!',
        },
        answers: [
          { text: 'Safe - It\'s a legitimate promotion', correct: false },
          { text: 'Phishing - You didn\'t enter, too good to be true', correct: true },
          { text: 'Safe - Gift cards are real rewards', correct: false },
          { text: 'Check before claiming', correct: false },
        ],
        tip: 'If you didn\'t enter a contest, you can\'t win. "Too good to be true" offers are classic phishing bait. Legitimate companies don\'t cold-email random prize claims.',
      },
      {
        type: 'phishing',
        text: 'Email from Netflix (noreply@netflix.com) says your payment method is expired and needs updating. Safe or Phishing?',
        extra: {
          from: 'noreply@netflix.com',
          subject: 'Your Payment Method Has Expired',
          body: 'Update your payment information to continue service',
        },
        answers: [
          { text: 'Phishing - Update payment in the app, not via email', correct: true },
          { text: 'Safe - Netflix official notification', correct: false },
          { text: 'Safe - Normal renewal process', correct: false },
          { text: 'Safe - Legitimate reminder', correct: false },
        ],
        tip: 'Legitimate streaming services notify you IN the app or on your account dashboard, not via email links. Always update payments through official apps.',
      },
      {
        type: 'phishing',
        text: 'You receive an email claiming to be from LinkedIn support about suspicious activity. The sender is support_linkedin@security-alert.net. Safe or Phishing?',
        extra: {
          from: 'support_linkedin@security-alert.net',
          subject: 'Suspicious Activity Detected',
          body: 'We detected unusual login attempts. Verify now.',
        },
        answers: [
          { text: 'Safe - LinkedIn security alert', correct: false },
          { text: 'Phishing - Not from official LinkedIn domain', correct: true },
          { text: 'Safe - Legitimate warning', correct: false },
          { text: 'Depends on content', correct: false },
        ],
        tip: 'LinkedIn\'s official domain is linkedin.com. Any email from security-alert.net or similar is fake. Real LinkedIn alerts appear IN your account.',
      },
      {
        type: 'phishing',
        text: 'Email from Google Accounts (account-security-noreply@google.com): "Confirm your recovery email." Safe or Phishing?',
        extra: {
          from: 'account-security-noreply@google.com',
          subject: 'Confirm Your Recovery Email',
          body: 'Verify your recovery email for account safety',
        },
        answers: [
          { text: 'Safe - Google official notification', correct: true },
          { text: 'Phishing - All security emails are phishing', correct: false },
          { text: 'Safe - Recovery email verification is normal', correct: true },
          { text: 'Cannot determine', correct: false },
        ],
        tip: 'Google\'s official domain is @google.com. Real security notifications come from official addresses and link to accounts.google.com. Always verify by going directly to Google.',
      },
      {
        type: 'phishing',
        text: 'Email: "Microsoft Security Alert - Your password will expire in 24 hours. Click to reset." Sender: security@microsoft.onmicrosoft.com. Safe or Phishing?',
        extra: {
          from: 'security@microsoft.onmicrosoft.com',
          subject: 'Password Expiration Warning',
          body: 'Reset your password immediately',
        },
        answers: [
          { text: 'Phishing - Microsoft doesn\'t expire passwords this way', correct: true },
          { text: 'Safe - Microsoft official domain', correct: false },
          { text: 'Safe - Password resets are important', correct: false },
          { text: 'Safe - Legitimate security alert', correct: false },
        ],
        tip: 'Microsoft doesn\'t send emails about password expiration via email links. Modern businesses don\'t force password expiration. Go to the account directly.',
      },
    ],
  },
  2: {
    title: 'Password Strength Challenge',
    icon: '🔐',
    description: 'Create and identify strong, secure passwords',
    questions: [
      {
        type: 'password',
        text: 'Which password is the STRONGEST?',
        answers: [
          { text: 'password123', correct: false },
          { text: 'MyD0g!B1rthday2024', correct: true },
          { text: 'qwerty', correct: false },
          { text: '12345678', correct: false },
        ],
        tip: 'Strong passwords have uppercase, lowercase, numbers, and symbols. Avoid dictionary words, birthdays, and sequential numbers.',
      },
      {
        type: 'password',
        text: 'Why is "admin123" a WEAK password?',
        answers: [
          { text: 'It is too long', correct: false },
          { text: 'Common word + predictable number pattern', correct: true },
          { text: 'It has numbers', correct: false },
          { text: 'It has lowercase letters', correct: false },
        ],
        tip: 'Weak passwords use common words, predictable patterns (123, abc), birthdays, or pet names. Hackers try these first.',
      },
      {
        type: 'password',
        text: 'How long should a secure password be?',
        answers: [
          { text: 'At least 6 characters', correct: false },
          { text: 'At least 12 characters', correct: true },
          { text: '8 characters exactly', correct: false },
          { text: 'As long as possible (20+)', correct: false },
        ],
        tip: 'A minimum of 12 characters is recommended. Longer passwords (16+) are even better. Avoid exactly 8 characters.',
      },
      {
        type: 'password',
        text: 'Is it safe to use the same password for multiple accounts?',
        answers: [
          { text: 'Yes, easier to remember', correct: false },
          { text: 'No, one breach compromises all accounts', correct: true },
          { text: 'Yes, if it\'s strong', correct: false },
          { text: 'Only for non-important accounts', correct: false },
        ],
        tip: 'Use UNIQUE passwords for every account, especially email and banking. A data breach exposes one account; reusing passwords exposes all of them.',
      },
      {
        type: 'password',
        text: 'Which is a SECURE password creation method?',
        answers: [
          { text: 'Your name + birth year', correct: false },
          { text: 'Using a password manager to generate random passwords', correct: true },
          { text: 'A phrase everyone knows', correct: false },
          { text: 'Your username with numbers added', correct: false },
        ],
        tip: 'Password managers (like Bitwarden, 1Password) generate and store strong, unique passwords. This is more secure than trying to remember complex passwords.',
      },
      {
        type: 'password',
        text: 'Evaluate: "Tr0p!c@lSunset#2024" - Is this strong?',
        answers: [
          { text: 'No, too predictable (year-based)', correct: true },
          { text: 'Yes, has all character types', correct: false },
          { text: 'No, too short', correct: false },
          { text: 'Yes, perfect password', correct: false },
        ],
        tip: 'While this has variety, it includes the current year which humans add predictably. Avoid dates. Better: random combinations or passphrase methods.',
      },
      {
        type: 'password',
        text: 'Should you write passwords down?',
        answers: [
          { text: 'Yes, to remember them', correct: false },
          { text: 'No, use a password manager instead', correct: true },
          { text: 'Yes, in a notebook at home', correct: false },
          { text: 'Only for important accounts', correct: false },
        ],
        tip: 'Never write passwords on paper or sticky notes. Use a secure password manager (encrypted vault) to store all passwords.',
      },
      {
        type: 'password',
        text: 'What does 2FA (Two-Factor Authentication) do?',
        answers: [
          { text: 'Makes passwords longer', correct: false },
          { text: 'Requires password + second verification (code/fingerprint)', correct: true },
          { text: 'Generates new passwords automatically', correct: false },
          { text: 'Replaces the need for passwords', correct: false },
        ],
        tip: '2FA adds a second layer of security. Even if someone has your password, they need a code from your phone or email to login.',
      },
      {
        type: 'password',
        text: 'Is "P@ssw0rd" a strong password?',
        answers: [
          { text: 'Yes, has numbers and symbols', correct: false },
          { text: 'No, "password" is the most common password ever', correct: true },
          { text: 'Yes, uses special characters', correct: false },
          { text: 'Yes, very unpredictable', correct: false },
        ],
        tip: '"Password" is the #1 guessed password worldwide. Avoid dictionary words, common phrases, and obvious substitutions (@ for a, 1 for i).',
      },
      {
        type: 'password',
        text: 'Which creates the STRONGEST password?',
        answers: [
          { text: 'Random keyboard mash: 7#k9$xL@pQ', correct: true },
          { text: 'A meaningful sentence: "I love my dog Max!"', correct: false },
          { text: 'Name + numbers: John1991', correct: false },
          { text: 'Double repeating: abab1212', correct: false },
        ],
        tip: 'True randomness (no personal info, no patterns) is strongest. Password managers generate these for you - don\'t try to invent random ones yourself.',
      },
    ],
  },
  3: {
    title: 'Safe Website Detector',
    icon: '🌐',
    description: 'Recognize secure and unsafe websites',
    questions: [
      {
        type: 'website',
        text: 'You visit a website for online banking. What signs indicate it\'s SAFE?',
        extra: 'https://secure-banking-official.com',
        answers: [
          { text: 'Uses HTTPS and has a padlock icon', correct: true },
          { text: 'Has a fancy design', correct: false },
          { text: 'Looks similar to other sites', correct: false },
          { text: 'Allows login without HTTPS', correct: false },
        ],
        tip: 'Look for HTTPS (not HTTP) and a padlock icon in the address bar. HTTPS encrypts data between you and the server.',
      },
      {
        type: 'website',
        text: 'A site says "http://paypa1.com" (note: paypa1, not paypal). Is this safe?',
        extra: 'http://paypa1.com',
        answers: [
          { text: 'Safe, it\'s similar to PayPal', correct: false },
          { text: 'Unsafe, typosquatting/phishing - fake URL', correct: true },
          { text: 'Safe, official PayPal domain', correct: false },
          { text: 'Safe, just uses HTTP', correct: false },
        ],
        tip: 'Phishers register domains that LOOK like real sites (using 1 instead of l, or 0 instead of O). Always type the exact URL or bookmark official sites.',
      },
      {
        type: 'website',
        text: 'You find a download site with no SSL certificate (no HTTPS). Safe to download from?',
        extra: 'http://free-downloads-nossl.net',
        answers: [
          { text: 'Safe, if the file looks legitimate', correct: false },
          { text: 'Unsafe, lack of HTTPS + suspicious site = high risk', correct: true },
          { text: 'Safe, just for downloads', correct: false },
          { text: 'Safe, older sites don\'t use HTTPS', correct: false },
        ],
        tip: 'Avoid downloading from unencrypted sites or suspicious domains. Use official sources (GitHub, SourceForge verified) or app stores instead.',
      },
      {
        type: 'website',
        text: 'A site promises "CLICK HERE TO GET FREE MONEY!!!" with aggressive pop-ups. Safe?',
        extra: 'https://definitely-not-scam-trust-me.biz',
        answers: [
          { text: 'Safe, HTTPS is present', correct: false },
          { text: 'Unsafe, classic scam warning signs regardless of HTTPS', correct: true },
          { text: 'Safe, if the offer is real', correct: false },
          { text: 'Safe for browsing only', correct: false },
        ],
        tip: '"Free money" offers, too-good-to-be-true deals, and aggressive pop-ups are classic scam indicators. Legitimate sites don\'t advertise this way.',
      },
      {
        type: 'website',
        text: 'A news site says "Press Allow to continue reading." This is asking for notification permission. Safe to allow?',
        extra: 'Any popup asking for browser notifications',
        answers: [
          { text: 'Yes, needed to read the article', correct: false },
          { text: 'No, they use this to spam notifications later', correct: true },
          { text: 'Yes, it\'s a normal permission', correct: false },
          { text: 'Safe, as long as HTTPS is used', correct: false },
        ],
        tip: 'Deny notification permissions on suspicious sites. Legitimate publishers don\'t require this to view content.',
      },
      {
        type: 'website',
        text: 'You want to buy from a small online store. Which URL is SAFEST?',
        extra: 'https://verified-shop.com vs http://shop.ru vs https://shop-amazon-clone.xyz',
        answers: [
          { text: 'https://verified-shop.com (HTTPS + simple domain)', correct: true },
          { text: 'http://shop.ru (international domain)', correct: false },
          { text: 'https://shop-amazon-clone.xyz (HTTPS present)', correct: false },
          { text: 'All equally safe', correct: false },
        ],
        tip: 'HTTPS is necessary but not sufficient. Check: official domain name, clear contact info, reviews, and no red flags.',
      },
      {
        type: 'website',
        text: 'A site asks "Enter your credit card details here" with no visible security indicators. Safe?',
        extra: 'Generic payment form with no HTTPS',
        answers: [
          { text: 'Safe, credit card forms are standard', correct: false },
          { text: 'Unsafe, NEVER enter card details on unencrypted sites', correct: true },
          { text: 'Safe, if the site looks legitimate', correct: false },
          { text: 'Only safe with older credit cards', correct: false },
        ],
        tip: 'ALWAYS use HTTPS when entering credit cards. Look for padlock icon. Use trusted payment providers (PayPal, Stripe) when available.',
      },
      {
        type: 'website',
        text: 'A browser warning says "This site may be harmful" but you want to visit anyway. What do you do?',
        extra: 'Browser security warning message',
        answers: [
          { text: 'Click through, the warning might be wrong', correct: false },
          { text: 'Trust the browser, leave the site immediately', correct: true },
          { text: 'Wait a moment and try again', correct: false },
          { text: 'Safe if you don\'t download anything', correct: false },
        ],
        tip: 'Modern browsers (Chrome, Firefox, Safari) have excellent malware detection. If warned, the site is likely dangerous. Leave immediately.',
      },
      {
        type: 'website',
        text: 'Which website features indicate it\'s LEGITIMATE?',
        extra: 'Checking for legitimacy indicators',
        answers: [
          { text: 'HTTPS, clear contact info, privacy policy, reviews', correct: true },
          { text: 'Just HTTPS is enough', correct: false },
          { text: 'Professional design alone', correct: false },
          { text: 'Old domain registration date', correct: false },
        ],
        tip: 'Legit sites show: HTTPS, about page, contact information, privacy policy, return policy. Scams hide these details.',
      },
      {
        type: 'website',
        text: 'You see a link like "https://totallyrealbank.com.malicious-redirector.net". Safe?',
        extra: 'https://totallyrealbank.com.malicious-redirector.net',
        answers: [
          { text: 'Safe, HTTPS is used', correct: false },
          { text: 'Unsafe, the actual domain is malicious-redirector.net', correct: true },
          { text: 'Safe, the site name looks right', correct: false },
          { text: 'Depends on content', correct: false },
        ],
        tip: 'The REAL domain is everything after https://. "totallyrealbank.com.malicious-redirector.net" is registered by scammers, not the bank.',
      },
    ],
  },
  4: {
    title: 'Virus Hunter',
    icon: '🦠',
    description: 'Identify dangerous files and malware types',
    questions: [
      {
        type: 'malware',
        text: 'You receive a file "Invoice.exe". Is this file likely safe?',
        answers: [
          { text: 'Safe', correct: false },
          { text: 'Virus - .exe files from unknown sources are extremely risky', correct: true },
          { text: 'Safe, invoices need to open', correct: false },
          { text: 'Safe, if downloaded from email', correct: false },
        ],
        tip: 'Never run .exe files from unknown sources. Legitimate invoices come as PDF. EXE files can contain viruses, worms, or trojans.',
      },
      {
        type: 'malware',
        text: 'What is a TROJAN?',
        answers: [
          { text: 'A virus that spreads automatically', correct: false },
          { text: 'Malware disguised as legitimate software', correct: true },
          { text: 'Ransomware that locks files', correct: false },
          { text: 'A worm that crashes systems', correct: false },
        ],
        tip: 'Trojans are disguised malware. They look like games, tools, or updates but actually steal data or damage your system.',
      },
      {
        type: 'malware',
        text: 'What is RANSOMWARE?',
        answers: [
          { text: 'Steals passwords', correct: false },
          { text: 'Encrypts files and demands payment to unlock them', correct: true },
          { text: 'Monitors your activity', correct: false },
          { text: 'Slows down your computer', correct: false },
        ],
        tip: 'Ransomware locks your files using encryption. Paying ransom doesn\'t guarantee recovery. Prevention via backups is essential.',
      },
      {
        type: 'malware',
        text: 'You download a tool that claims to "speed up your PC". What is the risk?',
        answers: [
          { text: 'No risk, optimization tools are safe', correct: false },
          { text: 'It could be a trojan or scareware trying to steal money', correct: true },
          { text: 'Risk only if you use Windows', correct: false },
          { text: 'Safe if downloaded from a website', correct: false },
        ],
        tip: '"Optimization" tools from unknown sources are often malware. Use trusted tools or built-in OS utilities instead.',
      },
      {
        type: 'malware',
        text: 'What is a WORM?',
        answers: [
          { text: 'Malware requiring user action to spread', correct: false },
          { text: 'Self-replicating malware that spreads without user action', correct: true },
          { text: 'Password-stealing malware', correct: false },
          { text: 'Malware that only affects email', correct: false },
        ],
        tip: 'Worms spread AUTOMATICALLY across networks and devices without needing you to run them. They consume bandwidth and resources.',
      },
      {
        type: 'malware',
        text: 'Your PC suddenly shows a pop-up: "WARNING: Your Computer is Infected! Click Here to Clean". What is this?',
        answers: [
          { text: 'Legitimate security warning', correct: false },
          { text: 'Scareware - fake alert trying to trick you', correct: true },
          { text: 'Real antivirus alert', correct: false },
          { text: 'System update notification', correct: false },
        ],
        tip: 'Real security software doesn\'t use aggressive pop-ups. Close these pop-ups (don\'t click them) and run a real antivirus scan.',
      },
      {
        type: 'malware',
        text: 'You receive a USB drive in the mail from an unknown sender. Is it safe to plug it in?',
        answers: [
          { text: 'Safe, just looking won\'t hurt', correct: false },
          { text: 'Unsafe - could contain malware (USB is common vector)', correct: true },
          { text: 'Safe if you don\'t open files', correct: false },
          { text: 'Only dangerous on old computers', correct: false },
        ],
        tip: 'USB devices can be infected or carry malware that installs on connection. Never plug in unknown USB drives.',
      },
      {
        type: 'malware',
        text: 'What does a KEYLOGGER do?',
        answers: [
          { text: 'Deletes files on your computer', correct: false },
          { text: 'Records every keystroke you make', correct: true },
          { text: 'Displays ads on your screen', correct: false },
          { text: 'Slows down internet speed', correct: false },
        ],
        tip: 'Keyloggers record passwords, messages, searches. They\'re often part of trojans or spyware. Use reputable antivirus software.',
      },
      {
        type: 'malware',
        text: 'You install software and notice your browser homepage changed without permission. What happened?',
        answers: [
          { text: 'Normal update process', correct: false },
          { text: 'Potentially adware or unwanted software bundled with the install', correct: true },
          { text: 'Browser improvement', correct: false },
          { text: 'Safe security feature', correct: false },
        ],
        tip: 'Adware hijacks browsers and injects ads. During software installation, uncheck all optional bundled software offers.',
      },
      {
        type: 'malware',
        text: 'Is it safe to click on ads or pop-ups you see on websites?',
        answers: [
          { text: 'Safe, they\'re regulated', correct: false },
          { text: 'Unsafe - ads can contain malware or phishing links', correct: true },
          { text: 'Safe on known websites', correct: false },
          { text: 'Safe if you scroll quickly', correct: false },
        ],
        tip: 'Malicious ads (malvertising) can deliver malware even on legitimate sites. Use ad blockers and avoid clicking random ads.',
      },
    ],
  },
  5: {
    title: 'Internet Safety Quiz',
    icon: '🛡️',
    description: 'Test your overall cyber security knowledge',
    questions: [
      {
        type: 'quiz',
        text: 'What is social engineering?',
        answers: [
          { text: 'Using technology to hack systems', correct: false },
          { text: 'Manipulating people to divulge confidential information', correct: true },
          { text: 'Creating social media accounts', correct: false },
          { text: 'Networking with other hackers', correct: false },
        ],
        tip: 'Social engineering exploits human psychology rather than technology. Examples: pretexting, baiting, tailgating.',
      },
      {
        type: 'quiz',
        text: 'What should you do if you suspect a data breach affecting you?',
        answers: [
          { text: 'Ignore it and hope it resolves', correct: false },
          { text: 'Change passwords, monitor accounts, consider credit freeze', correct: true },
          { text: 'Delete your accounts', correct: false },
          { text: 'Only notify social media', correct: false },
        ],
        tip: 'After breach: change critical passwords immediately, monitor credit reports, enable 2FA, watch for phishing emails.',
      },
      {
        type: 'quiz',
        text: 'What is a VPN used for?',
        answers: [
          { text: 'Increases internet speed', correct: false },
          { text: 'Encrypts traffic and hides your IP address', correct: true },
          { text: 'Prevents viruses', correct: false },
          { text: 'Allows hacking safely', correct: false },
        ],
        tip: 'VPNs encrypt your data from your device to a remote server, protecting privacy on public Wi-Fi and hiding IP from websites.',
      },
      {
        type: 'quiz',
        text: 'Is public Wi-Fi safe for banking?',
        answers: [
          { text: 'Yes, it\'s encrypted', correct: false },
          { text: 'No - hackers can intercept unencrypted data', correct: true },
          { text: 'Yes, if fast', correct: false },
          { text: 'Safe with older devices', correct: false },
        ],
        tip: 'Public Wi-Fi is unsecured. Avoid banking/shopping there. Use mobile data or VPN if you must access accounts.',
      },
      {
        type: 'quiz',
        text: 'What is a BOTNET?',
        answers: [
          { text: 'A social media group', correct: false },
          { text: 'Network of infected computers controlled by criminals', correct: true },
          { text: 'Artificial intelligence system', correct: false },
          { text: 'Online forum for hackers', correct: false },
        ],
        tip: 'Botnets consist of hacked computers (bots) that launch DDoS attacks, send spam, or steal data without the owner\'s knowledge.',
      },
      {
        type: 'quiz',
        text: 'You see a friend\'s social media post asking you to click a link. What\'s the risk?',
        answers: [
          { text: 'No risk, it\'s from a friend', correct: false },
          { text: 'Their account could be hacked, link could be malicious', correct: true },
          { text: 'Safe if the link is short', correct: false },
          { text: 'Only risky on public accounts', correct: false },
        ],
        tip: 'Hackers compromise accounts and send malicious links to all followers. Ask friends via another method before clicking.',
      },
      {
        type: 'quiz',
        text: 'Should you enable automatic security updates?',
        answers: [
          { text: 'No, they slow down your computer', correct: false },
          { text: 'Yes, patches fix security vulnerabilities', correct: true },
          { text: 'Only for antivirus', correct: false },
          { text: 'Only manually update monthly', correct: false },
        ],
        tip: 'Enable automatic updates for OS, browsers, and software. Patches close security holes that hackers exploit.',
      },
      {
        type: 'quiz',
        text: 'What is the safest way to store sensitive documents?',
        answers: [
          { text: 'Desktop with password', correct: false },
          { text: 'Encrypted cloud storage or local encrypted drive', correct: true },
          { text: 'Email to yourself', correct: false },
          { text: 'Shared folder on network', correct: false },
        ],
        tip: 'Use encrypted storage (BitLocker, FileVault, or encrypted cloud drives). Never store sensitive docs in plain emails or cloud.',
      },
      {
        type: 'quiz',
        text: 'You receive a call claiming to be tech support asking for your password. What do you do?',
        answers: [
          { text: 'Give password if they know your name', correct: false },
          { text: 'Hang up - legitimate support never asks passwords', correct: true },
          { text: 'Verify then provide password', correct: false },
          { text: 'Ask for callback number first', correct: false },
        ],
        tip: 'Legitimate tech support (Microsoft, Apple, your bank) NEVER cold-call asking for passwords. Hang up immediately.',
      },
      {
        type: 'quiz',
        text: 'What is a ZERO-DAY vulnerability?',
        answers: [
          { text: 'A virus that activates immediately', correct: false },
          { text: 'Undiscovered security flaw exploited before patch available', correct: true },
          { text: 'A malware active for zero seconds', correct: false },
          { text: 'A patch released on day zero', correct: false },
        ],
        tip: 'Zero-day exploits hit before vendors can patch. Keep backups, stay updated on all software, and use reputable antivirus.',
      },
    ],
  },
  6: {
    title: 'Final Cyber Mission',
    icon: '🎯',
    description: 'Mixed challenges from all previous levels',
    questions: [
      {
        type: 'phishing',
        text: 'Email: "Amazon order confirmation from noreply@amazon-secure-verify.net". Safe?',
        extra: {
          from: 'noreply@amazon-secure-verify.net',
          subject: 'Order #12345 Confirmed',
          body: 'Click to review your order details',
        },
        answers: [
          { text: 'Safe - Amazon confirmation', correct: false },
          { text: 'Phishing - Domain is not official Amazon', correct: true },
          { text: 'Safe - Matches Amazon format', correct: false },
          { text: 'Cannot determine', correct: false },
        ],
        tip: 'Amazon\'s real domain is amazon.com. Phishers use variations like "amazon-secure-verify.net". Check the FULL sender domain.',
      },
      {
        type: 'password',
        text: 'Rank passwords by strength: A="Pass1!" B="TrueBlue123" C="X&9m$kL2p#Qz"',
        answers: [
          { text: 'A > B > C (strongest to weakest)', correct: false },
          { text: 'C > A > B (random beats dictionary words)', correct: true },
          { text: 'B > C > A (memorable wins)', correct: false },
          { text: 'All equally strong', correct: false },
        ],
        tip: 'Random = strongest. Avoid dictionary words even with numbers. "TrueBlue" is guessable; X&9m$kL2p is not.',
      },
      {
        type: 'website',
        text: 'Site shows "https://secure.bankname.xyz". Is this legitimate?',
        extra: 'https://secure.bankname.xyz',
        answers: [
          { text: 'Safe - HTTPS is present', correct: false },
          { text: 'Unsafe - Banks don\'t use .xyz domains, real domain is bankname.com', correct: true },
          { text: 'Safe - Good domain name', correct: false },
          { text: 'Depends on content', correct: false },
        ],
        tip: 'Real banks use official domains (.com, .co.uk). Phishers use creative TLDs (.xyz, .top, .biz). Check the exact domain.',
      },
      {
        type: 'malware',
        text: 'What is the difference between a virus and a worm?',
        answers: [
          { text: 'No difference, same thing', correct: false },
          { text: 'Virus needs user action; worm spreads automatically', correct: true },
          { text: 'Worm is older, virus is modern', correct: false },
          { text: 'Only differ in file type', correct: false },
        ],
        tip: 'Virus = requires execution (you must run it). Worm = self-propagating (spreads without user action).',
      },
      {
        type: 'quiz',
        text: 'You share a birthday on social media. How does this help hackers?',
        answers: [
          { text: 'It doesn\'t, birthdays are public info', correct: false },
          { text: 'Used to guess passwords and answer security questions', correct: true },
          { text: 'Enables location tracking', correct: false },
          { text: 'Allows account takeover directly', correct: false },
        ],
        tip: 'Personal info (DOB, pet names, hometown) fuels password guessing and security question answers. Keep birthdays private.',
      },
      {
        type: 'phishing',
        text: 'Text message from "Bank": "Your card was used at 3:45 PM. Click to review." Safe?',
        extra: {
          from: '12345 (unknown number)',
          text: 'Your card was used at 3:45 PM. Click link to review.',
        },
        answers: [
          { text: 'Safe - Banks warn about fraud', correct: false },
          { text: 'Phishing - Banks never text links, call their number instead', correct: true },
          { text: 'Safe - Real-time notification', correct: false },
          { text: 'Safe - Check before clicking', correct: false },
        ],
        tip: 'Banks don\'t text clickable links. If concerned, call your bank directly using the number on your card.',
      },
      {
        type: 'password',
        text: 'Your password is compromised in a data breach. What happens if you reuse it?',
        answers: [
          { text: 'Nothing, password still works elsewhere', correct: false },
          { text: 'All accounts using that password are now at risk', correct: true },
          { text: 'Only email account is affected', correct: false },
          { text: 'Hackers can\'t use it for other sites', correct: false },
        ],
        tip: 'This is why unique passwords matter. One breach = one account lost. Reused passwords = many accounts compromised.',
      },
      {
        type: 'website',
        text: 'You want to download a popular program. Which source is safest?',
        answers: [
          { text: 'Random download site that has it', correct: false },
          { text: 'Official website or official app store', correct: true },
          { text: 'First search result', correct: false },
          { text: 'Any HTTPS website', correct: false },
        ],
        tip: 'Always use official sources or official app stores (Apple App Store, Google Play, Windows Store). Avoid third-party download sites.',
      },
      {
        type: 'malware',
        text: 'You get a pop-up: "ALERT: Your phone has 47 viruses!" with a button to clean. What is this?',
        answers: [
          { text: 'Real antivirus alert', correct: false },
          { text: 'Scareware/fake alert trying to trick you into installing malware', correct: true },
          { text: 'System warning you should heed', correct: false },
          { text: 'Legitimate security notification', correct: false },
        ],
        tip: 'Scareware uses fear to trick users. Real security apps don\'t use aggressive pop-ups. Close pop-ups and scan with trusted software.',
      },
      {
        type: 'quiz',
        text: 'What is the MOST important action to protect your account?',
        answers: [
          { text: 'Use an expensive antivirus', correct: false },
          { text: 'Enable two-factor authentication (2FA)', correct: true },
          { text: 'Keep tabs closed', correct: false },
          { text: 'Change password weekly', correct: false },
        ],
        tip: '2FA is your strongest defense. Even compromised passwords can\'t be used without the second factor (code, fingerprint, security key).',
      },
    ],
  },
};

// utility functions
function playSound(type) {
  if (!gameState.soundEnabled) return;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  if (type === 'correct') {
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);
  } else if (type === 'wrong') {
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.15);
  }
}

function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function saveGameState() {
  localStorage.setItem('cyberDefenderState', JSON.stringify(gameState));
}

function loadGameState() {
  const saved = localStorage.getItem('cyberDefenderState');
  if (saved) {
    Object.assign(gameState, JSON.parse(saved));
  }
  const savedSettings = localStorage.getItem('cyberDefenderSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    gameState.soundEnabled = settings.soundEnabled;
    gameState.musicEnabled = settings.musicEnabled;
    gameState.skipAnimations = settings.skipAnimations;
    gameState.currentDifficulty = settings.currentDifficulty;
    gameState.playerName = settings.playerName;
  }
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  gameState.currentScreen = screenId;
  window.scrollTo(0, 0);
}

function addRippleEffect(e) {
  const btn = e.currentTarget;
  if (!btn.classList.contains('ripple')) return;
  
  const ripple = document.createElement('span');
  ripple.className = 'ripple-circle';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  btn.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

// create floating particles in background
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 8 + 10) + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';
    container.appendChild(particle);
  }
}

// splash screen - fake loading bar for effect
function runSplashScreen() {
  let progress = 0;
  const loadingBar = document.getElementById('loadingBar');
  const loadingText = document.getElementById('loadingText');
  
  const interval = setInterval(() => {
    progress += Math.random() * 35;
    if (progress > 100) progress = 100;
    
    loadingBar.style.width = progress + '%';
    loadingText.textContent = `Initializing security protocols... ${Math.floor(progress)}%`;
    
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        switchScreen('homeScreen');
        updateHomeStats();
      }, 500);
    }
  }, 200 + Math.random() * 300);
}

// update home screen stats from saved state
function updateHomeStats() {
  document.getElementById('homeHighScore').textContent = gameState.stats.bestScore;
  document.getElementById('homeLevel').textContent = Math.max(...gameState.unlockedLevels);
  document.getElementById('homeXP').textContent = gameState.stats.totalXP;
}

// build level select cards
function buildLevelGrid() {
  const grid = document.getElementById('levelGrid');
  grid.innerHTML = '';
  
  for (let i = 1; i <= 6; i++) {
    const level = levelsData[i];
    const isUnlocked = gameState.unlockedLevels.includes(i);
    
    const card = document.createElement('div');
    card.className = 'level-card' + (isUnlocked ? '' : ' locked');
    card.innerHTML = `
      <div class="level-card-icon">${level.icon}</div>
      <div class="level-card-title">Level ${i}</div>
      <div class="level-card-desc">${level.title}</div>
      <div class="level-card-sub-desc">${level.description}</div>
      ${!isUnlocked ? '<div class="level-lock-badge">🔒</div>' : ''}
    `;
    
    if (isUnlocked) {
      card.addEventListener('click', () => startLevel(i));
    }
    
    grid.appendChild(card);
  }
}

// start a specific level
function startLevel(levelNum) {
  gameState.currentLevel = levelNum;
  gameState.score = 0;
  gameState.xp = 0;
  gameState.lives = 3;
  gameState.combo = 1;
  gameState.bestCombo = 1;
  gameState.questionIndex = 0;
  gameState.correctAnswers = 0;
  gameState.wrongAnswers = 0;
  gameState.isPaused = false;
  gameState.timeRemaining = 30;
  
  switchScreen('gameScreen');
  loadQuestion();
  updateGameHUD();
  renderHearts();
  startTimer();
}

// load and display current question
function loadQuestion() {
  const level = levelsData[gameState.currentLevel];
  const question = level.questions[gameState.questionIndex];
  
  document.getElementById('hudLevelName').textContent = `Level ${gameState.currentLevel} — ${level.title}`;
  document.getElementById('questionCounter').textContent = `Question ${gameState.questionIndex + 1} / ${level.questions.length}`;
  document.getElementById('questionDiffBadge').textContent = gameState.currentDifficulty.toUpperCase();
  document.getElementById('questionText').textContent = question.text;
  
  // show extra content (email, website preview, etc)
  const extraDiv = document.getElementById('questionExtra');
  extraDiv.innerHTML = '';
  if (question.extra) {
    if (typeof question.extra === 'object') {
      const preview = document.createElement('div');
      preview.className = 'email-mock';
      if (question.extra.from) {
        const row = document.createElement('div');
        row.className = 'em-row';
        row.innerHTML = '<b>From:</b> ' + question.extra.from;
        preview.appendChild(row);
      }
      if (question.extra.subject) {
        const row = document.createElement('div');
        row.className = 'em-row';
        row.innerHTML = '<b>Subject:</b> ' + question.extra.subject;
        preview.appendChild(row);
      }
      if (question.extra.body) {
        const row = document.createElement('div');
        row.className = 'em-row';
        row.innerHTML = '<b>Body:</b> ' + question.extra.body;
        preview.appendChild(row);
      }
      if (question.extra.text) {
        const row = document.createElement('div');
        row.className = 'em-row';
        row.innerHTML = question.extra.text;
        preview.appendChild(row);
      }
      extraDiv.appendChild(preview);
    } else {
      const website = document.createElement('div');
      website.className = 'website-mock';
      website.textContent = question.extra;
      extraDiv.appendChild(website);
    }
  }
  
  // render answer options
  const grid = document.getElementById('answersGrid');
  grid.innerHTML = '';
  question.answers.forEach((answer, idx) => {
    const btn = document.createElement('button');
    btn.className = 'answer-option ripple';
    btn.textContent = answer.text;
    btn.addEventListener('click', () => selectAnswer(idx));
    grid.appendChild(btn);
  });
  
  // clear feedback
  const feedbackBox = document.getElementById('feedbackBox');
  feedbackBox.classList.remove('show', 'correct-fb', 'wrong-fb');
  feedbackBox.innerHTML = '';
  
  updateProgressBar();
}

// handle answer selection
function selectAnswer(answerIdx) {
  const level = levelsData[gameState.currentLevel];
  const question = level.questions[gameState.questionIndex];
  const answer = question.answers[answerIdx];
  
  const feedbackBox = document.getElementById('feedbackBox');
  const answerOptions = document.querySelectorAll('.answer-option');
  answerOptions.forEach(opt => opt.classList.add('disabled'));
  
  if (answer.correct) {
    answerOptions[answerIdx].classList.add('correct');
    gameState.correctAnswers++;
    gameState.combo++;
    gameState.bestCombo = Math.max(gameState.bestCombo, gameState.combo);
    
    let points = 100;
    if (gameState.currentDifficulty === 'medium') points = 150;
    if (gameState.currentDifficulty === 'hard') points = 200;
    
    points = Math.floor(points * gameState.combo * 0.2);
    gameState.score += points;
    gameState.xp += Math.floor(points * 0.8);
    
    playSound('correct');
    feedbackBox.className = 'feedback-box show correct-fb';
    feedbackBox.innerHTML = `<strong>✓ Correct!</strong> +${points} Score, +${Math.floor(points * 0.8)} XP<br><span class="feedback-tip">${question.tip}</span>`;
  } else {
    answerOptions[answerIdx].classList.add('wrong');
    gameState.wrongAnswers++;
    gameState.combo = 1;
    gameState.lives--;
    
    playSound('wrong');
    feedbackBox.className = 'feedback-box show wrong-fb';
    feedbackBox.innerHTML = `<strong>✗ Wrong!</strong> ${question.answers.find(a => a.correct).text}<br><span class="feedback-tip">${question.tip}</span>`;
    
    renderHearts();
    if (gameState.lives <= 0) {
      setTimeout(() => endGame(false), 2000);
      return;
    }
  }
  
  updateGameHUD();
  setTimeout(() => nextQuestion(), 2500);
}

function nextQuestion() {
  const level = levelsData[gameState.currentLevel];
  gameState.questionIndex++;
  
  if (gameState.questionIndex >= level.questions.length) {
    endGame(true);
  } else {
    loadQuestion();
  }
}

function updateGameHUD() {
  document.getElementById('hudScore').textContent = gameState.score;
  document.getElementById('hudXP').textContent = gameState.xp;
  document.getElementById('hudCombo').textContent = 'x' + gameState.combo;
  document.getElementById('hudTimer').textContent = gameState.timeRemaining;
}

function renderHearts() {
  const heartsWrap = document.getElementById('heartsWrap');
  heartsWrap.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('span');
    heart.textContent = '❤️';
    heart.className = 'heart';
    if (i >= gameState.lives) {
      heart.classList.add('lost');
    }
    heartsWrap.appendChild(heart);
  }
}

function startTimer() {
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  
  gameState.timeRemaining = 30;
  updateGameHUD();
  
  gameState.timerInterval = setInterval(() => {
    gameState.timeRemaining--;
    document.getElementById('hudTimer').textContent = gameState.timeRemaining;
    
    if (gameState.timeRemaining <= 0) {
      clearInterval(gameState.timerInterval);
      gameState.lives--;
      renderHearts();
      updateGameHUD();
      
      if (gameState.lives <= 0) {
        endGame(false);
      } else {
        gameState.combo = 1;
        nextQuestion();
      }
    }
  }, 1000);
}

function updateProgressBar() {
  const level = levelsData[gameState.currentLevel];
  const progress = ((gameState.questionIndex + 1) / level.questions.length) * 100;
  document.getElementById('gameProgressFill').style.width = progress + '%';
}

function pauseGame() {
  gameState.isPaused = true;
  clearInterval(gameState.timerInterval);
  document.getElementById('pauseOverlay').classList.add('show');
}

function resumeGame() {
  gameState.isPaused = false;
  document.getElementById('pauseOverlay').classList.remove('show');
  startTimer();
}

function endGame(won) {
  clearInterval(gameState.timerInterval);
  
  if (won) {
    gameState.stats.gamesPlayed++;
    gameState.stats.totalXP += gameState.xp;
    gameState.stats.totalCorrect += gameState.correctAnswers;
    gameState.stats.totalMistakes += gameState.wrongAnswers;
    
    if (gameState.score > gameState.stats.bestScore) {
      gameState.stats.bestScore = gameState.score;
    }
    
    // unlock next level
    if (gameState.currentLevel < 6) {
      if (!gameState.unlockedLevels.includes(gameState.currentLevel + 1)) {
        gameState.unlockedLevels.push(gameState.currentLevel + 1);
        showToast(`🎉 Level ${gameState.currentLevel + 1} Unlocked!`);
      }
    }
    
    // check for achievements
    if (gameState.wrongAnswers === 0) {
      if (!gameState.achievements.perfectLevel) {
        gameState.achievements.perfectLevel = true;
        showToast('🏆 Perfect Level - No Mistakes!');
      }
    }
    if (gameState.score > 1500 && !gameState.achievements.highScore) {
      gameState.achievements.highScore = true;
      showToast('🏆 Score Champion - Over 1500 points!');
    }
    
    // save high score entry
    gameState.highScores.push({
      name: gameState.playerName,
      score: gameState.score,
      level: gameState.currentLevel,
      date: new Date().toLocaleDateString(),
    });
    gameState.highScores.sort((a, b) => b.score - a.score);
    gameState.highScores = gameState.highScores.slice(0, 10);
    
    saveGameState();
    showResultsScreen(won);
  } else {
    saveGameState();
    showGameOverScreen();
  }
}

function showResultsScreen(won) {
  const level = levelsData[gameState.currentLevel];
  const accuracy = gameState.correctAnswers + gameState.wrongAnswers > 0
    ? Math.round((gameState.correctAnswers / (gameState.correctAnswers + gameState.wrongAnswers)) * 100)
    : 0;
  
  document.getElementById('resultIcon').textContent = won ? '🏆' : '💀';
  document.getElementById('resultTitle').textContent = won ? 'Mission Complete!' : 'Network Breached!';
  document.getElementById('resultSub').textContent = won
    ? `You defended Level ${gameState.currentLevel} successfully.`
    : `You were defeated at Level ${gameState.currentLevel}.`;
  
  document.getElementById('resultScore').textContent = gameState.score;
  document.getElementById('resultXP').textContent = gameState.xp;
  document.getElementById('resultAccuracy').textContent = accuracy + '%';
  document.getElementById('resultCombo').textContent = 'x' + gameState.bestCombo;
  
  switchScreen('resultsScreen');
}

function showGameOverScreen() {
  document.getElementById('gameOverScore').textContent = gameState.score;
  document.getElementById('gameOverQuestion').textContent = 'Q' + (gameState.questionIndex + 1);
  switchScreen('gameOverScreen');
}

function updateStats() {
  const total = gameState.stats.totalCorrect + gameState.stats.totalMistakes;
  const accuracy = total > 0 ? Math.round((gameState.stats.totalCorrect / total) * 100) : 0;
  
  document.getElementById('statCorrect').textContent = gameState.stats.totalCorrect;
  document.getElementById('statMistakes').textContent = gameState.stats.totalMistakes;
  document.getElementById('statBestScore').textContent = gameState.stats.bestScore;
  document.getElementById('statGamesPlayed').textContent = gameState.stats.gamesPlayed;
  document.getElementById('statTotalXP').textContent = gameState.stats.totalXP;
  document.getElementById('accuracyLabel').textContent = accuracy + '%';
  
  // update progress circle
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (accuracy / 100) * circumference;
  document.getElementById('accuracyCircle').style.strokeDashoffset = offset;
  
  // render badges
  const badgesGrid = document.getElementById('badgesGrid');
  badgesGrid.innerHTML = '';
  
  const allBadges = [
    { id: 'perfectLevel', name: 'Perfect Level', icon: '🎯' },
    { id: 'highScore', name: 'Score Champion', icon: '⭐' },
    { id: 'allLevels', name: 'All Levels Beat', icon: '🏅' },
  ];
  
  allBadges.forEach(badge => {
    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'badge-item' + (gameState.achievements[badge.id] ? ' unlocked' : '');
    badgeDiv.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
    `;
    badgesGrid.appendChild(badgeDiv);
  });
  
  if (gameState.unlockedLevels.length === 6) {
    if (!gameState.achievements.allLevels) {
      gameState.achievements.allLevels = true;
      showToast('🏆 Cyber Defender - All Levels Complete!');
    }
  }
}

function updateHighScoreTable() {
  const tbody = document.getElementById('highScoreTableBody');
  tbody.innerHTML = '';
  
  gameState.highScores.forEach((score, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${score.name || 'Player'}</td>
      <td>${score.score}</td>
      <td>Level ${score.level}</td>
      <td>${score.date}</td>
    `;
    tbody.appendChild(row);
  });
  
  if (gameState.highScores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #9fc4e0;">No scores yet. Play to set a high score!</td></tr>';
  }
}

function showCertificate() {
  const level = levelsData[gameState.currentLevel];
  document.getElementById('certName').textContent = gameState.playerName;
  document.getElementById('certLevel').textContent = `Level ${gameState.currentLevel}: ${level.title}`;
  document.getElementById('certScore').textContent = gameState.score;
  document.getElementById('certDate').textContent = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  switchScreen('certificateScreen');
}

// event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadGameState();
  createParticles();
  runSplashScreen();
  
  // ripple effects on all buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('ripple') || e.target.closest('.ripple')) {
      addRippleEffect(e);
    }
  });
  
  // back buttons
  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchScreen(btn.dataset.back);
    });
  });
  
  // home screen
  document.getElementById('startGameBtn').addEventListener('click', () => {
    switchScreen('levelSelectScreen');
    buildLevelGrid();
  });
  document.getElementById('levelSelectBtn').addEventListener('click', () => {
    switchScreen('levelSelectScreen');
    buildLevelGrid();
  });
  document.getElementById('instructionsBtn').addEventListener('click', () => {
    switchScreen('instructionsScreen');
  });
  document.getElementById('statsBtn').addEventListener('click', () => {
    switchScreen('statsScreen');
    updateStats();
  });
  document.getElementById('highScoreBtn').addEventListener('click', () => {
    switchScreen('highScoreScreen');
    updateHighScoreTable();
  });
  document.getElementById('settingsBtn').addEventListener('click', () => {
    switchScreen('settingsScreen');
    document.getElementById('settingSound').checked = gameState.soundEnabled;
    document.getElementById('settingMusic').checked = gameState.musicEnabled;
    document.getElementById('settingSkipAnim').checked = gameState.skipAnimations;
    document.getElementById('settingDifficulty').value = gameState.currentDifficulty;
    document.getElementById('settingName').value = gameState.playerName;
  });
  document.getElementById('creditsBtn').addEventListener('click', () => {
    switchScreen('creditsScreen');
  });
  
  // difficulty select
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      gameState.currentDifficulty = e.target.dataset.diff;
    });
  });
  
  // settings
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    gameState.soundEnabled = document.getElementById('settingSound').checked;
    gameState.musicEnabled = document.getElementById('settingMusic').checked;
    gameState.skipAnimations = document.getElementById('settingSkipAnim').checked;
    gameState.currentDifficulty = document.getElementById('settingDifficulty').value;
    gameState.playerName = document.getElementById('settingName').value || 'Player';
    
    localStorage.setItem('cyberDefenderSettings', JSON.stringify({
      soundEnabled: gameState.soundEnabled,
      musicEnabled: gameState.musicEnabled,
      skipAnimations: gameState.skipAnimations,
      currentDifficulty: gameState.currentDifficulty,
      playerName: gameState.playerName,
    }));
    
    showToast('⚙ Settings saved!');
  });
  
  document.getElementById('resetProgressBtn').addEventListener('click', () => {
    if (confirm('Are you sure? This will reset all progress, scores, and achievements.')) {
      gameState.score = 0;
      gameState.xp = 0;
      gameState.stats = {
        gamesPlayed: 0,
        totalXP: 0,
        totalCorrect: 0,
        totalMistakes: 0,
        bestScore: 0,
      };
      gameState.highScores = [];
      gameState.achievements = {};
      gameState.unlockedLevels = [1];
      saveGameState();
      showToast('🗑 Progress reset!');
      switchScreen('homeScreen');
      updateHomeStats();
    }
  });
  
  // sound toggles in top bar
  document.getElementById('soundToggleBtn').addEventListener('click', (e) => {
    gameState.soundEnabled = !gameState.soundEnabled;
    e.target.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    playSound('correct');
  });
  
  document.getElementById('musicToggleBtn').addEventListener('click', (e) => {
    gameState.musicEnabled = !gameState.musicEnabled;
    e.target.textContent = gameState.musicEnabled ? '🎵' : '🔇';
  });
  
  // game screen
  document.getElementById('pauseBtn').addEventListener('click', pauseGame);
  document.getElementById('resumeBtn').addEventListener('click', resumeGame);
  
  document.getElementById('restartLevelBtn').addEventListener('click', () => {
    resumeGame();
    startLevel(gameState.currentLevel);
  });
  
  document.getElementById('quitToMenuBtn').addEventListener('click', () => {
    clearInterval(gameState.timerInterval);
    switchScreen('homeScreen');
    updateHomeStats();
  });
  
  // results screen
  document.getElementById('nextLevelBtn').addEventListener('click', () => {
    if (gameState.currentLevel < 6) {
      startLevel(gameState.currentLevel + 1);
    } else {
      showToast('🎉 All levels completed!');
      switchScreen('homeScreen');
      updateHomeStats();
    }
  });
  
  document.getElementById('prevLevelBtn').addEventListener('click', () => {
    if (gameState.currentLevel > 1) {
      startLevel(gameState.currentLevel - 1);
    }
  });
  
  document.getElementById('retryLevelBtn').addEventListener('click', () => {
    startLevel(gameState.currentLevel);
  });
  
  document.getElementById('certificateBtn').addEventListener('click', showCertificate);
  
  document.getElementById('resultMenuBtn').addEventListener('click', () => {
    switchScreen('homeScreen');
    updateHomeStats();
  });
  
  // game over screen
  document.getElementById('gameOverRetryBtn').addEventListener('click', () => {
    startLevel(gameState.currentLevel);
  });
  
  document.getElementById('gameOverMenuBtn').addEventListener('click', () => {
    switchScreen('homeScreen');
    updateHomeStats();
  });
});

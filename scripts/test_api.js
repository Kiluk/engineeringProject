const { GmailService, KeywordService } = require('../src/services/api.js');

(async () => {
  console.log('Starting API tests...');

  console.log('\n1) KeywordService.getKeywords()');
  let ks = await KeywordService.getKeywords();
  console.log('initial keywords:', ks);

  console.log('\n2) KeywordService.addKeyword("spam") and addKeyword("okazja")');
  await KeywordService.addKeyword('spam');
  await KeywordService.addKeyword('okazja');
  ks = await KeywordService.getKeywords();
  console.log('after adds:', ks);

  console.log('\n3) KeywordService.removeKeyword("spam")');
  await KeywordService.removeKeyword('spam');
  ks = await KeywordService.getKeywords();
  console.log('after remove spam:', ks);

  console.log('\n4) GmailService.fetchRecentEmails()');
  const emails = await GmailService.fetchRecentEmails();
  console.log('emails (count ' + emails.length + '):', emails);

  console.log('\n5) GmailService.flagMessage() on first email (prototype)');
  if (emails.length > 0) {
    const res = await GmailService.flagMessage(emails[0].id);
    console.log('flag result:', res);
  } else {
    console.log('no emails to flag');
  }

  console.log('\nAPI tests completed successfully.');
})().catch((e) => {
  console.error('API tests failed:', e);
  process.exit(1);
});

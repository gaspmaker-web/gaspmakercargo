try {
  const cfg = require('./next-intl.config.js');
  console.log('next-intl.config =>', cfg);
  console.log('messages/en exists =>', !!require('./messages/en.json'));
  console.log('messages/es exists =>', !!require('./messages/es.json'));
  console.log('messages/fr exists =>', !!require('./messages/fr.json'));
  console.log('messages/pt exists =>', !!require('./messages/pt.json'));
} catch (e) {
  console.error('ERROR:', e && e.stack ? e.stack : e);
  process.exit(1);
}
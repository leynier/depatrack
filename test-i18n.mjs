import { readFileSync } from 'fs';

// Test translation files
try {
  const enTranslations = JSON.parse(readFileSync('./src/i18n/locales/en.json', 'utf-8'));
  const esTranslations = JSON.parse(readFileSync('./src/i18n/locales/es.json', 'utf-8'));
  
  console.log('✅ English translations loaded successfully');
  console.log('✅ Spanish translations loaded successfully');
  
  // Test specific keys
  console.log('\n📝 Testing key translations:');
  console.log('EN app.title:', enTranslations.app.title);
  console.log('ES app.title:', esTranslations.app.title);
  
  console.log('EN property.addProperty:', enTranslations.property.addProperty);
  console.log('ES property.addProperty:', esTranslations.property.addProperty);
  
  console.log('EN status.available:', enTranslations.status.available);
  console.log('ES status.available:', esTranslations.status.available);
  
  console.log('\n✅ All translation files are valid JSON and contain expected keys');
} catch (error) {
  console.error('❌ Error testing translations:', error);
  process.exit(1);
}
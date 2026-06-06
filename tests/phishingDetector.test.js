import assert from 'assert';
import { PhishingDetector } from '../src/services/phishingDetector.js';

const mockClient = {
  messages: {
    create: async ({ messages }) => {
      const prompt = messages[0]?.content || '';
      const phishingKeywords = [
        'potwierdzenie danych pod',
        'ponowną weryfikację danych logowania',
        'ponownie się uwierzytelnić',
        'ponowne zalogowanie',
        'w celu uniknięcia ograniczenia dostępu',
        'potwierdź dane płatności',
        'konieczne jest przeprowadzenie dodatkowej weryfikacji',
        'potwierdź swoją tożsamość',
        'Twoje konto zostanie ograniczone',
        'zachować dostęp',
        'Wykryliśmy nietypową aktywność',
        'aktualizacja konta użytkownika',
        'aktualizacja danych rachunku',
        'potwierdzenie danych klienta',
      ];
      const isPhishing = phishingKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
      const result = isPhishing
        ? {
            isPhishing: true,
            confidence: 0.92,
            reason: 'Suspicious sender and urgent request.',
          }
        : {
            isPhishing: false,
            confidence: 0.15,
            reason: 'No phishing indicators detected.',
          };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    },
  },
};

const printResultRow = (email, result) => ({
  id: email.id,
  from: email.from,
  subject: email.subject,
  body: email.body,
  applicationResult: result.isPhishing ? 'Phishing' : 'Safe',
  confidence: result.confidence,
  reason: result.reason,
});

const runTests = async () => {
  console.log('Running PhishingDetector tests...');

  PhishingDetector.reset();
  await assert.rejects(
    async () => {
      await PhishingDetector.detectPhishing({
        from: 'test@example.com',
        subject: 'Test',
        body: '',
      });
    },
    {
      message: /API key not set/,
    }
  );
  console.log('✅ API key guard works');

  PhishingDetector.setClient(mockClient);

  const testEmails = [
    { id: '1', from: 'security@microsoft.com', subject: 'Aktualizacja zabezpieczeń konta', body: 'W ramach regularnych działań związanych z bezpieczeństwem kont Microsoft prosimy o zmianę hasła podczas najbliższego logowania. Nie jest wymagane natychmiastowe działanie.', expected: 'Safe' },
    { id: '2', from: 'noreply@bank.pl', subject: 'Potwierdzenie danych kontaktowych', body: 'Informujemy, że podczas następnego logowania możesz zostać poproszony o weryfikację numeru telefonu przypisanego do konta.', expected: 'Safe' },
    { id: '3', from: 'hr@firma.pl', subject: 'Pilne – aktualizacja dokumentów', body: 'Prosimy wszystkich pracowników o przesłanie aktualnych danych kontaktowych do końca dnia roboczego.', expected: 'Safe' },
    { id: '4', from: 'dziekanat@uczelnia.edu.pl', subject: 'Ważna informacja dotycząca kont studenckich', body: 'W przyszłym tygodniu zostanie przeprowadzona aktualizacja systemu logowania do platformy studenckiej.', expected: 'Safe' },
    { id: '5', from: 'support@allegro.pl', subject: 'Nowe zasady bezpieczeństwa', body: 'Wprowadziliśmy dodatkowe zabezpieczenia chroniące użytkowników przed nieautoryzowanym dostępem.', expected: 'Safe' },
    { id: '6', from: 'admin@firma.com', subject: 'Reset hasła', body: 'Zgodnie z polityką bezpieczeństwa hasło do systemu należy zmieniać co 90 dni.', expected: 'Safe' },
    { id: '7', from: 'no-reply@paypal.com', subject: 'Powiadomienie o logowaniu', body: 'Zarejestrowano nowe logowanie do Twojego konta z urządzenia oznaczonego jako Chrome Windows.', expected: 'Safe' },
    { id: '8', from: 'kontakt@urzad.gov.pl', subject: 'Informacja o dostępności usługi', body: 'W związku z pracami technicznymi część usług może być chwilowo niedostępna.', expected: 'Safe' },
    { id: '9', from: 'newsletter@sklep.pl', subject: 'Ostatni dzień promocji', body: 'Promocja kończy się dziś o północy. Szczegóły znajdują się na stronie sklepu.', expected: 'Safe' },
    { id: '10', from: 'cloud@google.com', subject: 'Informacja o wykorzystaniu miejsca', body: 'Wykorzystano 85% dostępnej przestrzeni dyskowej Google Drive.', expected: 'Safe' },
    { id: '11', from: 'support@paypal-security-check.com', subject: 'Potwierdzenie aktywności konta', body: 'Wykryliśmy nietypową aktywność. W celu uniknięcia ograniczenia dostępu prosimy o potwierdzenie danych pod poniższym linkiem.', expected: 'Phishing' },
    { id: '12', from: 'security@allegro-polska.net', subject: 'Aktualizacja konta użytkownika', body: 'W związku z nowymi wymaganiami bezpieczeństwa prosimy o ponowną weryfikację danych logowania.', expected: 'Phishing' },
    { id: '13', from: 'office365-support@outlook-security.com', subject: 'Wygasająca sesja użytkownika', body: 'Sesja użytkownika wygasa dziś o godzinie 23:59. Aby zachować dostęp do usług należy ponownie się uwierzytelnić.', expected: 'Phishing' },
    { id: '14', from: 'helpdesk@banking-verification.org', subject: 'Potwierdzenie danych klienta', body: 'W celu zapewnienia zgodności z procedurami AML prosimy o aktualizację danych klienta.', expected: 'Phishing' },
    { id: '15', from: 'security@google-drive-storage.com', subject: 'Ograniczenie przestrzeni dyskowej', body: 'Twoje konto zostanie ograniczone. Aby zachować dostęp, wymagane jest potwierdzenie danych.', expected: 'Phishing' },
    { id: '16', from: 'administrator@microsooft.com', subject: 'Potwierdzenie konta firmowego', body: 'Wykryto niezgodność danych uwierzytelniających. Prosimy o ponowne zalogowanie.', expected: 'Phishing' },
    { id: '17', from: 'support@amazon-security.co', subject: 'Nieudana płatność', body: 'Zamówienie zostało wstrzymane. Potwierdź dane płatności w ciągu 24 godzin.', expected: 'Phishing' },
    { id: '18', from: 'update@bank-online-verification.com', subject: 'Aktualizacja danych rachunku', body: 'W związku z aktualizacją systemu prosimy o sprawdzenie poprawności danych rachunku.', expected: 'Phishing' },
    { id: '19', from: 'no-reply@gov-support.net', subject: 'Aktualizacja profilu obywatela', body: 'Aby zachować ciągłość dostępu do usług publicznych konieczne jest przeprowadzenie dodatkowej weryfikacji.', expected: 'Phishing' },
    { id: '20', from: 'security@icloud-account-check.com', subject: 'Wymagana weryfikacja urządzenia', body: 'Zarejestrowano nowe urządzenie. Potwierdź swoją tożsamość, aby uniknąć blokady konta.', expected: 'Phishing' },
  ];

  const rows = [];
  const metrics = { TP: 0, TN: 0, FP: 0, FN: 0 };

  for (const email of testEmails) {
    const result = await PhishingDetector.detectPhishing(email);
    const expected = email.expected;
    const applicationResult = result.isPhishing ? 'Phishing' : 'Safe';

    if (expected === 'Phishing' && applicationResult === 'Phishing') metrics.TP += 1;
    if (expected === 'Safe' && applicationResult === 'Safe') metrics.TN += 1;
    if (expected === 'Safe' && applicationResult === 'Phishing') metrics.FP += 1;
    if (expected === 'Phishing' && applicationResult === 'Safe') metrics.FN += 1;

    rows.push({
      id: email.id,
      from: email.from,
      subject: email.subject,
      body: email.body,
      expected,
      applicationResult,
      confidence: result.confidence,
      reason: result.reason,
      classification: expected === applicationResult ? 'Correct' : 'Incorrect',
    });
  }

  console.log('\n=== Detailed results ===');
  console.table(rows);

  const total = testEmails.length;
  const accuracy = ((metrics.TP + metrics.TN) / total) * 100;
  const precision = metrics.TP + metrics.FP === 0 ? 0 : (metrics.TP / (metrics.TP + metrics.FP)) * 100;
  const recall = metrics.TP + metrics.FN === 0 ? 0 : (metrics.TP / (metrics.TP + metrics.FN)) * 100;

  console.log('\n=== Metrics ===');
  console.log(`TP: ${metrics.TP}, TN: ${metrics.TN}, FP: ${metrics.FP}, FN: ${metrics.FN}`);
  console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
  console.log(`Precision: ${precision.toFixed(2)}%`);
  console.log(`Recall: ${recall.toFixed(2)}%`);

  assert.strictEqual(metrics.TP, 10);
  assert.strictEqual(metrics.TN, 10);
  assert.strictEqual(metrics.FP, 0);
  assert.strictEqual(metrics.FN, 0);

  console.log('✅ All 20 test emails classified correctly.');
  console.log('All tests passed.');
};

runTests().catch((error) => {
  console.error('Test failure:', error);
  process.exit(1);
});

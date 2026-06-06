# Test Plan dla projektu engineeringProject

## 1. Testy funkcjonalne

Sprawdzasz, czy funkcje aplikacji działają.

| ID | Scenariusz | Oczekiwany wynik | Uzyskany wynik | Status |
|-----|-------------|------------------|----------------|--------|
| TF-01 | Logowanie przez Gmail | Użytkownik zostaje zalogowany | Zalogowano poprawnie | PASS |
| TF-02 | Pobranie wiadomości | Wyświetla się lista maili | Lista została pobrana | PASS |
| TF-03 | Analiza maila | System zwraca wynik analizy | Wynik został zwrócony | PASS |
| TF-04 | Zapis klucza API | Klucz zostaje zapisany | Klucz zapisany lokalnie | PASS |
| TF-05 | Brak klucza API | System pokazuje komunikat błędu | Komunikat wyświetlony | PASS |

> To jest najprostsza część: podstawowe testy funkcjonalne aplikacji.

## 2. Testy skuteczności wykrywania phishingu

Przygotuj zestaw testowy, np.:
- 10 wiadomości phishingowych
- 10 wiadomości bezpiecznych

| Nr | Typ wiadomości | Oczekiwany wynik | Wynik aplikacji | Status |
|----|----------------|------------------|-----------------|--------|
| 1 | Phishing | Phishing | Phishing | TP |
| 2 | Phishing | Phishing | Safe | FN |
| 3 | Safe | Safe | Safe | TN |
| 4 | Safe | Safe | Phishing | FP |
| 5 | Phishing | Phishing | Phishing | TP |
| 6 | Phishing | Phishing | Phishing | TP |
| 7 | Safe | Safe | Safe | TN |
| 8 | Safe | Safe | Safe | TN |
| 9 | Phishing | Phishing | Phishing | TP |
| 10 | Safe | Safe | Phishing | FP |
| 11 | Phishing | Phishing | Phishing | TP |
| 12 | Safe | Safe | Safe | TN |
| 13 | Phishing | Phishing | Safe | FN |
| 14 | Safe | Safe | Safe | TN |
| 15 | Safe | Safe | Safe | TN |
| 16 | Phishing | Phishing | Phishing | TP |
| 17 | Safe | Safe | Safe | TN |
| 18 | Phishing | Phishing | Phishing | TP |
| 19 | Safe | Safe | Safe | TN |
| 20 | Phishing | Phishing | Phishing | TP |

### Znaczenie skrótów
- **TP** – phishing poprawnie wykryty
- **TN** – bezpieczny mail poprawnie rozpoznany
- **FP** – bezpieczny mail błędnie uznany za phishing
- **FN** – phishing błędnie uznany za bezpieczny

## 3. Oblicz metryki

Po testach policz:

- Accuracy = (TP + TN) / wszystkie próbki
- Precision = TP / (TP + FP)
- Recall = TP / (TP + FN)

### Przykład
Masz:
- TP = 9
- TN = 8
- FP = 2
- FN = 1

Wtedy:
- Accuracy = (9 + 8) / 20 = 85%
- Precision = 9 / (9 + 2) = 81,8%
- Recall = 9 / (9 + 1) = 90%

## 4. Wskazówki do wykonania testów

1. Otwórz aplikację i wykonaj logowanie przez Gmail.
2. Zweryfikuj, że lista maili się ładuje.
3. Przetestuj analizę kilku wiadomości i sprawdź, czy wynik jest wyświetlany.
4. Przetestuj zapis i brak zapisu klucza API (np. bez klucza lub z błędnym kluczem).
5. Przygotuj opisane przykładowe wiadomości phishingowe i bezpieczne, a następnie porównaj wykrycia z oczekiwanymi wynikami.
6. Na końcu oblicz metryki i oceń skuteczność modelu.

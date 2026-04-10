// === PAIN LIBRARY ===
// Keys match HubSpot multi-select values
const PAIN_LIBRARY = {
  "brak_segmentacji": {
    title: "Brak segmentacji klientów",
    description: "Brak podziału klientów według wartości i zachowania powoduje, że najbardziej rentowne grupy nie są rozwijane, a potencjał bazy pozostaje niewykorzystany.",
    icon: "segments"
  },
  "porzucone_koszyki": {
    title: "Utracony przychód z porzuconych koszyków",
    description: "Koszt pozyskania ruchu został poniesiony, jednak część klientów z wysoką intencją zakupową opuszcza proces bez finalizacji, co oznacza bezpośrednią utratę sprzedaży.",
    icon: "cart"
  },
  "brak_powracalnosci": {
    title: "Brak kontroli nad powracalnością",
    description: "Brak precyzyjnych danych o liczbie i czasie powrotów uniemożliwia przewidywanie przychodu z bazy i zwiększa zależność od akwizycji nowych klientów.",
    icon: "repeat"
  },
  "niski_koszyk": {
    title: "Niska średnia wartość koszyka",
    description: "Średnia wartość zamówienia nie rośnie wraz z kosztem reklamy, co powoduje spadek rentowności pierwszego zakupu.",
    icon: "basket"
  },
  "niewykorzystany_ruch": {
    title: "Niewykorzystanie istniejącego ruchu",
    description: "Pozyskany ruch nie jest w pełni monetyzowany, co obniża efektywność inwestycji marketingowych.",
    icon: "traffic"
  },
  "cykl_produktu": {
    title: "Brak pracy na cyklu życia produktu",
    description: "Brak reakcji w naturalnym momencie ponownego zakupu skutkuje utratą przewidywalnego, przyszłego przychodu.",
    icon: "lifecycle"
  },
  "dlugi_proces": {
    title: "Długi proces decyzyjny bez wsparcia",
    description: "Wydłużony czas podejmowania decyzji bez aktywnego podtrzymywania relacji zwiększa ryzyko utraty sprzedaży na rzecz konkurencji.",
    icon: "clock"
  },
  "rentownosc_kolejne_zakupy": {
    title: "Rentowność uzależniona od kolejnych zakupów",
    description: "Jeżeli zysk pojawia się dopiero przy drugim lub trzecim zamówieniu, brak kontroli nad powrotami bezpośrednio zagraża stabilności modelu finansowego.",
    icon: "money"
  },
  "brak_mierzalnosci": {
    title: "Brak mierzalności wpływu automatyzacji",
    description: "Brak jednoznacznych danych o udziale automatyzacji w obrocie uniemożliwia świadome zarządzanie tym obszarem.",
    icon: "chart"
  },
  "nieaktywni_klienci": {
    title: "Brak pracy na nieaktywnych klientach",
    description: "Klienci, którzy wcześniej wygenerowali sprzedaż, pozostają bez systematycznej reaktywacji, co oznacza utratę potencjalnego zwrotu z poniesionej inwestycji.",
    icon: "sleep"
  },
  "retencja": {
    title: "Niska retencja klientów",
    description: "Brak systematycznych działań retencyjnych powoduje, że klienci nie wracają po pierwszym zakupie, a koszt ich pozyskania nie zwraca się.",
    icon: "repeat"
  },
  "niska_konwersja": {
    title: "Niska konwersja odwiedzających",
    description: "Znaczna część ruchu na stronie nie przekłada się na zakupy — brak personalizacji i automatycznych reakcji na zachowanie użytkownika obniża skuteczność sprzedaży.",
    icon: "traffic"
  }
};

// === PROBLEM → MECHANISM → IMPACT LIBRARY ===
// Mapped to pain keys
const PMI_LIBRARY = {
  "porzucone_koszyki": {
    problem: "Użytkownicy dodają produkty do koszyka, przeglądają konkretne modele, sprawdzają dostępność — ale sprzedaż nie jest systemowo domykana.",
    mechanism: "Gotowe scenariusze reagujące na zachowanie użytkownika: porzucone koszyki, przeglądane produkty, remarketing email/SMS.",
    impact: "Odzysk sprzedaży, która już była w zasięgu, bez zwiększania budżetu reklamowego."
  },
  "niewykorzystany_ruch": {
    problem: "Sprzedaż spada, gdy zmniejsza się budżet reklamowy. Baza klientów nie generuje stabilnego przychodu.",
    mechanism: "Automatyzacje retencyjne, segmentacja klientów według historii zakupów, cykl życia klienta, stała komunikacja wielokanałowa do istniejącej bazy.",
    impact: "Większa część przychodu pochodzi z powracających klientów, a zależność od płatnej akwizycji maleje."
  },
  "brak_powracalnosci": {
    problem: "Nie ma jasnych danych o tym, ilu klientów wraca, kiedy wracają i jaki mają realny udział w obrocie.",
    mechanism: "Monitorowanie repeat rate, segmentacja według częstotliwości zakupów, automatyczne scenariusze przypominające o kolejnym zakupie.",
    impact: "Przewidywalny przychód z bazy i możliwość realnego zarządzania retencją."
  },
  "niski_koszyk": {
    problem: "Średnia wartość zamówienia nie rośnie proporcjonalnie do kosztu pozyskania klienta.",
    mechanism: "Dynamiczne rekomendacje produktowe, cross-sell i up-sell w automatyzacjach oraz komunikacji on-site, personalizacja oferty w oparciu o zachowanie użytkownika.",
    impact: "Wyższa wartość pojedynczej transakcji przy tym samym wolumenie ruchu."
  },
  "rentownosc_kolejne_zakupy": {
    problem: "Pierwsze zamówienie często pokrywa jedynie koszt pozyskania klienta, a zysk pojawia się dopiero przy powrotach.",
    mechanism: "Scenariusze po pierwszym zakupie, programy reaktywacyjne, segmentacja klientów według wartości i częstotliwości.",
    impact: "Większy odsetek klientów przechodzi do drugiego i trzeciego zakupu, co stabilizuje marżę."
  },
  "nieaktywni_klienci": {
    problem: "W bazie znajdują się klienci, którzy wcześniej kupili, ale dziś nie generują sprzedaży.",
    mechanism: "Automatyczne kampanie reaktywacyjne uruchamiane po określonym czasie braku aktywności, segmentacja 'uśpionych' klientów.",
    impact: "Odzysk przychodu bez ponoszenia kosztu pozyskania nowych klientów."
  },
  "dlugi_proces": {
    problem: "Klienci analizują ofertę przez dłuższy czas, a firma traci wpływ na moment podjęcia decyzji.",
    mechanism: "Scenariusze przeglądanych produktów, remarketing email/SMS, komunikacja on-site oparta na zachowaniu użytkownika.",
    impact: "Większy odsetek decyzji zakupowych finalizowanych w sklepie."
  },
  "brak_segmentacji": {
    problem: "Brak segmentacji sprawia, że najbardziej wartościowi klienci nie są rozwijani, a baza klientów nie jest w pełni wykorzystywana.",
    mechanism: "edrone automatycznie segmentuje klientów na podstawie danych zakupowych i zachowań (np. RFM), umożliwiając kierowanie dopasowanych kampanii do konkretnych grup.",
    impact: "Lepsze zarządzanie bazą klientów zwiększa CLV nawet o kilkanaście procent w ciągu 12 miesięcy."
  },
  "cykl_produktu": {
    problem: "Klient naturalnie powinien wrócić po określonym czasie, ale brak reakcji powoduje utratę tej sprzedaży.",
    mechanism: "Automatyczne przypomnienia o ponownym zakupie oparte na czasie od ostatniej transakcji i typie produktu.",
    impact: "Zwiększenie liczby powrotów bez dodatkowych inwestycji w ruch."
  },
  "brak_mierzalnosci": {
    problem: "Dane o zakupach, zachowaniu i komunikacji są w różnych systemach, co utrudnia spójne zarządzanie relacją.",
    mechanism: "Jedno centralne CRM gromadzące dane transakcyjne i behawioralne oraz wspólny silnik segmentacji dla wszystkich kanałów.",
    impact: "Spójna komunikacja i decyzje oparte na pełnym obrazie klienta."
  },
  "retencja": {
    problem: "Klienci kupują raz i nie wracają — brak systematycznych działań retencyjnych sprawia, że koszt pozyskania nie zwraca się.",
    mechanism: "Automatyczne scenariusze po zakupie, programy lojalnościowe, przypomnienia o ponownym zakupie i reaktywacja nieaktywnych klientów.",
    impact: "Wyższy wskaźnik powracalności i stabilniejszy przychód z istniejącej bazy klientów."
  },
  "niska_konwersja": {
    problem: "Duża część odwiedzających opuszcza sklep bez zakupu — brak personalizacji i automatycznych reakcji na zachowanie obniża konwersję.",
    mechanism: "Personalizowane rekomendacje produktowe, pop-upy z ofertami, automatyczne scenariusze reagujące na przeglądane produkty i porzucone procesy.",
    impact: "Wyższy współczynnik konwersji przy tym samym wolumenie ruchu, co oznacza lepszy zwrot z inwestycji w reklamę."
  }
};

// === USP LIBRARY ===
const USP_LIBRARY = {
  "szybka_konfiguracja": {
    title: "Błyskawiczna konfiguracja",
    subtitle: "Gotowe automatyzacje sprzedażowe od pierwszego dnia"
  },
  "nieograniczony_dostep": {
    title: "Nieograniczony dostęp do wszystkich funkcjonalności",
    subtitle: "Jedna licencja, pełna funkcjonalność"
  },
  "5_kanalow": {
    title: "5 kanałów komunikacji w jednej platformie",
    subtitle: "Możliwość komunikacji z klientami, pięcioma najlepszymi kanałami sprzedaży w ecommerce"
  },
  "transparentny_cennik": {
    title: "Transparentny model cenowy",
    subtitle: "Jasne zasady, brak ukrytych kosztów"
  },
  "wsparcie": {
    title: "Wsparcie najlepszego zespołu Supportowego",
    subtitle: "Dedykowany zespół dbający o Twój sukces"
  },
  "szybki_roi": {
    title: "Szybki time-to-return of investment",
    subtitle: "Połowa klientów osiąga ROI w 20 dni"
  }
};

// === CASE STUDY TEMPLATES ===
const CASE_STUDIES = {
  "default": {
    text: "Nasi klienci z branży e-commerce notują znaczące poprawy współczynnika konwersji, powracalności klientów i średniej wartości zamówienia w ciągu pierwszych 12 miesięcy korzystania z edrone. Poniższe wyniki pokazują typowy wzrost wydajności w oparciu o benchmarki branżowe.",
    conversion_before: 1.8,
    conversion_after: 3.2,
    repeat_before: 12,
    repeat_after: 22,
    aov_before: 150,
    aov_after: 185
  }
};

// Make globally available
window.PAIN_LIBRARY = PAIN_LIBRARY;
window.PMI_LIBRARY = PMI_LIBRARY;
window.USP_LIBRARY = USP_LIBRARY;
window.CASE_STUDIES = CASE_STUDIES;

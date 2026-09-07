#!/usr/bin/env python3
"""Blok generowany `PROJECT_STATUS.md` jako funkcja `plans/**` i gita.

KANON FLOTY. Jedyne pelne zrodlo tej implementacji zyje w
`project-structure/skeleton/core/tools/status-block.py`; egzemplarze w repo
floty sa jego KOPIAMI i maja byc z nim identyczne co do bajtu. Rozjazd kopii
z kanonem lapie komenda weryfikacji wpisu M-024 (porownanie sumy SHA-256), nie
oko. Poprawke wnosi sie do kanonu i rozwozi rolloutem - egzemplarza w cudzym
repo nie edytuje sie na miejscu, bo wtedy gramatyka znowu ma cztery zrodla,
czyli dokladnie stan, ktory M-024 zlikwidowalo.

Kontrakt tresci: ADR-0010 floty (`project-structure/decisions/
adr-0010-artefakt-wspolny-wyprowadzany-z-jednego-pisarza.md`), par. 1.2 (blok)
i 1.3 (gramatyka `## Progress`); wybor nosnika i status stopnia 1:
[ADR-0015](../../../decisions/adr-0015-nosnik-komendy-bloku-generowanego.md).
Zyje w `tools/`, nie w `src/`: konwencja floty nazywa `tools/` narzedziami
deweloperskimi, wiec progi rozmiaru kodu produkcyjnego go nie mierza.

Zalezy WYLACZNIE od `python3` i biblioteki standardowej. To nie jest
oszczednosc, tylko warunek dzialania: komenda ze znacznika jest uruchamiana
przez `fleet-scan.sh` w `env -i` z biala lista zmiennych, a narzedzie, ktorego
przy takim uruchomieniu brakuje, wypisuje pustke i tym samym udaje rozjazd
bloku. Zmierzone na kandydacie zaleznym od `uv`: brak `uv` w PATH daje puste
stdout, czyli FAIL nieodroznialny od prawdziwego rozjazdu (ADR-0015, tabela
kosztu).

Trzy rzeczy latwe do zgubienia przy zmianie tego pliku:

1. Wiersz `Review` NIE wlicza sie do licznikow `X`/`Y` w polu "fazy <X>/<Y>"
   (ADR-0010 par. 1.2, tabela wyprowadzenia).
2. Porzadek "ostatnio domknietego planu" liczy sie z PELNEGO znacznika czasu
   commita (`%ct`), nie z daty skroconej do dnia; remis rozstrzyga nazwa
   katalogu MALEJACO (ADR-0010 par. 1.2).
3. Znacznik liczy sie jako CALA LINIA (`^<!-- generated:begin`), nie jako napis
   gdziekolwiek w tresci pliku - inaczej wystapienie tego samego slowa w prozie
   (np. we wpisie dziennika opisujacym ten sam ADR) falszywie liczy sie jako
   granica bloku. To jest dokladnie usterka nazwana w ADR-0010 par. 1.2.

Uzycie (sciezki licza sie od korzenia repo wyprowadzonego z polozenia TEGO
pliku, `__file__`, nie z `cwd` - dzieki temu dziala tez wywolane z zewnatrz):

    python3 tools/status-block.py --print     tresc bloku na stdout
    python3 tools/status-block.py --check      kod 1 przy rozjezdzie
    python3 tools/status-block.py --write       zregeneruj blok w pliku
    python3 tools/status-block.py --selftest    testy gramatyki, bez I/O

Znacznik w `PROJECT_STATUS.md` niesie te komende (ADR-0010 par. 1.1, stopien 2):

    <!-- generated:begin: python3 tools/status-block.py --print -->

Kod wyjscia: 0 - blok zgodny (albo zapisany) bez bledow gramatyki; 1 - rozjazd
tresci, brak adopcji (zero znacznikow) albo blad gramatyki `## Progress` w
ktoryms z planow aktywnych; 2 - POMIAR NIEWAZNY, czyli para znacznikow
niejednoznaczna (zero par NIE jest tym przypadkiem - to FAIL, kod 1). `--print`
pisze ewentualne bledy gramatyki na stderr, zeby stdout zawsze niosl WYLACZNIE
tresc bloku - to jest warunkiem uzycia go w komendzie znacznika.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

BRAK_COMMITA = "(brak commita)"

_NAGLOWEK = re.compile(r"^## (?:[0-9]+\. )?Progress[ \t]*$")
_CHECKBOX = re.compile(r"^- \[[ x]\] ")
_FAZA = re.compile(
    r"^- \[(?P<box>[ x])\] Faza (?P<numer>[0-9]+)(?P<sufiks>[a-z]?) - "
    r"(?P<nazwa>.+) \(commit: (?P<sha>[0-9a-f]{7,40})?\)$"
)
_REVIEW = re.compile(r"^- \[(?P<box>[ x])\] Review \(review\.md, werdykt: (?P<werdykt>.*)\)$")
_SLOWA_KLUCZOWE = ("Faza", "Review")

_BEGIN = re.compile(r"^<!-- *generated:begin")
_END = re.compile(r"^<!-- *generated:end *-->[ \t]*$")


# --- gramatyka "## Progress" (ADR-0010 par. 1.3) -----------------------------


@dataclass(frozen=True)
class Wiersz:
    numer: int
    tekst: str
    rodzaj: str  # faza | review | blad | proza | inny | naglowek | poza


@dataclass(frozen=True)
class WierszFazy:
    numer: int
    sufiks: str
    zrobiona: bool
    linia: int


@dataclass(frozen=True)
class WierszReview:
    werdykt: str
    zrobiony: bool
    linia: int


@dataclass(frozen=True)
class Progress:
    wiersze: tuple = field(default_factory=tuple)
    fazy: tuple = field(default_factory=tuple)
    review: tuple = field(default_factory=tuple)

    @property
    def bledy(self) -> tuple:
        return tuple(w for w in self.wiersze if w.rodzaj == "blad")

    @property
    def total(self) -> int:
        return len(self.fazy)

    @property
    def zrobione(self) -> int:
        return sum(1 for f in self.fazy if f.zrobiona)

    @property
    def werdykt(self) -> str:
        # Liczy sie PIERWSZY odhaczony wiersz Review. Nieodhaczony niesie
        # werdykt, ktorego jeszcze nie ma; pusty niesie brak werdyktu. Oba
        # czytaja sie w bloku tak samo: "brak".
        for r in self.review:
            if r.zrobiony:
                return r.werdykt or "brak"
        return "brak"


def sklasyfikuj(linia: str) -> tuple:
    if not _CHECKBOX.match(linia):
        return "inny", None
    dopasowanie = _FAZA.match(linia)
    if dopasowanie is not None:
        return "faza", dopasowanie
    dopasowanie = _REVIEW.match(linia)
    if dopasowanie is not None:
        return "review", dopasowanie
    if any(slowo in linia for slowo in _SLOWA_KLUCZOWE):
        return "blad", None
    return "proza", None


def sparsuj_progress(tekst: str) -> Progress:
    """Sparsuj sekcje `## Progress` z tresci `plan.md` (czysta funkcja tekstu)."""
    wiersze: list[Wiersz] = []
    fazy: list[WierszFazy] = []
    review: list[WierszReview] = []
    w_sekcji = False

    for numer, surowa in enumerate(tekst.splitlines(), start=1):
        if _NAGLOWEK.match(surowa):
            w_sekcji = True
            wiersze.append(Wiersz(numer, surowa, "naglowek"))
            continue
        if w_sekcji and surowa.startswith("## "):
            w_sekcji = False
        if not w_sekcji:
            wiersze.append(Wiersz(numer, surowa, "poza"))
            continue

        rodzaj, dopasowanie = sklasyfikuj(surowa)
        wiersze.append(Wiersz(numer, surowa, rodzaj))
        if rodzaj == "faza":
            fazy.append(WierszFazy(
                numer=int(dopasowanie.group("numer")),
                sufiks=dopasowanie.group("sufiks"),
                zrobiona=dopasowanie.group("box") == "x",
                linia=numer,
            ))
        elif rodzaj == "review":
            review.append(WierszReview(
                werdykt=dopasowanie.group("werdykt"),
                zrobiony=dopasowanie.group("box") == "x",
                linia=numer,
            ))

    return Progress(wiersze=tuple(wiersze), fazy=tuple(fazy), review=tuple(review))


def tytul_planu(tekst: str) -> str:
    """Pierwsza linia zaczynajaca sie od `# `, bez tego prefiksu."""
    for linia in tekst.splitlines():
        if linia.startswith("# "):
            return linia[2:]
    return ""


# --- fakty gita ---------------------------------------------------------


@dataclass(frozen=True)
class Commit:
    skrot: str
    data: str
    znacznik_czasu: int


# Zmienne, ktore przekierowuja gita POZA `-C korzen` (repo/indeks/obiekty inne
# niz to, na ktore wskazuje `-C`). Dziedziczenie ich z otoczenia procesu jest
# niebezpieczne, gdy narzedzie jest wolane wewnatrz hooka gita innego repo
# (np. z tego samego procesu co `python3 -m unittest discover tests` pod
# `lefthook run pre-commit` przy commicie z jawnym pathspecem): git na czas
# hooka ustawia `GIT_INDEX_FILE`/`GIT_DIR` na tymczasowy indeks CZESCIOWEGO
# commita rodzica, wiec `-C korzen` przestaje wystarczac za granice repo i
# `git log` moze czytac/pisac nie to repo, co trzeba. Dlatego KAZDE wywolanie
# w tym module dostaje jawnie wyczyszczone srodowisko.
_ZMIENNE_GITA_DO_WYCIECIA = (
    "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_COMMON_DIR", "GIT_CEILING_DIRECTORIES",
)


def _srodowisko_gita() -> dict[str, str]:
    return {k: v for k, v in os.environ.items() if k not in _ZMIENNE_GITA_DO_WYCIECIA}


def ostatni_commit(korzen: Path, sciezka: str) -> Commit | None:
    """Ostatni commit dotykajacy `sciezka` w `korzen`, albo None (cisza, nie
    wyjatek: raport ma dzialac tez na sciezce bez historii)."""
    try:
        wynik = subprocess.run(
            ["git", "-C", str(korzen), "log", "-1", "--format=%h%x1f%ad%x1f%ct",
             "--date=short", "--", sciezka],
            capture_output=True, text=True, check=False, timeout=30,
            env=_srodowisko_gita(),
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if wynik.returncode != 0:
        return None
    linia = wynik.stdout.strip()
    if not linia:
        return None
    czesci = linia.split("\x1f")
    if len(czesci) != 3 or not czesci[2].isdigit():
        return None
    return Commit(skrot=czesci[0], data=czesci[1], znacznik_czasu=int(czesci[2]))


# --- fakty o planach i blok ----------------------------------------------


@dataclass(frozen=True)
class PlanAktywny:
    nazwa: str
    tytul: str
    zrobione: int
    total: int
    werdykt: str
    commit: object
    bledy: tuple


@dataclass(frozen=True)
class PlanZarchiwizowany:
    nazwa: str
    commit: Commit


@dataclass(frozen=True)
class Fakty:
    aktywne: tuple
    ostatni: object
    liczba_archiwum: int

    @property
    def bledy(self) -> tuple:
        return tuple((plan.nazwa, w) for plan in self.aktywne for w in plan.bledy)


def katalogi_numerowane(korzen: Path) -> list:
    if not korzen.is_dir():
        return []
    return sorted(
        (wpis for wpis in korzen.iterdir() if wpis.is_dir() and wpis.name[:1].isdigit()),
        key=lambda wpis: wpis.name,
    )


def zbierz_fakty(korzen: Path) -> Fakty:
    """Zbierz fakty o planach; jedyne miejsce w module dotykajace dysku i gita."""
    aktywne = []
    for katalog in katalogi_numerowane(korzen / "plans"):
        plik_planu = katalog / "plan.md"
        if not plik_planu.is_file():
            continue
        tekst = plik_planu.read_text(encoding="utf-8")
        progress = sparsuj_progress(tekst)
        aktywne.append(PlanAktywny(
            nazwa=katalog.name,
            tytul=tytul_planu(tekst),
            zrobione=progress.zrobione,
            total=progress.total,
            werdykt=progress.werdykt,
            commit=ostatni_commit(korzen, f"plans/{katalog.name}"),
            bledy=progress.bledy,
        ))

    katalogi_archiwum = katalogi_numerowane(korzen / "plans" / "archived")
    kandydaci = []
    for katalog in katalogi_archiwum:
        commit = ostatni_commit(korzen, f"plans/archived/{katalog.name}")
        if commit is not None:
            kandydaci.append(PlanZarchiwizowany(nazwa=katalog.name, commit=commit))

    ostatni = None
    if kandydaci:
        # Remis rozstrzyga nazwa malejaco: max() na (znacznik_czasu, nazwa)
        # wybiera wiekszy string przy rownych znacznikach czasu.
        ostatni = max(kandydaci, key=lambda plan: (plan.commit.znacznik_czasu, plan.nazwa))

    return Fakty(aktywne=tuple(aktywne), ostatni=ostatni, liczba_archiwum=len(katalogi_archiwum))


def wyrenderuj(fakty: Fakty) -> str:
    """Tresc bloku, zakonczona nowa linia kazdego wiersza; bez znacznikow."""
    wiersze = []
    if not fakty.aktywne:
        wiersze.append("- **Aktywne plany (0):** brak")
    else:
        wiersze.append(f"- **Aktywne plany ({len(fakty.aktywne)}):**")
        for plan in fakty.aktywne:
            if plan.commit is not None:
                commit_txt = f"`{plan.commit.skrot}` ({plan.commit.data})"
            else:
                commit_txt = BRAK_COMMITA
            wiersze.append(
                f"  - [`{plan.nazwa}`](./plans/{plan.nazwa}/plan.md) - {plan.tytul} - "
                f"fazy {plan.zrobione}/{plan.total} - review: {plan.werdykt} - "
                f"ostatni commit {commit_txt}"
            )
    if fakty.ostatni is None:
        wiersze.append("- **Ostatnio domknięty plan:** brak")
    else:
        wiersze.append(
            f"- **Ostatnio domknięty plan:** [`{fakty.ostatni.nazwa}`]"
            f"(./plans/archived/{fakty.ostatni.nazwa}/plan.md#wynik) - {fakty.ostatni.commit.data}"
        )
    wiersze.append(f"- **Plany zarchiwizowane:** {fakty.liczba_archiwum}")
    return "".join(f"{w}\n" for w in wiersze)


# --- granica w PROJECT_STATUS.md -----------------------------------------


class BrakAdopcji(Exception):
    """Zero znacznikow: brak adopcji, nie pomiar niewazny."""


class BlokNiejednoznaczny(Exception):
    """Znaczniki sa, ale ksztalt jest niejednoznaczny."""


@dataclass(frozen=True)
class Blok:
    poczatek: int
    koniec: int
    tresc: str


def znajdz_blok(tekst: str) -> Blok:
    wiersze = tekst.splitlines()
    poczatki = [i for i, w in enumerate(wiersze) if _BEGIN.match(w)]
    konce = [i for i, w in enumerate(wiersze) if _END.match(w)]

    if not poczatki and not konce:
        raise BrakAdopcji(
            "brak pary znacznikow <!-- generated:begin --> / <!-- generated:end -->"
        )
    if len(poczatki) != len(konce) or len(poczatki) > 1:
        raise BlokNiejednoznaczny(
            f"znacznikow begin jest {len(poczatki)}, end {len(konce)}, a ma byc po jednym"
        )
    if poczatki[0] > konce[0]:
        raise BlokNiejednoznaczny(
            f"generated:end w wierszu {konce[0] + 1} stoi przed "
            f"generated:begin w wierszu {poczatki[0] + 1}"
        )

    tresc = "".join(f"{w}\n" for w in wiersze[poczatki[0] + 1: konce[0]])
    return Blok(poczatek=poczatki[0], koniec=konce[0], tresc=tresc)


def podmien_blok(tekst: str, tresc: str) -> str:
    """Podmien tresc miedzy znacznikami; wszystko poza nia zostaje bajt w bajt."""
    blok = znajdz_blok(tekst)
    wiersze = tekst.splitlines(keepends=True)
    glowa = "".join(wiersze[: blok.poczatek + 1])
    ogon = "".join(wiersze[blok.koniec:])
    return f"{glowa}{tresc}{ogon}"


# --- CLI -------------------------------------------------------------------


def _zglos_bledy(fakty: Fakty, strumien) -> None:
    for nazwa_planu, w in fakty.bledy:
        print(
            f"  ZMIEŃ {nazwa_planu}/plan.md:{w.numer}: wiersz z 'Faza'/'Review' "
            f"nie pasuje do gramatyki ADR-0010 par. 1.3: {w.tekst.strip()!r}",
            file=strumien,
        )


def polecenie_print(korzen: Path) -> int:
    fakty = zbierz_fakty(korzen)
    sys.stdout.write(wyrenderuj(fakty))
    if fakty.bledy:
        _zglos_bledy(fakty, sys.stderr)
        return 1
    return 0


def polecenie_check(korzen: Path) -> int:
    sciezka_statusu = korzen / "PROJECT_STATUS.md"
    if not sciezka_statusu.is_file():
        print(f"  ZMIEŃ {sciezka_statusu} nie istnieje")
        return 1
    tekst = sciezka_statusu.read_text(encoding="utf-8")

    try:
        blok = znajdz_blok(tekst)
    except BrakAdopcji as wyjatek:
        print(f"  ZMIEŃ {wyjatek}")
        return 1
    except BlokNiejednoznaczny as wyjatek:
        print(f"  POMIAR NIEWAŻNY: {wyjatek}")
        return 2

    fakty = zbierz_fakty(korzen)
    swiezy = wyrenderuj(fakty)
    porazka = 0

    if swiezy != blok.tresc:
        print("  ZMIEŃ blok w PROJECT_STATUS.md rozjechał się ze stanem plans/ i gita")
        print("  --- plik ---")
        print("".join(f"  {w}\n" for w in blok.tresc.splitlines()))
        print("  --- świeże wyprowadzenie ---")
        print("".join(f"  {w}\n" for w in swiezy.splitlines()))
        porazka = 1
    else:
        print("  ok    blok w PROJECT_STATUS.md zgodny z plans/ i gitem")

    if fakty.bledy:
        _zglos_bledy(fakty, sys.stdout)
        porazka = 1

    return porazka


def polecenie_write(korzen: Path) -> int:
    sciezka_statusu = korzen / "PROJECT_STATUS.md"
    if not sciezka_statusu.is_file():
        print(f"  ZMIEŃ {sciezka_statusu} nie istnieje")
        return 1
    tekst = sciezka_statusu.read_text(encoding="utf-8")

    try:
        znajdz_blok(tekst)
    except BrakAdopcji as wyjatek:
        print(f"  ZMIEŃ nie zapisuję: {wyjatek}")
        return 1
    except BlokNiejednoznaczny as wyjatek:
        print(f"  POMIAR NIEWAŻNY, nie zapisuję: {wyjatek}")
        return 2

    fakty = zbierz_fakty(korzen)
    swiezy = wyrenderuj(fakty)
    nowy_tekst = podmien_blok(tekst, swiezy)

    if nowy_tekst == tekst:
        print("  ok    blok już zgodny, nic do zapisania")
    else:
        sciezka_statusu.write_text(nowy_tekst, encoding="utf-8")
        print(f"  done  zregenerowano blok w {sciezka_statusu}")

    if fakty.bledy:
        _zglos_bledy(fakty, sys.stdout)
        return 1
    return 0


def _wywola_wyjatek(typ_wyjatku, fn, *args) -> bool:
    try:
        fn(*args)
    except typ_wyjatku:
        return True
    except Exception:  # noqa: BLE001 - selftest ma zlapac KAZDY wyjatek, to jest jego rola
        return False
    return False


def polecenie_selftest() -> int:
    """Testy gramatyki i granicy bloku, bez I/O. Wzorce z ADR-0010 par. 1.3."""
    niezaliczone: list[str] = []

    def sprawdz(etykieta: str, warunek: bool) -> None:
        if not warunek:
            niezaliczone.append(etykieta)

    pozytywny = (
        "## Progress\n"
        "- [x] Faza 2a - M-016 i M-017 z dowodem FAIL/PASS komend (commit: 3a8c60e)\n"
        "      Dowolna proza kontynuacji, wcięta. Parser ją pomija.\n"
        "- [ ] Faza 3b - skan floty dla M-015 (commit: )\n"
        "- [x] Review (review.md, werdykt: APPROVE)\n"
    )
    progress = sparsuj_progress(pozytywny)
    sprawdz("faza z sufiksem i commitem", progress.total == 2)
    sprawdz("faza odhaczona liczy sie do zrobione", progress.zrobione == 1)
    sprawdz("werdykt z odhaczonego review", progress.werdykt == "APPROVE")
    sprawdz("brak bledow na poprawnym wejsciu", not progress.bledy)

    negatywny = (
        "## Progress\n"
        "- [x] **Faza 1** - domknięcie W1 korpusu - DOMKNIĘTA 2026-08-11\n"
        "- [x] Faza 3: przebieg pomiarowy 1\n"
        "- [ ] Faza 4 - przebieg pomiarowy 2 (commity w repo docelowych: )\n"
    )
    progress = sparsuj_progress(negatywny)
    sprawdz("trzy wiersze ze slowem Faza w zlym ksztalcie to trzy bledy",
            len(progress.bledy) == 3)
    sprawdz("bledne wiersze nie licza sie do faz", progress.total == 0)

    proza = (
        "## Progress\n"
        "- [ ] bramka wejscia: akceptacja czlowieka\n"
        "- [x] D-01 skille w formacie Agent Skills\n"
    )
    progress = sparsuj_progress(proza)
    sprawdz("wiersz bez Faza/Review to proza, nie blad", not progress.bledy)
    sprawdz("proza nie wchodzi do liczby faz", progress.total == 0)

    numerowany = "## 7. Progress\n- [ ] Faza 1 - x (commit: )\n"
    sprawdz("numerowany naglowek sekcji jest legalny",
            sparsuj_progress(numerowany).total == 1)

    sprawdz("werdykt bez zadnego wiersza review to brak",
            sparsuj_progress("## Progress\n- [ ] Faza 1 - x (commit: )\n").werdykt == "brak")
    sprawdz("nieodhaczony review to brak, nie jego tresc",
            sparsuj_progress(
                "## Progress\n- [ ] Review (review.md, werdykt: APPROVE)\n"
            ).werdykt == "brak")

    sprawdz("brak znacznikow to BrakAdopcji",
            _wywola_wyjatek(BrakAdopcji, znajdz_blok, "# X\n\nzero znacznikow tutaj\n"))
    sprawdz("dwie pary begin/end to BlokNiejednoznaczny",
            _wywola_wyjatek(BlokNiejednoznaczny, znajdz_blok,
                            "<!-- generated:begin -->\n<!-- generated:end -->\n"
                            "<!-- generated:begin -->\n<!-- generated:end -->\n"))
    sprawdz("end przed begin to BlokNiejednoznaczny",
            _wywola_wyjatek(BlokNiejednoznaczny, znajdz_blok,
                            "<!-- generated:end -->\n<!-- generated:begin -->\n"))
    sprawdz("wystapienie slowa generated:begin w prozie nie liczy sie jako znacznik",
            _wywola_wyjatek(BrakAdopcji, znajdz_blok,
                             "opis mowi generated:begin w tekscie\n"))

    podmieniony = podmien_blok(
        "przed\n<!-- generated:begin -->\nstare\n<!-- generated:end -->\npo\n",
        "nowe\n",
    )
    sprawdz("podmien_blok zostawia reszte pliku bajt w bajt",
            podmieniony == "przed\n<!-- generated:begin -->\nnowe\n<!-- generated:end -->\npo\n")

    remis = (
        PlanZarchiwizowany("0002-b", Commit("aaa", "2026-08-01", 100)),
        PlanZarchiwizowany("0001-a", Commit("bbb", "2026-08-01", 100)),
    )
    zwyciezca = max(remis, key=lambda plan: (plan.commit.znacznik_czasu, plan.nazwa))
    sprawdz("remis znacznika czasu rozstrzyga nazwa malejaco", zwyciezca.nazwa == "0002-b")

    if niezaliczone:
        for etykieta in niezaliczone:
            print(f"  ZMIEŃ selftest: {etykieta}")
        print(f"selftest: {len(niezaliczone)} niezaliczonych")
        return 1
    print("  ok    selftest: wszystkie przypadki zaliczone")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    grupa = parser.add_mutually_exclusive_group(required=True)
    grupa.add_argument("--print", action="store_true", dest="do_print",
                        help="wypisz tresc bloku na stdout")
    grupa.add_argument("--check", action="store_true",
                        help="porownaj PROJECT_STATUS.md ze stanem plans/ i gita")
    grupa.add_argument("--write", action="store_true",
                        help="zregeneruj blok w PROJECT_STATUS.md")
    grupa.add_argument("--selftest", action="store_true",
                        help="testy gramatyki i granicy bloku, bez I/O")
    parser.add_argument("--korzen", default=None,
                         help="korzen repo (domyslnie: katalog nadrzedny wobec tools/)")
    args = parser.parse_args(argv)

    if args.selftest:
        return polecenie_selftest()

    korzen = Path(args.korzen).resolve() if args.korzen else Path(__file__).resolve().parent.parent

    if args.do_print:
        return polecenie_print(korzen)
    if args.check:
        return polecenie_check(korzen)
    return polecenie_write(korzen)


if __name__ == "__main__":
    sys.exit(main())

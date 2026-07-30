<img src="assets/brand/traitwise-studio-logo.svg" alt="TraitWise Studio" width="320" />

# TraitWise Studio

Editor visuale per generare il file `config.yaml` usato da [TraitWise](../traitwise). Pensato per chi deve creare o modificare un quiz senza scrivere YAML a mano: compili un form, a destra vedi l'anteprima del file generato in tempo reale, poi lo scarichi.

Sito statico puro — nessun backend, nessun salvataggio automatico. Tutto vive nella memoria della pagina finché resta aperta.

## Avvio in locale

Da dentro questa cartella:

```bash
python3 -m http.server 8090
```

Poi apri `http://localhost:8090` (serve un server locale per lo stesso motivo di TraitWise: `fetch()`/moduli ES non funzionano aperti come `file://`).

## Come si usa

1. Nella sezione **Tipo di quiz** scegli la modalità: "Quiz di personalità" (vince la categoria scelta più spesso, con eventuale gestione dei pareggi) o "Quiz con risposta corretta" (ogni risposta vale dei punti, il profilo dipende dal punteggio totale). Cambia i campi mostrati nelle sezioni successive di conseguenza — vedi `traitwise/editing-config.md` punto 6 per la spiegazione completa delle due modalità.
2. Compila le sezioni: **Informazioni generali**, **Domande**, **Profili**. Ogni sezione ha bottoni "+ Aggiungi" e frecce ▲▼ per riordinare.
3. Guarda il pannello **avvisi** a destra: elenca cosa manca o è inconsistente (es. una categoria usata in una domanda senza profilo corrispondente) prima ancora di scaricare il file.
4. Quando è tutto a posto, premi **Scarica config.yaml** (o **Copia** per incollarlo altrove).
5. Sposta il file scaricato dentro `traitwise/data/config.yaml`, sovrascrivendo quello esistente.
6. Vuoi ripartire da un quiz già pubblicato invece che da zero? Usa **Importa da file** o **Incolla YAML** in alto e carica/incolla il contenuto esistente: il form si popola con i suoi contenuti.

## Cosa NON fa

- **Non carica immagini o loghi.** I campi "percorso immagine/logo" sono testo libero (es. `assets/profiles/nome.svg`): il file YAML generato punta lì, ma il file immagine vero va copiato a mano dentro `traitwise/assets/`, come già spiegato in `traitwise/editing-config.md`.
- **Non salva automaticamente.** Se chiudi la scheda senza scaricare, il lavoro si perde — nessuna persistenza, per design (stesso principio di TraitWise).
- **Stesso subset YAML di TraitWise**: gli `id` di domande/opzioni sono generati automaticamente e non editabili qui, apposta per evitare duplicati; se un testo contiene sia `'` che `"` insieme, il pannello avvisi te lo segnala perché quel caso limite non è rappresentabile dal parser minimale condiviso.

## Perché un progetto separato

TraitWise (il sito che gli utenti finali vedono) resta volutamente minimale: parser YAML, poche schermate, zero editor di form. Tutta la complessità di "costruire" un quiz vive qui, in uno strumento a parte che nessun utente finale del quiz vede mai. `js/yamlParser.js` è una copia identica di quello in `traitwise/js/`, in modo che quanto generato qui sia garantito leggibile là (verificato: vedi round-trip testato durante lo sviluppo).

# Fantasy Quest – Monster & Fiender (30 st)

Unika fiender indelade efter typ och ungefärlig svårighetsgrad.  
Anpassade för turn-based combat i ett dark fantasy-mobilspel.

---

## Vanliga Fiender (Early Game)

### 1. Skuggvarg
Snabba vargar som jagar i flock. Hög Speed, låg Defense.  
**Special:** Kan hoppa över frontlinjen och attackera bakre rader.

### 2. Skelettkrigare
Klassiska odöda soldater med rostiga svärd och sköldar.  
**Special:** Återuppstår en gång med 30% HP om de inte bränns.

### 3. Giftspindel
Stora spindlar som sprutar gift.  
**Special:** Applicerar starkt gift vid träff + kan spärra in en hjälte i nät.

### 4. Stenknalle
Långsamma men mycket tåliga stenmonster.  
**Special:** Hög Defense. När de tar kritisk skada splittras de i mindre versioner.

### 5. Blodfladdermus
Svärmar av blodtörstiga fladdermöss.  
**Special:** Lifesteal på attacker. Svåra att träffa (hög evasion).

### 6. Körsbärsträds-ande (Korrupt)
Korrupta skogsväsen som ser vackra ut men är dödliga.  
**Special:** Kan charma en hjälte i 1 runda.

### 7. Svampodlare
Märkliga svampvarelser som sprider sporer.  
**Special:** Skapar små svamp-minions varje runda.

### 8. Isimp
Små isväsen som kastar frostmagi.  
**Special:** Sänker Speed på träffade mål.

---

## Medelstarka Fiender (Mid Game)

### 9. Järngolem
Tunga konstruktioner av järn och runor.  
**Special:** Extremt hög Defense. Kan bara skadas ordentligt av magi eller rustningsbrytande attacker.

### 10. Nekromantens Lärling
Mänskliga nekromantiker som tar fram skelett.  
**Special:** Summonar 1–2 Skelettkrigare under striden.

### 11. Eldsalamander
Stora ödlor som andas eld.  
**Special:** Eldandning (AoE) + immunitet mot eld.

### 12. Skuggassassin (Fiende)
Mörka lönnmördare som tjänar en ond makt.  
**Special:** Hög krit-chans + kan bli ostårbara i 1 runda.

### 13. Banshee
Hemsökande andar med dödsskrik.  
**Special:** Skräck-skrik som kan få hjältar att missa sin tur.

### 14. Kristallspindel
Större och farligare variant av Giftspindeln.  
**Special:** Hennes nät sänker både Speed och Defense.

### 15. Drakkin-krigare
Ödlemänniskor med drakblod.  
**Special:** Kan gå in i en rasande form som ökar ATK kraftigt.

### 16. Svart Riddare
Fallna riddare i svart rustning.  
**Special:** Hög Defense + kan spegla en del skada tillbaka.

### 17. Stormelemental
Varelser gjorda av vind och blixt.  
**Special:** Kedjeblixt-attacker + immunitet mot fysiska attacker (delvis).

### 18. Blodmästare
Kultister som offrar blod för kraft.  
**Special:** Offrar egna HP för att ge massiv buff till en allierad fiende.

---

## Elit & Boss-liknande Fiender (Late Game)

### 19. Äldre Stenjätte
Enorma stenjättar som vaktar gamla ruiner.  
**Special:** Jordskalv (AoE + stun-chans) + enorm HP-pool.

### 20. Vampyrlord
Aristokratiska vampyrer med stor makt.  
**Special:** Stark lifesteal + kan förvandla sig till fladdermöss (hög evasion).

### 21. Drakunge (Svart)
Unga svarta drakar. Fortfarande mycket farliga.  
**Special:** Eldandning + svagare version av Drakform.

### 22. Lich
Kraftfulla odöda magiker.  
**Special:** Kan återuppväcka fallna fiender + kastar starka förbannelser.

### 23. Skuggdemon
Demoner från skuggriket.  
**Special:** Blir starkare ju fler debuffs laget har.

### 24. Korrupt Trädherre
Enorma levande träd som sprider korruption.  
**Special:** Summonar korrupt vegetation + stark regenerering.

### 25. Isdrottning
Härskarinna över is och kyla.  
**Special:** Kan frysa hela laget (lägre chans) + skapar isbarriärer.

### 26. Krigsgolem
Avancerade golems byggda för krig.  
**Special:** Byter mellan offensiv och defensiv form under striden.

### 27. Själslukare
Märkliga varelser som livnär sig på själar.  
**Special:** Stjäl energi/mana från hjältar och blir starkare av det.

---

## Speciella / Unika Fiender

### 28. Spegelväktare
Varelser som kopierar hjältarnas utseende.  
**Special:** Kopierar en hjältes starkaste spell och använder den mot laget.

### 29. Tidsvridare
Märkliga entiteter som manipulerar tid.  
**Special:** Kan få en hjälte att hoppa över sin nästa tur eller agera två gånger.

### 30. Den Fallne Stjärnan
En korrupt stjärnvarelse (mini-boss känsla).  
**Special:** Kombinerar helig och skuggmagi. Kan både hela sig själv och kasta förödande AoE.

---

## Snabböversikt efter typ

| Typ              | Antal | Exempel                     |
|------------------|-------|-----------------------------|
| Odöda            | 5     | Skelettkrigare, Lich, Banshee |
| Bestar           | 6     | Skuggvarg, Eldsalamander, Drakunge |
| Elementaler      | 4     | Stormelemental, Isimp, Isdrottning |
| Konstrukter      | 3     | Järngolem, Krigsgolem, Stenknalle |
| Humanoider       | 5     | Svart Riddare, Nekromantens Lärling, Blodmästare |
| Demoner/Skugga   | 4     | Skuggdemon, Skuggassassin, Själslukare |
| Övriga / Unika   | 3     | Spegelväktare, Tidsvridare, Den Fallne Stjärnan |

---

**Tips för implementation:**
- Ge varje monster 1–2 unika abilities + en grundattack.
- Använd rarity eller “stars” internt (1–5) för att styra stats.
- Många av de vanliga fienderna kan återanvändas i starkare versioner (Elite / Champion) senare.

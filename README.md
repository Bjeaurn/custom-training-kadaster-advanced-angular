# Kadaster specifieke "cases".

1. Testing [/medewerkers-aanpassen/](./medewerkers-aanpassen/)
2. "Derived state" [project-detail/medewerkers-aanpassen/](./project-detail/medewerkers-aanpassen)
3. "Shared state" [project-detail/](./project-detail)

## Notes
project-detail/ map bevat 3 sub componente, die vanuit `project-details.component` worden aangeroepen/opgestart. Vreemd genoeg zijn de laatste 2 componenten, `projectgegevens-aanpassen` en `projectregels-aanpassen` allebei mooie "presentational" components, die misschien nog een beetje data verrijken, maar als eindresultaat vooral een eventje emitten naar de parent met de gebruikersactie. 

Het eerste component, `medewerkers-aanpassen` doet dit echter niet; dit is zijn eigen smart component die wat state bijhoud. Ik kan niet direct een reden aanwijzen waarom dit zo is (zowel dit component als parent smart component communiceren vooral met de `projectenService`). Misschien is dit een mooie invalshoek voor deze case?

Aanvullend moet die wel data ophalen en matchen aan bestaande data van het project. Dit is misschien nog een mooie kans om naar de service te kijken of dit niet in een keer kan, ook al zijn het onderwater twee verschillende endpoints? En ook dan krijgen we weer de discussie of dit component zelf verantwoordelijk is voor z'n data (en retrieval), of dat zijn parent dit prima kan leveren?

Wat betreft het shared state stuk, dit is ook iets wat terugvalt op het "smart/presentational" component stuk. Alle informatie benodigd doorgeven. Dus stukje theoretische aanpak daarvan vanuit architectuur oogpunt is hier misschien nuttig. Slaat ook gelijk terug op "testability", want eenvoudige componenten zijn nou eenmaal eenvoudiger te testen.

